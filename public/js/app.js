const input = document.getElementById("pokemonInput");
const button = document.getElementById("searchBtn");
const card = document.getElementById("pokemonCard");
const error = document.getElementById("error");
const loading = document.getElementById("loading");

button.addEventListener("click", buscarPokemon);

async function buscarPokemon() {
  const nombre = input.value.toLowerCase().trim();

  if (!nombre) {
    mostrarError("Ingresá un nombre");
    return;
  }

  limpiar();

  loading.classList.remove("hidden");

  try {
    const res = await fetch(`/api/pokemon/${encodeURIComponent(nombre)}`);
    
    if (!res.ok) throw new Error("No existe");

    const data = await res.json();
    mostrarPokemon(data);

  } catch (err) {
    mostrarError("Pokémon no encontrado");
  } finally {
    loading.classList.add("hidden");
  }
}

function mostrarPokemon(pokemon) {
  const tipos = pokemon.tipos.join(", ");

  card.innerHTML = `
    <h2>${pokemon.nombre}</h2>
    <img src="${pokemon.imagen}" />
    <p>Tipo: ${tipos}</p>
    <p>Peso: ${pokemon.weight}</p>
    <p>Altura: ${pokemon.height}</p>
  `;
}

function mostrarError(msg) {
  error.textContent = msg;
  error.classList.remove("hidden");
}

function limpiar() {
  card.innerHTML = "";
  error.classList.add("hidden");
}

input.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    buscarPokemon();
  }
});