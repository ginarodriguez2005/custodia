
const jwt = require("jsonwebtoken");

function generarToken(usuario) {
    return jwt.sign(
        { id: usuario._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
}

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            mensaje: "Token no proporcionado"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = { id: payload.id };

        next();
    } catch (error) {
        return res.status(401).json({
            mensaje: "Token inválido o expirado"
        });
    }
}

module.exports = { generarToken, verificarToken };
