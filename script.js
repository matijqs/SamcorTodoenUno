// Esto asegura que se muestre Neumáticos Web por defecto
window.onload = () => {
  openTab("webprecios");
};

function toggleSubmenu(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === "flex" ? "none" : "flex";
}

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("show");
}

function openTab(tabId) {
  // Oculta todas las pestañas
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // Busca la pestaña que queremos abrir
  const selectedTab = document.getElementById(tabId);
  
  // Si la pestaña existe, le agrega la clase active
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Cierra el menú después de hacer clic
  const menu = document.getElementById("menu");
  if (menu) {
    menu.classList.remove("show");
  }
}

// Opcional: cerrar menú si se hace clic fuera
window.addEventListener("click", function (e) {
  const menu = document.getElementById("menu");
  const hamburger = document.querySelector(".hamburger");

  // Si el clic NO es dentro del menú NI del botón hamburguesa
  if (menu && hamburger && !menu.contains(e.target) && !hamburger.contains(e.target)) {
    menu.classList.remove("show");
  }
});
