const Notificacion = require("../models/Notificacion");

const LIMITE = 20;

// Últimas notificaciones del usuario y cantidad sin leer
async function obtenerNotificaciones(req, res) {
    try {
        const usuario = req.usuario.id;
        const [notificaciones, noLeidas] = await Promise.all([
            Notificacion.find({ usuario })
                .sort({ fechaCreacion: -1 })
                .limit(LIMITE)
                .select("-__v -usuario"),
            Notificacion.countDocuments({ usuario, leida: false })
        ]);

        res.status(200).json({ notificaciones, noLeidas });
    } catch (error) {
        console.error("Error al obtener notificaciones:", error.message);
        res.status(500).json({ mensaje: "Error al obtener las notificaciones" });
    }
}

// Marca todas las notificaciones del usuario como leídas
async function marcarLeidas(req, res) {
    try {
        const { modifiedCount } = await Notificacion.updateMany(
            { usuario: req.usuario.id, leida: false },
            { $set: { leida: true } }
        );

        res.status(200).json({ actualizadas: modifiedCount });
    } catch (error) {
        console.error("Error al marcar notificaciones:", error.message);
        res.status(500).json({ mensaje: "Error al actualizar las notificaciones" });
    }
}

module.exports = { obtenerNotificaciones, marcarLeidas };
