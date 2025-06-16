document
  .getElementById("searchButton")
  .addEventListener("click", realizarBusqueda);
document
  .getElementById("medidaInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
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

function cargarArchivoDesdeCSV(medidaBuscada) {
  fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSt2J_fxHoCMq4KhMBR85x4vVO_m8v5SLWo09BP7KJ5cp-SKw_mN2cgxznNnaZWBw/pub?output=csv"
  )
    .then((response) => response.text())
    .then((csvText) => {
      const rows = Papa.parse(csvText, { header: true }).data;
      const variantes = GenerarVariantesMedida(medidaBuscada);
      const resultados = rows.filter((row) =>
        variantes.some(
          (vari) =>
            row["MEDIDA"] &&
            row["MEDIDA"].toUpperCase().includes(vari.toUpperCase())
        )
      );
      mostrarResultados(resultados, medidaBuscada);
    })
    .catch((error) => console.error("Error al cargar los datos:", error));
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

function mostrarResultados(resultados, medidaBuscada) {
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  const encabezado = document.createElement("h3");
  encabezado.textContent = "Estamos en días SAMCOR SALE, tenemos estas ofertas para ti:";
  resultadosDiv.appendChild(encabezado);

  if (resultados.length > 0) {
    resultados.forEach((fila) => {
      const medida = fila["MEDIDA"] || "";
      const marca = fila["MARCA"] || "";
      const modelo = fila["MODELO"] || "";
      const precioUnidad = fila["X1"] || "";
      const precioX2 = fila["X2"] || "";
      const precioX4 = fila["X4"] || "";
      const web = fila["WEB"] || "";
      const categoria = fila["CATEGORIA"] || "";
      const stock = fila["CANTIDAD"] || "";
      const instalacion = fila["INSTALACION"] || "";

      function formatearPrecio(precio) {
        if (!precio) return "";
        return Number(precio).toLocaleString("es-ES");
      }

      const precioUnidadFormateado = formatearPrecio(precioUnidad);
      const precioX2Formateado = formatearPrecio(precioX2);
      const precioX4Formateado = formatearPrecio(precioX4);

      let resultadoTexto = "";
      if (precioUnidad && precioX2 && precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        1 X $${precioUnidadFormateado}<br>
        2 X $${precioX2Formateado}<br>
        4 X $${precioX4Formateado}<br>
        Precio Web: $${formatearPrecio(web)}<br>
        Categoría: ${categoria}<br>`;
        
      } else if (precioUnidad && !precioX2 && precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        1 X $${precioUnidadFormateado}<br>
        4 X $${precioX4Formateado}<br>
        Precio Web: $${formatearPrecio(web)}<br>
        Categoría: ${categoria}<br>`;

      } else if (precioUnidad && precioX2 && !precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        1 X $${precioUnidadFormateado}<br>
        2 X $${precioX2Formateado}<br>
        Precio Web: $${formatearPrecio(web)}<br>
        Categoría: ${categoria}<br>`;

      } else if (precioX2 && precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        2 X $${precioX2Formateado}<br>
        4 X $${precioX4Formateado}<br>
        Precio Web: $${formatearPrecio(web)}<br>
        Categoría: ${categoria}<br>`;

      } else if (!precioUnidad && !precioX2 && precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        Precio: 4 X $${precioX4Formateado}<br>
        Stock: ${stock}<br>       
        PRECIO VALIDO SOLO POR LA COMPRA DE 4 UNIDADES<br>`;

      } else if (!precioUnidad && precioX2 && !precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        Precio: 2 X $${precioX2Formateado}<br>
        Stock: ${stock}<br>
        PRECIO VALIDO SOLO POR LA COMPRA DE 2 UNIDADES<br>`;

      } else if (precioUnidad && !precioX2 && !precioX4) {
        resultadoTexto = `Neumático ${medida} ${marca} ${modelo}<br>
        1 X $${precioUnidadFormateado}<br>
        Precio Web: $${formatearPrecio(web)}<br>
        Categoría: ${categoria}<br>`;
      }

      const resultadoElemento = document.createElement("div");
      resultadoElemento.classList.add("alert", "alert-info");

      const checkbox = document.createElement("input");
      checkbox.dataset.instalacion = (fila["INSTALACION"] || "")
        .toString()
        .trim()
        .toLowerCase();
      checkbox.type = "checkbox";
      checkbox.classList.add("resultado-checkbox");
      checkbox.style.marginRight = "10px";

      resultadoElemento.appendChild(checkbox);
      resultadoElemento.innerHTML += resultadoTexto;

      resultadosDiv.appendChild(resultadoElemento);
    });

    const bajada1 = document.createElement("p");
    bajada1.textContent = "Incluye instalación, balanceo y válvula normal.";
    resultadosDiv.appendChild(bajada1);

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

document.getElementById("copyButton").addEventListener("click", function () {
  const resultadosDiv = document.getElementById("resultados");
  let resultadosTexto = "";
  let incluirMensajesInstalacion = false;

  const encabezado = resultadosDiv.querySelector("h3");
  if (encabezado) resultadosTexto += encabezado.innerText + "\n\n";

  const alertElements = resultadosDiv.querySelectorAll(".alert");
  alertElements.forEach((alert) => {
    const checkbox = alert.querySelector(".resultado-checkbox");
    if (checkbox && checkbox.dataset.instalacion === "sí") {
      incluirMensajesInstalacion = true;
    }
    const lines = alert.innerText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    resultadosTexto += lines.join("\n") + "\n\n";
  });

  if (incluirMensajesInstalacion) {
    resultadosTexto += "Incluye instalación, balanceo y válvula normal.";
  }

  navigator.clipboard.writeText(resultadosTexto.trim());
});

document
  .getElementById("copySelectedButton")
  .addEventListener("click", function () {
    const resultadosDiv = document.getElementById("resultados");
    let resultadosTexto = "";
    let incluirMensajesInstalacion = false;

    const encabezado = resultadosDiv.querySelector("h3");
    if (encabezado) resultadosTexto += encabezado.innerText + "\n\n";

    const checkboxes = resultadosDiv.querySelectorAll(
      ".resultado-checkbox:checked"
    );

    if (checkboxes.length === 0) {
      alert("Selecciona al menos un resultado para copiar.");
      return;
    }

    checkboxes.forEach((checkbox) => {
      const resultadoElemento = checkbox.closest(".alert");
      if (checkbox.dataset.instalacion === "sí") {
        incluirMensajesInstalacion = true;
      }
      const lines = resultadoElemento.innerText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");
      resultadosTexto += lines.join("\n") + "\n\n";
    });

    if (incluirMensajesInstalacion) {
      resultadosTexto += "Incluye instalación, balanceo y válvula normal.";
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
  });
