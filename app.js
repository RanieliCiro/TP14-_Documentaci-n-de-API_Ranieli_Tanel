const express = require("express");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");

const POKEAPI = "https://pokeapi.co/api/v2";
const MAX_EQUIPO = 6;
const PORT = 3000;

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Equipo Pokémon guardado en memoria
let equipo = [];
let siguienteId = 1;

// Consulta a la PokeAPI. Devuelve { status, data }
async function consultarPokeApi(ruta) {
  try {
    const res = await fetch(`${POKEAPI}${ruta}`);
    if (!res.ok) return { status: res.status === 404 ? 404 : 502 };
    return { status: 200, data: await res.json() };
  } catch (err) {
    return { status: 502 };
  }
}

function simplificar(p) {
  return {
    id: p.id,
    nombre: p.name,
    tipos: p.types.map((t) => t.type.name),
    peso: p.weight,
    altura: p.height,
    imagen: p.sprites.front_default,
  };
}

function responderErrorPokeApi(res, status, mensaje) {
  if (status === 404) return res.status(404).json({ error: mensaje });
  return res.status(502).json({ error: "No se pudo consultar la PokeAPI" });
}

// ---------- Pokémon (PokeAPI) ----------

app.get("/api/pokemon", async (req, res) => {
  // #swagger.tags = ['Pokémon']
  // #swagger.summary = 'Lista paginada de Pokémon'
  // #swagger.description = 'Devuelve una lista de nombres de Pokémon consultando la PokeAPI.'
  // #swagger.parameters['limit'] = { in: 'query', description: 'Cantidad de resultados (1 a 100). Por defecto 10.', type: 'integer', example: 10 }
  // #swagger.parameters['offset'] = { in: 'query', description: 'Cantidad de resultados a saltear. Por defecto 0.', type: 'integer', example: 0 }
  // #swagger.responses[200] = { description: 'Lista de Pokémon', schema: { $ref: '#/definitions/ListaPokemon' } }
  // #swagger.responses[400] = { description: 'limit u offset inválidos', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[502] = { description: 'Falla al consultar la PokeAPI', schema: { $ref: '#/definitions/Error' } }
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    return res.status(400).json({ error: "limit debe ser un entero entre 1 y 100 y offset un entero >= 0" });
  }

  const r = await consultarPokeApi(`/pokemon?limit=${limit}&offset=${offset}`);
  if (r.status !== 200) return responderErrorPokeApi(res, r.status, "No encontrado");

  res.status(200).json({
    total: r.data.count,
    resultados: r.data.results.map((p) => p.name),
  });
});

app.get("/api/pokemon/:nombre", async (req, res) => {
  // #swagger.tags = ['Pokémon']
  // #swagger.summary = 'Obtiene un Pokémon'
  // #swagger.description = 'Busca un Pokémon por nombre o por número (id) en la PokeAPI.'
  // #swagger.parameters['nombre'] = { in: 'path', description: 'Nombre o id del Pokémon', type: 'string', example: 'pikachu' }
  // #swagger.responses[200] = { description: 'Pokémon encontrado', schema: { $ref: '#/definitions/Pokemon' } }
  // #swagger.responses[404] = { description: 'El Pokémon no existe', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[502] = { description: 'Falla al consultar la PokeAPI', schema: { $ref: '#/definitions/Error' } }
  const nombre = req.params.nombre.toLowerCase().trim();
  const r = await consultarPokeApi(`/pokemon/${encodeURIComponent(nombre)}`);
  if (r.status !== 200) return responderErrorPokeApi(res, r.status, "Pokémon no encontrado");
  res.status(200).json(simplificar(r.data));
});

app.get("/api/tipos/:tipo", async (req, res) => {
  // #swagger.tags = ['Pokémon']
  // #swagger.summary = 'Pokémon de un tipo'
  // #swagger.description = 'Devuelve los nombres de los Pokémon que pertenecen a un tipo (fire, water, grass...).'
  // #swagger.parameters['tipo'] = { in: 'path', description: 'Nombre del tipo en inglés', type: 'string', example: 'fire' }
  // #swagger.responses[200] = { description: 'Pokémon del tipo', schema: { $ref: '#/definitions/PokemonPorTipo' } }
  // #swagger.responses[404] = { description: 'El tipo no existe', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[502] = { description: 'Falla al consultar la PokeAPI', schema: { $ref: '#/definitions/Error' } }
  const tipo = req.params.tipo.toLowerCase().trim();
  const r = await consultarPokeApi(`/type/${encodeURIComponent(tipo)}`);
  if (r.status !== 200) return responderErrorPokeApi(res, r.status, "Tipo no encontrado");
  res.status(200).json({
    tipo: r.data.name,
    pokemon: r.data.pokemon.map((p) => p.pokemon.name),
  });
});

// ---------- Equipo (CRUD propio) ----------

app.get("/api/equipo", (req, res) => {
  // #swagger.tags = ['Equipo']
  // #swagger.summary = 'Lista el equipo'
  // #swagger.description = 'Devuelve todos los Pokémon guardados en el equipo (máximo 6).'
  // #swagger.responses[200] = { description: 'Equipo actual', schema: [{ $ref: '#/definitions/MiembroEquipo' }] }
  res.status(200).json(equipo);
});

