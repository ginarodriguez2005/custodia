
const mongoose = require("mongoose");

const solicitudPagoSchema = new mongoose.Schema({

    nombreProducto: {
        type: String,
        required: true,
        trim: true
    },

    precio: {
        type: Number,
        required: true,
        min: 0.01
    },

    foto: {
        type: String,
        required: true
    },

    codigoReferencia: {
        type: String,
        required: true,
        unique: true
    },

    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    comprador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },

    estado: {
        type: String,
        enum: [
            "PENDIENTE",
            "PAGADA",
            "DESPACHADA",
            "FINALIZADA",
            "EN_RECLAMO",
            "CANCELADA"
        ],
        default: "PENDIENTE"
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    fechaPago: {
        type: Date,
        default: null
    },

    fechaDespacho: {
        type: Date,
        default: null
    },

    fechaRecepcion: {
        type: Date,
        default: null
    },

    fechaLiberacion: {
        type: Date,
        default: null
    },

    // Devolución del dinero al comprador al resolver un reclamo
    fechaDevolucion: {
        type: Date,
        default: null
    },

    numeroSeguimiento: {
        type: String,
        default: null
    }

});

module.exports = mongoose.model(
    "SolicitudPago",
    solicitudPagoSchema
);
