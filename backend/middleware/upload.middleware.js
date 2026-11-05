
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("node:crypto");

const carpeta = path.join(__dirname, "../uploads/productos");

// Crear carpeta si todavía no existe
fs.mkdirSync(carpeta, { recursive: true });

const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, carpeta);
    },

    filename: (req, file, cb) => {
        const extensiones = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        };

        const extension = extensiones[file.mimetype];

        const nombre = crypto.randomUUID() + extension;

        cb(null, nombre);
    }
});

const filtroArchivos = (req, file, cb) => {
    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!tiposPermitidos.includes(file.mimetype)) {
        return cb(new Error("Formato de imagen no permitido"));
    }

    cb(null, true);
};

const subirFoto = multer({
    storage: almacenamiento,
    fileFilter: filtroArchivos,
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1
    }
});

module.exports = subirFoto;
