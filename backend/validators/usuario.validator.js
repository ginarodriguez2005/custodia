// Reglas de validación de Usuario. Las mismas reglas de contraseña
// están replicadas en frontend/js/contrasena.js para el aviso en pantalla.

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

// Solo letras (incluye tildes y ñ) y espacios
const SOLO_LETRAS_Y_ESPACIOS = /^[\p{L} ]+$/u;
const SOLO_NUMEROS = /^\d+$/;

function esTextoNoVacio(valor) {
    return typeof valor === "string" && valor.trim() !== "";
}

// Devuelve los requisitos que la contraseña no cumple (vacío si es válida).
function validarContrasena(contrasena) {
    if (typeof contrasena !== "string") {
        return REGLAS_CONTRASENA.map((regla) => regla.mensaje);
    }
    return REGLAS_CONTRASENA
        .filter((regla) => !regla.cumple(contrasena))
        .map((regla) => regla.mensaje);
}

// Valida el body de alta de usuario. Devuelve un arreglo de errores (vacío si es válido).
function validarNuevoUsuario({ nombre, celular, localidad, contrasena, fotoPerfil } = {}) {
    const errores = [];

    if (!esTextoNoVacio(nombre)) {
        errores.push("El nombre es obligatorio");
    } else if (!SOLO_LETRAS_Y_ESPACIOS.test(nombre.trim())) {
        errores.push("El nombre solo puede contener letras y espacios");
    }

    if (!esTextoNoVacio(celular)) {
        errores.push("El celular es obligatorio");
    } else if (!SOLO_NUMEROS.test(celular.trim())) {
        errores.push("El celular solo puede contener números");
    }

    if (!esTextoNoVacio(localidad)) {
        errores.push("La localidad es obligatoria");
    } else if (!SOLO_LETRAS_Y_ESPACIOS.test(localidad.trim())) {
        errores.push("La localidad solo puede contener letras y espacios");
    }

    if (!esTextoNoVacio(contrasena)) {
        errores.push("La contraseña es obligatoria");
    } else {
        const incumplidas = validarContrasena(contrasena);
        if (incumplidas.length) {
            errores.push(`La contraseña no cumple los requisitos: ${incumplidas.join(", ")}`);
        }
    }

    if (fotoPerfil !== undefined && fotoPerfil !== null && typeof fotoPerfil !== "string") {
        errores.push("La foto de perfil no es válida");
    }

    return errores;
}

module.exports = {
    CONTRASENA_MIN,
    CONTRASENA_MAX,
    esTextoNoVacio,
    validarContrasena,
    validarNuevoUsuario
};
