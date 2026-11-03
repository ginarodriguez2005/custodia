
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    celular: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    fotoPerfil: {
        type: String,
        default: null
    },

    localidad: {
        type: String,
        required: true,
        trim: true
    },

    contrasenaHash: {
        type: String,
        required: true,
        select: false
    }
});

module.exports = mongoose.model("Usuario", usuarioSchema);
