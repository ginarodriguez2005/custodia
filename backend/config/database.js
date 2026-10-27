
const mongoose = require("mongoose");

async function conectarBD() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conexión a MongoDB exitosa");
    } catch (error) {
        console.error("Error al conectar a MongoDB:", error.message);
        throw error;
    }
}

module.exports = conectarBD;
