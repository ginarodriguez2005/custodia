
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const conectarBD = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const reclamoRoutes = require("./routes/reclamo.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        mensaje: "API de Custodia funcionando"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/solicitudes/:id/reclamos", reclamoRoutes);

// Rutas de API inexistentes: responder JSON en lugar de buscar un archivo estático.
app.use("/api", (req, res) => {
    res.status(404).json({
        mensaje: "Ruta no encontrada"
    });
});

// Frontend: se sirve como archivos estáticos desde el mismo servidor y puerto.
app.use(express.static(path.join(__dirname, "..", "frontend")));

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        await conectarBD();

        app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor");
        process.exit(1);
    }
}

iniciarServidor();
