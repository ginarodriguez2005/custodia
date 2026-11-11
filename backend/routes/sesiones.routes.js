const express = require("express");
const { crearSesion } = require("../controllers/sesiones.controller");

const router = express.Router();

router.post("/", crearSesion);

module.exports = router;
