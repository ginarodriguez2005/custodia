
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const conectarBD = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        mensaje: "API de Custodia funcionando"
    });
});

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
