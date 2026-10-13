//Esto es para cargar express con el modulo path para montar las rutas sin tener que saber si estas en windows o Linux
const express = require('express');
const path = require('path');
const { obtenerPlazasRestantes, estaInscrito, validarInscripcion, siguienteId } = require('./funciones');