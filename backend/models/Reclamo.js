
const mongoose = require("mongoose");

const reclamoSchema = new mongoose.Schema({

    solicitudPago: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolicitudPago",
        required: true
    },

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    motivo: {
        type: String,
        required: true,
        enum: [
            "NO_RECIBIDO",
            "NO_COINCIDE",
            "DANADO",
            "OTRO"
        ]
    },

    descripcion: {
        type: String,
        required: true,
        trim: true
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
    }

});

module.exports = mongoose.model("Reclamo", reclamoSchema);
