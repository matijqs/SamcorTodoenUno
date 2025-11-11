const searchButton = document.getElementById("searchButton");
const cleanButton = document.getElementById("cleanButton");
const searchInput = document.getElementById("stockInput");
const stockResults = document.getElementById("stockResults");
const tableBody = document.querySelector("#stockTable tbody");

let stockData = [];

// Cargar el Excel
async function loadExcel() {
  try {
    const response = await fetch("files/stock.xlsx");
    if (!response.ok) throw new Error("No se pudo cargar el archivo stock.xlsx");
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    stockData = XLSX.utils.sheet_to_json(sheet);
  } catch (error) {
    console.error("Error al cargar el archivo:", error);
  }
}

// Buscar
function realizarBusqueda() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    alert("Por favor, ingresa un término válido.");
    return;
  }

  const filtered = stockData.filter(row =>
    Object.values(row)
      .join(" ")
      .toLowerCase()
      .includes(term)
  );

  renderTable(filtered);
}

// Mostrar tabla
function renderTable(data) {
  tableBody.innerHTML = "";
  if (data.length === 0) {
    stockResults.style.display = "block";
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-warning">⚠️ No se encontraron resultados.</td></tr>`;
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row["Categoria"] || ""}</td>
      <td>${row["Nombre"] || ""}</td>
      <td>${row["SKU"] || ""}</td>
      <td>${row["Marca"] || ""}</td>
      <td>${row["Modelo"] || ""}</td>
      <td>${row["Disponibilidad en: Bodega 9"] || 0}</td>
      <td>${row["Disponibilidad en: Bodega San Joaquín"] || 0}</td>
    `;
    tableBody.appendChild(tr);
  });

  stockResults.style.display = "block";
}

// Borrar búsqueda
cleanButton.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  stockResults.style.display = "none";
});

// Buscar con botón o Enter
searchButton.addEventListener("click", realizarBusqueda);
searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") realizarBusqueda();
});

// Cargar al iniciar
loadExcel();

