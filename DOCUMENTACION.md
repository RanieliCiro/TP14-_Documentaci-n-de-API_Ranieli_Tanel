# TP14 – Documentación de una API con Swagger

**Alumnos:** Ranieli / Tanel

## 1. Proyecto seleccionado

**API Pokédex**, basada en el TP05 (`TP05_Tanel_Ranieli`), una Pokédex hecha en HTML/CSS/JS que consultaba la PokeAPI.

- **Tipo de API:** propia. Es un servidor Node + Express que consulta la PokeAPI externa (https://pokeapi.co) y además tiene un CRUD propio de "equipo Pokémon" (máximo 6 integrantes, guardado en memoria).
- **URL base:** `http://localhost:3000/api`

### Justificación de la API elegida
El TP05 usaba un solo endpoint de la PokeAPI, solo con GET. Para poder documentar con Swagger se le agregó un backend Express con 8 endpoints, que cubre GET, POST, PUT y DELETE, parámetros de ruta y de consulta, body y distintos códigos de error. El frontend original se conserva y ahora consume nuestra API.

### Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/pokemon?limit=&offset=` | Lista paginada de Pokémon |
| GET | `/api/pokemon/:nombre` | Datos de un Pokémon por nombre o id |
| GET | `/api/tipos/:tipo` | Pokémon de un tipo |
| GET | `/api/equipo` | Lista el equipo |
| GET | `/api/equipo/:id` | Un integrante del equipo |
| POST | `/api/equipo` | Agrega un Pokémon al equipo |
| PUT | `/api/equipo/:id` | Modifica apodo y/o nivel |
| DELETE | `/api/equipo/:id` | Elimina un integrante |

### Códigos de respuesta documentados
200 (OK), 201 (creado), 400 (datos inválidos o equipo lleno), 404 (no encontrado), 502 (falla al consultar la PokeAPI).

### Modelos
- **Pokemon:** `id` (integer), `nombre` (string), `tipos` (array de string), `peso` (integer), `altura` (integer), `imagen` (string, URL).
- **MiembroEquipo:** `id` (integer), `nombre` (string), `apodo` (string), `nivel` (integer, 1 a 100), `tipos` (array de string).
- **NuevoMiembro:** `nombre` (string, obligatorio), `apodo` (string), `nivel` (integer).
- **ModificarMiembro:** `apodo` (string), `nivel` (integer).
- **ListaPokemon:** `total` (integer), `resultados` (array de string).
- **PokemonPorTipo:** `tipo` (string), `pokemon` (array de string).
- **Error:** `error` (string).

## 2. Implementación de Swagger

Se usaron las herramientas vistas en clase:

- **swagger-autogen** ([swagger.js](swagger.js)): lee los comentarios `#swagger.*` de cada ruta en [app.js](app.js) y genera `swagger-output.json`. Ahí se definen también la información general y los modelos (`definitions`).
- **swagger-ui-express** ([app.js](app.js)): carga `swagger-output.json` y lo muestra en la ruta `/api-docs`.

`npm start` regenera primero la especificación y después levanta el servidor.

## 3. Cómo acceder a Swagger

```
npm install
npm start
```

Documentación: **http://localhost:3000/api-docs**
App (frontend): http://localhost:3000

> **Nota (redes con proxy/certificado propio):** si la API responde 502 porque Node rechaza el certificado de la red, iniciar con `set NODE_OPTIONS=--use-system-ca` (CMD) o `$env:NODE_OPTIONS="--use-system-ca"` (PowerShell) antes de `npm start`.

## 4. Problemas encontrados y soluciones

| Problema | Solución |
|---|---|
| El TP05 era solo frontend y no se podía usar swagger-autogen | Se agregó un backend Express que sirve el frontend y expone la API |
| Un solo endpoint, solo GET | Se sumó el CRUD del equipo y las consultas por lista y por tipo |
| Node devolvía `SELF_SIGNED_CERT_IN_CHAIN` al consultar la PokeAPI (proxy de la red) | Ejecutar Node con `--use-system-ca` |
| Errores de la PokeAPI llegaban como errores genéricos | Se distinguen 404 (no existe) y 502 (falla del servicio externo) |

## 5. Pruebas realizadas desde Swagger UI

Se probaron desde `/api-docs` con "Try it out". Resultados verificados:

| # | Prueba | Entrada | Código esperado | Captura |
|---|---|---|---|---|
| 1 | GET lista (parámetros de consulta) | `limit=3`, `offset=0` | 200 | *(pegar captura)* |
| 2 | GET con parámetro de ruta | `nombre=pikachu` | 200 | *(pegar captura)* |
| 3 | GET Pokémon inexistente | `nombre=xxxx` | 404 | *(pegar captura)* |
| 4 | POST agregar al equipo | `{"nombre":"pikachu","apodo":"Rayito","nivel":10}` | 201 | *(pegar captura)* |
| 5 | POST con body inválido | `{}` | 400 | *(pegar captura)* |
| 6 | PUT modificar | `id=1`, `{"nivel":20}` | 200 | *(pegar captura)* |
| 7 | DELETE eliminar | `id=1` | 200 | *(pegar captura)* |
| 8 | DELETE ya eliminado | `id=1` | 404 | *(pegar captura)* |

## 6. Evidencias (capturas de pantalla)

- Interfaz principal de Swagger (`/api-docs` completa): *(pegar captura)*
- Endpoints documentados (desplegados con parámetros, body y respuestas): *(pegar captura)*
- Pruebas desde Swagger UI y respuestas obtenidas: ver tabla de la sección 5.
