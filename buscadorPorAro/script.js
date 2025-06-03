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
  cargarArchivo(medidaBuscada);
}

function cargarArchivo(medidaBuscada) {
  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQjAvFAI8WFGT2lFVeotBGNAyOFwFgXGGof1HjmwQqe0SB-1B2zf9SAfmVK3M9bew/pub?gid=500081744&single=true&output=csv";

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

      if (medidaBuscada.length < 2) {
        alert("Por favor, ingresa una medida válida (por ejemplo, '15A' o '15C').");
        return;
      }

      const aro = medidaBuscada.slice(0, -1).trim();
      const tipoLetra = medidaBuscada.slice(-1).toUpperCase();
      const tipoVehiculo =
        tipoLetra === "A" ? "auto" : tipoLetra === "C" ? "camioneta" : null;

      if (!tipoVehiculo) {
        alert("Por favor, termina la medida con 'A' (auto) o 'C' (camioneta).");
        return;
      }

      const jsonData = parsed.data;

      const resultados = jsonData.filter((row) => {
        const aroValido = row["ARO"]?.toString().trim() === aro;
        const tipoValido = row["TIPO VEHICULO"]?.toLowerCase().trim() === tipoVehiculo;
        return aroValido && tipoValido;
      });

      mostrarResultados(resultados, medidaBuscada);
    })
    .catch((error) => {
      console.error("Error al procesar el CSV:", error);
      alert("Hubo un error al cargar los datos.");
    });
}

function mostrarResultados(resultados, medidaBuscada) {
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  const encabezado = document.createElement("h3");
  encabezado.textContent = "Tenemos lo siguiente:";
  resultadosDiv.appendChild(encabezado);

  if (resultados.length > 0) {
    resultados.forEach((fila) => {
      const medida = fila["ARO"] || "";
      const proveedor = fila["PROVEEDOR"] || "";
      const modelos = fila["MODELOS"] || "";
      const tipoVehiculo = fila["TIPO VEHICULO"] || "";
      const facebook = fila["FACEBOOK"] || "";
      const agregado = fila["AGREGADO"] || "NO CONTIENE AGREGADO";
      const web = fila["WEB"] || "";

      let resultadoTexto = `
                Medida: ARO ${medida}<br>
                Proveedor: ${proveedor}<br>
                Modelo: ${modelos}<br>
                Tipo Vehículo: ${tipoVehiculo}<br>
                Precio Market: $${facebook}<br>
                Agregado: ${agregado}<br>
                Precio Web: $${web}<br>
            `;

      // Crear el elemento del resultado
      const resultadoElemento = document.createElement("div");
      resultadoElemento.classList.add("alert", "alert-info");

      // Crear el checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.classList.add("resultado-checkbox");
      checkbox.style.marginRight = "10px";

      // Añadir el checkbox al resultado
      resultadoElemento.appendChild(checkbox);
      resultadoElemento.innerHTML += resultadoTexto;

      // Añadir el resultado a la vista
      resultadosDiv.appendChild(resultadoElemento);
    });

    // Mostrar botones si hay resultados
    document.getElementById("copyButton").style.display = "block";
    document.getElementById("copySelectedButton").style.display = "block";
  } else {
    // Mostrar mensaje si no hay resultados
    const resultadoElemento = document.createElement("p");
    resultadoElemento.classList.add("alert", "alert-warning");
    resultadoElemento.textContent = `No se encontraron llantas de aro "${medidaBuscada}".`;
    resultadosDiv.appendChild(resultadoElemento);

    // Ocultar botones si no hay resultados
    document.getElementById("copyButton").style.display = "none";
    document.getElementById("copySelectedButton").style.display = "none";
  }
}

// Función para formatear precios
function formatearPrecio(precio) {
  if (!precio) return "";
  return parseFloat(precio).toLocaleString("es-ES");
}

// Función para copiar todos los resultados
document.getElementById("copyButton").addEventListener("click", function () {
  const resultadosDiv = document.getElementById("resultados");
  let resultadosTexto = "";

  // Añadir el texto del encabezado
  const encabezado = resultadosDiv.querySelector("h3");
  if (encabezado) {
    resultadosTexto += encabezado.innerText + "\n\n";
  }

  // Recopilar el contenido de los resultados
  resultadosDiv.querySelectorAll(".alert").forEach((alert) => {
    const lines = alert.innerText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
    resultadosTexto += lines.join("\n") + "\n\n";
  });

  navigator.clipboard.writeText(resultadosTexto.trim());
});

// Función para copiar solo los resultados seleccionados
document
  .getElementById("copySelectedButton")
  .addEventListener("click", function () {
    const resultadosDiv = document.getElementById("resultados");
    let resultadosTexto = "";

    // Añadir el texto del encabezado
    const encabezado = resultadosDiv.querySelector("h3");
    if (encabezado) {
      resultadosTexto += encabezado.innerText + "\n\n";
    }

    const checkboxes = resultadosDiv.querySelectorAll(
      ".resultado-checkbox:checked"
    );

    if (checkboxes.length === 0) {
      alert("Selecciona al menos un resultado para copiar.");
      return;
    }

    checkboxes.forEach((checkbox) => {
      const resultadoElemento = checkbox.closest(".alert");
      if (resultadoElemento) {
        const lines = resultadoElemento.innerText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");
        resultadosTexto += lines.join("\n") + "\n\n";
      }
    });

    navigator.clipboard.writeText(resultadosTexto.trim());
  });
