const express = require("express");
const { obtenerNotificaciones, marcarLeidas } = require("../controllers/notificaciones.controller");
const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", verificarToken, obtenerNotificaciones);
router.patch("/leidas", verificarToken, marcarLeidas);

module.exports = router;
