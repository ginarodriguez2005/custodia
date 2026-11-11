const mongoose = require("mongoose");

// Solicitud de recuperación de contraseña: guarda un código de un solo uso (hasheado)
const recuperacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true,
        index: true
    },

    codigoHash: {
        type: String,
        required: true
    },

    intentos: {
        type: Number,
        default: 0
    },

    usada: {
        type: Boolean,
        default: false
    },

    expira: {
        type: Date,
        required: true
    }
}, {
    timestamps: { createdAt: "fechaCreacion", updatedAt: false }
});

// MongoDB elimina automáticamente las solicitudes vencidas
recuperacionSchema.index({ expira: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RecuperacionContrasena", recuperacionSchema);
