const mongoose = require("mongoose");
const crypto = require("node:crypto");
const SolicitudPago = require("../models/SolicitudPago");
const fs = require("node:fs/promises");

// Crear una solicitud de pago
const crearSolicitud = async (req, res) => {
    try {
        const { nombreProducto, precio } = req.body || {};

        const precioNumero = Number(precio);

        // Validar datos
        if (
            typeof nombreProducto !== "string" ||
            !nombreProducto.trim() ||
            (precio === undefined || precio === null || !String(precio).trim()) ||
            !Number.isFinite(precioNumero) ||
            precioNumero <= 0 ||
            !req.file
        ) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => { });
            }

            return res.status(400).json({
                mensaje: "Debe ingresar nombre, precio válido y fotografía"
            });
        }

        const codigoReferencia = crypto.randomUUID();

        const solicitud = await SolicitudPago.create({
            nombreProducto: nombreProducto.trim(),
            precio: precioNumero,
            foto: `/uploads/productos/${req.file.filename}`,
            codigoReferencia,
            vendedor: req.usuario.id,
            estado: "PENDIENTE"
        });

        return res.status(201).json({
            mensaje: "Solicitud creada correctamente",
            solicitud: {
                id: solicitud._id,
                nombreProducto: solicitud.nombreProducto,
                precio: solicitud.precio,
                foto: solicitud.foto,
                codigoReferencia: solicitud.codigoReferencia,
                estado: solicitud.estado,
                fechaCreacion: solicitud.fechaCreacion,
                enlace: `/pages/solicitud.html?id=${solicitud._id}`
            }
        });

    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => { });
        }

        console.error("Error al crear solicitud:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                mensaje: "Se generó un código de referencia duplicado. Intentá nuevamente"
            });
        }

        return res.status(500).json({
            mensaje: "Error al crear la solicitud"
        });
    }
};


// Consultar solicitudes propias
const obtenerMisSolicitudes = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const [ventas, compras] = await Promise.all([
            SolicitudPago.find({ vendedor: usuarioId })
                .sort({ fechaCreacion: -1 })
                .select("-__v"),

            SolicitudPago.find({ comprador: usuarioId })
                .sort({ fechaCreacion: -1 })
                .select("-__v")
        ]);

        return res.status(200).json({
            ventas,
            compras
        });

    } catch (error) {
        console.error("Error al consultar solicitudes:", error);

        return res.status(500).json({
            mensaje: "Error al obtener las solicitudes"
        });
    }
};



// Consultar detalles públicos de una solicitud
const obtenerSolicitudPorId = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que sea un ObjectId válido
        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({
                mensaje: "Identificador de solicitud inválido"
            });
        }

        const solicitud = await SolicitudPago.findById(id)
            .select("nombreProducto precio foto estado vendedor comprador numeroSeguimiento fechaDespacho fechaRecepcion")
            .populate("vendedor", "nombre localidad")
            .populate("comprador", "nombre");

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        return res.status(200).json({
            solicitud: {
                id: solicitud._id,
                nombreProducto: solicitud.nombreProducto,
                precio: solicitud.precio,
                foto: solicitud.foto,
                estado: solicitud.estado,
                vendedor: solicitud.vendedor,
                comprador: solicitud.comprador
                    ? { _id: solicitud.comprador._id, nombre: solicitud.comprador.nombre }
                    : null,
                numeroSeguimiento: solicitud.numeroSeguimiento,
                fechaDespacho: solicitud.fechaDespacho,
                fechaRecepcion: solicitud.fechaRecepcion
            }
        });

    } catch (error) {
        console.error("Error al consultar solicitud:", error);

        return res.status(500).json({
            mensaje: "Error al obtener la solicitud"
        });
    }
};


