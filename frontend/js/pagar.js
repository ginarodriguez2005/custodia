if (requerirSesion()) {
    (async () => {
        const id = obtenerIdSolicitud();
        const boton = document.getElementById("confirmar-pago");
        const modal = document.getElementById("modal-pago");
        const confirmarModal = document.getElementById("modal-confirmar");
        const cargando = document.getElementById("cargando");

        if (!id) {
            cargando.classList.add("hide");
            mostrarMensaje("Falta el identificador de la solicitud.");
            return;
        }

        const rutaDetalle = enlaceDetalle(id);
        document.getElementById("volver-detalle").href = rutaDetalle;
        document.getElementById("ver-detalle").href = rutaDetalle;
        // Volver de la cabecera siempre al detalle de esta solicitud.
        document.querySelector(".app-header__back").href = rutaDetalle;

        try {
            const { solicitud } = await apiRequest(`/solicitudes/${encodeURIComponent(id)}`);
            cargando.classList.add("hide");
            document.getElementById("pago-contenido").classList.remove("hide");
            agregarFila(document.getElementById("resumen"), "Artículo", solicitud.nombreProducto);
            agregarFila(document.getElementById("resumen"), "Vendedor", solicitud.vendedor?.nombre || "No disponible");
            agregarFila(document.getElementById("resumen"), "Estado", etiquetaEstado(solicitud.estado));
            document.getElementById("monto").textContent = precioUy(solicitud.precio);

            agregarFila(document.getElementById("modal-resumen"), "Artículo", solicitud.nombreProducto);
            agregarFila(document.getElementById("modal-resumen"), "Vendedor", solicitud.vendedor?.nombre || "No disponible");
            document.getElementById("modal-monto").textContent = precioUy(solicitud.precio);

            const usuario = obtenerUsuario();
            const esPropia = !!usuario &&
                String(usuario.id || usuario._id) === String(solicitud.vendedor?._id);
            if (esPropia || solicitud.estado !== "PENDIENTE") {
                boton.disabled = true;
                mostrarMensaje(esPropia
                    ? "No podés pagar una solicitud creada por vos."
                    : "Esta solicitud ya no está pendiente de pago.");
            }

            boton.addEventListener("click", () => {
                if (!boton.disabled) modal.showModal();
            });

            confirmarModal.addEventListener("click", async () => {
                if (confirmarModal.disabled) return;
                ocultarMensaje();
                deshabilitarBoton(confirmarModal, true, "Registrando...");
                boton.disabled = true;

                try {
                    const respuesta = await apiRequest(`/solicitudes/${encodeURIComponent(id)}/pagar`, {
                        method: "POST",
                        auth: true
                    });
                    modal.close();
                    document.getElementById("pago-contenido").classList.add("hide");
                    document.getElementById("pago-exitoso").classList.remove("hide");
                    const comprador = respuesta.solicitud.comprador;
                    const nombreComprador = comprador?.nombre || usuario?.nombre || "No disponible";
                    agregarFila(document.getElementById("datos-exito"), "Comprador", nombreComprador);
                    agregarFila(document.getElementById("datos-exito"), "Producto", respuesta.solicitud.nombreProducto);
                    agregarFila(document.getElementById("datos-exito"), "Importe", precioUy(respuesta.solicitud.precio));
                } catch (error) {
                    modal.close();
                    boton.disabled = false;
                    mostrarMensaje(error.message);
                } finally {
                    deshabilitarBoton(confirmarModal, false);
                }
            });
        } catch (error) {
            cargando.classList.add("hide");
            mostrarMensaje(error.message);
        }
    })();
}
