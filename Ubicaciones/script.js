document.getElementById('searchButton').addEventListener('click', realizarBusqueda);
document.getElementById('medidaInput').addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        realizarBusqueda();
    }
});

document.getElementById("cleanButton").addEventListener("click", function() {
    let input = document.getElementById("medidaInput");
    input.value = ""; // Limpia el input
    input.focus();    // Hace focus en el input
});

const scrollButton = document.getElementById("scrollButton");
scrollButton.addEventListener("click", function () {
    if (window.scrollY >= document.body.scrollHeight - window.innerHeight - 10) {
        window.scrollTo({ top: 0, behavior: "instant" });
        scrollButton.innerHTML = "Ir al final";
    } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
        scrollButton.innerHTML = "Ir al inicio";
    }
});

function realizarBusqueda() {
    const medidaBuscada = document.getElementById('medidaInput').value.trim();
    if (!medidaBuscada) {
        alert("Por favor, ingresa una medida válida.");
        return;
    }
    cargarArchivo(medidaBuscada);
    cargarUbicaciones(medidaBuscada);
}

function cargarArchivo(medidaBuscada) {
    fetch('files/Ubicaciones.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets["Datos de producto"];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const variantes = GenerarVariantesMedida(medidaBuscada);

            const resultados = jsonData.filter(row =>
                variantes.some(vari => row["MEDIDA"] && row["MEDIDA"].toString().toUpperCase().includes(vari.toUpperCase()))
            );

            mostrarUbicaciones(resultados, medidaBuscada);
        })
        .catch(error => console.error('Error al cargar el archivo:', error));
}

function cargarUbicaciones(medidaBuscada) {
    fetch('files/Ubicaciones.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets["Datos de producto"];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const variantes = GenerarVariantesMedida(medidaBuscada);

            const resultados = jsonData.filter(row =>
                variantes.some(vari => row["Medida"] && row["Medida"].toString().toUpperCase().includes(vari.toUpperCase()))
            );

            mostrarUbicaciones(resultados, medidaBuscada);
        })
        .catch(error => console.error('Error al cargar el archivo Ubicaciones:', error));
}

function GenerarVariantesMedida(medida) {
    medida = medida.toString().trim();
    
    if (medida.length === 7) {
        const ancho = medida.substring(0, 3);
        const perfil = medida.substring(3, 5);
        const diametro = medida.substring(5);
        return [
            `${ancho}/${perfil}R${diametro}`, `${ancho}/${perfil}ZR${diametro}`, 
            `${ancho}/${perfil}ZRZ${diametro}`, `${ancho}/${perfil}RZR${diametro}`,
            `${ancho}/${perfil}R${diametro}C`, `${ancho}/${perfil}ZR${diametro}C`,
            `${ancho}/${perfil}ZRF${diametro}`, `${ancho}/${perfil}ZRXL${diametro}`,
            `${ancho}/${perfil}ZRF${diametro}C`
        ];
    }

    if (medida.length === 5) {
        const ancho = medida.substring(0, 3);
        const diametro = medida.substring(3);
        return [
            `${ancho}R${diametro}`, `${ancho}R${diametro}C`,
            `${ancho}ZR${diametro}`, `${ancho}ZR${diametro}C`,
            `${ancho}ZRF${diametro}`
        ];
    }
    
    if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
        return [medida];
    }

    return [medida];
}

function mostrarUbicaciones(resultados, medidaBuscada) {
    const ubicacionesDiv = document.getElementById('ubicaciones');
    ubicacionesDiv.innerHTML = '';

    const encabezado = document.createElement('h3');
    encabezado.textContent = "Ubicaciones encontradas:";
    ubicacionesDiv.appendChild(encabezado);

    if (resultados.length > 0) {
        resultados.forEach(fila => {
            const medida = fila["Medida"] || '';
            const marca = fila["Marca"] || '';
            const modelo = fila["Modelo"] || '';
            const ubicacion = fila["Ubicación"] || 'No Determinada';

            const resultadoTexto = `
                Medida: ${medida}<br>
                Marca: ${marca}<br>
                Modelo: ${modelo}<br>
                Ubicación: ${ubicacion}<br>`;

            const resultadoElemento = document.createElement('div');
            resultadoElemento.classList.add('alert', 'alert-success');
            resultadoElemento.innerHTML = resultadoTexto;

            ubicacionesDiv.appendChild(resultadoElemento);
        });
    } else {
        const mensaje = document.createElement('p');
        mensaje.classList.add('alert', 'alert-warning');
        mensaje.textContent = `No se encontraron ubicaciones que contengan la medida "${medidaBuscada}".`;
        ubicacionesDiv.appendChild(mensaje);
    }
};