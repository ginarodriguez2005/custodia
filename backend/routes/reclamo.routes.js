
const express = require("express");
const {
    registrarReclamo,
    obtenerReclamos,
    resolverReclamo
} = require("../controllers/reclamo.controller");
const { verificarToken } = require("../middleware/auth.middleware");

// mergeParams permite leer :id definido en la ruta padre
const router = express.Router({ mergeParams: true });

router.post("/", verificarToken, registrarReclamo);
router.get("/", verificarToken, obtenerReclamos);
router.patch("/", verificarToken, resolverReclamo);

module.exports = router;
