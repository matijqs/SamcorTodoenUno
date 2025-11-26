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

function cargarArchivoDesdeCSV(medidaBuscada) {
    const URL_CSV = "files/LISTA DE PRECIOS MARKET.csv";

    fetch(URL_CSV)
        .then(response => {
            if (!response.ok) throw new Error("Error cargando CSV");
            return response.text();
        })
        .then(csvText => {
            const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
            const rows = parsed.data;

            const variantes = GenerarVariantesMedida(medidaBuscada);

            const resultados = rows.filter(row =>
                variantes.some(v =>
                    row["MEDIDA"] &&
                    row["MEDIDA"].toUpperCase().includes(v.toUpperCase())
                )
            );

            mostrarResultados(resultados, medidaBuscada);
        })
        .catch(error => console.error("Error CSV:", error));
}

function GenerarVariantesMedida(medida) {
    medida = medida.toString().trim();

    if (medida.length === 7) {
        const a = medida.substring(0, 3);
        const b = medida.substring(3, 5);
        const c = medida.substring(5);
        return [
            `${a}/${b}R${c}`, `${a}/${b}ZR${c}`,
            `${a}/${b}ZRZ${c}`, `${a}/${b}RZR${c}`,
            `${a}/${b}R${c}C`, `${a}/${b}ZR${c}C`,
            `${a}/${b}ZRF${c}`, `${a}/${b}ZRXL${c}`,
            `${a}/${b}ZRF${c}C`
        ];
    }

    if (medida.length === 5) {
        const a = medida.substring(0, 3);
        const c = medida.substring(3);
        return [
            `${a}R${c}`, `${a}R${c}C`,
            `${a}ZR${c}`, `${a}ZR${c}C`,
            `${a}ZRF${c}`
        ];
    }

    if (medida.includes("/") || medida.includes("R") || medida.includes("Z")) {
        return [medida];
    }

    return [medida];
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

            function format(p) { return p ? p.toLocaleString('es-ES') : ''; }

            let resultadoTexto = `
                Neumático ${medida} ${marca} ${modelo}<br>
            `;

            if (precioUnidad) resultadoTexto += `1 X $${format(precioUnidad)}<br>`;
            if (precioX2) resultadoTexto += `2 X $${format(precioX2)}<br>`;
            if (precioX4) resultadoTexto += `4 X $${format(precioX4)}<br>`;

            // PROMO
            const promo = (fila["PROMO"] || '').trim().toUpperCase();
            if (promo !== '') {
                resultadoTexto += `<strong style="color:red;">🔥 ${promo}</strong><br>`;
            }

            const box = document.createElement('div');
            box.classList.add('alert', 'alert-info');

            const check = document.createElement('input');
            check.type = "checkbox";
            check.classList.add("resultado-checkbox");
            check.dataset.instalacion = (fila["INSTALACION"] || "").toLowerCase().trim();
            check.style.marginRight = "10px";

            box.appendChild(check);

            // FIX — evita borrar el checkbox
            box.insertAdjacentHTML("beforeend", resultadoTexto);

            resultadosDiv.appendChild(box);
        });

        const bajada1 = document.createElement('p');
        bajada1.textContent = "Incluye instalación, balanceo y válvula normal.";
        resultadosDiv.appendChild(bajada1);

        document.getElementById('copyButton').style.display = 'block';
        document.getElementById('copySelectedButton').style.display = 'block';

    } else {
        const noRes = document.createElement('p');
        noRes.classList.add('alert', 'alert-warning');
        noRes.textContent = `No se encontraron neumáticos que contengan "${medidaBuscada}".`;
        resultadosDiv.appendChild(noRes);

        document.getElementById('copyButton').style.display = 'none';
        document.getElementById('copySelectedButton').style.display = 'none';
    }
}

document.getElementById('copyButton').addEventListener('click', function () {
    const resultadosDiv = document.getElementById('resultados');
    let txt = '';
    let incluir = false;

    const bajada1 = "Incluye instalación, balanceo y válvula normal.";

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) txt += encabezado.innerText + "\n\n";

    resultadosDiv.querySelectorAll('.alert').forEach(alert => {
        const checkbox = alert.querySelector('.resultado-checkbox');
        if (checkbox && checkbox.dataset.instalacion === 'sí') incluir = true;

        const lines = alert.innerText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l !== '');

        txt += lines.join("\n") + "\n\n";
    });

    if (incluir) txt += bajada1 + "\n\n";

    navigator.clipboard.writeText(txt.trim());
});

document.getElementById('copySelectedButton').addEventListener('click', function () {
    const resultadosDiv = document.getElementById('resultados');
    let txt = '';
    let incluir = false;

    const bajada1 = "Incluye instalación, balanceo y válvula normal.";

    const encabezado = resultadosDiv.querySelector('h3');
    if (encabezado) txt += encabezado.innerText + "\n\n";

    const seleccionados = resultadosDiv.querySelectorAll('.resultado-checkbox:checked');

    if (seleccionados.length === 0) {
        alert("Selecciona al menos un resultado para copiar.");
        return;
    }

    seleccionados.forEach(check => {
        const box = check.closest('.alert');
        if (check.dataset.instalacion === 'sí') incluir = true;

        const lines = box.innerText
            .split('\n')
            .map(l => l.trim())
            .filter(l => l !== '');

        txt += lines.join("\n") + "\n\n";
    });

    if (incluir) txt += bajada1 + "\n\n";

    navigator.clipboard.writeText(txt.trim());
});

