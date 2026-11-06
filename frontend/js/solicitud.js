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
        const esPropia = !!usuario &&
            String(usuario.id || usuario._id) === String(solicitud.vendedor?._id);
        const rol = esPropia ? "vendedor" : "publico";
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

        const botonPagar = document.getElementById("ir-pagar");
        if (solicitud.estado === "PENDIENTE" && !esPropia) {
            botonPagar.href = `/pages/pagar.html?id=${encodeURIComponent(id)}`;
            botonPagar.classList.remove("hide");
        }
        if (esPropia) {
            document.getElementById("aviso-vendedor").classList.remove("hide");
        }
        if (solicitud.estado !== "PENDIENTE") {
            const aviso = document.getElementById("aviso-estado");
            aviso.textContent = "Esta solicitud ya no admite un nuevo pago.";
            aviso.classList.remove("hide");
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
