
const mongoose = require("mongoose");
const Reclamo = require("../models/Reclamo");
const SolicitudPago = require("../models/SolicitudPago");

const MOTIVOS = Reclamo.schema.path("motivo").enumValues;
const ESTADOS_RECLAMABLES = ["PAGADA", "DESPACHADA"];

async function registrarReclamo(req, res) {
    try {
        const { id } = req.params;
        const { motivo, descripcion } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                mensaje: "Id de solicitud inválido"
            });
        }

        if (!motivo || !descripcion || !descripcion.trim()) {
            return res.status(400).json({
                mensaje: "Motivo y descripción son obligatorios"
            });
        }

        if (!MOTIVOS.includes(motivo)) {
            return res.status(400).json({
                mensaje: `Motivo inválido. Valores permitidos: ${MOTIVOS.join(", ")}`
            });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        if (!solicitud.comprador || !solicitud.comprador.equals(req.usuario.id)) {
            return res.status(403).json({
                mensaje: "Solo el comprador puede registrar un reclamo"
            });
        }

        const estadoAnterior = solicitud.estado;

        // Actualización condicional para evitar dos reclamos simultáneos
        const actualizada = await SolicitudPago.findOneAndUpdate(
            { _id: id, estado: { $in: ESTADOS_RECLAMABLES } },
            { estado: "EN_RECLAMO" }
        );

        if (!actualizada) {
            return res.status(409).json({
                mensaje: `No se puede registrar un reclamo con la solicitud en estado ${estadoAnterior}`
            });
        }

        let reclamo;

        try {
            reclamo = await Reclamo.create({
                solicitudPago: id,
                usuario: req.usuario.id,
                motivo,
                descripcion
            });
        } catch (error) {
            await SolicitudPago.updateOne(
                { _id: id },
                { estado: actualizada.estado }
            );
            throw error;
        }

        res.status(201).json({ reclamo });
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

        const esParticipante =
            solicitud.vendedor.equals(req.usuario.id) ||
            (solicitud.comprador && solicitud.comprador.equals(req.usuario.id));

        if (!esParticipante) {
            return res.status(403).json({
                mensaje: "No tienes acceso a los reclamos de esta solicitud"
            });
        }

        const reclamos = await Reclamo
            .find({ solicitudPago: id })
            .sort({ fechaCreacion: -1 });

        res.status(200).json({ reclamos });
    } catch (error) {
        console.error("Error al obtener reclamos:", error.message);
        res.status(500).json({
            mensaje: "Error al obtener los reclamos"
        });
    }
}

module.exports = {
    registrarReclamo,
    obtenerReclamos
};
