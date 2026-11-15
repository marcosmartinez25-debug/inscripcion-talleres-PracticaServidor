# Sistema de inscripción a talleres y actividades

Práctica de Desarrollo Web en Entorno Servidor (2º DAW). Es una aplicación hecha
con Express 5 y EJS para unas jornadas tecnológicas: se pueden ver los talleres
que hay, filtrarlos, entrar en la ficha de cada uno y apuntarse rellenando un
formulario que valido en el servidor.

Chats usados como apoyo:

- https://claude.ai/share/0d390d19-380b-4099-afdb-267fadf06129

## Cómo arrancarlo

```bash
npm install
npm start
```

Con eso el servidor se queda escuchando en http://localhost:3000. Si no quiero
parar y arrancar a mano cada vez que cambio algo, uso `npm run dev`, que levanta
lo mismo pero recargando solo cuando guardo un fichero.

Las dependencias no están subidas al repositorio (la carpeta `node_modules` está
en el `.gitignore`), así que el `npm install` del principio hay que hacerlo sí o
sí la primera vez.

## Cómo está organizado

| Fichero | Para qué es |
| --- | --- |
| `app.js` | Las rutas de Express y los middlewares. Es lo único que toca `req` y `res`. |
| `src/datos.js` | Las dos colecciones en memoria, con tres elementos cada una. |
| `src/funciones.js` | `obtenerPlazasRestantes`, `estaInscrito`, `validarInscripcion` y `siguienteId`. |
| `src/logica.js` | El filtrado, el estado de las plazas y la parte que limpia el id que llega por la URL. |
| `src/registro.js` | Mi middleware de registro de peticiones. |
| `views/` | Las plantillas EJS, con la cabecera y el pie sacados a `views/partials`. |
| `public/styles.css` | La hoja de estilos. |

Ni `src/funciones.js` ni `src/logica.js` reciben `req` ni `res`. Trabajan solo con
datos y es el código de Express el que los importa, así esas funciones se pueden
probar por su cuenta sin montar una petición HTTP entera.

Las vistas comparten la cabecera y el pie con `include`, para no tener el mismo
`<head>` copiado cinco veces:

```ejs
<%- include('partials/cabecera', { tituloPagina: 'Jornadas tecnológicas' }) %>
...
<%- include('partials/pie') %>
```

## Los middlewares

Van en este orden en `app.js`, y el orden importa porque Express recorre la
cadena de arriba abajo:

1. `registrarPeticion`, el mío, para que deje constancia de todas las peticiones.
2. `express.urlencoded({ extended: false })`, para poder leer `req.body`. Tiene
   que estar antes de las rutas que miran el formulario; si lo pongo después,
   `req.body` no trae los campos.
3. `express.static`, para servir la hoja de estilos de `public`.

### Middleware de registro de peticiones

Está en `src/registro.js` y lo he escrito yo. Se ejecuta con todas las peticiones
que entran al servidor porque lo registro con `app.use` antes de cualquier ruta,
así que también salen por consola las de los ficheros estáticos y las de las
rutas que no existen.

De cada petición saca tres cosas: la fecha y la hora, el método HTTP
(`req.method`) y la URL que se ha pedido (`req.originalUrl`). Uso `originalUrl`
en vez de `req.url` porque me devuelve la dirección completa tal y como la pidió
el navegador, con la query string incluida. Al final llama a `next()` para que la
petición siga su camino hacia las rutas; si me olvidara de esa línea, el
navegador se quedaría esperando sin recibir nunca una respuesta.

La fecha la formateo en una función aparte (`formatearFechaHora`) que recibe la
fecha como parámetro y no usa `req` ni `res`, así puedo probarla pasándole una
fecha fija. Lo del `padStart(2, '0')` es para que los días y las horas de un solo
dígito salgan como `09` y no como `9`, y que todas las líneas queden alineadas.

Ejemplo de lo que aparece en la terminal:

```
[09/11/2026 18:34:21] GET /talleres
[09/11/2026 18:34:28] GET /talleres/3
[09/11/2026 18:34:40] POST /talleres/3/inscripcion
```

### Tratamiento global de rutas inexistentes

