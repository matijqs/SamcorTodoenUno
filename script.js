function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(el => el.style.display = 'none');
  
    const selected = document.getElementById(tabId);
    if (selected) selected.style.display = 'block';
    
  }
  
  // Esto asegura que se muestre por defecto si no usas inline style en el div
  window.onload = () => {
    openTab('porMedida');
  };