function openTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((el) => (el.style.display = "none"));

  const selected = document.getElementById(tabId);
  if (selected) selected.style.display = "block";
}

// Esto asegura que se muestre por defecto si no usas inline style en el div
window.onload = () => {
  openTab("porMedida");
};

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");
}

function openTab(tabId) {
  // Oculta todas las pestañas
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");

  // Cierra el menú después de hacer clic
  document.getElementById("menu").classList.remove("show");
}

// Opcional: cerrar menú si se hace clic fuera
window.addEventListener("click", function (e) {
  const menu = document.getElementById("menu");
  const hamburger = document.querySelector(".hamburger");

  // Si el clic NO es dentro del menú NI del botón hamburguesa
  if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.classList.remove("show");
  }
});
