// Lógica que se apoya en funciones.js. Tampoco depende de req ni de res.

const { obtenerPlazasRestantes } = require('./funciones');

function normalizarId(valor) {
    const texto = String(valor).trim();
    if (!/^\d+$/.test(texto)) return null;
    const numero = Number(texto);
    if (!Number.isSafeInteger(numero) || numero <= 0) return null;
    return numero;
}

// Busca un taller por su id ya normalizado.
function buscarTaller(id, talleres) {
    if (id === null) return undefined;
    return talleres.find(t => t.id === id);
}

// Resuelve de una vez el id que llega por la URL. Devuelve en qué caso estamos
// para que la ruta sepa si tiene que contestar 400, 404 o seguir adelante.
// No recibe req ni res: solo el valor del id y la lista de talleres.
function resolverTaller(valorId, talleres) {
    const id = normalizarId(valorId);

    // El id no es un número entero positivo: /talleres/abc, /talleres/-5, /talleres/3.7
    if (id === null) {
        return { estado: 'invalido', taller: undefined };
    }

    const taller = buscarTaller(id, talleres);

    // El id tiene buena forma pero no hay ningún taller con ese número.
    if (!taller) {
        return { estado: 'inexistente', taller: undefined };
    }

    return { estado: 'ok', taller: taller };
}

function limpiarParametro(valor) {
    if (typeof valor !== 'string') return '';
    return valor.trim().toLowerCase();
}

function listarTalleres(talleres, inscripciones) {
    return talleres.map(t => ({
        id: t.id,
        titulo: t.titulo,
        categoria: t.categoria,
        nivel: t.nivel,
        plazas: t.plazas,
        plazasRestantes: obtenerPlazasRestantes(t, inscripciones)
    }));
}

function filtrarTalleres(lista, filtros) {
    let resultado = lista;

    if (filtros.categoria !== '') {
        resultado = resultado.filter(t => t.categoria === filtros.categoria);
    }
    if (filtros.nivel !== '') {
        resultado = resultado.filter(t => t.nivel === filtros.nivel);
    }
    if (filtros.disponibles === 'true') {
        resultado = resultado.filter(t => t.plazasRestantes > 0);
    }

    return resultado;
}

function describirEstado(restantes) {
    if (restantes <= 0) return 'Completo';
    if (restantes === 1) return 'Última plaza disponible';
    return restantes + ' plazas disponibles';
}

function valoresUnicos(talleres, campo) {
    const valores = [];
    talleres.map(t => t[campo]).forEach(v => {
        if (!valores.includes(v)) valores.push(v);
    });
    return valores.sort();
}

module.exports = {
    normalizarId,
    buscarTaller,
    resolverTaller,
    limpiarParametro,
    listarTalleres,
    filtrarTalleres,
    describirEstado,
    valoresUnicos
};