Al final de `app.js`, después de todas las rutas, hay un `app.use` sin ruta
asociada:

```js
app.use((req, res) => {
  res.status(404).render('404', { ruta: req.originalUrl });
});
```

Ahí solo llegan las peticiones que no ha atendido ninguna ruta anterior, porque
Express va probando la cadena en orden y este es el último eslabón. La posición
es lo importante: si lo pusiera arriba contestaría 404 a todo, incluso al
listado de talleres.

Devuelve el código 404 y renderiza `views/404.ejs`, que es una vista propia e
integrada con el resto de la aplicación: usa los mismos parciales de cabecera y
pie, la misma hoja de estilos y tiene un enlace para volver al listado. No es
texto plano. Además muestra la dirección que se ha pedido, y la saco con `<%= %>`
para que salga escapada: si alguien pide `/<script>alert(1)</script>`, eso se ve
como texto y no se ejecuta.

Los 404 de un taller que no existe son otra cosa distinta y los resuelve la
propia ruta `/talleres/:id` con la vista `error.ejs`, porque ahí la ruta sí
existe y lo que no existe es el taller.

## Las rutas

La raíz no hace nada por sí misma, simplemente redirige al listado. En
`/talleres` saco todos los talleres con sus filtros y las plazas que le quedan a
cada uno. En `/talleres/:id` está la ficha de un taller concreto con su estado. En
`/talleres/:id/inscripcion` tengo dos cosas: por GET se muestra el formulario y
por POST se da de alta la inscripción.

Los filtros van por la query string y se pueden combinar entre ellos: por
categoría, por nivel o pidiendo solo los que tienen plazas libres.

Las plazas que quedan no las guardo en ningún sitio, las calculo restándole a las
plazas del taller el número de inscripciones que tiene:

```
plazasRestantes = plazas - númeroDeInscripciones
```

Según el número que salga, la ficha muestra las plazas disponibles que quedan,
avisa de que es la última plaza o dice que está completo.

## Las validaciones del formulario

Cuando llega el POST compruebo las cosas en este orden: que el taller existe, que
el nombre y el correo son válidos, que todavía quedan plazas y que ese correo no
se ha apuntado ya a ese mismo taller.

Si alguien se pone a tocar el id de la URL, la aplicación no se rompe. Separo dos
casos porque son problemas distintos:

- El id está mal escrito (`/talleres/abc`, `/talleres/-5`, `/talleres/3.7`):
  devuelvo **400**, porque el fallo está en lo que me han enviado.
- El id tiene buena forma pero no hay ningún taller con ese número
  (`/talleres/999`): devuelvo **404**, porque el recurso no existe.

Todo lo que llega del navegador por `req.query`, `req.params` y `req.body` lo
trato como si no me fiara antes de usarlo, y en las vistas lo pinto siempre con
`<%= %>` para que se escape.

Si hay algún error vuelvo a mostrar el formulario con un **400**, pero
conservando los campos que sí estaban bien y enseñando el mensaje de cada fallo,
para no obligar a escribirlo todo otra vez. Si la inscripción es correcta aplico
PRG: el POST acaba en un `res.redirect(303, ...)` a la ficha, así si se refresca
la página no se vuelve a enviar el formulario ni se duplica la inscripción.

## Métodos de array que he usado

- `find()` para localizar un taller por su id (`buscarTaller`).
- `filter()` para los filtros del listado y para sacar las inscripciones de un taller.
- `map()` para añadirle a cada taller las plazas que le quedan (`listarTalleres`).
- `some()` para comprobar si un correo ya está inscrito (`estaInscrito`).

Aparte de eso hay condicionales, un bucle `for` en `siguienteId`, conversiones de
tipos con `String()` y `Number()` y funciones propias en los tres módulos de
`src`.

---

# Llamadas con curl

Todas con el servidor levantado en `http://localhost:3000`. Uso `curl -i` cuando
quiero ver el código de estado y las cabeceras.

## Redirección de la raíz

```bash
curl -i http://localhost:3000/
```

Devuelve `302 Found` con `Location: /talleres`.

**Equivalente en HTML:** entrar en http://localhost:3000/ con el navegador.

## Listado de talleres

```bash
curl -i http://localhost:3000/talleres
```

