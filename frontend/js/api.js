// Cliente mínimo para la API de Custodia.
// Ruta relativa: el frontend lo sirve el mismo Express que expone la API.
const API_URL = "/api";

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
        const token = localStorage.getItem("token");
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new Error("No se pudo conectar con el servidor. Intentá de nuevo.");
    }

    const data = await response.json().catch(() => ({}));

    // Sesión vencida o inválida en una ruta protegida: volver al login.
    if (auth && response.status === 401) {
        cerrarSesion();
        window.location.href = "/pages/login.html";
        throw new Error(data.mensaje || "Tu sesión expiró.");
    }

    if (!response.ok) {
        throw new Error(data.mensaje || "Ocurrió un error inesperado.");
    }

    return data;
}

function guardarSesion({ token, usuario }) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuario));
}

function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
}

function obtenerUsuario() {
    try {
        return JSON.parse(localStorage.getItem("usuario"));
    } catch {
        return null;
    }
}

// Para pantallas que necesitan sesión: si no hay token, ir al login.
function requerirSesion() {
    if (!localStorage.getItem("token")) {
        window.location.replace("/pages/login.html");
        return false;
    }
    return true;
}
