// Funciones de la lógica. No usan req ni res.

// Plazas que quedan en un taller
function obtenerPlazasRestantes(taller, inscripciones) {
    const delTaller = inscripciones.filter(i => i.tallerId === taller.id);
    return taller.plazas - delTaller.length;
}

// Comprueba si un correo ya está inscrito en ese taller
function estaInscrito(tallerId, email, inscripciones) {
    const correo = String(email).trim().toLowerCase();
    return inscripciones.some(i => i.tallerId === tallerId && i.email.toLowerCase() === correo);
}

// Valida los datos del formulario (vienen del navegador, no son fiables)
function validarInscripcion(datos) {
    const errores = {};

    // Si no llega un texto lo dejamos vacío
    let nombre = '';
    let email = '';
   if (datos && typeof datos.nombre === 'string') nombre = datos.nombre.trim();
    if (datos && typeof datos.email === 'string') email = datos.email.trim();

    if (nombre === '') {
        errores.nombre = 'El nombre es obligatorio';
    } else if (nombre.length < 3) {
        errores.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    const patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === '') {
        errores.email = 'El correo es obligatorio';
    } else if (!patronEmail.test(email)) {
        errores.email = 'El correo no es válido';
    }

    const valido = Object.keys(errores).length === 0;
    return { valido: valido, errores: errores, datos: { nombre: nombre, email: email } };
}

// Calcula el siguiente id de una lista
function siguienteId(lista) {
    let max = 0;
    for (let i = 0; i < lista.length; i++) {
        if (lista[i].id > max) max = lista[i].id;
    }
    return max + 1;
}

module.exports = { obtenerPlazasRestantes, estaInscrito, validarInscripcion, siguienteId };
