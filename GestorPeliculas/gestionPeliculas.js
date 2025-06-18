// --- Variables globales y DOM ---
let puntuaciones = {};
let listaPeliculas = [];

const tabla = document.getElementById("tablaPeliculas");
const form = document.getElementById("formularioRegistro");
const formPuntuacion = document.getElementById("formularioPuntuacion");
const selectPeliculas = document.getElementById("peliculaSelect");

const campos = {
    titulo: document.getElementById("titulo"),
    director: document.getElementById("director"),
    anio: document.getElementById("anio"),
    duracion: document.getElementById("duracion"),
    genero: document.getElementById("genero")
};

// --- Inicialización ---
document.addEventListener("DOMContentLoaded", inicializarAplicacion);

function inicializarAplicacion() {
    cargarPeliculasDesdeStorage();
    puntuaciones = JSON.parse(localStorage.getItem('puntuaciones')) || {};

    listaPeliculas.forEach(p => actualizarPromedioPelicula(p.titulo));
    actualizarTabla();
    actualizarEstadisticas();

    const dniGuardado = localStorage.getItem('usuarioActual');
    if (dniGuardado) {
        document.getElementById('dniUsuario').value = dniGuardado;
        document.getElementById('usuarioActual').textContent = `Usuario activo: ${dniGuardado}`;
    }
}

// --- Formularios ---
form.addEventListener("submit", manejadorEnvioFormulario);
formPuntuacion.addEventListener("submit", manejadorPuntuacion);

function manejadorEnvioFormulario(event) {
    event.preventDefault();

    const titulo = campos.titulo.value;
    const director = campos.director.value;
    const anio = parseInt(campos.anio.value);
    const duracion = parseInt(campos.duracion.value);
    const genero = campos.genero.value;
    const cartelera = document.querySelector('input[name="cartelera"]:checked')?.value;

    if (!titulo || !director || isNaN(anio) || isNaN(duracion) || !genero || !cartelera) {
        alert("Por favor complete todos los campos correctamente");
        return;
    }

    const pelicula = {
        titulo,
        director,
        anio,
        duracion,
        genero,
        cartelera,
        antiguedad: new Date().getFullYear() - anio
    };

    agregarPeliculaATabla(pelicula);
    guardarPeliculaEnStorage(pelicula);
    form.reset();
    alert(`Película "${titulo}" registrada correctamente`);
}

function manejadorPuntuacion(event) {
    event.preventDefault();

    const dni = document.getElementById('dniUsuario').value.trim();
    const tituloPelicula = selectPeliculas.value;
    const puntuacion = document.getElementById('puntuacion').value;

    if (!dni || isNaN(dni)) {
        alert("DNI inválido. Debe ser un número.");
        return;
    }
    if (!tituloPelicula || !puntuacion) {
        alert("Selecciona una película y una puntuación.");
        return;
    }

    localStorage.setItem('usuarioActual', dni);
    document.getElementById('usuarioActual').textContent = `Usuario activo: ${dni}`;

    const clave = `${dni}_${tituloPelicula}`;
    puntuaciones[clave] = {
        dni,
        titulo: tituloPelicula,
        puntuacion: parseFloat(puntuacion),
        fecha: new Date().toISOString()
    };

    localStorage.setItem('puntuaciones', JSON.stringify(puntuaciones));
    actualizarPromedioPelicula(tituloPelicula);
    actualizarTabla();

    selectPeliculas.value = '';
    document.getElementById('puntuacion').value = '';
    alert(`Puntuación registrada para DNI: ${dni}`);
}

// --- Operaciones con películas ---
function agregarPeliculaATabla(pelicula) {
    const fila = tabla.insertRow();

    const promedio = calcularPromedio(pelicula.titulo);

    const celdas = [
        pelicula.titulo,
        pelicula.director,
        pelicula.anio,
        `${pelicula.duracion} min`,
        pelicula.genero,
        pelicula.cartelera,
        `${pelicula.antiguedad} años`,
        promedio
    ];

    celdas.forEach((valor, index) => {
        const celda = fila.insertCell();
        celda.textContent = valor;

        if (index === 6) {
            celda.classList.remove('antiguedad-reciente', 'antiguedad-media', 'antiguedad-antigua');
            if (pelicula.antiguedad <= 5) celda.classList.add('antiguedad-reciente');
            else if (pelicula.antiguedad <= 20) celda.classList.add('antiguedad-media');
            else celda.classList.add('antiguedad-antigua');
        }
    });

    const celdaAcciones = fila.insertCell();
    celdaAcciones.appendChild(crearBoton("Editar", "btn-warning", () => {
        llenarFormularioConPelicula(pelicula);
        borrarPeliculaDelStorage(pelicula);
        tabla.deleteRow(fila.rowIndex);
    }));
    celdaAcciones.appendChild(crearBoton("Eliminar", "btn-danger", () => {
        if (confirm(`¿Eliminar "${pelicula.titulo}"?`)) {
            borrarPeliculaDelStorage(pelicula);
            tabla.deleteRow(fila.rowIndex);
        }
    }));
}

