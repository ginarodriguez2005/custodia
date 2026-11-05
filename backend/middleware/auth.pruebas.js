const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");

module.exports = async (req, res, next) => {
    if (process.env.NODE_ENV !== "development" || process.env.AUTH_PRUEBAS !== "true") {
        return res.status(403).json({ mensaje: "Modo de pruebas desactivado" });
    }
    const id = req.header("x-test-user-id");
    if (!id || !mongoose.isObjectIdOrHexString(id)) {
        return res.status(401).json({ mensaje: "Falta x-test-user-id válido" });
    }
    try {
        const usuario = await Usuario.findById(id).select("_id");
        if (!usuario) return res.status(401).json({ mensaje: "Usuario de prueba inexistente" });
        req.usuario = { id: usuario._id.toString() };
        next();
    } catch (error) {
        console.error("Error de autenticación de prueba:", error);
        res.status(500).json({ mensaje: "Error en autenticación de prueba" });
    }
};
