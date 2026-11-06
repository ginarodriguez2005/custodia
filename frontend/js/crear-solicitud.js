if (requerirSesion()) {
    const formulario = document.getElementById("solicitud-form");
    const foto = document.getElementById("foto");
    const vista = document.getElementById("vista-foto");
    const boton = document.getElementById("crear-btn");
    const previewBox = document.getElementById("foto-preview-box");
    const selector = document.getElementById("foto-selector");
    const campoNombre = document.getElementById("nombreProducto");
    const campoPrecio = document.getElementById("precio");
    let urlTemporal = null;
    let enlaceCompartir = "";

    function marcarError(idCampo, mensaje) {
        const campo = document.getElementById(`campo-${idCampo}`);
        campo.classList.add("has-error");
        const error = document.getElementById(`error-${idCampo}`);
        if (mensaje) 
            error.textContent = mensaje;
        const control = campo.querySelector("input");
        control?.setAttribute("aria-invalid", "true");
    }

    function limpiarError(idCampo) {
        const campo = document.getElementById(`campo-${idCampo}`);
        campo.classList.remove("has-error");
        campo.querySelector("input")?.removeAttribute("aria-invalid");
    }

    function liberarVistaPrevia() {
        if (urlTemporal) 
            URL.revokeObjectURL(urlTemporal);
        urlTemporal = null;
        vista.removeAttribute("src");
        previewBox.classList.add("hide");
        selector.classList.remove("hide");
    }

    function procesarFoto() {
        limpiarError("foto");
        liberarVistaPrevia();
        const archivo = foto.files[0];
        if (!archivo) 
            return;

        const tipos = ["image/jpeg", "image/png", "image/webp"];
        if (!tipos.includes(archivo.type)) {
            foto.value = "";
            marcarError("foto", "Usá una imagen JPG, PNG o WebP.");
            return;
        }
        if (archivo.size > 2 * 1024 * 1024) {
            foto.value = "";
            marcarError("foto", "La fotografía no puede superar los 2 MB.");
            return;
        }

        urlTemporal = URL.createObjectURL(archivo);
        vista.src = urlTemporal;
        document.getElementById("foto-nombre").textContent = archivo.name;
        selector.classList.add("hide");
        previewBox.classList.remove("hide");
    }

    foto.addEventListener("change", procesarFoto);
    campoNombre.addEventListener("input", () => limpiarError("nombre"));
    campoPrecio.addEventListener("input", () => limpiarError("precio"));
    document.getElementById("cambiar-foto").addEventListener("click", () => foto.click());
    document.getElementById("quitar-foto").addEventListener("click", () => {
        foto.value = "";
        liberarVistaPrevia();
    });

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        ocultarMensaje();
        ["nombre", "precio", "foto"].forEach(limpiarError);

        const nombre = campoNombre.value.trim();
        const precio = campoPrecio.value.trim();
        const archivo = foto.files[0];
        let primerInvalido = null;

        if (!nombre) {
            marcarError("nombre", "Ingresá qué producto estás vendiendo.");
            primerInvalido = campoNombre;
        }
        if (!precio || !Number.isFinite(Number(precio)) || Number(precio) <= 0) {
            marcarError("precio", "Ingresá un precio mayor a cero.");
            primerInvalido ||= campoPrecio;
        }
        if (!archivo) {
            marcarError("foto", "Seleccioná una fotografía del producto.");
            primerInvalido ||= foto;
        }
        if (primerInvalido) {
            if (primerInvalido === foto) 
                document.getElementById("foto-selector").focus();
            else 
                primerInvalido.focus();
            return;
        }

        const datos = new FormData();
        datos.append("nombreProducto", nombre);
        datos.append("precio", precio);
        datos.append("foto", archivo);
        deshabilitarBoton(boton, true, "Creando solicitud...");

        try {
            const respuesta = await apiRequest("/solicitudes", {
                method: "POST",
                body: datos,
                auth: true
            });
            const id = respuesta.solicitud.id;
            enlaceCompartir = new URL(enlaceDetalle(id), window.location.origin).href;
            document.getElementById("enlace-creado").textContent = enlaceCompartir;
            document.getElementById("ver-solicitud").href = enlaceDetalle(id);
            document.getElementById("resultado").classList.remove("hide");
            formulario.classList.add("hide");
        } catch (error) {
            mostrarMensaje(error.message);
        } finally {
            deshabilitarBoton(boton, false);
        }
    });

    document.getElementById("copiar-enlace").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(enlaceCompartir);
            mostrarMensaje("Enlace copiado.", "success");
        } catch {
            mostrarMensaje("No se pudo copiar automáticamente. Copiá el enlace mostrado.");
        }
    });
    window.addEventListener("beforeunload", liberarVistaPrevia);
}
