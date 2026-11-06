require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const conectarBD = require("./config/database");
const authRoutes = require("./routes/auth.routes");
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

app.use("/api/auth", authRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/solicitudes/:id/reclamos", reclamoRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({ mensaje: "Ruta no encontrada" });
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
