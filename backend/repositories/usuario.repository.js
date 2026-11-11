// Acceso a datos de Usuario. Los controladores no usan el modelo de Mongoose directamente.
const Usuario = require("../models/Usuario");

// Datos que se pueden devolver al cliente (nunca incluye contrasenaHash).
function aPublico(usuario) {
    return {
        id: usuario._id,
        nombre: usuario.nombre,
        celular: usuario.celular,
        fotoPerfil: usuario.fotoPerfil,
        localidad: usuario.localidad
    };
}

function crear({ nombre, celular, localidad, fotoPerfil, contrasenaHash }) {
    return Usuario.create({ nombre, celular, localidad, fotoPerfil, contrasenaHash });
}

function buscarPorId(id, { incluirContrasena = false } = {}) {
    const consulta = Usuario.findById(id);
    return incluirContrasena ? consulta.select("+contrasenaHash") : consulta;
}

function actualizarContrasena(id, contrasenaHash) {
    return Usuario.updateOne({ _id: id }, { contrasenaHash });
}

function buscarPorCelular(celular, { incluirContrasena = false } = {}) {
    const consulta = Usuario.findOne({ celular });
    return incluirContrasena ? consulta.select("+contrasenaHash") : consulta;
}

async function existeCelular(celular) {
    return (await Usuario.exists({ celular })) !== null;
}

module.exports = {
    aPublico,
    crear,
    buscarPorId,
    buscarPorCelular,
    existeCelular,
    actualizarContrasena
};
