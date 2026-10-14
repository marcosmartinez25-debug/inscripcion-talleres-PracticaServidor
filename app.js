//Esto es para cargar express con el modulo path para montar las rutas sin tener que saber si estas en windows o Linux
const express = require('express');
const path = require('path');
const { obtenerPlazasRestantes, estaInscrito, validarInscripcion, siguienteId } = require('./funciones');

const app = express(); // crea la aplicación de Express yel servidor al que le ponemos todas las rutas y middlewares.
const PUERTO = 3000; //El puerto en el que se va a levantar el servidor.

// esto es para poder usar EJS como motor de plantillas y poder renderizar las vistas.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// este es el Middleware  para poder recibir los datos del formulario.
app.use(express.urlencoded({ extended: false }));

const talleres = [
  { id: 1, titulo: 'Sistemas Informaticos', categoria: 'sistemas', plazas: 30, nivel: 'inicial' },
  { id: 2, titulo: 'Desarrollo de Aplicaciones Web', categoria: 'web', plazas: 15, nivel: 'avanzado' },
  { id: 3, titulo: 'Diseño responsive con HTML5 y CSS3', categoria: 'web', plazas: 15, nivel: 'medio' }
];

// array para almacenar las inscripciones.
app.get('/', (req, res) => {
  res.redirect('/talleres');
});

// Listado con todos los filtros y las plazas restantes de cada taller.
app.get('/talleres', (req, res) => {

  let lista = talleres.map(t => ({
    id: t.id,
    titulo: t.titulo,
    categoria: t.categoria,
    nivel: t.nivel,
    plazas: t.plazas,
    plazasRestantes: obtenerPlazasRestantes(t, inscripciones)
  }));

  // al venir de una URL los parametros lo tratamos como si no fueran fiables.
  const categoria = typeof req.query.categoria === 'string' ? req.query.categoria.trim().toLowerCase() : '';
  const nivel = typeof req.query.nivel === 'string' ? req.query.nivel.trim().toLowerCase() : '';
  const disponibles = typeof req.query.disponibles === 'string' ? req.query.disponibles.trim().toLowerCase() : '';

  // filtramos la lista de talleres según los parametros recibidos.
  if (categoria !== '') {
    lista = lista.filter(t => t.categoria === categoria);
  }
  if (nivel !== '') {
    lista = lista.filter(t => t.nivel === nivel);
  }
  if (disponibles === 'true') {
    lista = lista.filter(t => t.plazasRestantes > 0);
  }

  res.render('talleres', { talleres: lista, filtros: { categoria, nivel, disponibles } });
});

//Formulario de inscripción a un taller.// Formulario de inscripción a un taller.
app.get('/talleres/:id/inscripcion', (req, res) => {
  const id = Number(req.params.id);
  const taller = talleres.find(t => t.id === id);

  if (!taller) {
    return res.status(404).send('Taller no encontrado');
  }

  res.render('inscripcion', { taller: taller, datos: { nombre: '', email: '' }, errores: {} });
});

//Dar de alta a un usuario en un taller y mostrarle el mensaje si ya esta inscrito o si no hay plazas disponibles.
app.post('/talleres/:id/inscripcion', (req, res) => {
  const id = Number(req.params.id);
  const taller = talleres.find(t => t.id === id);

  if (!taller) {
    return res.status(404).send('Taller no encontrado');
  }

  const resultadoValidacion = validarInscripcion(req.body);
  const errores = resultadoValidacion.errores;
  const datos = resultadoValidacion.datos;

  if (obtenerPlazasRestantes(taller, inscripciones) <= 0) {
    errores.plazas = 'No hay plazas disponibles para este taller.';
  } else if (estaInscrito(id, datos.email, inscripciones)) {
    errores.email = 'Ya estás inscrito en este taller.';
  }

  // Si hay errores, se vuelve a mostrar el formulario conservando los campos correctos.
  if (Object.keys(errores).length > 0) {
    return res.status(422).render('inscripcion', { taller: taller, datos: datos, errores: errores });
  }

  inscripciones.push({ id: siguienteId(inscripciones), tallerId: id, nombre: datos.nombre, email: datos.email });

  // PRG: tras el POST se redirige para que un refresco no reenvíe el formulario.
  res.redirect('/talleres/' + id);
});

//Ficha del taller con el listado de los inscritos.
// Ficha del taller con su estado de plazas.
app.get('/talleres/:id', (req, res) => {
  const id = Number(req.params.id);
  const taller = talleres.find(t => t.id === id);

  if (!taller) {
    return res.status(404).send('Taller no encontrado');
  }

  const restantes = obtenerPlazasRestantes(taller, inscripciones);

  let estado;
  if (restantes === 0) {
    estado = 'Completo';
  } else if (restantes === 1) {
    estado = 'Última plaza disponible';
  } else {
    estado = restantes + ' plazas disponibles';
  }

  res.render('ficha', { taller: taller, restantes: restantes, estado: estado });
});

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});