// Simular el pago de una solicitud
const pagarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({
                mensaje: "Identificador de solicitud inválido"
            });
        }

        // Buscar la solicitud
        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({
                mensaje: "Solicitud no encontrada"
            });
        }

        // No permitir que el vendedor pague su propia solicitud
        if (solicitud.vendedor.toString() === usuarioId.toString()) {
            return res.status(403).json({
                mensaje: "No puede pagar su propia solicitud"
            });
        }

        // Solo se pueden pagar solicitudes pendientes
        if (solicitud.estado !== "PENDIENTE") {
            return res.status(409).json({
                mensaje: "La solicitud no está pendiente de pago"
            });
        }

        // Actualización condicional para evitar pagos duplicados
        const solicitudActualizada =
            await SolicitudPago.findOneAndUpdate(
                {
                    _id: id,
                    estado: "PENDIENTE",
                    comprador: null,
                    vendedor: { $ne: usuarioId }
                },
                {
                    $set: {
                        comprador: usuarioId,
                        estado: "PAGADA",
                        fechaPago: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        // Puede haber cambiado el estado entre las consultas
        if (!solicitudActualizada) {
            return res.status(409).json({
                mensaje: "La solicitud ya no está disponible para pagar"
            });
        }

        // Mostrar únicamente el nombre del comprador en la respuesta.
        await solicitudActualizada.populate("comprador", "nombre");

        return res.status(200).json({
            mensaje: "Pago simulado correctamente",
            solicitud: {
                id: solicitudActualizada._id,
                nombreProducto: solicitudActualizada.nombreProducto,
                precio: solicitudActualizada.precio,
                codigoReferencia:
                    solicitudActualizada.codigoReferencia,
                estado: solicitudActualizada.estado,
                comprador: { nombre: solicitudActualizada.comprador.nombre },
                fechaPago: solicitudActualizada.fechaPago
            }
        });

    } catch (error) {
        console.error("Error al simular pago:", error);

        return res.status(500).json({
            mensaje: "Error al registrar el pago"
        });
    }
};

// Confirmar el despacho de una solicitud
const despacharSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;
        const { numeroSeguimiento } = req.body || {}; // número de seguimiento

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({ mensaje: "Identificador de solicitud inválido" });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        }

        // Verificar que sea el vendedor
        if (solicitud.vendedor.toString() !== usuarioId.toString()) {
            return res.status(403).json({ mensaje: "No tenés permiso para despachar esta solicitud" });
        }

        // Verificar estado
        if (solicitud.estado !== "PAGADA") {
            return res.status(409).json({ mensaje: "La solicitud debe estar PAGADA para poder despachar" });
        }

        // Actualización condicional
        const solicitudActualizada = await SolicitudPago.findOneAndUpdate(
            { _id: id, estado: "PAGADA", vendedor: usuarioId },
            {
                $set: {
                    estado: "DESPACHADA",
                    fechaDespacho: new Date(),
                    numeroSeguimiento: numeroSeguimiento || null
                }
            },
            { new: true, runValidators: true }
        );

        if (!solicitudActualizada) {
            return res.status(409).json({ mensaje: "La solicitud ya no está disponible para despachar" });
        }

        return res.status(200).json({
            mensaje: "Solicitud despachada correctamente",
            solicitud: {
                id: solicitudActualizada._id,
                estado: solicitudActualizada.estado,
                fechaDespacho: solicitudActualizada.fechaDespacho,
                numeroSeguimiento: solicitudActualizada.numeroSeguimiento
            }
        });

    } catch (error) {
        console.error("Error al despachar solicitud:", error);
        return res.status(500).json({ mensaje: "Error al registrar el despacho" });
    }
};


