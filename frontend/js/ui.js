// Helpers de UI reutilizables entre pantallas.

// Botones "Mostrar"/"Ocultar" contraseña: <button data-toggle-password="idDelInput">
document.querySelectorAll("[data-toggle-password]").forEach((boton) => {
    const input = document.getElementById(boton.dataset.togglePassword);
    boton.addEventListener("click", () => {
        const oculto = input.type === "password";
        input.type = oculto ? "text" : "password";
        boton.textContent = oculto ? "Ocultar" : "Mostrar";
    });
});

// tipo: "error" (por defecto) o "success"
function mostrarAlerta(mensaje, tipo = "error") {
    const alerta = document.getElementById("form-alert");
    alerta.textContent = mensaje;
    alerta.classList.remove("alert--error", "alert--success");
    alerta.classList.add(`alert--${tipo}`, "is-visible");
    alerta.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ocultarAlerta() {
    document.getElementById("form-alert").classList.remove("is-visible");
}

// Marca como inválidos los campos requeridos vacíos. Devuelve true si todo está ok.
function validarRequeridos(form) {
    let valido = true;
    form.querySelectorAll("[required]").forEach((input) => {
        const campo = input.closest(".field");
        const vacio = !input.value.trim();
        campo.classList.toggle("has-error", vacio);
        if (vacio && valido) {
            input.focus();
            valido = false;
        }
    });
    return valido;
}

// Quita el estado de error cuando el usuario corrige el campo.
document.querySelectorAll(".field .input").forEach((input) => {
    input.addEventListener("input", () => {
        input.closest(".field").classList.remove("has-error");
    });
});

function setCargando(boton, cargando, texto) {
    if (cargando) {
        boton.dataset.textoOriginal = boton.textContent;
        boton.textContent = texto;
    } else {
        boton.textContent = boton.dataset.textoOriginal || boton.textContent;
    }
    boton.disabled = cargando;
}
