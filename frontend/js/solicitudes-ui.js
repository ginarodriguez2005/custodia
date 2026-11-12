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
            vendedor: "Hay un reclamo abierto y la operación está detenida. Podés resolverlo desde \"Ver reclamo\".",
            comprador: "Tu compra tiene un reclamo abierto y la operación está detenida. Podés resolverlo desde \"Ver reclamo\".",
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

// Motivos de reclamo por rol. Los valores coinciden con MOTIVOS_POR_ROL del modelo Reclamo.
const MOTIVOS_RECLAMO = {
    COMPRADOR: [
        { valor: "NO_RECIBIDO", texto: "No recibí el producto" },
        { valor: "NO_COINCIDE", texto: "No es como me lo describieron" },
        { valor: "DANADO", texto: "Llegó dañado o incompleto" },
        { valor: "OTRO", texto: "Otro problema" }
    ],
    VENDEDOR: [
        { valor: "NO_CONFIRMA_RECEPCION", texto: "El comprador no confirma la recepción" },
        { valor: "PROBLEMA_ENVIO", texto: "Hubo un problema con el envío" },
        { valor: "SIN_RESPUESTA", texto: "El comprador no responde" },
        { valor: "OTRO", texto: "Otro problema" }
    ]
};

const ESTADOS_RECLAMABLES = ["PAGADA", "DESPACHADA"];

// Cómo puede cerrar el reclamo cada parte (siempre a favor de la otra).
// Coincide con RESOLUCION_POR_ROL del modelo Reclamo.
const RESOLUCION_RECLAMO = {
    COMPRADOR: {
        valor: "LIBERAR_VENDEDOR",
        boton: "Se solucionó: liberar el dinero",
        explicacion: "Si el problema se solucionó, liberá el dinero al vendedor. La operación queda finalizada."
    },
    VENDEDOR: {
        valor: "DEVOLVER_COMPRADOR",
        boton: "Devolver el dinero al comprador",
        explicacion: "Si le das la razón al comprador, devolvele el dinero. La operación queda cancelada."
    }
};

function textoResolucion(resolucion) {
    return resolucion === "LIBERAR_VENDEDOR"
        ? "Dinero liberado al vendedor"
        : "Dinero devuelto al comprador";
}

function textoMotivo(rol, valor) {
    return (MOTIVOS_RECLAMO[rol] || []).find((m) => m.valor === valor)?.texto || "Otro problema";
}

function etiquetaEstadoReclamo(estado) {
    const etiquetas = {
        ABIERTO: "Abierto",
        EN_REVISION: "En revisión",
        RESUELTO: "Resuelto"
    };
    return etiquetas[estado] || "Abierto";
}

function enlaceReclamo(id, tab) {
    return `/pages/reporte.html?solicitud=${encodeURIComponent(id)}&tab=${tab}`;
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

// Campanita de notificaciones dentro de la página (reclamos creados y resueltos)
const INTERVALO_NOTIFICACIONES_MS = 30000;

function iconoCampana() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("notif__icon");
    const trazo = document.createElementNS(ns, "path");
    trazo.setAttribute("d", "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z");
    svg.append(trazo);
    return svg;
}

function agregarNotificaciones(contenedor) {
    if (!contenedor || !localStorage.getItem("token")) return;

    const raiz = nodo("div", "notif");
    const boton = nodo("button", "notif__button");
    boton.type = "button";
    boton.setAttribute("aria-haspopup", "true");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Notificaciones");
    const contador = nodo("span", "notif__badge hide");
    boton.append(iconoCampana(), contador);

    const panel = nodo("div", "notif__panel hide");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Notificaciones");

    raiz.append(boton, panel);
    contenedor.prepend(raiz);

    let datos = { notificaciones: [], noLeidas: 0 };

    function pintarContador() {
        const n = datos.noLeidas;
        contador.textContent = n > 9 ? "9+" : String(n);
        contador.classList.toggle("hide", n === 0);
        boton.setAttribute("aria-label", n ? `Notificaciones (${n} sin leer)` : "Notificaciones");
    }

    function pintarLista() {
        panel.replaceChildren(nodo("p", "notif__title", "Notificaciones"));
        if (!datos.notificaciones.length) {
            panel.append(nodo("p", "notif__empty", "No tenés notificaciones."));
            return;
        }
        const lista = nodo("ul", "notif__list");
        datos.notificaciones.forEach((n) => {
            const item = nodo("li", n.leida ? "notif__item" : "notif__item notif__item--nueva");
            const enlace = nodo("a", "notif__link");
            enlace.href = n.solicitudPago
                ? enlaceReclamo(n.solicitudPago, n.rol === "VENDEDOR" ? "ventas" : "compras")
                : "#";
            enlace.append(
                nodo("span", "notif__text", n.mensaje),
                nodo("span", "notif__date", new Date(n.fechaCreacion).toLocaleString("es-UY", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                }))
            );
            item.append(enlace);
            lista.append(item);
        });
        panel.append(lista);
    }

    async function cargar() {
        try {
            datos = await apiRequest("/notificaciones", { auth: true });
            pintarContador();
            if (!panel.classList.contains("hide")) pintarLista();
        } catch {
            // Sin conexión: se reintenta en el próximo ciclo
        }
    }

    function cerrar() {
        panel.classList.add("hide");
        boton.setAttribute("aria-expanded", "false");
    }

    boton.addEventListener("click", async () => {
        const abrir = panel.classList.contains("hide");
        if (!abrir) return cerrar();

        pintarLista();
        panel.classList.remove("hide");
        boton.setAttribute("aria-expanded", "true");

        // Al abrir el panel se marcan como leídas (se siguen viendo resaltadas hasta cerrarlo)
        if (datos.noLeidas) {
            try {
                await apiRequest("/notificaciones/leidas", { method: "PATCH", auth: true });
                datos.noLeidas = 0;
                pintarContador();
            } catch {
                // Se volverá a intentar al abrir de nuevo
            }
        }
    });

    document.addEventListener("click", (evento) => {
        if (!raiz.contains(evento.target)) cerrar();
    });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") cerrar();
    });

    cargar();
    setInterval(() => {
        if (!document.hidden) cargar();
    }, INTERVALO_NOTIFICACIONES_MS);
}

function configurarCabecera() {
    const salir = document.getElementById("salir");
    if (salir) {
        agregarAvatar(salir);
        agregarNotificaciones(salir.closest(".app-header__user"));
        salir.addEventListener("click", (evento) => {
            evento.preventDefault();
            cerrarSesion();
            window.location.href = "/pages/login.html";
        });
    }
}

configurarCabecera();
