// Recuperación de contraseña en dos pasos:
// 1) POST /api/recuperaciones con el celular → se envía un código.
// 2) PATCH /api/recuperaciones/:id con el código y la nueva contraseña.
const celularForm = document.getElementById("celular-form");
const codigoForm = document.getElementById("codigo-form");
const subtitulo = document.getElementById("subtitulo");
const reenviarBtn = document.getElementById("reenviar-btn");
const contrasenaInput = document.getElementById("contrasena");
const confirmacionInput = document.getElementById("confirmacion");
const codigoInput = document.getElementById("codigo");

const contrasenaValida = iniciarCartelContrasena(
    contrasenaInput,
    document.getElementById("password-check")
);

let recuperacionId = null;
let celular = "";
let cuentaRegresiva = null;

function marcarError(input) {
    input.closest(".field").classList.add("has-error");
    input.focus();
}

function habilitarReenvio(segundos) {
    clearInterval(cuentaRegresiva);
    let restantes = segundos;
    reenviarBtn.disabled = true;
    reenviarBtn.textContent = `Reenviar código (${restantes}s)`;

    cuentaRegresiva = setInterval(() => {
        restantes -= 1;
        if (restantes <= 0) {
            clearInterval(cuentaRegresiva);
            reenviarBtn.disabled = false;
            reenviarBtn.textContent = "Reenviar código";
        } else {
            reenviarBtn.textContent = `Reenviar código (${restantes}s)`;
        }
    }, 1000);
}

async function solicitarCodigo() {
    const data = await apiRequest("/recuperaciones", {
        method: "POST",
        body: { celular }
    });
    recuperacionId = data.recuperacion.id;
    habilitarReenvio(data.recuperacion.esperaReenvioSegundos || 60);
    mostrarAlerta(data.mensaje, "success");
}

function mostrarPaso(paso) {
    const esCodigo = paso === "codigo";
    celularForm.hidden = esCodigo;
    codigoForm.hidden = !esCodigo;
    subtitulo.textContent = esCodigo
        ? `Ingresá el código que enviamos al ${celular} y elegí tu nueva contraseña.`
        : "Te enviamos un código a tu celular para crear una nueva.";
}

celularForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlerta();

    if (!validarRequeridos(celularForm)) return;

    const boton = celularForm.querySelector("[type=submit]");
    setCargando(boton, true, "Enviando código...");

    try {
        celular = celularForm.celular.value.trim();
        await solicitarCodigo();
        mostrarPaso("codigo");
        codigoInput.focus();
    } catch (error) {
        mostrarAlerta(error.message);
    } finally {
        setCargando(boton, false);
    }
});

codigoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlerta();

    if (!validarRequeridos(codigoForm)) return;

    if (!/^\d{6}$/.test(codigoInput.value.trim())) {
        marcarError(codigoInput);
        return;
    }

    // Sin una contraseña segura no se puede continuar.
    if (!contrasenaValida()) {
        marcarError(contrasenaInput);
        mostrarAlerta("La contraseña no cumple con los requisitos de seguridad.");
        return;
    }

    if (confirmacionInput.value !== contrasenaInput.value) {
        marcarError(confirmacionInput);
        return;
    }

    const boton = codigoForm.querySelector("[type=submit]");
    setCargando(boton, true, "Guardando...");

    try {
        await apiRequest(`/recuperaciones/${encodeURIComponent(recuperacionId)}`, {
            method: "PATCH",
            body: {
                codigo: codigoInput.value.trim(),
                contrasena: contrasenaInput.value
            }
        });
        window.location.href = "login.html?recuperada=1";
    } catch (error) {
        mostrarAlerta(error.message);
        setCargando(boton, false);
    }
});

reenviarBtn.addEventListener("click", async () => {
    ocultarAlerta();
    reenviarBtn.disabled = true;
    try {
        await solicitarCodigo();
        codigoInput.value = "";
        codigoInput.focus();
    } catch (error) {
        mostrarAlerta(error.message);
        reenviarBtn.disabled = false;
    }
});

document.getElementById("cambiar-celular-btn").addEventListener("click", () => {
    ocultarAlerta();
    clearInterval(cuentaRegresiva);
    codigoForm.reset();
    contrasenaValida();
    mostrarPaso("celular");
    celularForm.celular.focus();
});
