// Envío de notificaciones al usuario.
// PROTOTIPO: el envío por WhatsApp/SMS está simulado y el código se muestra en la
// consola del servidor. Para producción, reemplazar por un proveedor real.

async function enviarCodigoRecuperacion(celular, codigo, vigenciaMinutos) {
    console.log(
        `[Recuperación de contraseña] Código para ${celular}: ${codigo} ` +
        `(vence en ${vigenciaMinutos} minutos)`
    );
}

module.exports = { enviarCodigoRecuperacion };
