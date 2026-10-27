const talleres = [
  { id: 1, titulo: 'Sistemas Informaticos', categoria: 'sistemas', plazas: 30, nivel: 'inicial' },
  { id: 2, titulo: 'Desarrollo de Aplicaciones Web', categoria: 'web', plazas: 15, nivel: 'avanzado' },
  { id: 3, titulo: 'Diseño responsive con HTML5 y CSS3', categoria: 'web', plazas: 3, nivel: 'medio' }
];

const inscripciones = [
  { id: 1, tallerId: 1, nombre: 'Marcos Martinez', email: 'marcosmartinez@gmail.com' },
  { id: 2, tallerId: 3, nombre: 'Daniel Jimenez', email: 'danieljimenez@gmail.com' },
  { id: 3, tallerId: 3, nombre: 'Javier Oliveros', email: 'javioliveros@example.com' }
];

module.exports = { talleres, inscripciones };
