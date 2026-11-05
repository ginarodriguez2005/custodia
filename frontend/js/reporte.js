
// TEMPORAL: se puede ver la pantalla sin iniciar sesión.
// Volver a true para exigir login antes de mostrarla.
const EXIGIR_SESION = false;

if (!EXIGIR_SESION || requerirSesion()) {
    // Teléfono de ayuda (formato internacional, ej: "+59899123456").
    // Mientras esté vacío, el botón "Llamar para ayuda" avisa que no está disponible.
    const TELEFONO_AYUDA = "";

    // Motivos por rol. Los valores coinciden con el enum "motivo" del modelo Reclamo.
    // La descripción de cada opción se envía como "descripcion" salvo en OTRO,
    // donde el usuario la escribe.
    const MOTIVOS_POR_ROL = {
        COMPRADOR: [
            { valor: "NO_RECIBIDO", texto: "No recibí el producto" },
            { valor: "NO_COINCIDE", texto: "No es como me lo describieron" },
            { valor: "DANADO", texto: "Llegó dañado o incompleto" },
            { valor: "OTRO", texto: "Otro problema" }
        ]
        // VENDEDOR: [...] cuando el backend permita reclamos del vendedor.
    };

    const usuario = obtenerUsuario();
    // El modelo Usuario todavía no tiene "rol": hasta que exista, se asume comprador.
    const rol = (usuario?.rol || "COMPRADOR").toUpperCase();
    const motivos = MOTIVOS_POR_ROL[rol] || MOTIVOS_POR_ROL.COMPRADOR;

    const form = document.getElementById("reporte-form");
    const listaMotivos = document.getElementById("motivos");
    const detalleField = document.getElementById("detalle-field");
    const descripcion = document.getElementById("descripcion");
    const solicitudId = new URLSearchParams(window.location.search).get("solicitud");

    // Render de opciones
    motivos.forEach(({ valor, texto }) => {
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

        if (!solicitudId) {
            mostrarAlerta("No encontramos la compra a reportar. Volvé a entrar desde el detalle de tu compra.");
            return;
        }

        const texto = motivo === "OTRO"
            ? descripcion.value.trim()
            : motivos.find((m) => m.valor === motivo).texto;

        const boton = form.querySelector("[type=submit]");
        setCargando(boton, true, "Enviando...");

        try {
            await apiRequest(`/solicitudes/${encodeURIComponent(solicitudId)}/reclamos`, {
                method: "POST",
                auth: true,
                body: { motivo, descripcion: texto }
            });
            mostrarAlerta("Recibimos tu reporte. Te vamos a avisar por WhatsApp cuando lo revisemos.", "success");
            form.querySelectorAll("input, textarea").forEach((el) => { el.disabled = true; });
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
}
