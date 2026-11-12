// Envío de notificaciones al usuario.
// PROTOTIPO: el envío por WhatsApp/SMS está simulado y el código se muestra en la
// consola del servidor. Para producción, reemplazar por un proveedor real.
const Notificacion = require("../models/Notificacion");

async function enviarCodigoRecuperacion(celular, codigo, vigenciaMinutos) {
    console.log(
        `[Recuperación de contraseña] Código para ${celular}: ${codigo} ` +
        `(vence en ${vigenciaMinutos} minutos)`
    );
}

// Notificación dentro de la página web. Si falla no interrumpe la operación principal.
async function notificarEnWeb({ usuario, tipo, mensaje, solicitudPago = null, rol = null }) {
    try {
        await Notificacion.create({ usuario, tipo, mensaje, solicitudPago, rol });
    } catch (error) {
        console.error("No se pudo crear la notificación:", error.message);
    }
}

module.exports = { enviarCodigoRecuperacion, notificarEnWeb };
