
if (requerirSesion()) {
    // Teléfono de ayuda (formato internacional, ej: "+59899123456").
    // Mientras esté vacío, el botón "Llamar para ayuda" avisa que no está disponible.
    const TELEFONO_AYUDA = "";

    const parametros = new URLSearchParams(window.location.search);
    const solicitudId = parametros.get("solicitud");
    const tab = parametros.get("tab") === "ventas" ? "ventas" : "compras";

    const form = document.getElementById("reporte-form");
    const listaMotivos = document.getElementById("motivos");
    const detalleField = document.getElementById("detalle-field");
    const descripcion = document.getElementById("descripcion");
    const cargando = document.getElementById("cargando");
    const botonesRol = document.querySelectorAll(".segmented__option");
    let rol = null;

    document.getElementById("volver").href = `mis-solicitudes.html?tab=${tab}`;

    function renderizarMotivos() {
        listaMotivos.querySelectorAll(".option-card").forEach((opcion) => opcion.remove());
        MOTIVOS_RECLAMO[rol].forEach(({ valor, texto }) => {
            const opcion = document.createElement("label");
            opcion.className = "option-card";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "motivo";
            radio.value = valor;

            const marca = document.createElement("span");
            marca.className = "option-card__radio";

            opcion.append(radio, marca, texto);
            listaMotivos.appendChild(opcion);
        });
        detalleField.hidden = true;
        descripcion.required = false;
    }

    // El rol lo define la operación: solo se habilita el que corresponde al usuario
    function configurarRol(rolUsuario) {
        rol = rolUsuario;
        botonesRol.forEach((boton) => {
            const activo = boton.dataset.rol === rol;
            boton.setAttribute("aria-pressed", String(activo));
            boton.disabled = !activo;
            boton.title = activo ? "" : "En esta operación no tenés este rol";
        });
        renderizarMotivos();
    }

    function mostrarProducto(solicitud) {
        const nombre = solicitud.nombreProducto || "Producto";
        document.getElementById("producto-nombre").textContent = nombre;
        document.getElementById("producto-precio").textContent = precioUy(solicitud.precio);
        const rutaFoto = fotoProducto(solicitud.foto);
        if (rutaFoto) {
            const foto = document.getElementById("producto-foto");
            foto.src = rutaFoto;
            foto.alt = `Fotografía de ${nombre}`;
            foto.classList.remove("hide");
        }
        document.getElementById("producto").classList.remove("hide");
    }

    function mostrarReclamoExistente(reclamo, solicitud) {
        const propio = reclamo.rol === rol;
        const resuelto = reclamo.estado === "RESUELTO";
        document.getElementById("reclamo-titulo").textContent = resuelto
            ? "Reclamo resuelto"
            : (propio ? "Ya hiciste un reclamo"
                : (reclamo.rol === "VENDEDOR" ? "El vendedor hizo un reclamo" : "El comprador hizo un reclamo"));
        document.getElementById("reporte-subtitulo").textContent = resuelto
            ? "Este reclamo ya se resolvió entre comprador y vendedor."
            : "Cada operación admite un solo reclamo. Lo resuelven entre comprador y vendedor.";

        const datos = document.getElementById("reclamo-datos");
        datos.replaceChildren();
        agregarFila(datos, "Producto", solicitud.nombreProducto || "Producto");
        agregarFila(datos, "Motivo", textoMotivo(reclamo.rol, reclamo.motivo));
        if (reclamo.motivo === "OTRO") agregarFila(datos, "Detalle", reclamo.descripcion);
        agregarFila(datos, "Estado", etiquetaEstadoReclamo(reclamo.estado));
        agregarFila(datos, "Fecha", new Date(reclamo.fechaCreacion).toLocaleDateString("es-UY"));
        if (resuelto) {
            agregarFila(datos, "Resultado", textoResolucion(reclamo.resolucion));
            agregarFila(datos, "Resuelto el", new Date(reclamo.fechaResolucion).toLocaleDateString("es-UY"));
        }

        const opcion = RESOLUCION_RECLAMO[rol];
        document.getElementById("resolver").classList.toggle("hide", resuelto);
        document.getElementById("aviso-protegido").classList.toggle("hide", resuelto);
        if (!resuelto) {
            document.getElementById("resolver-texto").textContent = opcion.explicacion;
            document.getElementById("resolver-btn").textContent = opcion.boton;
            document.getElementById("modal-resolver-texto").textContent = opcion.explicacion;
        }
        document.getElementById("reclamo-existente").classList.remove("hide");
    }

    // Resolución del reclamo (con confirmación)
    const modalResolver = document.getElementById("modal-resolver");
    const confirmarResolver = document.getElementById("confirmar-resolver");
    let datosReclamo = null;

    document.getElementById("resolver-btn").addEventListener("click", () => {
        ocultarAlerta();
        modalResolver.showModal();
    });

    confirmarResolver.addEventListener("click", async () => {
        setCargando(confirmarResolver, true, "Resolviendo...");
        try {
            const respuesta = await apiRequest(`/solicitudes/${encodeURIComponent(solicitudId)}/reclamos`, {
                method: "PATCH",
                auth: true,
                body: { resolucion: RESOLUCION_RECLAMO[rol].valor }
            });
            modalResolver.close();
            mostrarReclamoExistente(respuesta.reclamo, datosReclamo.solicitud);
            mostrarAlerta(respuesta.mensaje, "success");
        } catch (error) {
            modalResolver.close();
            mostrarAlerta(error.message);
        }
        setCargando(confirmarResolver, false);
    });

    listaMotivos.addEventListener("change", () => {
        listaMotivos.classList.remove("has-error");
        const esOtro = form.motivo.value === "OTRO";
        detalleField.hidden = !esOtro;
        descripcion.required = esOtro;
        if (esOtro) descripcion.focus();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        ocultarAlerta();

        const motivo = form.motivo.value;

        if (!motivo) {
            listaMotivos.classList.add("has-error");
            mostrarAlerta("Elegí una opción para continuar.");
            return;
        }

        if (!validarRequeridos(form)) return;

        const texto = motivo === "OTRO" ? descripcion.value.trim() : textoMotivo(rol, motivo);

        const boton = form.querySelector("[type=submit]");
        setCargando(boton, true, "Enviando...");

        try {
            await apiRequest(`/solicitudes/${encodeURIComponent(solicitudId)}/reclamos`, {
                method: "POST",
                auth: true,
                body: { motivo, descripcion: texto }
            });
            mostrarAlerta("Reporte enviado", "success");
            form.querySelectorAll("input, textarea, .segmented__option").forEach((el) => { el.disabled = true; });
            boton.textContent = "Reporte enviado";
            boton.disabled = true;
            return;
        } catch (error) {
            mostrarAlerta(error.message);
        }

        setCargando(boton, false);
    });

    document.getElementById("llamar-btn").addEventListener("click", (event) => {
        if (TELEFONO_AYUDA) {
            event.currentTarget.href = `tel:${TELEFONO_AYUDA}`;
            return;
        }
        event.preventDefault();
        mostrarAlerta("La línea de ayuda todavía no está disponible.");
    });

    // Carga de la operación y del reclamo existente (si lo hay)
    (async () => {
        if (!solicitudId) {
            cargando.classList.add("hide");
            mostrarAlerta("No encontramos la operación a reportar. Entrá desde Mis compras y ventas.");
            return;
        }

        try {
            const ruta = `/solicitudes/${encodeURIComponent(solicitudId)}`;
            const [{ solicitud }, { reclamos }] = await Promise.all([
                apiRequest(ruta),
                apiRequest(`${ruta}/reclamos`, { auth: true })
            ]);

            const usuario = obtenerUsuario();
            const usuarioId = String(usuario?.id || usuario?._id || "");
            const esComprador = usuarioId === String(solicitud.comprador?._id || "");
            configurarRol(esComprador ? "COMPRADOR" : "VENDEDOR");
            cargando.classList.add("hide");
            mostrarProducto(solicitud);

            if (reclamos.length) {
                datosReclamo = { solicitud };
                mostrarReclamoExistente(reclamos[0], solicitud);
                return;
            }

            if (!ESTADOS_RECLAMABLES.includes(solicitud.estado)) {
                mostrarAlerta(`Esta operación no admite reclamos (estado: ${etiquetaEstado(solicitud.estado)}).`);
                return;
            }

            form.classList.remove("hide");
        } catch (error) {
            cargando.classList.add("hide");
            mostrarAlerta(error.message);
        }
    })();
}
