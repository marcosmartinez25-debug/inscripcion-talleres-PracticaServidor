# inscripcion-talleres---PracticaServidor

enlace de Claude IA: https://claude.ai/share/0d390d19-380b-4099-afdb-267fadf06129
# Sistema de inscripción a talleres y actividades

Esta es mi práctica de servidor con Express 5 y EJS. Va de unas jornadas tecnológicas: se pueden ver los talleres que hay, filtrarlos, entrar en la ficha de cada uno y apuntarse rellenando un formulario que valido en el servidor.

## Cómo arrancarlo

Primero `npm install` para instalar las dependencias y luego `npm start`. Con eso el servidor se queda escuchando en http://localhost:3000.

## Cómo está organizado

En `app.js` tengo las rutas de Express y los middlewares. En `src/datos.js` están las dos colecciones en memoria, con tres elementos cada una. En `src/funciones.js` metí las funciones de apoyo: `obtenerPlazasRestantes`, `estaInscrito`, `validarInscripcion` y `siguienteId`. En `src/logica.js` está el filtrado, el estado de las plazas y la parte que limpia el id que llega por la URL. Las plantillas EJS están en `views` (el listado, la ficha, la inscripción y la de error) y la hoja de estilos en `public/styles.css`.

Ni `src/funciones.js` ni `src/logica.js` reciben `req` ni `res`. Trabajan solo con datos y es el código de Express el que los importa, así esas funciones se pueden probar por su cuenta.

## Las rutas

La raíz no hace nada por sí misma, simplemente redirige al listado. En `/talleres` saco todos los talleres con sus filtros y las plazas que le quedan a cada uno. En `/talleres/:id` está la ficha de un taller concreto con su estado. En `/talleres/:id/inscripcion` tengo dos cosas: por GET se muestra el formulario y por POST se da de alta la inscripción.

Los filtros van por la query string y se pueden combinar entre ellos. Se puede filtrar por categoría, por nivel o pedir solo los que tienen plazas libres, por ejemplo `/talleres?categoria=web`, `/talleres?disponibles=true` o los tres a la vez con `/talleres?categoria=web&nivel=avanzado&disponibles=true`.

Las plazas que quedan no las guardo en ningún sitio, las calculo restándole a las plazas del taller el número de inscripciones que tiene. Según el número que salga, la ficha muestra las plazas disponibles que quedan, avisa de que es la última plaza o dice que está completo.

## Las validaciones del formulario

Cuando llega el POST compruebo las cosas en este orden: que el taller existe, que el nombre y el correo son válidos, que todavía quedan plazas y que ese correo no se ha apuntado ya a ese mismo taller.

Si alguien se pone a tocar el id de la URL y pone cosas como `/talleres/abc`, `/talleres/-5` o `/talleres/3.7`, la aplicación no se rompe: `normalizarId` lo descarta y la ruta devuelve un 404. Todo lo que llega del navegador por `req.query` y `req.body` lo trato como si no me fiara antes de usarlo.

Si hay algún error vuelvo a mostrar el formulario, pero conservando los campos que sí estaban bien y enseñando el mensaje de cada fallo, para no obligar a escribirlo todo otra vez. Si la inscripción es correcta aplico PRG: el POST acaba en un `redirect` a la ficha, así si se refresca la página no se vuelve a enviar el formulario.

## Métodos de array que he usado

Uso `find()` para localizar un taller por su id, `filter()` para los filtros del listado y para sacar las inscripciones de un taller, `map()` para añadirle a cada taller las plazas que le quedan y `some()` para comprobar si un correo ya está inscrito. Aparte de eso hay condicionales, bucles, conversiones de tipos y funciones propias.

## Middlewares

Uso `express.urlencoded({ extended: false })` para poder recibir los datos del formulario y `express.static` para servir la hoja de estilos.
