// Utilidades compartidas para las pantallas de solicitudes.
function precioUy(valor) {
    return new Intl.NumberFormat("es-UY", {
        style: "currency",
        currency: "UYU",
        maximumFractionDigits: 2
    }).format(Number(valor) || 0);
}

function etiquetaEstado(estado) {
    const etiquetas = {
        PENDIENTE: "Pendiente de pago",
        PAGADA: "Pago registrado",
        DESPACHADA: "Producto despachado",
        FINALIZADA: "Compra finalizada",
        EN_RECLAMO: "Reclamo en revisión",
        CANCELADA: "Solicitud cancelada"
    };
    return etiquetas[estado] || "Estado no disponible";
}

function descripcionEstado(estado, rol = "publico") {
    const mensajes = {
        PENDIENTE: {
            vendedor: "Esperando que el comprador registre el pago simulado.",
            comprador: "Todavía no se registró el pago simulado.",
            publico: "Esta solicitud está disponible para registrar un pago simulado."
        },
        PAGADA: {
            vendedor: "El comprador registró el pago simulado. El siguiente paso es confirmar el despacho.",
            comprador: "Tu pago simulado fue registrado. Ahora esperá a que el vendedor confirme el despacho.",
            publico: "El pago simulado ya fue registrado. Se espera el despacho del producto."
        },
        DESPACHADA: {
            vendedor: "El producto figura como despachado. Se espera la confirmación de recepción.",
            comprador: "El vendedor confirmó el despacho. Confirmá la recepción cuando recibas el producto.",
            publico: "El vendedor registró el despacho del producto."
        },
        FINALIZADA: {
            vendedor: "El comprador confirmó la recepción. La operación simulada terminó.",
            comprador: "La recepción fue confirmada. La operación simulada terminó.",
            publico: "Esta operación simulada está finalizada."
        },
        EN_RECLAMO: {
            vendedor: "Hay un reclamo abierto y la operación se encuentra detenida.",
            comprador: "Tu compra tiene un reclamo abierto y la operación está detenida.",
            publico: "La operación está detenida por un reclamo."
        },
        CANCELADA: {
            vendedor: "Cancelaste esta solicitud; ya no puede recibir pagos.",
            comprador: "Esta solicitud fue cancelada y no admite pagos.",
            publico: "Esta solicitud fue cancelada y no admite pagos."
        }
    };
    return mensajes[estado]?.[rol] || mensajes[estado]?.publico || "No hay información del estado.";
}

function obtenerIdSolicitud() {
    return new URLSearchParams(window.location.search).get("id");
}

function fotoProducto(ruta) {
    return typeof ruta === "string" && ruta.startsWith("/uploads/productos/") ? ruta : "";
}

function nodo(tag, clase, texto) {
    const elemento = document.createElement(tag);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = String(texto);
    return elemento;
}

function agregarFila(contenedor, etiqueta, valor) {
    const fila = nodo("div", "summary-row");
    fila.append(
        nodo("span", "summary-row__label", etiqueta),
        nodo("strong", "summary-row__value", valor)
    );
    contenedor.append(fila);
}

function mostrarMensaje(mensaje, tipo = "error") {
    const contenedor = document.getElementById("form-alert");
    if (!contenedor) return;
    contenedor.textContent = mensaje;
    contenedor.className = `alert alert--${tipo} is-visible`;
}

function ocultarMensaje() {
    const contenedor = document.getElementById("form-alert");
    if (contenedor) contenedor.className = "alert alert--error";
}

function deshabilitarBoton(boton, activo, texto) {
    if (!boton) return;
    if (activo) {
        boton.dataset.original = boton.textContent;
        boton.textContent = texto;
    } else {
        boton.textContent = boton.dataset.original || boton.textContent;
    }
    boton.disabled = activo;
}

function enlaceDetalle(id) {
    return `/pages/solicitud.html?id=${encodeURIComponent(id)}`;
}

// Iniciales para el avatar cuando el usuario no tiene foto: "Susana Pérez" → "SP"
function inicialesDe(nombre) {
    return (nombre || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join("") || "?";
}

// Foto de perfil (o iniciales) al lado de "Salir"
function agregarAvatar(salir) {
    const usuario = obtenerUsuario();
    if (!usuario || !localStorage.getItem("token")) return;

    const avatar = document.createElement("span");
    avatar.className = "app-header__avatar";
    avatar.title = usuario.nombre || "Mi perfil";

    if (usuario.fotoPerfil) {
        const imagen = document.createElement("img");
        imagen.src = usuario.fotoPerfil;
        imagen.alt = `Foto de perfil de ${usuario.nombre || "usuario"}`;
        // Si la imagen no carga, se muestran las iniciales
        imagen.addEventListener("error", () => {
            imagen.remove();
            avatar.textContent = inicialesDe(usuario.nombre);
        });
        avatar.append(imagen);
    } else {
        avatar.textContent = inicialesDe(usuario.nombre);
        avatar.setAttribute("aria-label", usuario.nombre || "Usuario");
    }

    const contenedor = document.createElement("div");
    contenedor.className = "app-header__user";
    salir.replaceWith(contenedor);
    contenedor.append(avatar, salir);
}

function configurarCabecera() {
    const salir = document.getElementById("salir");
    if (salir) {
        agregarAvatar(salir);
        salir.addEventListener("click", (evento) => {
            evento.preventDefault();
            cerrarSesion();
            window.location.href = "/pages/login.html";
        });
    }
}

configurarCabecera();
