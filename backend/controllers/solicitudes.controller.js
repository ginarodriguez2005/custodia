const mongoose = require("mongoose");
const crypto = require("node:crypto");
const SolicitudPago = require("../models/SolicitudPago");
const fs = require("node:fs/promises");

// Crear una solicitud de pago
const crearSolicitud = async (req, res) => {
    try {
        const { nombreProducto, precio } = req.body;

        const precioNumero = Number(precio);

        // Validar datos
        if (
            typeof nombreProducto !== "string" ||
            !nombreProducto.trim() ||
            !String(precio).trim() ||
            !Number.isFinite(precioNumero) ||
            precioNumero <= 0 ||
            !req.file
        ) {
            if (req.file) {
                await fs.unlink(req.file.path).catch(() => {});
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
                enlace: `/solicitud.html?id=${solicitud._id}`
            }
        });

    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }

        console.error("Error al crear solicitud:", error);

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
            .select("nombreProducto precio foto estado vendedor")
            .populate("vendedor", "nombre localidad");

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
                vendedor: solicitud.vendedor
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

        return res.status(200).json({
            mensaje: "Pago simulado correctamente",
            solicitud: {
                id: solicitudActualizada._id,
                nombreProducto: solicitudActualizada.nombreProducto,
                precio: solicitudActualizada.precio,
                codigoReferencia:
                    solicitudActualizada.codigoReferencia,
                estado: solicitudActualizada.estado,
                comprador: solicitudActualizada.comprador,
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


module.exports = {
    crearSolicitud,
    obtenerMisSolicitudes,
    obtenerSolicitudPorId,
    pagarSolicitud
};