
const mongoose = require("mongoose");

// Avisos que el usuario ve en la página (campanita del encabezado)
const notificacionSchema = new mongoose.Schema({

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    tipo: {
        type: String,
        enum: ["RECLAMO_CREADO", "RECLAMO_RESUELTO"],
        required: true
    },

    mensaje: {
        type: String,
        required: true,
        trim: true
    },

    solicitudPago: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolicitudPago",
        default: null
    },

    // Rol del destinatario en la operación: arma el enlace a compras o ventas
    rol: {
        type: String,
        enum: ["COMPRADOR", "VENDEDOR"],
        default: null
    },

    leida: {
        type: Boolean,
        default: false
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    }

});

notificacionSchema.index({ usuario: 1, fechaCreacion: -1 });

module.exports = mongoose.model("Notificacion", notificacionSchema);
