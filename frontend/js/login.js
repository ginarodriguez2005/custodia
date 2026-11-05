const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlerta();

    if (!validarRequeridos(loginForm)) return;

    const boton = loginForm.querySelector("[type=submit]");
    setCargando(boton, true, "Ingresando...");

    try {
        const data = await apiRequest("/auth/login", {
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
    mostrarAlerta("La recuperación de contraseña todavía no está disponible.");
});
