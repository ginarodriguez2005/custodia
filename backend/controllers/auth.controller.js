
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

function generarToken(usuario) {
    return jwt.sign(
        { id: usuario._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

function formatearUsuario(usuario) {
    return {
        id: usuario._id,
        nombre: usuario.nombre,
        celular: usuario.celular,
        fotoPerfil: usuario.fotoPerfil,
        localidad: usuario.localidad
    };
}

async function registro(req, res) {
    try {
        const { nombre, celular, localidad, contrasena, fotoPerfil } = req.body || {};

        if (!nombre || !celular || !localidad || !contrasena) {
            return res.status(400).json({
                mensaje: "Nombre, celular, localidad y contraseña son obligatorios"
            });
        }

        const existe = await Usuario.findOne({ celular: celular.trim() });

        if (existe) {
            return res.status(409).json({
                mensaje: "Ya existe un usuario con ese celular"
            });
        }

        const contrasenaHash = await bcrypt.hash(contrasena, 10);

        const usuario = await Usuario.create({
            nombre,
            celular,
            localidad,
            fotoPerfil,
            contrasenaHash
        });

        res.status(201).json({
            token: generarToken(usuario),
            usuario: formatearUsuario(usuario)
        });
    } catch (error) {
        console.error("Error en registro:", error.message);
        res.status(500).json({
            mensaje: "Error al registrar el usuario"
        });
    }
}

async function login(req, res) {
    try {
        const { celular, contrasena } = req.body || {};

        if (!celular || !contrasena) {
            return res.status(400).json({
                mensaje: "Celular y contraseña son obligatorios"
            });
        }

        const usuario = await Usuario
            .findOne({ celular: celular.trim() })
            .select("+contrasenaHash");

        const coincide = usuario &&
            await bcrypt.compare(contrasena, usuario.contrasenaHash);

        if (!coincide) {
            return res.status(401).json({
                mensaje: "Credenciales inválidas"
            });
        }

        res.status(200).json({
            token: generarToken(usuario),
            usuario: formatearUsuario(usuario)
        });
    } catch (error) {
        console.error("Error en login:", error.message);
        res.status(500).json({
            mensaje: "Error al iniciar sesión"
        });
    }
}

async function obtenerUsuarioAutenticado(req, res) {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.status(200).json({
            usuario: formatearUsuario(usuario)
        });
    } catch (error) {
        console.error("Error al obtener usuario:", error.message);
        res.status(500).json({
            mensaje: "Error al obtener el usuario"
        });
    }
}

module.exports = {
    registro,
    login,
    obtenerUsuarioAutenticado
};
