if (requerirSesion()) {
    const ELEMENTOS_POR_PAGINA = 5;
    let datos = { ventas: [], compras: [] };
    let tipoActual = new URLSearchParams(window.location.search).get("tab") === "compras"
        ? "compras" : "ventas";
    const paginas = { ventas: 1, compras: 1 };
    const contenedor = document.getElementById("lista-operaciones");
    const tabVentas = document.getElementById("tab-ventas");
    const tabCompras = document.getElementById("tab-compras");
    const paginacion = document.getElementById("paginacion");
    const botonAnterior = document.getElementById("pagina-anterior");
    const botonSiguiente = document.getElementById("pagina-siguiente");

    function renderizar() {
        tabVentas.setAttribute("aria-selected", String(tipoActual === "ventas"));
        tabCompras.setAttribute("aria-selected", String(tipoActual === "compras"));
        contenedor.replaceChildren();

        const elementos = Array.isArray(datos[tipoActual]) ? datos[tipoActual] : [];
        if (!elementos.length) {
            paginacion.classList.add("hide");
            const texto = tipoActual === "ventas"
                ? "Todavía no creaste solicitudes de venta. Podés empezar con el botón de abajo."
                : "Todavía no realizaste compras. Cuando registres un pago, aparecerá acá.";
            contenedor.append(nodo("div", "panel empty-state", texto));
            return;
        }

        const cantidadPaginas = Math.ceil(elementos.length / ELEMENTOS_POR_PAGINA);
        paginas[tipoActual] = Math.min(paginas[tipoActual], cantidadPaginas);
        const paginaActual = paginas[tipoActual];
        const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
        const elementosVisibles = elementos.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);

        elementosVisibles.forEach((solicitud) => {
            const tarjeta = nodo("article", "product-card");
            const rutaFoto = fotoProducto(solicitud.foto);
            if (rutaFoto) {
                const imagen = nodo("img", "product-card__image");
                imagen.src = rutaFoto;
                imagen.alt = `Fotografía de ${solicitud.nombreProducto || "producto"}`;
                imagen.loading = "lazy";
                tarjeta.append(imagen);
            }

            const cuerpo = nodo("div", "product-card__body");
            cuerpo.append(nodo("h2", "product-card__title", solicitud.nombreProducto || "Producto"));
            cuerpo.append(nodo(
                "span",
                `status status--${String(solicitud.estado || "").toLowerCase()}`,
                etiquetaEstado(solicitud.estado)
            ));
            cuerpo.append(nodo(
                "p",
                "product-card__meta",
                descripcionEstado(solicitud.estado, tipoActual === "ventas" ? "vendedor" : "comprador")
            ));
            cuerpo.append(nodo("p", "product-card__price", precioUy(solicitud.precio)));
            if (solicitud.fechaCreacion) {
                cuerpo.append(nodo(
                    "p", "product-card__meta",
                    `Creada: ${new Date(solicitud.fechaCreacion).toLocaleDateString("es-UY")}`
                ));
            }
            const enlace = nodo("a", "btn btn--outline btn--block btn--sm", "Ver detalles");
            enlace.href = enlaceDetalle(solicitud._id || solicitud.id);
            cuerpo.append(enlace);
            tarjeta.append(cuerpo);
            contenedor.append(tarjeta);
        });

        paginacion.classList.toggle("hide", cantidadPaginas <= 1);
        document.getElementById("pagina-info").textContent = `Página ${paginaActual} de ${cantidadPaginas}`;
        botonAnterior.disabled = paginaActual === 1;
        botonSiguiente.disabled = paginaActual === cantidadPaginas;
    }

    function cambiarTipo(tipo) {
        tipoActual = tipo;
        renderizar();
    }

    tabVentas.addEventListener("click", () => cambiarTipo("ventas"));
    tabCompras.addEventListener("click", () => cambiarTipo("compras"));
    botonAnterior.addEventListener("click", () => {
        if (paginas[tipoActual] > 1) {
            paginas[tipoActual]--;
            renderizar();
        }
    });
    botonSiguiente.addEventListener("click", () => {
        paginas[tipoActual]++;
        renderizar();
    });

    (async () => {
        try {
            datos = await apiRequest("/solicitudes/mias", { auth: true });
            renderizar();
        } catch (error) {
            contenedor.replaceChildren();
            paginacion.classList.add("hide");
            mostrarMensaje(error.message);
        }
    })();
}