app.get("/api/equipo/:id", (req, res) => {
  // #swagger.tags = ['Equipo']
  // #swagger.summary = 'Obtiene un integrante del equipo'
  // #swagger.description = 'Devuelve un integrante del equipo a partir de su id.'
  // #swagger.parameters['id'] = { in: 'path', description: 'Id del integrante', type: 'integer', example: 1 }
  // #swagger.responses[200] = { description: 'Integrante encontrado', schema: { $ref: '#/definitions/MiembroEquipo' } }
  // #swagger.responses[404] = { description: 'No existe el integrante', schema: { $ref: '#/definitions/Error' } }
  const miembro = equipo.find((m) => m.id === Number(req.params.id));
  if (!miembro) return res.status(404).json({ error: "Integrante no encontrado" });
  res.status(200).json(miembro);
});

app.post("/api/equipo", async (req, res) => {
  // #swagger.tags = ['Equipo']
  // #swagger.summary = 'Agrega un Pokémon al equipo'
  // #swagger.description = 'Verifica en la PokeAPI que el Pokémon exista y lo agrega al equipo. El equipo admite como máximo 6 integrantes.'
  // #swagger.parameters['body'] = { in: 'body', description: 'Datos del nuevo integrante', required: true, schema: { $ref: '#/definitions/NuevoMiembro' } }
  // #swagger.responses[201] = { description: 'Integrante creado', schema: { $ref: '#/definitions/MiembroEquipo' } }
  // #swagger.responses[400] = { description: 'Datos inválidos o equipo lleno', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[404] = { description: 'El Pokémon no existe', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[502] = { description: 'Falla al consultar la PokeAPI', schema: { $ref: '#/definitions/Error' } }
  const { nombre, apodo, nivel } = req.body || {};

  if (typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({ error: "El campo nombre es obligatorio" });
  }
  if (apodo !== undefined && typeof apodo !== "string") {
    return res.status(400).json({ error: "apodo debe ser texto" });
  }
  if (nivel !== undefined && (!Number.isInteger(nivel) || nivel < 1 || nivel > 100)) {
    return res.status(400).json({ error: "nivel debe ser un entero entre 1 y 100" });
  }
  if (equipo.length >= MAX_EQUIPO) {
    return res.status(400).json({ error: `El equipo ya tiene ${MAX_EQUIPO} integrantes` });
  }

  const r = await consultarPokeApi(`/pokemon/${encodeURIComponent(nombre.toLowerCase().trim())}`);
  if (r.status !== 200) return responderErrorPokeApi(res, r.status, "Pokémon no encontrado");

  const miembro = {
    id: siguienteId++,
    nombre: r.data.name,
    apodo: apodo || r.data.name,
    nivel: nivel || 5,
    tipos: r.data.types.map((t) => t.type.name),
  };
  equipo.push(miembro);
  res.status(201).json(miembro);
});

app.put("/api/equipo/:id", (req, res) => {
  // #swagger.tags = ['Equipo']
  // #swagger.summary = 'Modifica un integrante'
  // #swagger.description = 'Cambia el apodo y/o el nivel de un integrante del equipo.'
  // #swagger.parameters['id'] = { in: 'path', description: 'Id del integrante', type: 'integer', example: 1 }
  // #swagger.parameters['body'] = { in: 'body', description: 'Campos a modificar', required: true, schema: { $ref: '#/definitions/ModificarMiembro' } }
  // #swagger.responses[200] = { description: 'Integrante modificado', schema: { $ref: '#/definitions/MiembroEquipo' } }
  // #swagger.responses[400] = { description: 'Datos inválidos', schema: { $ref: '#/definitions/Error' } }
  // #swagger.responses[404] = { description: 'No existe el integrante', schema: { $ref: '#/definitions/Error' } }
  const miembro = equipo.find((m) => m.id === Number(req.params.id));
  if (!miembro) return res.status(404).json({ error: "Integrante no encontrado" });

  const { apodo, nivel } = req.body || {};
  if (apodo === undefined && nivel === undefined) {
    return res.status(400).json({ error: "Enviá apodo y/o nivel" });
  }
  if (apodo !== undefined && (typeof apodo !== "string" || !apodo.trim())) {
    return res.status(400).json({ error: "apodo debe ser texto no vacío" });
  }
  if (nivel !== undefined && (!Number.isInteger(nivel) || nivel < 1 || nivel > 100)) {
    return res.status(400).json({ error: "nivel debe ser un entero entre 1 y 100" });
  }

  if (apodo !== undefined) miembro.apodo = apodo.trim();
  if (nivel !== undefined) miembro.nivel = nivel;
  res.status(200).json(miembro);
});

app.delete("/api/equipo/:id", (req, res) => {
  // #swagger.tags = ['Equipo']
  // #swagger.summary = 'Elimina un integrante'
  // #swagger.description = 'Saca a un Pokémon del equipo.'
  // #swagger.parameters['id'] = { in: 'path', description: 'Id del integrante', type: 'integer', example: 1 }
  // #swagger.responses[200] = { description: 'Integrante eliminado', schema: { $ref: '#/definitions/MiembroEquipo' } }
  // #swagger.responses[404] = { description: 'No existe el integrante', schema: { $ref: '#/definitions/Error' } }
  const indice = equipo.findIndex((m) => m.id === Number(req.params.id));
  if (indice === -1) return res.status(404).json({ error: "Integrante no encontrado" });
  const [eliminado] = equipo.splice(indice, 1);
  res.status(200).json(eliminado);
});

// ---------- Swagger UI ----------

if (fs.existsSync("./swagger-output.json")) {
  const especificacion = JSON.parse(fs.readFileSync("./swagger-output.json", "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(especificacion));
}

app.listen(PORT, () => {
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});
