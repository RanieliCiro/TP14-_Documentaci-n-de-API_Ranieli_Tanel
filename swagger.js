const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "API Pokédex",
    version: "1.0.0",
    description:
      "API que consulta la PokeAPI (https://pokeapi.co) y permite armar un equipo Pokémon propio de hasta 6 integrantes.",
  },
  host: "localhost:3000",
  schemes: ["http"],
  tags: [
    { name: "Pokémon", description: "Consultas de Pokémon (datos de la PokeAPI)" },
    { name: "Equipo", description: "CRUD del equipo Pokémon (guardado en memoria)" },
  ],
  definitions: {
    Pokemon: {
      id: 25,
      nombre: "pikachu",
      tipos: ["electric"],
      peso: 60,
      altura: 4,
      imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    },
    ListaPokemon: {
      total: 1350,
      resultados: ["bulbasaur", "ivysaur", "venusaur"],
    },
    PokemonPorTipo: {
      tipo: "fire",
      pokemon: ["charmander", "charmeleon", "charizard"],
    },
    MiembroEquipo: {
      id: 1,
      nombre: "pikachu",
      apodo: "Rayito",
      nivel: 5,
      tipos: ["electric"],
    },
    NuevoMiembro: {
      $nombre: "pikachu",
      apodo: "Rayito",
      nivel: 5,
    },
    ModificarMiembro: {
      apodo: "Rayo",
      nivel: 20,
    },
    Error: {
      error: "Mensaje de error",
    },
  },
};

swaggerAutogen("./swagger-output.json", ["./app.js"], doc);
