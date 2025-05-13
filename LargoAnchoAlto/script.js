// Listas de valores para ancho, perfil y aro
const anchos = [175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305];
const perfiles = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
const aros = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function llenarSelect(id, valores) {
    let select = document.getElementById(id);
    valores.forEach(valor => {
        let option = document.createElement("option");
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
}

// Llenar los select con valores al cargar la página
window.onload = function() {
    llenarSelect("ancho", anchos);
    llenarSelect("perfil", perfiles);
    llenarSelect("aro", aros);
};

function calcular() {
    let ancho = parseInt(document.getElementById("ancho").value);
    let perfil = parseInt(document.getElementById("perfil").value);
    let aro = parseInt(document.getElementById("aro").value);
    let cantidad = parseInt(document.getElementById("cantidad").value);
    let resultadoDiv = document.getElementById("resultado");

    let alturaCostado = (ancho * perfil) / 100; // Altura del perfil
    let diametroRin = aro * 25.4; // Convertir pulgadas a mm
    let diametroTotal = diametroRin + (2 * alturaCostado); // En mm
    let diametroTotalCm = (diametroTotal / 10).toFixed(1); // Convertir a cm

    let alturaAcostado = (ancho / 10).toFixed(1); // Convertir ancho a cm
    let alturaPila = (cantidad * alturaAcostado).toFixed(1); // Altura total según cantidad

    resultadoDiv.innerHTML = `
        <div class="alert alert-info">
            <p><strong>Largo:</strong> ${diametroTotalCm} cm</p>
            <p><strong>Ancho:</strong> ${diametroTotalCm} cm</p>
            <p><strong>Alto:</strong> ${alturaPila} cm</p>
        </div>
    `;
}
