// Carga express con el modulo path para montar las rutas sin tener que saber
// si estas en Windows o en Linux.
const express = require('express');
const path = require('path');

const { talleres, inscripciones } = require('./src/datos');
const { obtenerPlazasRestantes, estaInscrito, validarInscripcion, siguienteId } = require('./src/funciones');
const {
  resolverTaller,
  limpiarParametro,
  listarTalleres,
  filtrarTalleres,
  describirEstado,
  valoresUnicos
} = require('./src/logica');
const { registrarPeticion } = require('./src/registro');

const app = express(); // Crea la aplicación de Express, a la que le ponemos las rutas y los middlewares.
const PUERTO = 3000;   // Puerto en el que se levanta el servidor.

// EJS como motor de plantillas para poder renderizar las vistas.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(registrarPeticion);

// Middleware urlencoded para poder recibir los datos del formulario.
// Tiene que ir antes de las rutas que leen req.body.
app.use(express.urlencoded({ extended: false }));

// Middleware para servir la hoja de estilos de la carpeta public.
app.use(express.static(path.join(__dirname, 'public')));


// Contesta cuando el id de la URL no sirve. Separo los dos casos:
// 400 si el id está mal escrito y 404 si el taller no existe.
function responderTallerNoUtilizable(res, estado) {
  if (estado === 'invalido') {
    return res.status(400).render('error', {
      mensaje: 'Identificador no válido',
      detalle: 'El número del taller tiene que ser un entero positivo.'
    });
  }

  return res.status(404).render('error', {
    mensaje: 'Taller no encontrado',
    detalle: 'No hay ningún taller con ese número.'
  });
}

// La raíz lleva al listado.
app.get('/', (req, res) => {
  res.redirect('/talleres');
});

// Listado con los filtros y las plazas restantes de cada taller.
app.get('/talleres', (req, res) => {
  // Los parámetros vienen de la URL, así que los tratamos como no fiables.
  const filtros = {
    categoria: limpiarParametro(req.query.categoria),
    nivel: limpiarParametro(req.query.nivel),
    disponibles: limpiarParametro(req.query.disponibles)
  };

  const lista = filtrarTalleres(listarTalleres(talleres, inscripciones), filtros);

  res.render('talleres', {
    talleres: lista,
    total: talleres.length,
    filtros: filtros,
    categorias: valoresUnicos(talleres, 'categoria'),
    niveles: valoresUnicos(talleres, 'nivel'),
    describirEstado: describirEstado
  });
});

// Formulario de inscripción a un taller.
app.get('/talleres/:id/inscripcion', (req, res) => {
  const resultado = resolverTaller(req.params.id, talleres);

  if (resultado.estado !== 'ok') {
    return responderTallerNoUtilizable(res, resultado.estado);
  }

  const taller = resultado.taller;
  const restantes = obtenerPlazasRestantes(taller, inscripciones);

  res.render('inscripcion', {
    taller: taller,
    restantes: restantes,
    estado: describirEstado(restantes),
    datos: { nombre: '', email: '' },
    errores: {}
  });
});

// Alta de un usuario en un taller.
app.post('/talleres/:id/inscripcion', (req, res) => {
  // Comprobamos primero que el taller existe, aunque el id venga manipulado.
  const resultado = resolverTaller(req.params.id, talleres);

  if (resultado.estado !== 'ok') {
    return responderTallerNoUtilizable(res, resultado.estado);
  }

  const taller = resultado.taller;

  // Validamos nombre y correo.
  const comprobacion = validarInscripcion(req.body);
  const errores = comprobacion.errores;
  const datos = comprobacion.datos;

  const restantes = obtenerPlazasRestantes(taller, inscripciones);

  // Comprobamos que quedan plazas y que ese correo no está ya inscrito en el taller.
  if (restantes <= 0) {
    errores.plazas = 'No quedan plazas disponibles para este taller.';
  } else if (!errores.email && estaInscrito(taller.id, datos.email, inscripciones)) {
    errores.email = 'Ese correo ya está inscrito en este taller.';
  }

  // Si hay errores se vuelve a mostrar el formulario conservando los campos
  // correctos. Se responde con 400 porque el fallo está en los datos enviados.
  if (Object.keys(errores).length > 0) {
    return res.status(400).render('inscripcion', {
      taller: taller,
      restantes: restantes,
      estado: describirEstado(restantes),
      datos: datos,
      errores: errores
    });
  }

  inscripciones.push({
    id: siguienteId(inscripciones),
    tallerId: taller.id,
    nombre: datos.nombre,
    email: datos.email
  });

  // PRG: tras el POST se redirige con un 303 para que un refresco no vuelva a
  // enviar el formulario.
  res.redirect(303, '/talleres/' + taller.id + '?inscrito=1');
});

// Ficha del taller con su estado de plazas.
app.get('/talleres/:id', (req, res) => {
  const resultado = resolverTaller(req.params.id, talleres);

  if (resultado.estado !== 'ok') {
    return responderTallerNoUtilizable(res, resultado.estado);
  }

  const taller = resultado.taller;
  const restantes = obtenerPlazasRestantes(taller, inscripciones);

  res.render('ficha', {
    taller: taller,
    restantes: restantes,
    estado: describirEstado(restantes),
    inscritos: inscripciones.filter(i => i.tallerId === taller.id).length,
    recienInscrito: req.query.inscrito === '1'
  });
});

app.use((req, res) => {
  res.status(404).render('404', { ruta: req.originalUrl });
});

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
