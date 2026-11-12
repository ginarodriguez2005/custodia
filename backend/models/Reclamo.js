
const mongoose = require("mongoose");

// Motivos permitidos según quién inicia el reclamo
const MOTIVOS_POR_ROL = {
    COMPRADOR: [
        "NO_RECIBIDO",
        "NO_COINCIDE",
        "DANADO",
        "OTRO"
    ],
    VENDEDOR: [
        "NO_CONFIRMA_RECEPCION",
        "PROBLEMA_ENVIO",
        "SIN_RESPUESTA",
        "OTRO"
    ]
};

// Cada parte solo puede cerrar el reclamo a favor de la otra:
// el comprador libera el dinero al vendedor y el vendedor lo devuelve al comprador.
const RESOLUCION_POR_ROL = {
    COMPRADOR: "LIBERAR_VENDEDOR",
    VENDEDOR: "DEVOLVER_COMPRADOR"
};

const reclamoSchema = new mongoose.Schema({

    // Una solicitud admite un único reclamo (de comprador o de vendedor)
    solicitudPago: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolicitudPago",
        required: true,
        unique: true
    },

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    rol: {
        type: String,
        enum: Object.keys(MOTIVOS_POR_ROL),
        required: true,
        default: "COMPRADOR"
    },

    motivo: {
        type: String,
        required: true,
        enum: [...new Set(Object.values(MOTIVOS_POR_ROL).flat())]
    },

    descripcion: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },

    estado: {
        type: String,
        enum: [
            "ABIERTO",
            "EN_REVISION",
            "RESUELTO"
        ],
        default: "ABIERTO"
    },

    fechaCreacion: {
        type: Date,
        default: Date.now
    },

    // Resultado acordado entre las partes (no hay administrador)
    resolucion: {
        type: String,
        enum: Object.values(RESOLUCION_POR_ROL),
        default: null
    },

    resueltoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },

    fechaResolucion: {
        type: Date,
        default: null
    }

});

const Reclamo = mongoose.model("Reclamo", reclamoSchema);

module.exports = Reclamo;
module.exports.MOTIVOS_POR_ROL = MOTIVOS_POR_ROL;
module.exports.RESOLUCION_POR_ROL = RESOLUCION_POR_ROL;
