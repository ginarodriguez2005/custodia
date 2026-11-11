const express = require("express");
const {
    crearRecuperacion,
    completarRecuperacion
} = require("../controllers/recuperaciones.controller");

const router = express.Router();

router.post("/", crearRecuperacion);
router.patch("/:id", completarRecuperacion);

module.exports = router;
