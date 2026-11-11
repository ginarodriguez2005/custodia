const express = require("express");
const {
    crearUsuario,
    obtenerUsuarioAutenticado
} = require("../controllers/usuarios.controller");
const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", crearUsuario);
router.get("/me", verificarToken, obtenerUsuarioAutenticado);

module.exports = router;
