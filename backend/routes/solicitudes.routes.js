const express = require("express");
const router = express.Router();

const {
    crearSolicitud,
    obtenerMisSolicitudes,
    obtenerSolicitudPorId,
    pagarSolicitud
} = require("../controllers/solicitudes.controller");

// Middleware de autenticación (Solo para pruebas locales)
const modoPruebas = process.env.NODE_ENV === "development" &&
    process.env.AUTH_PRUEBAS === "true";

const verificarToken = modoPruebas
    ? require("../middleware/auth.pruebas")
    : require("../middleware/auth.middleware");

const multer = require("multer");
const subirFoto = require("../middleware/upload.middleware");

// Crear solicitud
router.post("/", verificarToken, (req, res, next) => {
    subirFoto.single("foto")(req, res, (error) => {
        if (error) {
            const mensaje =
                error.code === "LIMIT_FILE_SIZE"
                    ? "La imagen no puede superar los 2 MB"
                    : error.message;

            return res.status(400).json({ mensaje });
        }

        next();
    });
}, crearSolicitud);

// Consultar solicitudes propias
router.get("/mias", verificarToken, obtenerMisSolicitudes);

// Consultar detalles públicos de una solicitud
router.get("/:id", obtenerSolicitudPorId);

// Simular pago
router.post("/:id/pagar", verificarToken, pagarSolicitud);

module.exports = router;
