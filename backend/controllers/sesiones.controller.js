const bcrypt = require("bcryptjs");
const usuarioRepository = require("../repositories/usuario.repository");
const { esTextoNoVacio } = require("../validators/usuario.validator");
const { generarToken } = require("../middleware/auth.middleware");

// POST /api/sesiones — inicio de sesión (crea un token de sesión)
async function crearSesion(req, res) {
    try {
        const { celular, contrasena } = req.body || {};

        if (!esTextoNoVacio(celular) || !esTextoNoVacio(contrasena)) {
            return res.status(400).json({
                mensaje: "Celular y contraseña son obligatorios"
            });
        }

        const usuario = await usuarioRepository.buscarPorCelular(celular.trim(), {
            incluirContrasena: true
        });

        const coincide = usuario &&
            await bcrypt.compare(contrasena, usuario.contrasenaHash);

        if (!coincide) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        res.status(201).json({
            token: generarToken(usuario),
            usuario: usuarioRepository.aPublico(usuario)
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error.message);
        res.status(500).json({
            mensaje: "Error al iniciar sesión"
        });
    }
}

module.exports = { crearSesion };
