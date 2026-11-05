const registroForm = document.getElementById("registro-form");
const fotoInput = document.getElementById("foto");
const photoPicker = document.getElementById("photo-picker");
const photoPreview = document.getElementById("photo-preview");
const photoBtn = document.getElementById("photo-btn");

let fotoPerfil = null;

// Reduce la imagen a un cuadrado de 256px en JPEG para no superar
// el límite de tamaño del body JSON del backend (100kb por defecto).
function redimensionarImagen(archivo, tamano = 256) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const lado = Math.min(img.width, img.height);
            const canvas = document.createElement("canvas");
            canvas.width = tamano;
            canvas.height = tamano;
            canvas.getContext("2d").drawImage(
                img,
                (img.width - lado) / 2, (img.height - lado) / 2, lado, lado,
                0, 0, tamano, tamano
            );
            URL.revokeObjectURL(img.src);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => reject(new Error("No se pudo leer la imagen."));
        img.src = URL.createObjectURL(archivo);
    });
}

fotoInput.addEventListener("change", async () => {
    const archivo = fotoInput.files[0];
    if (!archivo) return;

    try {
        fotoPerfil = await redimensionarImagen(archivo);
        photoPreview.querySelector("img").src = fotoPerfil;
        photoPreview.querySelector("img").className = "";
        photoPicker.classList.add("has-photo");
        photoBtn.textContent = "Cambiar foto";
    } catch (error) {
        mostrarAlerta(error.message);
    }
});

registroForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarAlerta();

    if (!validarRequeridos(registroForm)) return;

    const boton = registroForm.querySelector("[type=submit]");
    setCargando(boton, true, "Creando cuenta...");

    try {
        const data = await apiRequest("/auth/registro", {
            method: "POST",
            body: {
                nombre: registroForm.nombre.value.trim(),
                celular: registroForm.celular.value.trim(),
                localidad: registroForm.localidad.value.trim(),
                contrasena: registroForm.contrasena.value,
                fotoPerfil
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
