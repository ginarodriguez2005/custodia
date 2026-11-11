// Acceso a datos de las solicitudes de recuperación de contraseña.
const RecuperacionContrasena = require("../models/RecuperacionContrasena");

function crear({ usuario, codigoHash, expira }) {
    return RecuperacionContrasena.create({ usuario, codigoHash, expira });
}

// Anula las solicitudes pendientes del usuario (solo vale el último código enviado).
function invalidarPendientes(usuarioId) {
    return RecuperacionContrasena.updateMany(
        { usuario: usuarioId, usada: false },
        { usada: true }
    );
}

// Solicitud pendiente creada después de "desde" (para limitar reenvíos seguidos).
function buscarPendienteDesde(usuarioId, desde) {
    return RecuperacionContrasena.findOne({
        usuario: usuarioId,
        usada: false,
        expira: { $gt: new Date() },
        fechaCreacion: { $gt: desde }
    }).sort({ fechaCreacion: -1 });
}

// Solicitud que todavía puede usarse: no usada, no vencida y con intentos disponibles.
function buscarVigente(id, maxIntentos) {
    return RecuperacionContrasena.findOne({
        _id: id,
        usada: false,
        expira: { $gt: new Date() },
        intentos: { $lt: maxIntentos }
    });
}

function registrarIntentoFallido(id) {
    return RecuperacionContrasena.findByIdAndUpdate(
        id,
        { $inc: { intentos: 1 } },
        { new: true }
    );
}

// Marca la solicitud como usada solo si nadie la usó antes (evita doble uso simultáneo).
function marcarUsada(id) {
    return RecuperacionContrasena.findOneAndUpdate(
        { _id: id, usada: false },
        { usada: true }
    );
}

module.exports = {
    crear,
    invalidarPendientes,
    buscarPendienteDesde,
    buscarVigente,
    registrarIntentoFallido,
    marcarUsada
};
