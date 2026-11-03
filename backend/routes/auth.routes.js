
const express = require("express");
const {
    registro,
    login,
    obtenerUsuarioAutenticado
} = require("../controllers/auth.controller");
const { verificarToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/registro", registro);
router.post("/login", login);
router.get("/me", verificarToken, obtenerUsuarioAutenticado);

module.exports = router;