function actualizarPromedioPelicula(titulo) {
    const pelicula = listaPeliculas.find(p => p.titulo === titulo);
    if (!pelicula) return;

    const promedio = calcularPromedio(titulo);
    pelicula.puntuacion = promedio;
    guardarPeliculaEnStorage(pelicula);
}

function calcularPromedio(titulo) {
    const puntuacionesPeli = Object.values(puntuaciones)
        .filter(p => p.titulo === titulo)
        .map(p => parseFloat(p.puntuacion));

    if (puntuacionesPeli.length === 0) return "N/A";
    const suma = puntuacionesPeli.reduce((a, b) => a + b, 0);
    return (suma / puntuacionesPeli.length).toFixed(1);
}

// --- Storage ---
function obtenerPeliculasDesdeStorage() {
    const data = localStorage.getItem("peliculas");
    return data ? JSON.parse(data) : [];
}

function cargarPeliculasDesdeStorage() {
    listaPeliculas = obtenerPeliculasDesdeStorage();
    actualizarTabla();
    actualizarSelectPeliculas();
}

function guardarPeliculaEnStorage(pelicula) {
    const index = listaPeliculas.findIndex(p => p.titulo === pelicula.titulo);
    if (index !== -1) listaPeliculas[index] = pelicula;
    else listaPeliculas.push(pelicula);

    localStorage.setItem("peliculas", JSON.stringify(listaPeliculas));
    actualizarSelectPeliculas();
    actualizarEstadisticas();
}

function borrarPeliculaDelStorage(pelicula) {
    listaPeliculas = listaPeliculas.filter(p => p.titulo !== pelicula.titulo);
    localStorage.setItem("peliculas", JSON.stringify(listaPeliculas));
    actualizarEstadisticas();
}

// --- UI y otros ---
function actualizarTabla() {
    while (tabla.rows.length > 1) tabla.deleteRow(1);
    listaPeliculas.forEach(agregarPeliculaATabla);
}

function actualizarSelectPeliculas() {
    selectPeliculas.innerHTML = '<option value="">Seleccionar película...</option>';
    listaPeliculas.forEach(pelicula => {
        const option = document.createElement("option");
        option.value = pelicula.titulo;
        option.textContent = pelicula.titulo;
        selectPeliculas.appendChild(option);
    });
}

function llenarFormularioConPelicula(pelicula) {
    campos.titulo.value = pelicula.titulo;
    campos.director.value = pelicula.director;
    campos.anio.value = pelicula.anio;
    campos.duracion.value = pelicula.duracion;
    campos.genero.value = pelicula.genero;
    document.querySelector(`input[name="cartelera"][value="${pelicula.cartelera}"]`).checked = true;
}

function crearBoton(texto, clase, accion) {
    const boton = document.createElement("button");
    boton.textContent = texto;
    boton.className = `btn ${clase} mx-1`;
    boton.onclick = accion;
    return boton;
}

function actualizarEstadisticas() {
    const statsContainer = document.getElementById("estadisticas");

    if (listaPeliculas.length === 0) {
        statsContainer.innerHTML = "<p>No hay películas registradas</p>";
        return;
    }

    const total = listaPeliculas.length;
    const enCartelera = listaPeliculas.filter(p => p.cartelera === "Sí").length;

    const generos = {};
    listaPeliculas.forEach(p => generos[p.genero] = (generos[p.genero] || 0) + 1);

    let generosHTML = "";
    for (const [genero, cantidad] of Object.entries(generos)) {
        generosHTML += `<li class="list-group-item">${genero}: ${cantidad}</li>`;
    }

    statsContainer.innerHTML = `
    <div class="card">
      <div class="card-header"><h5>Estadísticas</h5></div>
      <ul class="list-group list-group-flush">
        <li class="list-group-item">Total: ${total} películas</li>
        <li class="list-group-item">En cartelera: ${enCartelera}</li>
        <li class="list-group-item"><strong>Por género:</strong></li>
        ${generosHTML}
      </ul>
    </div>`;
}
