document.getElementById('searchButton').addEventListener('click', realizarBusqueda);
document.getElementById('medidaInput').addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
        realizarBusqueda();
    }
});

document.getElementById("cleanButton").addEventListener("click", function() {
    let input = document.getElementById("medidaInput");
    input.value = "";
    input.focus();
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
    cargarArchivoDesdeCSV(medidaBuscada);
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

function cargarArchivoDesdeCSV(medidaBuscada) {
  const urls = [
    {
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvX_EPW0NwRZS69n3dKorHfYERGXaHeQyuJZacQCNUIHzFXZ36Tuu6ry03DeWjfQ/pub?output=csv",
      tipo: "normal"
    },
    {
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSt2J_fxHoCMq4KhMBR85x4vVO_m8v5SLWo09BP7KJ5cp-SKw_mN2cgxznNnaZWBw/pub?output=csv",
      tipo: "sale"
    }
  ];

  const variantes = GenerarVariantesMedida(medidaBuscada);

  Promise.all(urls.map(item =>
    fetch(item.url)
      .then(resp => resp.text())
      .then(csv => {
        const rows = Papa.parse(csv, { header: true }).data;
        return rows.filter(row =>
          variantes.some(vari =>
            row["MEDIDA"] &&
            row["MEDIDA"].toUpperCase().includes(vari.toUpperCase())
          )
        ).map(row => ({ ...row, tipo: item.tipo }));
      })
  ))
  .then(resultadosArrays => {
    const resultadosCombinados = [].concat(...resultadosArrays);
    mostrarResultados(resultadosCombinados, medidaBuscada);
  })
  .catch(error => console.error("Error al cargar los datos:", error));
}

function mostrarResultados(resultados, medidaBuscada) {
    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = '';

    const encabezado = document.createElement('h3');
    encabezado.textContent = "Tenemos lo siguiente:";
    resultadosDiv.appendChild(encabezado);

    if (resultados.length > 0) {
        resultados.forEach(fila => {
            const medida = fila["MEDIDA"] || '';
            const marca = fila["MARCA"] || '';
            const modelo = fila["MODELO"] || '';
            const precioUnidad = fila["UNIDAD"] || '';
            const precioX2 = fila["X2"] || '';
            const precioX4 = fila["X4"] || '';
            const tipo = fila["tipo"] || '';

            function formatearPrecio(precio) {
                if (!precio) return '';
                return Number(precio).toLocaleString('es-ES');
            }

            const precioUnidadFormateado = formatearPrecio(precioUnidad);
            const precioX2Formateado = formatearPrecio(precioX2);
            const precioX4Formateado = formatearPrecio(precioX4);

            let resultadoTexto = '';

            if (precioUnidad && precioX2 && precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidad}<br>
                    Precio por par (X2): $${precioX2}<br>
                    Precio por juego (X4): $${precioX4}<br>`;
            } else if (precioUnidad && !precioX2 && precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidad}<br>
                    Precio por juego (X4): $${precioX4}<br>`;
            } else if (precioUnidad && precioX2 && !precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio unidad: $${precioUnidad}<br>
                    Precio por par (X2): $${precioX2}<br>`;
            } else if (precioX2 && precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio por par (X2): $${precioX2}<br>
                    Precio por juego (X4): $${precioX4}<br>`;
            } else if (!precioUnidad && !precioX2 && precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio por juego (X4): $${precioX4}<br>`;
            } else if (!precioUnidad && precioX2 && !precioX4) {
                resultadoTexto = `
                    Medida: ${medida}<br>
                    Marca: ${marca}<br>
                    Modelo: ${modelo}<br>
                    Precio por par (X2): $${precioX2Formateado}<br>`;
            } else if (precioUnidad && !precioX2 && !precioX4) {
                resultadoTexto = `
                    Neumático ${medida} ${marca} ${modelo}. Valor Unitario: $${precioUnidad} <br>`;
            }

            if (tipo === "sale") {
                resultadoTexto += `<span style="color: red; font-weight: bold;">🔥 Oferta SAMCORSALE</span><br>`;
            }

            const resultadoElemento = document.createElement('div');
            resultadoElemento.classList.add('alert', 'alert-info');

            const checkbox = document.createElement('input');
            checkbox.dataset.instalacion = (fila["INSTALACION"] || '').toString().trim().toLowerCase();
            checkbox.type = 'checkbox';
            checkbox.classList.add('resultado-checkbox');
            checkbox.style.marginRight = '10px';

            resultadoElemento.appendChild(checkbox);
            resultadoElemento.innerHTML += resultadoTexto;
            resultadosDiv.appendChild(resultadoElemento);
        });

        const bajada1 = document.createElement('p');
        bajada1.textContent = "Incluye instalación, balanceo y válvula normal.";
        resultadosDiv.appendChild(bajada1);

        document.getElementById('copyButton').style.display = 'block';
        document.getElementById('copySelectedButton').style.display = 'block';
    } else {
        const resultadoElemento = document.createElement('p');
        resultadoElemento.classList.add('alert', 'alert-warning');
        resultadoElemento.textContent = `No se encontraron neumáticos que contengan la medida "${medidaBuscada}".`;
        resultadosDiv.appendChild(resultadoElemento);

        document.getElementById('copyButton').style.display = 'none';
        document.getElementById('copySelectedButton').style.display = 'none';
    }
}

document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';
    let incluirMensajesInstalacion = false;

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) resultadosTexto += encabezado.innerText + '\n\n';

    const alertElements = resultadosDiv.querySelectorAll('.alert');
    alertElements.forEach(alert => {
        const checkbox = alert.querySelector('.resultado-checkbox');
        if (checkbox && checkbox.dataset.instalacion === 'sí') {
            incluirMensajesInstalacion = true;
        }
        const lines = alert.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    });

    if (incluirMensajesInstalacion) {
        resultadosTexto += "Incluye instalación, balanceo y válvula normal.";
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});

document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';
    let incluirMensajesInstalacion = false;

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) resultadosTexto += encabezado.innerText + '\n\n';

    const checkboxes = resultadosDiv.querySelectorAll('.resultado-checkbox:checked');
    if (checkboxes.length === 0) {
        alert("Selecciona al menos un resultado para copiar.");
        return;
    }

    checkboxes.forEach(checkbox => {
        const resultadoElemento = checkbox.closest('.alert');
        if (checkbox.dataset.instalacion === 'sí') {
            incluirMensajesInstalacion = true;
        }
        const lines = resultadoElemento.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    });

    if (incluirMensajesInstalacion) {
        resultadosTexto += "Incluye instalación, balanceo y válvula normal.";
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});