Devuelve `200 OK` con el listado de los tres talleres y las plazas que le quedan
a cada uno.

**Equivalente en HTML:** el enlace "Ir al listado de talleres" y las migas
"Volver al listado" que hay en la ficha, el formulario y las páginas de error.

## Filtro por categoría

```bash
curl -i "http://localhost:3000/talleres?categoria=web"
```

Devuelve `200 OK` y solo los talleres de la categoría `web` (los talleres 2 y 3).

**Equivalente en HTML:** el desplegable "Categoría" del formulario de filtros del
listado, que va por `method="GET"` a `/talleres`.

## Filtro por nivel

```bash
curl -i "http://localhost:3000/talleres?nivel=avanzado"
```

Devuelve `200 OK` y solo el taller de nivel `avanzado` (el taller 2).

**Equivalente en HTML:** el desplegable "Nivel" del mismo formulario de filtros.

## Filtro por disponibilidad

```bash
curl -i "http://localhost:3000/talleres?disponibles=true"
```

Devuelve `200 OK` y solo los talleres a los que les queda al menos una plaza.

**Equivalente en HTML:** la casilla "Solo con plazas libres" del formulario de
filtros.

## Filtros combinados

```bash
curl -i "http://localhost:3000/talleres?categoria=web&disponibles=true"
curl -i "http://localhost:3000/talleres?categoria=web&nivel=avanzado&disponibles=true"
```

Devuelven `200 OK` aplicando los filtros uno detrás de otro. La última llamada
deja solo el taller 2.

**Equivalente en HTML:** elegir varias cosas a la vez en el formulario de filtros
y darle a "Filtrar". El formulario manda los tres campos juntos en la misma
query string.

## Ficha de un taller

```bash
curl -i http://localhost:3000/talleres/1
```

Devuelve `200 OK` con la ficha del taller 1: sus etiquetas, las plazas totales,
las inscripciones que tiene, las plazas restantes y el estado.

Para ver los tres estados:

```bash
curl -s http://localhost:3000/talleres/2 | grep estado   # varias plazas disponibles
curl -s http://localhost:3000/talleres/3 | grep estado   # Última plaza disponible
```

**Equivalente en HTML:** el título de cada taller del listado y el enlace "Ver
ficha".

## Ficha de un taller que no existe

```bash
curl -i http://localhost:3000/talleres/999
```

Devuelve `404 Not Found` con la vista `error.ejs` y el mensaje "Taller no
encontrado".

**Equivalente en HTML:** escribir esa dirección en el navegador. La página que
sale tiene un enlace para volver al listado.

## Ficha con un identificador manipulado

```bash
curl -i http://localhost:3000/talleres/abc
curl -i http://localhost:3000/talleres/-5
curl -i http://localhost:3000/talleres/3.7
```

Las tres devuelven `400 Bad Request` con el mensaje "Identificador no válido". La
aplicación no se cae ni devuelve un error del servidor.

**Equivalente en HTML:** escribir cualquiera de esas direcciones en el navegador.

## Formulario de inscripción

```bash
curl -i http://localhost:3000/talleres/1/inscripcion
```

Devuelve `200 OK` con el formulario vacío y sin errores.

**Equivalente en HTML:** el botón "Inscribirse" del listado y el botón
"Inscribirse en este taller" de la ficha.

## Alta de una inscripción correcta

```bash
curl -i -X POST \
  -d "nombre=Daniel Jimenez" \
  -d "email=daniel.nuevo@example.com" \
  http://localhost:3000/talleres/2/inscripcion
```

Devuelve `303 See Other` con `Location: /talleres/2?inscrito=1`. Es el PRG: el
navegador hace después un GET a la ficha, donde sale el aviso "Inscripción
realizada correctamente" y las plazas restantes ya con una menos.

**Equivalente en HTML:** rellenar el formulario de `/talleres/2/inscripcion` y
darle a "Confirmar inscripción". El formulario va con `method="POST"`.

## Alta con datos no válidos

```bash
curl -i -X POST -d "nombre=&email=" http://localhost:3000/talleres/1/inscripcion
```

