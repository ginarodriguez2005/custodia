// Requisitos de contraseña segura. Deben coincidir con
// backend/validators/usuario.validator.js (el backend vuelve a validar).
const CONTRASENA_MIN = 8;
const CONTRASENA_MAX = 20;

const REGLAS_CONTRASENA = [
    {
        mensaje: `Entre ${CONTRASENA_MIN} y ${CONTRASENA_MAX} caracteres`,
        cumple: (c) => c.length >= CONTRASENA_MIN && c.length <= CONTRASENA_MAX
    },
    { mensaje: "Al menos una letra mayúscula", cumple: (c) => /\p{Lu}/u.test(c) },
    { mensaje: "Al menos una letra minúscula", cumple: (c) => /\p{Ll}/u.test(c) },
    { mensaje: "Al menos un número", cumple: (c) => /\d/.test(c) }
];

function contrasenaEsValida(contrasena) {
    return REGLAS_CONTRASENA.every((regla) => regla.cumple(contrasena));
}

// Conecta un input de contraseña con el cartel de requisitos.
// Devuelve una función que indica si la contraseña actual es válida.
function iniciarCartelContrasena(input, cartel) {
    const estado = cartel.querySelector(".password-check__status");
    const lista = cartel.querySelector(".password-check__rules");

    const items = REGLAS_CONTRASENA.map((regla) => {
        const item = document.createElement("li");
        item.className = "password-check__rule";
        item.textContent = regla.mensaje;
        lista.append(item);
        return item;
    });

    function actualizar() {
        const valor = input.value;
        let valida = true;

        REGLAS_CONTRASENA.forEach((regla, i) => {
            const cumple = regla.cumple(valor);
            items[i].classList.toggle("is-ok", cumple);
            items[i].setAttribute("aria-label", `${regla.mensaje}: ${cumple ? "cumple" : "no cumple"}`);
            if (!cumple) valida = false;
        });

        cartel.classList.toggle("is-ok", valida);
        cartel.classList.toggle("is-error", !valida);
        estado.textContent = valida
            ? "La contraseña cumple con todos los requisitos."
            : "La contraseña todavía no cumple con los requisitos:";
        return valida;
    }

    input.addEventListener("input", actualizar);
    actualizar();
    return actualizar;
}
