const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlerta();

    if (!validarRequeridos(loginForm)) return;

    const boton = loginForm.querySelector("[type=submit]");
    setCargando(boton, true, "Ingresando...");

    try {
        const data = await apiRequest("/sesiones", {
            method: "POST",
            body: {
                celular: loginForm.celular.value.trim(),
                contrasena: loginForm.contrasena.value
            }
        });
        guardarSesion(data);
        window.location.href = "../index.html";
    } catch (error) {
        mostrarAlerta(error.message);
    } finally {
        setCargando(boton, false);
    }
});

document.getElementById("olvide-btn").addEventListener("click", () => {
    window.location.href = "recuperar.html";
});

// Aviso al volver de recuperar la contraseña
if (new URLSearchParams(window.location.search).get("recuperada") === "1") {
    mostrarAlerta("Tu contraseña se actualizó correctamente. Ya podés ingresar.", "success");
    history.replaceState(null, "", window.location.pathname);
}