Devuelve `400 Bad Request` y vuelve a mostrar el formulario con los mensajes "El
nombre es obligatorio" y "El correo es obligatorio".

Para comprobar que se conservan los campos buenos cuando falla otro:

```bash
curl -s -X POST \
  -d "nombre=Marcos Martinez" \
  -d "email=noesuncorreo" \
  http://localhost:3000/talleres/1/inscripcion | grep 'id="nombre"'
```

Sale `value="Marcos Martinez"`: el nombre se mantiene y el error se marca solo en
el correo.

**Equivalente en HTML:** enviar el formulario con los campos vacíos o con un
correo mal escrito. No hay `required` en el HTML a propósito, para que se vea que
la validación la hace el servidor.

## Alta con un correo que ya está inscrito

```bash
curl -i -X POST \
  -d "nombre=Otro Nombre" \
  -d "email=marcosmartinez@gmail.com" \
  http://localhost:3000/talleres/1/inscripcion
```

Devuelve `400 Bad Request` con el mensaje "Ese correo ya está inscrito en este
taller". Ese correo ya aparece en `src/datos.js` apuntado al taller 1.

El mismo correo sí puede apuntarse a otro taller distinto, porque la comprobación
es por taller y correo a la vez:

```bash
curl -i -X POST \
  -d "nombre=Marcos Martinez" \
  -d "email=marcosmartinez@gmail.com" \
  http://localhost:3000/talleres/2/inscripcion
```

**Equivalente en HTML:** enviar el formulario con un correo que ya esté apuntado
a ese taller.

## Alta en un taller sin plazas

El taller 3 tiene 3 plazas y 2 inscripciones, así que con una más se completa:

```bash
curl -i -X POST -d "nombre=Ana Ruiz" -d "email=ana@example.com" \
  http://localhost:3000/talleres/3/inscripcion   # 303, se queda completo
curl -i -X POST -d "nombre=Luis Gil" -d "email=luis@example.com" \
  http://localhost:3000/talleres/3/inscripcion   # 400, no quedan plazas
```

La segunda devuelve `400 Bad Request` con el aviso "No quedan plazas disponibles
para este taller". La ficha pasa a mostrar "Completo" y desaparece el enlace de
inscripción.

Como los datos están en memoria, para volver al estado inicial basta con parar y
arrancar otra vez el servidor.

**Equivalente en HTML:** el botón "Confirmar inscripción" sale desactivado cuando
no quedan plazas, y la ficha del taller completo ya no ofrece el enlace para
inscribirse.

## Alta con el identificador manipulado

```bash
curl -i -X POST -d "nombre=Juan Lopez" -d "email=juan@example.com" \
  http://localhost:3000/talleres/999/inscripcion   # 404
curl -i -X POST -d "nombre=Juan Lopez" -d "email=juan@example.com" \
  http://localhost:3000/talleres/abc/inscripcion   # 400
```

El POST comprueba el taller antes de mirar los datos del formulario, así que un
id inventado no llega a tocar la lista de inscripciones.

**Equivalente en HTML:** no hay ningún enlace que lleve ahí, pero se puede
cambiar a mano el `action` del formulario desde el inspector del navegador y la
aplicación lo rechaza igual.

## Ruta inexistente

```bash
curl -i http://localhost:3000/ruta-inexistente
```

La respuesta incluye un código equivalente a:

```
HTTP/1.1 404 Not Found
```

y el cuerpo es la vista `views/404.ejs` renderizada, con la cabecera y el pie de
la aplicación y un enlace para volver al listado.

Si solo quiero ver el código de estado:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ruta-inexistente
# 404
```

**Equivalente en HTML:** escribir en el navegador cualquier dirección que no
exista, por ejemplo http://localhost:3000/ruta-inexistente. También se llega al
poner un enlace mal escrito. La página que sale tiene el enlace "Ir al listado de
talleres" para volver.

## Hoja de estilos (middleware static)

```bash
curl -i http://localhost:3000/styles.css
```

Devuelve `200 OK` con el CSS, servido por `express.static` desde la carpeta
`public`.

**Equivalente en HTML:** la etiqueta `<link rel="stylesheet" href="/styles.css">`
del parcial de la cabecera, que el navegador pide sola al cargar cualquier
página.
