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
  input.value = ""; // Limpia el input
  input.focus(); // Hace focus en el input
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
  cargarUbicaciones(medidaBuscada);
}

function cargarUbicaciones(medidaBuscada) {
  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8e8rG-dbXPudPU9BJZ1Hbd59BZYmD2bmlEuS_X6ib_pEG-R9p7LVnMAlXwWcI3Q/pub?gid=1044172382&single=true&output=csv"; // Reemplaza con tu URL pública CSV

  fetch(csvUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error al cargar el archivo CSV: ${response.statusText}`
        );
      }
      return response.text();
    })
    .then((csvText) => {
      const parsed = Papa.parse(csvText, { header: true });
      const data = parsed.data.filter((row) => row["Medida"]); // <- evita filas vacías

      const variantes = GenerarVariantesMedida(medidaBuscada);

      const resultados = data.filter((row) =>
        variantes.some((vari) =>
          row["Medida"].toString().toUpperCase().includes(vari.toUpperCase())
        )
      );

      mostrarUbicaciones(resultados, medidaBuscada);
    })

    .catch((error) => {
      console.error("Error al procesar CSV:", error);
      alert("Hubo un error al cargar los datos.");
    });
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

function mostrarUbicaciones(resultados, medidaBuscada) {
  const ubicacionesDiv = document.getElementById("ubicaciones");
  ubicacionesDiv.innerHTML = "";

  const encabezado = document.createElement("h3");
  encabezado.textContent = "Ubicaciones encontradas:";
  ubicacionesDiv.appendChild(encabezado);

  if (resultados.length > 0) {
    resultados.forEach((fila) => {
      const medida = fila["Medida"] || "";
      const marca = fila["Marca"] || "";
      const modelo = fila["Modelo"] || "";
      const ubicacion1 = fila["Bodega 9"] || "No Determinada";
      const ubicacion2 = fila["Bodega SJ"] || "No Determinada";

      const resultadoTexto = `
                Medida: ${medida}<br>
                Marca: ${marca}<br>
                Modelo: ${modelo}<br>
                Ubicación Bodega 9: ${ubicacion1}<br>
                Ubicación Bodega SJ: ${ubicacion2}<br>`;

      const resultadoElemento = document.createElement("div");
      resultadoElemento.classList.add("alert", "alert-success");
      resultadoElemento.innerHTML = resultadoTexto;

      ubicacionesDiv.appendChild(resultadoElemento);
    });
  } else {
    const mensaje = document.createElement("p");
    mensaje.classList.add("alert", "alert-warning");
    mensaje.textContent = `No se encontraron ubicaciones que contengan la medida "${medidaBuscada}".`;
    ubicacionesDiv.appendChild(mensaje);
  }
}
