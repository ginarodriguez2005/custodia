
const mongoose = require("mongoose");
const Reclamo = require("../models/Reclamo");
const SolicitudPago = require("../models/SolicitudPago");
const { notificarEnWeb } = require("../services/notificacion.service");

const { MOTIVOS_POR_ROL, RESOLUCION_POR_ROL } = Reclamo;
const ESTADOS_RECLAMABLES = ["PAGADA", "DESPACHADA"];

// La otra parte de la operación: a quien se le avisa
function contraparte(solicitud, rol) {
    return rol === "COMPRADOR"
        ? { usuario: solicitud.vendedor, rol: "VENDEDOR" }
        : { usuario: solicitud.comprador, rol: "COMPRADOR" };
}

// Devuelve "COMPRADOR", "VENDEDOR" o null según la participación del usuario
function rolEnSolicitud(solicitud, usuarioId) {
    if (solicitud.comprador && solicitud.comprador.equals(usuarioId)) return "COMPRADOR";
    if (solicitud.vendedor && solicitud.vendedor.equals(usuarioId)) return "VENDEDOR";
    return null;
}

async function registrarReclamo(req, res) {
    try {
        const { id } = req.params;
        const { motivo, descripcion } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                mensaje: "Id de solicitud inválido"
            });
        }

        if (typeof motivo !== "string" || typeof descripcion !== "string" || !descripcion.trim()) {
            return res.status(400).json({
                mensaje: "Motivo y descripción son obligatorios"
            });
        }

        if (descripcion.trim().length > 500) {
            return res.status(400).json({
                mensaje: "La descripción no puede superar los 500 caracteres"
            });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        const rol = rolEnSolicitud(solicitud, req.usuario.id);

        if (!rol) {
            return res.status(403).json({
                mensaje: "Solo el comprador o el vendedor pueden registrar un reclamo"
            });
        }

        if (!MOTIVOS_POR_ROL[rol].includes(motivo)) {
            return res.status(400).json({
                mensaje: `Motivo inválido. Valores permitidos: ${MOTIVOS_POR_ROL[rol].join(", ")}`
            });
        }

        if (await Reclamo.exists({ solicitudPago: id })) {
            return res.status(409).json({
                mensaje: "Esta operación ya tiene un reclamo registrado"
            });
        }

        // Actualización condicional para evitar dos reclamos simultáneos
        const anterior = await SolicitudPago.findOneAndUpdate(
            { _id: id, estado: { $in: ESTADOS_RECLAMABLES } },
            { estado: "EN_RECLAMO" }
        );

        if (!anterior) {
            return res.status(409).json({
                mensaje: `No se puede registrar un reclamo con la solicitud en estado ${solicitud.estado}`
            });
        }

        let reclamo;

        try {
            reclamo = await Reclamo.create({
                solicitudPago: id,
                usuario: req.usuario.id,
                rol,
                motivo,
                descripcion: descripcion.trim()
            });
        } catch (error) {
            // Se revierte el estado si no se pudo guardar el reclamo
            await SolicitudPago.updateOne(
                { _id: id, estado: "EN_RECLAMO" },
                { estado: anterior.estado }
            );

            if (error.code === 11000) {
                return res.status(409).json({
                    mensaje: "Esta operación ya tiene un reclamo registrado"
                });
            }
            throw error;
        }

        const otro = contraparte(solicitud, rol);
        await notificarEnWeb({
            ...otro,
            tipo: "RECLAMO_CREADO",
            solicitudPago: solicitud._id,
            mensaje: `El ${rol === "COMPRADOR" ? "comprador" : "vendedor"} hizo un reclamo sobre "${solicitud.nombreProducto}".`
        });

        res.status(201).json({
            mensaje: "Reclamo registrado correctamente",
            reclamo
        });
    } catch (error) {
        console.error("Error al registrar reclamo:", error.message);
        res.status(500).json({
            mensaje: "Error al registrar el reclamo"
        });
    }
}

