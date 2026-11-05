
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const conectarBD = require("./config/database");
const authRoutes = require("./routes/auth.routes");
const reclamoRoutes = require("./routes/reclamo.routes");
const path = require("path");

const app = express();

const solicitudesRoutes = require("./routes/solicitudes.routes");

app.use(cors());
app.use(express.json());

app.use(
    "/uploads/productos",
    express.static(path.join(__dirname, "uploads/productos"))
);

app.use("/api/solicitudes", solicitudesRoutes);

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

        const modoPruebas = process.env.NODE_ENV === "development" &&
            process.env.AUTH_PRUEBAS === "true";

        if (modoPruebas && !process.env.MONGO_URI.includes("custodia_pruebas")) {
            throw new Error("Modo pruebas exige una base llamada custodia_pruebas");
        }

        const host = modoPruebas ? "127.0.0.1" : "0.0.0.0";
        app.listen(PORT, host, () => {
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
