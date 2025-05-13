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
}

function cargarArchivo(medidaBuscada) {
    fetch('files/LLANTAS.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets["Hoja1"];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Validación y separación
            if (medidaBuscada.length < 2) {
                alert("Por favor, ingresa una medida válida (por ejemplo, '15A' o '15C').");
                return;
            }

            const aro = medidaBuscada.slice(0, -1);
            const tipoLetra = medidaBuscada.slice(-1).toUpperCase();
            const tipoVehiculo = tipoLetra === "A"
                ? "auto"
                : tipoLetra === "C"
                ? "camioneta"
                : null;

            if (!tipoVehiculo) {
                alert("Por favor, termina la medida con 'A' (auto) o 'C' (camioneta).");
                return;
            }

            // Filtrar resultados
            const resultados = jsonData.filter(row =>
                row["ARO"] && row["ARO"].toString().includes(aro) &&
                row["TIPO VEHICULO"] && row["TIPO VEHICULO"].toLowerCase() === tipoVehiculo &&
                (row["PROOVEDOR"] === "PACIFICO" || row["PROOVEDOR"] === "OTROS")
            );

            mostrarResultados(resultados, medidaBuscada);
        })
        .catch(error => console.error('Error al cargar el archivo:', error));
}


function mostrarResultados(resultados, medidaBuscada) {
    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = '';

    const encabezado = document.createElement('h3');
    encabezado.textContent = "Tenemos lo siguiente:";
    resultadosDiv.appendChild(encabezado);

    if (resultados.length > 0) {
        resultados.forEach(fila => {
            const medida = fila["ARO"] || '';
            const proveedor = fila["PROOVEDOR"] || '';
            const modelos = fila["MODELOS"] || '';
            const tipoVehiculo = fila["TIPO VEHICULO"] || '';
            const facebook = fila["FACEBOOK"] || '';
            const agregado = fila["AGREGADO"] || 'NO CONTIENE AGREGADO';
            const web = fila["WEB"] || '';
            const observaciones = fila["OBSERVACIONES"] || 'NO PRESENTA OBSERVACION';
            
            let resultadoTexto = `
                Medida: ARO ${medida}<br>
                Proveedor: ${proveedor}<br>
                Modelo: ${modelos}<br>
                Tipo Vehículo: ${tipoVehiculo}<br>
                Precio Market: $${formatearPrecio(facebook)}<br>
                Agregado: ${agregado}<br>
                Precio Web: $${formatearPrecio(web)}<br>
                Observaciones: ${observaciones}<br>
            `;

            // Crear el elemento del resultado
            const resultadoElemento = document.createElement('div');
            resultadoElemento.classList.add('alert', 'alert-info');

            // Crear el checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('resultado-checkbox');
            checkbox.style.marginRight = '10px';

            // Añadir el checkbox al resultado
            resultadoElemento.appendChild(checkbox);
            resultadoElemento.innerHTML += resultadoTexto;

            // Añadir el resultado a la vista
            resultadosDiv.appendChild(resultadoElemento);
        });

        // Mostrar botones si hay resultados
        document.getElementById('copyButton').style.display = 'block';
        document.getElementById('copySelectedButton').style.display = 'block';
    } else {
        // Mostrar mensaje si no hay resultados
        const resultadoElemento = document.createElement('p');
        resultadoElemento.classList.add('alert', 'alert-warning');
        resultadoElemento.textContent = `No se encontraron llantas de aro "${medidaBuscada}".`;
        resultadosDiv.appendChild(resultadoElemento);

        // Ocultar botones si no hay resultados
        document.getElementById('copyButton').style.display = 'none';
        document.getElementById('copySelectedButton').style.display = 'none';
    }
}

// Función para formatear precios
function formatearPrecio(precio) {
    if (!precio) return '';
    return parseFloat(precio).toLocaleString('es-ES');
}

// Función para copiar todos los resultados
document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    // Añadir el texto del encabezado
    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) {
        resultadosTexto += encabezado.innerText + '\n\n';
    }

    // Recopilar el contenido de los resultados
    resultadosDiv.querySelectorAll('.alert').forEach(alert => {
        const lines = alert.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    });

    navigator.clipboard.writeText(resultadosTexto.trim());
});

// Función para copiar solo los resultados seleccionados
document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    // Añadir el texto del encabezado
    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) {
        resultadosTexto += encabezado.innerText + '\n\n';
    }

    const checkboxes = resultadosDiv.querySelectorAll('.resultado-checkbox:checked');

    if (checkboxes.length === 0) {
        alert("Selecciona al menos un resultado para copiar.");
        return;
    }

    checkboxes.forEach(checkbox => {
        const resultadoElemento = checkbox.closest('.alert');
        if (resultadoElemento) {
            const lines = resultadoElemento.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
            resultadosTexto += lines.join('\n') + '\n\n';
        }
    });

    navigator.clipboard.writeText(resultadosTexto.trim());
});
