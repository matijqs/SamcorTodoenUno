// ... (código anterior sin cambios) ...

function mostrarResultados(resultados, medidaBuscada) {
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "";

  const encabezado = document.createElement("h3");
  encabezado.textContent = "Tenemos lo siguiente:";
  resultadosDiv.appendChild(encabezado);

  if (resultados.length > 0) {
    resultados.forEach((fila) => {
      const medida = fila["MEDIDA"] || "";
      const marca = fila["MARCA"] || "";
      const modelo = fila["MODELO"] || "";
      const precioUnidad = fila["WEB"] || "";

      function formatearPrecio(precio) {
        if (!precio) return "";
        return Number(precio).toLocaleString("es-ES");
      }

      const precioUnidadFormateado = formatearPrecio(precioUnidad);

      let resultadoTexto = "";

      resultadoTexto = `Neumático ${medida} ${marca} ${modelo}. Valor Unitario: $${precioUnidad} <br>`;

      const promo = (fila["PROMO"] || "").trim();

      if (promo !== "") {
        resultadoTexto += `<strong style="color: red;">🔥 ${promo}</strong><br>`;
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

    // NUEVO: Agregando el mensaje de Precios Black en pantalla
    const bajada2 = document.createElement("p");
    bajada2.textContent = "Precios Black válidos solo comprando 4 unidades.";
    // Opcional: puedes darle algún estilo, por ejemplo ponerlo en negrita:
    // bajada2.style.fontWeight = "bold"; 
    resultadosDiv.appendChild(bajada2);

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

document.getElementById('copyButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';
    let incluirMensajesInstalacion = false;

    const bajada1 = "Incluye instalación, balanceo y válvula normal.";
    // NUEVO: Agregando la variable para el texto a copiar
    const bajada2 = "Precios Black válidos solo comprando 4 unidades.";

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) {
        resultadosTexto += encabezado.innerText + '\n\n';
    }

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
        // NUEVO: Concatenando ambos mensajes al copiar
        resultadosTexto += bajada1 + "\n" + bajada2 + "\n\n";
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});

document.getElementById('copySelectedButton').addEventListener('click', function() {
    const resultadosDiv = document.getElementById('resultados');
    let resultadosTexto = '';
    let incluirMensajesInstalacion = false;

    const bajada1 = "Incluye instalación, balanceo y válvula normal.";
    // NUEVO: Agregando la variable para el texto a copiar
    const bajada2 = "Precios Black válidos solo comprando 4 unidades.";

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
        if (checkbox.dataset.instalacion === 'sí') {
            incluirMensajesInstalacion = true;
        }

        const lines = resultadoElemento.innerText.split('\n').map(line => line.trim()).filter(line => line !== '');
        resultadosTexto += lines.join('\n') + '\n\n';
    });

    if (incluirMensajesInstalacion) {
        // NUEVO: Concatenando ambos mensajes al copiar
        resultadosTexto += bajada1 + "\n" + bajada2 + "\n\n";
    }

    navigator.clipboard.writeText(resultadosTexto.trim());
});
