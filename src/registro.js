// Middleware propio de registro de peticiones.
// Saca por consola la fecha y la hora, el método HTTP y la URL de cada petición
// que llega al servidor.

// Pone un número con dos cifras para que la fecha se lea siempre igual
// (el 9 tiene que salir como 09). Esta función no usa req ni res.
function dosCifras(numero) {
    return String(numero).padStart(2, '0');
}

// Devuelve la fecha y la hora con el formato dd/mm/aaaa hh:mm:ss.
// Recibe la fecha como parámetro para poder probarla con una fecha fija.
function formatearFechaHora(fecha) {
    const dia = dosCifras(fecha.getDate());
    const mes = dosCifras(fecha.getMonth() + 1); // getMonth() empieza en 0.
    const anio = fecha.getFullYear();
    const horas = dosCifras(fecha.getHours());
    const minutos = dosCifras(fecha.getMinutes());
    const segundos = dosCifras(fecha.getSeconds());

    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}

// El middleware en sí. Escribe la línea del registro y llama a next() para que
// la petición siga su camino hacia las demás rutas.
function registrarPeticion(req, res, next) {
    const momento = formatearFechaHora(new Date());
    console.log(`[${momento}] ${req.method} ${req.originalUrl}`);
    next();
}

module.exports = { registrarPeticion, formatearFechaHora };
