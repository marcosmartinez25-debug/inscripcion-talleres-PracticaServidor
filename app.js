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
 