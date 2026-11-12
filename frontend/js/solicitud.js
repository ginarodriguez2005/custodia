(async () => {
    const id = obtenerIdSolicitud();
    const cargando = document.getElementById("cargando");

    if (!id) {
        cargando.classList.add("hide");
        mostrarMensaje("Falta el identificador de la solicitud.");
        return;
    }

    try {
        const { solicitud } = await apiRequest(`/solicitudes/${encodeURIComponent(id)}`);
        cargando.classList.add("hide");
        document.getElementById("detalles").classList.remove("hide");
        document.getElementById("producto-nombre").textContent = solicitud.nombreProducto;
        document.getElementById("producto-precio").textContent = precioUy(solicitud.precio);

        const usuario = obtenerUsuario();
        const usuarioId = usuario ? String(usuario.id || usuario._id) : null;
        const esVendedor = !!usuarioId && usuarioId === String(solicitud.vendedor?._id || solicitud.vendedor);
        const esComprador = !!usuarioId && usuarioId === String(solicitud.comprador?._id || solicitud.comprador?.id || solicitud.comprador);
        const rol = esVendedor ? "vendedor" : (esComprador ? "comprador" : "publico");

        const estado = document.getElementById("producto-estado");
        estado.textContent = etiquetaEstado(solicitud.estado);
        estado.className = `status status--${String(solicitud.estado || "").toLowerCase()}`;
        document.getElementById("producto-estado-descripcion").textContent = descripcionEstado(solicitud.estado, rol);

        const foto = document.getElementById("producto-foto");
        const rutaFoto = fotoProducto(solicitud.foto);
        if (rutaFoto) {
            foto.src = rutaFoto;
            foto.classList.remove("hide");
        }

        const datos = document.getElementById("producto-datos");
        agregarFila(datos, "Vendedor", solicitud.vendedor?.nombre || "No disponible");
        agregarFila(datos, "Localidad", solicitud.vendedor?.localidad || "No disponible");
        if (solicitud.comprador?.nombre) {
            agregarFila(datos, "Comprador", solicitud.comprador.nombre);
        }
        if (solicitud.numeroSeguimiento) {
            agregarFila(datos, "Nº de seguimiento", solicitud.numeroSeguimiento);
        }
        if (solicitud.fechaDespacho) {
            agregarFila(datos, "Fecha de despacho", new Date(solicitud.fechaDespacho).toLocaleDateString("es-UY"));
        }
        if (solicitud.fechaRecepcion) {
            agregarFila(datos, "Fecha de recepción", new Date(solicitud.fechaRecepcion).toLocaleDateString("es-UY"));
        }

        // Acciones y visibilidad según estado y rol
        const botonPagar = document.getElementById("ir-pagar");
        const botonDespachar = document.getElementById("btn-despachar");
        const botonRecepcion = document.getElementById("btn-recepcion");
        const botonCancelar = document.getElementById("btn-cancelar");
        const botonReclamo = document.getElementById("ir-reclamo");

        if (solicitud.estado === "PENDIENTE") {
            if (!esVendedor) {
                botonPagar.href = `/pages/pagar.html?id=${encodeURIComponent(id)}`;
                botonPagar.classList.remove("hide");
            }
            if (esVendedor) {
                document.getElementById("aviso-vendedor").classList.remove("hide");
                botonCancelar.classList.remove("hide");
            }
        } else {
            const aviso = document.getElementById("aviso-estado");
            aviso.textContent = "Esta solicitud ya no admite un nuevo pago.";
            aviso.classList.remove("hide");
        }

        // Si la solicitud está PAGADA y es el vendedor, puede despachar
        if (solicitud.estado === "PAGADA" && esVendedor) {
            botonDespachar.classList.remove("hide");
        }

        // Si la solicitud está DESPACHADA y es el comprador, puede confirmar recepción
        if (solicitud.estado === "DESPACHADA" && esComprador) {
            botonRecepcion.classList.remove("hide");
        }

        // Si la solicitud está pagada o despachada, comprador o vendedor pueden reportar un reclamo
        if (ESTADOS_RECLAMABLES.includes(solicitud.estado) && (esComprador || esVendedor)) {
            botonReclamo.href = enlaceReclamo(id, esVendedor ? "ventas" : "compras");
            botonReclamo.classList.remove("hide");
        }

        // Modales y Event Listeners
        const modalDespacho = document.getElementById("modal-despacho");
        const btnConfirmarDespacho = document.getElementById("confirmar-despacho");
        const inputTracking = document.getElementById("input-tracking");

        if (botonDespachar && modalDespacho) {
            botonDespachar.addEventListener("click", () => {
                ocultarMensaje();
                modalDespacho.showModal();
            });

            btnConfirmarDespacho.addEventListener("click", async () => {
                deshabilitarBoton(btnConfirmarDespacho, true, "Despachando...");
                try {
                    const tracking = inputTracking.value.trim();
                    const body = tracking ? { numeroSeguimiento: tracking } : {};
                    const res = await apiRequest(`/solicitudes/${encodeURIComponent(id)}/despachar`, {
                        method: "POST",
                        body,
                        auth: true
                    });
                    modalDespacho.close();
                    mostrarMensaje(res.mensaje || "Despacho confirmado correctamente.", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    modalDespacho.close();
                    mostrarMensaje(error.message);
                    deshabilitarBoton(btnConfirmarDespacho, false);
                }
            });
        }

        const modalRecepcion = document.getElementById("modal-recepcion");
        const btnConfirmarRecepcion = document.getElementById("confirmar-recepcion");

        if (botonRecepcion && modalRecepcion) {
            botonRecepcion.addEventListener("click", () => {
                ocultarMensaje();
                modalRecepcion.showModal();
            });

            btnConfirmarRecepcion.addEventListener("click", async () => {
                deshabilitarBoton(btnConfirmarRecepcion, true, "Confirmando...");
                try {
                    const res = await apiRequest(`/solicitudes/${encodeURIComponent(id)}/confirmar-recepcion`, {
                        method: "POST",
                        auth: true
                    });
                    modalRecepcion.close();
                    mostrarMensaje(res.mensaje || "Recepción confirmada correctamente.", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    modalRecepcion.close();
                    mostrarMensaje(error.message);
                    deshabilitarBoton(btnConfirmarRecepcion, false);
                }
            });
        }

        const modalCancelar = document.getElementById("modal-cancelar");
        const btnConfirmarCancelar = document.getElementById("confirmar-cancelar");

        if (botonCancelar && modalCancelar) {
            botonCancelar.addEventListener("click", () => {
                ocultarMensaje();
                modalCancelar.showModal();
            });

            btnConfirmarCancelar.addEventListener("click", async () => {
                deshabilitarBoton(btnConfirmarCancelar, true, "Cancelando...");
                try {
                    const res = await apiRequest(`/solicitudes/${encodeURIComponent(id)}/cancelar`, {
                        method: "POST",
                        auth: true
                    });
                    modalCancelar.close();
                    mostrarMensaje(res.mensaje || "Solicitud cancelada.", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    modalCancelar.close();
                    mostrarMensaje(error.message);
                    deshabilitarBoton(btnConfirmarCancelar, false);
                }
            });
        }

        document.getElementById("copiar").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                mostrarMensaje("Enlace copiado.", "success");
            } catch {
                mostrarMensaje("No se pudo copiar automáticamente. Copiá la dirección del navegador.");
            }
        });

    } catch (error) {
        cargando.classList.add("hide");
        mostrarMensaje(error.message);
    }
})();