async function obtenerReclamos(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                mensaje: "Id de solicitud inválido"
            });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        if (!rolEnSolicitud(solicitud, req.usuario.id)) {
            return res.status(403).json({
                mensaje: "No tienes acceso a los reclamos de esta solicitud"
            });
        }

        const reclamos = await Reclamo
            .find({ solicitudPago: id })
            .sort({ fechaCreacion: -1 })
            .select("-__v");

        res.status(200).json({ reclamos });
    } catch (error) {
        console.error("Error al obtener reclamos:", error.message);
        res.status(500).json({
            mensaje: "Error al obtener los reclamos"
        });
    }
}

// Resuelve el reclamo abierto. Sin administrador: cada parte solo puede
// cerrarlo a favor de la otra (comprador → libera al vendedor, vendedor → devuelve al comprador).
async function resolverReclamo(req, res) {
    try {
        const { id } = req.params;
        const { resolucion } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                mensaje: "Id de solicitud inválido"
            });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        const rol = rolEnSolicitud(solicitud, req.usuario.id);

        if (!rol) {
            return res.status(403).json({
                mensaje: "Solo el comprador o el vendedor pueden resolver el reclamo"
            });
        }

        if (resolucion !== RESOLUCION_POR_ROL[rol]) {
            return res.status(400).json({
                mensaje: rol === "COMPRADOR"
                    ? "Como comprador solo podés resolver el reclamo liberando el dinero al vendedor (LIBERAR_VENDEDOR)"
                    : "Como vendedor solo podés resolver el reclamo devolviendo el dinero al comprador (DEVOLVER_COMPRADOR)"
            });
        }

        const ahora = new Date();

        // Actualización condicional: solo un reclamo sin resolver puede cerrarse
        const reclamo = await Reclamo.findOneAndUpdate(
            { solicitudPago: id, estado: { $ne: "RESUELTO" } },
            {
                $set: {
                    estado: "RESUELTO",
                    resolucion,
                    resueltoPor: req.usuario.id,
                    fechaResolucion: ahora
                }
            },
            { returnDocument: "after" }
        );

        if (!reclamo) {
            const existe = await Reclamo.exists({ solicitudPago: id });
            return res.status(existe ? 409 : 404).json({
                mensaje: existe ? "El reclamo ya fue resuelto" : "Esta operación no tiene reclamos"
            });
        }

        const cambios = resolucion === "LIBERAR_VENDEDOR"
            ? { estado: "FINALIZADA", fechaRecepcion: solicitud.fechaRecepcion || ahora, fechaLiberacion: ahora }
            : { estado: "CANCELADA", fechaDevolucion: ahora };

        const actualizada = await SolicitudPago.findOneAndUpdate(
            { _id: id, estado: "EN_RECLAMO" },
            { $set: cambios },
            { returnDocument: "after" }
        );

        if (!actualizada) {
            // Se revierte el reclamo si la solicitud ya no estaba en reclamo
            await Reclamo.updateOne(
                { _id: reclamo._id },
                { $set: { estado: "ABIERTO", resolucion: null, resueltoPor: null, fechaResolucion: null } }
            );
            return res.status(409).json({
                mensaje: "La solicitud ya no está en reclamo"
            });
        }

        const otro = contraparte(solicitud, rol);
        await notificarEnWeb({
            ...otro,
            tipo: "RECLAMO_RESUELTO",
            solicitudPago: solicitud._id,
            mensaje: resolucion === "LIBERAR_VENDEDOR"
                ? `Se resolvió el reclamo de "${solicitud.nombreProducto}": el comprador liberó el dinero al vendedor.`
                : `Se resolvió el reclamo de "${solicitud.nombreProducto}": el vendedor devolvió el dinero al comprador.`
        });

        res.status(200).json({
            mensaje: resolucion === "LIBERAR_VENDEDOR"
                ? "Reclamo resuelto. El dinero se liberó al vendedor."
                : "Reclamo resuelto. El dinero se devolvió al comprador.",
            reclamo,
            solicitud: {
                id: actualizada._id,
                estado: actualizada.estado
            }
        });
    } catch (error) {
        console.error("Error al resolver reclamo:", error.message);
        res.status(500).json({
            mensaje: "Error al resolver el reclamo"
        });
    }
}

module.exports = {
    registrarReclamo,
    obtenerReclamos,
    resolverReclamo
};
