document.getElementById("searchButton").addEventListener("click", realizarBusqueda);

document.getElementById("medidaInput").addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    realizarBusqueda();
  }
});

// Escuchar cambios en el menú desplegable para actualizar automáticamente
document.getElementById("tipoPrecio").addEventListener("change", function() {
  if (document.getElementById("medidaInput").value.trim() !== "") {
    realizarBusqueda();
  }
});

document.getElementById("cleanButton").addEventListener("click", function () {
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
  const medidaBuscada = document.getElementById("medidaInput").value.trim();
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
      `${ancho}/${perfil}R${diametro}`,
      `${ancho}/${perfil}ZR${diametro}`,
      `${ancho}/${perfil}ZRZ${diametro}`,
      `${ancho}/${perfil}RZR${diametro}`,
      `${ancho}/${perfil}R${diametro}C`,
      `${ancho}/${perfil}ZR${diametro}C`,
      `${ancho}/${perfil}ZRF${diametro}`,
      `${ancho}/${perfil}ZRXL${diametro}`,
      `${ancho}/${perfil}ZRF${diametro}C`,
    ];
  }
  if (medida.length === 5) {
    const ancho = medida.substring(0, 3);
    const diametro = medida.substring(3);
    return [
      `${ancho}R${diametro}`,
      `${ancho}R${diametro}C`,
      `${ancho}ZR${diametro}`,
      `${ancho}ZR${diametro}C`,
      `${ancho}ZRF${diametro}`,
    ];
  }
  if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
    return [medida];
  }
  return [medida];
}

function cargarArchivoDesdeCSV(medidaBuscada) {
  const URL_CSV = "files/stock-bodega.csv"; 

  fetch(URL_CSV)
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el CSV: " + response.status);
      }
      return response.text();
    })
    .then((csvText) => {
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = parsed.data;

      const variantes = GenerarVariantesMedida(medidaBuscada);
      
      const resultados = rows.filter((row) =>
        variantes.some(
          (vari) =>
            row["DESCRIPCION"] &&
            row["DESCRIPCION"].toUpperCase().includes(vari.toUpperCase())
        )
      );

      mostrarResultados(resultados, medidaBuscada);
    })
    .catch((error) =>
      console.error("Error al cargar los datos:", error)
    );
}

function mostrarResultados(resultados, medidaBuscada) {
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  const tipoPrecioSelect = document.getElementById("tipoPrecio");
  const columnaPrecio = tipoPrecioSelect.value;

  const encabezado = document.createElement("h3");
  encabezado.textContent = "Tenemos lo siguiente:";
  resultadosDiv.appendChild(encabezado);

  if (resultados.length > 0) {
    resultados.forEach((fila) => {
      const descripcion = fila["DESCRIPCION"] || "";
      const precioUnidad = fila[columnaPrecio] || "";

      function formatearPrecio(precio) {
        if (!precio) return "";
        const precioLimpio = precio.toString().replace(/[^\d]/g, "");
        return Number(precioLimpio).toLocaleString("es-CL");
      }

      const precioUnidadFormateado = formatearPrecio(precioUnidad);
      if (!precioUnidadFormateado) return;

      // Aplicar formato para que la marca Nexen aparezca siempre correctamente escrita
      let descLimpia = descripcion.replace(/\bNEXEN\b/ig, "Nexen");

      // NUEVO FORMATO DE TEXTO (Directo al grano)
      let resultadoTexto = `🔥 ${descLimpia}: *$${precioUnidadFormateado}*`;

      const resultadoElemento = document.createElement("div");
      resultadoElemento.classList.add("alert", "alert-info");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("resultado-checkbox");
      checkbox.style.marginRight = "10px";

      resultadoElemento.appendChild(checkbox);
      resultadoElemento.innerHTML += resultadoTexto;
      resultadosDiv.appendChild(resultadoElemento);
    });

    // NUEVO: CREAR EL TEXTO FINAL (FOOTER) UNA SOLA VEZ
    let textoPromocion = "";
    if (columnaPrecio === "X 4 EFEC") {
        textoPromocion = "Valor por 4 neumáticos. Incluye instalación, balanceo y válvula nueva. Oferta válida con efectivo o transferencia.";
    } else if (columnaPrecio === "X 4 TC") {
        textoPromocion = "Valor por 4 neumáticos. Incluye instalación, balanceo y válvula nueva pagando con Tarjeta de Crédito.";
    } else if (columnaPrecio === "X 2 EFEC") {
        textoPromocion = "Valor por 2 neumáticos. Incluye instalación, balanceo y válvula nueva. Oferta válida con efectivo o transferencia.";
    } else {
        textoPromocion = "Valor unitario (Precio Web). Incluye instalación, balanceo y válvula normal.";
    }

    const footerElemento = document.createElement("p");
    footerElemento.id = "texto-bajadas";
    footerElemento.style.marginTop = "20px";
    footerElemento.style.color = "#ff0000"; // Rojo para que destaque en pantalla
    footerElemento.innerHTML = `<em>${textoPromocion}</em>`;
    
    // Guardamos el texto puro en un atributo oculto para que el botón de copiar lo pueda extraer fácil
    footerElemento.dataset.textoCopia = textoPromocion;
    
    resultadosDiv.appendChild(footerElemento);

    document.getElementById("copyButton").style.display = "block";
    document.getElementById("copySelectedButton").style.display = "block";
  } else {
    const resultadoElemento = document.createElement("p");
    resultadoElemento.classList.add("alert", "alert-warning");
    resultadoElemento.textContent = `No se encontraron neumáticos que contengan la medida "${medidaBuscada}".`;
    resultadosDiv.appendChild(resultadoElemento);

    document.getElementById("copyButton").style.display = "none";
    document.getElementById("copySelectedButton").style.display = "none";
  }
}

// FUNCIONES DE COPIADO ACTUALIZADAS
document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) {
        resultadosTexto += encabezado.innerText + '\n\n';
    }

    const alertElements = resultadosDiv.querySelectorAll('.alert-info');
    alertElements.forEach(alert => {
        const textContent = alert.innerText.trim();
        if (textContent) {
            resultadosTexto += textContent + '\n';
        }
    });

    // Agregar el texto final (bajadas) una sola vez
    const footer = document.getElementById('texto-bajadas');
    if (footer) {
        resultadosTexto += '\n' + footer.dataset.textoCopia;
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});

document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';

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
        const resultadoElemento = checkbox.closest('.alert-info');
        const textContent = resultadoElemento.innerText.trim();
        
        if (textContent) {
            resultadosTexto += textContent + '\n';
        }
    });

    // Agregar el texto final (bajadas) una sola vez, incluso si solo seleccionó uno
    const footer = document.getElementById('texto-bajadas');
    if (footer) {
        resultadosTexto += '\n' + footer.dataset.textoCopia;
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});
