const bcrypt = require("bcryptjs");
const usuarioRepository = require("../repositories/usuario.repository");
const { validarNuevoUsuario } = require("../validators/usuario.validator");
const { generarToken } = require("../middleware/auth.middleware");

// POST /api/usuarios — alta de un usuario (registro)
async function crearUsuario(req, res) {
    try {
        const body = req.body || {};
        const errores = validarNuevoUsuario(body);

        if (errores.length) {
            return res.status(400).json({ mensaje: errores.join(". "), errores });
        }

        const nombre = body.nombre.trim();
        const celular = body.celular.trim();
        const localidad = body.localidad.trim();

        if (await usuarioRepository.existeCelular(celular)) {
            return res.status(409).json({
                mensaje: "Ya existe un usuario con ese celular"
            });
        }

        const contrasenaHash = await bcrypt.hash(body.contrasena, 10);

        const usuario = await usuarioRepository.crear({
            nombre,
            celular,
            localidad,
            fotoPerfil: body.fotoPerfil || null,
            contrasenaHash
        });

        res.status(201)
            .location("/api/usuarios/me")
            .json({
                token: generarToken(usuario),
                usuario: usuarioRepository.aPublico(usuario)
            });
    } catch (error) {
        // Dos registros simultáneos con el mismo celular: lo resuelve el índice único.
        if (error.code === 11000) {
            return res.status(409).json({
                mensaje: "Ya existe un usuario con ese celular"
            });
        }
        console.error("Error al crear usuario:", error.message);
        res.status(500).json({
            mensaje: "Error al registrar el usuario"
        });
    }
}

// GET /api/usuarios/me — datos del usuario autenticado
async function obtenerUsuarioAutenticado(req, res) {
    try {
        const usuario = await usuarioRepository.buscarPorId(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.status(200).json({
            usuario: usuarioRepository.aPublico(usuario)
        });
    } catch (error) {
        console.error("Error al obtener usuario:", error.message);
        res.status(500).json({
            mensaje: "Error al obtener el usuario"
        });
    }
}

module.exports = {
    crearUsuario,
    obtenerUsuarioAutenticado
};
