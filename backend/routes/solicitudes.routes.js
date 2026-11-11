const express = require("express");
const router = express.Router();

const {
    crearSolicitud,
    obtenerMisSolicitudes,
    obtenerSolicitudPorId,
    pagarSolicitud,
    despacharSolicitud,
    confirmarRecepcionSolicitud,
    cancelarSolicitud
} = require("../controllers/solicitudes.controller");

const { verificarToken } = require("../middleware/auth.middleware");
const subirFoto = require("../middleware/upload.middleware");

router.post("/", verificarToken, (req, res, next) => {
    subirFoto.single("foto")(req, res, (error) => {
        if (error) {
            const mensaje = error.code === "LIMIT_FILE_SIZE"
                ? "La imagen no puede superar los 2 MB"
                : error.message;
            return res.status(400).json({ mensaje });
        }
        next();
    });
}, crearSolicitud);

router.get("/mias", verificarToken, obtenerMisSolicitudes);
router.get("/:id", obtenerSolicitudPorId);
router.post("/:id/pagar", verificarToken, pagarSolicitud);
router.post("/:id/despachar", verificarToken, despacharSolicitud);
router.post("/:id/confirmar-recepcion", verificarToken, confirmarRecepcionSolicitud);
router.post("/:id/cancelar", verificarToken, cancelarSolicitud);

module.exports = router;
