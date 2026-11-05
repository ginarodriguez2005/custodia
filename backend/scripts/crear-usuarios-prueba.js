// Ejecutar una sola vez, apuntando a una base aislada custodia_pruebas.
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

async function main() {
    if (process.env.NODE_ENV !== "development" ||
        process.env.AUTH_PRUEBAS !== "true" ||
        !process.env.MONGO_URI?.includes("custodia_pruebas")) {
        throw new Error("Usá NODE_ENV=development, AUTH_PRUEBAS=true y BD custodia_pruebas");
    }
    await mongoose.connect(process.env.MONGO_URI);
    for (const u of [
        {nombre:"Vendedor Prueba", celular:"099000001", localidad:"Paysandú"},
        {nombre:"Comprador Prueba", celular:"099000002", localidad:"Paysandú"}
    ]) {
        const usuario = await Usuario.findOneAndUpdate(
            { celular: u.celular },
            { $setOnInsert: { ...u, contrasenaHash: await bcrypt.hash("PruebaLocalNoUsar123!", 10) } },
            { upsert:true, new:true, setDefaultsOnInsert:true }
        );
        console.log(`${u.nombre}: ${usuario._id}`);
    }
    await mongoose.disconnect();
}
main().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
