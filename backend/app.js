require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const conectarBD = require("./config/database");
const usuariosRoutes = require("./routes/usuarios.routes");
const sesionesRoutes = require("./routes/sesiones.routes");
const recuperacionesRoutes = require("./routes/recuperaciones.routes");
const solicitudesRoutes = require("./routes/solicitudes.routes");
const reclamoRoutes = require("./routes/reclamo.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Fotografías públicas de productos almacenadas localmente
app.use("/uploads/productos", express.static(path.join(__dirname, "uploads/productos")));

app.get("/api/health", (req, res) => {
    res.status(200).json({ mensaje: "API de Custodia funcionando" });
});

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/sesiones", sesionesRoutes);
app.use("/api/recuperaciones", recuperacionesRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/solicitudes/:id/reclamos", reclamoRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Errores del parser JSON (body mal formado o demasiado grande) siempre en formato JSON
app.use("/api", (error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ mensaje: "El cuerpo de la petición no es un JSON válido" });
    }
    if (error.type === "entity.too.large") {
        return res.status(413).json({ mensaje: "La petición es demasiado grande" });
    }
    next(error);
});

app.use(express.static(path.join(__dirname, "..", "frontend")));

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
            throw new Error("Faltan JWT_SECRET o MONGO_URI en el archivo .env");
        }
        await conectarBD();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error.message);
        process.exit(1);
    }
}

iniciarServidor();