// Confirmar la recepción de una solicitud (libera los fondos)
const confirmarRecepcionSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({ mensaje: "Identificador de solicitud inválido" });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        }

        // Verificar que sea el comprador
        if (!solicitud.comprador || solicitud.comprador.toString() !== usuarioId.toString()) {
            return res.status(403).json({ mensaje: "No tenés permiso para confirmar esta recepción" });
        }

        // Si está en reclamo, no se puede confirmar
        if (solicitud.estado === "EN_RECLAMO") {
            return res.status(409).json({ mensaje: "La solicitud está en proceso de reclamo. Los fondos permanecen congelados." });
        }

        // Verificar estado
        if (solicitud.estado !== "DESPACHADA") {
            return res.status(409).json({ mensaje: "La solicitud debe estar DESPACHADA para confirmar la recepción" });
        }

        // Actualización condicional
        const solicitudActualizada = await SolicitudPago.findOneAndUpdate(
            { _id: id, estado: "DESPACHADA", comprador: usuarioId },
            {
                $set: {
                    estado: "FINALIZADA",
                    fechaRecepcion: new Date(),
                    fechaLiberacion: new Date() // aca se marca que el dinero se liberó al vendedor
                }
            },
            { new: true, runValidators: true }
        );

        if (!solicitudActualizada) {
            return res.status(409).json({ mensaje: "La solicitud ya no está disponible para confirmar" });
        }

        return res.status(200).json({
            mensaje: "Recepción confirmada. Los fondos han sido liberados al vendedor.",
            solicitud: {
                id: solicitudActualizada._id,
                estado: solicitudActualizada.estado,
                fechaRecepcion: solicitudActualizada.fechaRecepcion,
                fechaLiberacion: solicitudActualizada.fechaLiberacion
            }
        });

    } catch (error) {
        console.error("Error al confirmar recepción:", error);
        return res.status(500).json({ mensaje: "Error al confirmar la recepción" });
    }
};


// Cancelar una solicitud
const cancelarSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({ mensaje: "Identificador de solicitud inválido" });
        }

        const solicitud = await SolicitudPago.findById(id);

        if (!solicitud) {
            return res.status(404).json({ mensaje: "Solicitud no encontrada" });
        }

        // Verificar que sea parte de la operación (comprador o vendedor)
        const esComprador = solicitud.comprador && solicitud.comprador.toString() === usuarioId.toString();
        const esVendedor = solicitud.vendedor.toString() === usuarioId.toString();

        if (!esComprador && !esVendedor) {
            return res.status(403).json({ mensaje: "No tenés permiso para cancelar esta solicitud" });
        }

        // Si está en reclamo, no se puede cancelar unilateralmente
        if (solicitud.estado === "EN_RECLAMO") {
            return res.status(409).json({ mensaje: "No se puede cancelar una solicitud en reclamo. Esperá la resolución de soporte." });
        }

        // No se puede cancelar si ya se despachó o finalizó
        if (solicitud.estado === "DESPACHADA" || solicitud.estado === "FINALIZADA") {
            return res.status(409).json({ mensaje: "No se puede cancelar una solicitud ya despachada o finalizada. Debés iniciar un reclamo." });
        }

        // Actualización condicional
        const solicitudActualizada = await SolicitudPago.findOneAndUpdate(
            {
                _id: id,
                estado: { $in: ["PENDIENTE", "PAGADA"] }
            },
            {
                $set: {
                    estado: "CANCELADA"
                }
            },
            { new: true, runValidators: true }
        );

        if (!solicitudActualizada) {
            return res.status(409).json({ mensaje: "La solicitud ya no está disponible para cancelar" });
        }

        return res.status(200).json({
            mensaje: "Solicitud cancelada correctamente",
            solicitud: {
                id: solicitudActualizada._id,
                estado: solicitudActualizada.estado
            }
        });

    } catch (error) {
        console.error("Error al cancelar solicitud:", error);
        return res.status(500).json({ mensaje: "Error al cancelar la solicitud" });
    }
}

module.exports = {
    crearSolicitud,
    obtenerMisSolicitudes,
    obtenerSolicitudPorId,
    pagarSolicitud,
    despacharSolicitud,
    confirmarRecepcionSolicitud,
    cancelarSolicitud
};