// Crea solicitudes de prueba para ver el flujo de reclamos.
// Uso: node scripts/seed-reclamos.js [celularA] [celularB]
// Sin argumentos usa los dos primeros usuarios registrados.
// Es idempotente: borra y vuelve a crear las solicitudes con código "DEMO-".
require("dotenv").config({ quiet: true });

const path = require("node:path");
const fs = require("node:fs/promises");
const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");
const SolicitudPago = require("../models/SolicitudPago");
const Reclamo = require("../models/Reclamo");
const Notificacion = require("../models/Notificacion");

const CARPETA_FOTOS = path.join(__dirname, "..", "uploads", "productos");

function fotoSvg(texto, color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
<rect width="600" height="400" fill="${color}"/>
<text x="300" y="215" font-family="Segoe UI, Arial" font-size="36" font-weight="700" fill="#FFFFFF" text-anchor="middle">${texto}</text>
</svg>`;
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);

    const [celA, celB] = process.argv.slice(2);
    const usuarios = celA && celB
        ? await Promise.all([Usuario.findOne({ celular: celA }), Usuario.findOne({ celular: celB })])
        : await Usuario.find().sort({ _id: 1 }).limit(2);

    if (usuarios.length < 2 || usuarios.some((u) => !u)) {
        throw new Error("Se necesitan dos usuarios registrados (registrá otra cuenta o pasá dos celulares válidos)");
    }

    const [a, b] = usuarios;

    // Limpieza de corridas anteriores
    const anteriores = await SolicitudPago.find({ codigoReferencia: /^DEMO-/ }).select("_id");
    await Reclamo.deleteMany({ solicitudPago: { $in: anteriores.map((s) => s._id) } });
    await Notificacion.deleteMany({ solicitudPago: { $in: anteriores.map((s) => s._id) } });
    await SolicitudPago.deleteMany({ _id: { $in: anteriores.map((s) => s._id) } });

    await fs.mkdir(CARPETA_FOTOS, { recursive: true });

    const ahora = Date.now();
    const dia = 24 * 60 * 60 * 1000;
    const datos = [
        // Compras de A (vendedor B)
        { nombre: "Bicicleta rodado 26", foto: "bicicleta.jpg", precio: 12000, color: "#0F3D5E", vendedor: b, comprador: a, estado: "PAGADA" },
        { nombre: "Auriculares inalámbricos", foto: "auriculares.jpg", precio: 3500, color: "#2A56D6", vendedor: b, comprador: a, estado: "DESPACHADA" },
        {
            nombre: "Silla de escritorio", foto: "silla-escritorio.jpg", precio: 6800, color: "#2E7D3A", vendedor: b, comprador: a, estado: "EN_RECLAMO",
            reclamo: { usuario: a, rol: "COMPRADOR", motivo: "DANADO", descripcion: "Llegó dañado o incompleto" }
        },
        // Ventas de A (comprador B)
        { nombre: "Guitarra criolla", foto: "guitarra.jpg", precio: 9500, color: "#1C5480", vendedor: a, comprador: b, estado: "DESPACHADA" },
        {
            nombre: "Monitor 24 pulgadas", foto: "monitor.jpg", precio: 15000, color: "#5B6B7A", vendedor: a, comprador: b, estado: "EN_RECLAMO",
            reclamo: { usuario: b, rol: "COMPRADOR", motivo: "NO_RECIBIDO", descripcion: "No recibí el producto" }
        }
    ];

    for (const [i, d] of datos.entries()) {
        // Usa la foto real si está en uploads/productos; si no, genera una de ejemplo
        let archivo = d.foto;
        const existe = await fs.access(path.join(CARPETA_FOTOS, archivo)).then(() => true, () => false);
        if (!existe) {
            archivo = `demo-${i + 1}.svg`;
            await fs.writeFile(path.join(CARPETA_FOTOS, archivo), fotoSvg(d.nombre, d.color));
        }

        const despachada = ["DESPACHADA", "EN_RECLAMO"].includes(d.estado);
        const solicitud = await SolicitudPago.create({
            nombreProducto: d.nombre,
            precio: d.precio,
            foto: `/uploads/productos/${archivo}`,
            codigoReferencia: `DEMO-${i + 1}-${ahora}`,
            vendedor: d.vendedor._id,
            comprador: d.comprador._id,
            estado: d.estado,
            fechaCreacion: new Date(ahora - (5 - i) * dia),
            fechaPago: new Date(ahora - (4 - i) * dia),
            fechaDespacho: despachada ? new Date(ahora - (3 - i) * dia) : null,
            numeroSeguimiento: despachada ? `UY${100200 + i}` : null
        });

        if (d.reclamo) {
            await Reclamo.create({
                solicitudPago: solicitud._id,
                usuario: d.reclamo.usuario._id,
                rol: d.reclamo.rol,
                motivo: d.reclamo.motivo,
                descripcion: d.reclamo.descripcion
            });
            // Aviso en la página para la otra parte (el seed solo crea reclamos de compradores)
            await Notificacion.create({
                usuario: d.vendedor._id,
                rol: "VENDEDOR",
                tipo: "RECLAMO_CREADO",
                solicitudPago: solicitud._id,
                mensaje: `El comprador hizo un reclamo sobre "${d.nombre}".`
            });
        }
        console.log(`✔ ${d.nombre} (${d.estado}) — vende ${d.vendedor.nombre}, compra ${d.comprador.nombre}`);
    }

    console.log(`\nIngresá como ${a.nombre} (${a.celular}) o ${b.nombre} (${b.celular}) y abrí "Mis compras y ventas".`);
}

main()
    .catch((error) => {
        console.error("Error en el seed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
