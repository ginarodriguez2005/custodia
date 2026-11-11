const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const usuarioRepository = require("../repositories/usuario.repository");
const recuperacionRepository = require("../repositories/recuperacion.repository");
const { esTextoNoVacio, validarContrasena } = require("../validators/usuario.validator");
const { enviarCodigoRecuperacion } = require("../services/notificacion.service");

const VIGENCIA_MINUTOS = 10;
const MAX_INTENTOS = 5;
const ESPERA_REENVIO_SEGUNDOS = 60;

const MENSAJE_ENVIADO =
    "Si el celular está registrado, te enviamos un código de 6 números por WhatsApp.";
const MENSAJE_CODIGO_NO_VALIDO =
    "El código no es válido o ya expiró. Solicitá uno nuevo.";

function generarCodigo() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// POST /api/recuperaciones — solicita un código para restablecer la contraseña.
// La respuesta es la misma exista o no el celular, para no revelar qué números están registrados.
async function crearRecuperacion(req, res) {
    try {
        const { celular } = req.body || {};

        if (!esTextoNoVacio(celular)) {
            return res.status(400).json({
                mensaje: "El celular es obligatorio"
            });
        }

        const usuario = await usuarioRepository.buscarPorCelular(celular.trim());
        let recuperacionId;

        if (usuario) {
            const desde = new Date(Date.now() - ESPERA_REENVIO_SEGUNDOS * 1000);
            const reciente = await recuperacionRepository.buscarPendienteDesde(usuario._id, desde);

            if (reciente) {
                // Reenvío demasiado seguido: se mantiene el código ya enviado.
                recuperacionId = reciente._id;
            } else {
                await recuperacionRepository.invalidarPendientes(usuario._id);

                const codigo = generarCodigo();
                const recuperacion = await recuperacionRepository.crear({
                    usuario: usuario._id,
                    codigoHash: await bcrypt.hash(codigo, 10),
                    expira: new Date(Date.now() + VIGENCIA_MINUTOS * 60 * 1000)
                });

                await enviarCodigoRecuperacion(usuario.celular, codigo, VIGENCIA_MINUTOS);
                recuperacionId = recuperacion._id;
            }
        } else {
            // Identificador que no corresponde a ninguna solicitud real.
            recuperacionId = new mongoose.Types.ObjectId();
        }

        res.status(202)
            .location(`/api/recuperaciones/${recuperacionId}`)
            .json({
                mensaje: MENSAJE_ENVIADO,
                recuperacion: {
                    id: recuperacionId,
                    vigenciaMinutos: VIGENCIA_MINUTOS,
                    esperaReenvioSegundos: ESPERA_REENVIO_SEGUNDOS
                }
            });
    } catch (error) {
        console.error("Error al solicitar recuperación:", error.message);
        res.status(500).json({
            mensaje: "Error al solicitar la recuperación de contraseña"
        });
    }
}

// PATCH /api/recuperaciones/:id — valida el código y establece la nueva contraseña.
async function completarRecuperacion(req, res) {
    try {
        const { id } = req.params;
        const { codigo, contrasena } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ mensaje: MENSAJE_CODIGO_NO_VALIDO });
        }

        if (typeof codigo !== "string" || !/^\d{6}$/.test(codigo.trim())) {
            return res.status(400).json({
                mensaje: "El código debe tener 6 números"
            });
        }

        const incumplidas = validarContrasena(contrasena);
        if (incumplidas.length) {
            return res.status(400).json({
                mensaje: `La contraseña no cumple los requisitos: ${incumplidas.join(", ")}`,
                errores: incumplidas
            });
        }

        const recuperacion = await recuperacionRepository.buscarVigente(id, MAX_INTENTOS);

        if (!recuperacion) {
            return res.status(400).json({ mensaje: MENSAJE_CODIGO_NO_VALIDO });
        }

        const codigoCorrecto = await bcrypt.compare(codigo.trim(), recuperacion.codigoHash);

        if (!codigoCorrecto) {
            const actualizada = await recuperacionRepository.registrarIntentoFallido(id);
            const restantes = MAX_INTENTOS - actualizada.intentos;
            return res.status(400).json({
                mensaje: restantes > 0
                    ? `Código incorrecto. Te quedan ${restantes} ${restantes === 1 ? "intento" : "intentos"}.`
                    : "Superaste la cantidad de intentos. Solicitá un código nuevo."
            });
        }

        const usuario = await usuarioRepository.buscarPorId(recuperacion.usuario, {
            incluirContrasena: true
        });

        if (!usuario) {
            return res.status(400).json({ mensaje: MENSAJE_CODIGO_NO_VALIDO });
        }

        if (await bcrypt.compare(contrasena, usuario.contrasenaHash)) {
            return res.status(400).json({
                mensaje: "La nueva contraseña debe ser distinta a la anterior"
            });
        }

        // Consumir el código antes de cambiar la contraseña: un código, un solo uso.
        if (!await recuperacionRepository.marcarUsada(id)) {
            return res.status(400).json({ mensaje: MENSAJE_CODIGO_NO_VALIDO });
        }

        await usuarioRepository.actualizarContrasena(
            usuario._id,
            await bcrypt.hash(contrasena, 10)
        );

        res.status(200).json({
            mensaje: "Tu contraseña se actualizó correctamente. Ya podés ingresar."
        });
    } catch (error) {
        console.error("Error al completar recuperación:", error.message);
        res.status(500).json({
            mensaje: "Error al restablecer la contraseña"
        });
    }
}

module.exports = {
    crearRecuperacion,
    completarRecuperacion
};
