function calcularDiametro(ancho, perfil, aro) {
    return (2 * (ancho * (perfil / 100))) + (aro * 25.4);
}

function calcularPorcentajeDiferencia(diametroOriginal, nuevoDiametro) {
    return Math.abs((nuevoDiametro - diametroOriginal) / diametroOriginal) * 100;
}

function generarSugerencias(ancho, perfil, aro) {
    let diametroOriginal = calcularDiametro(ancho, perfil, aro);
    let sugerencia1 = null;
    let sugerencia2 = null;

    for (let ajuste of [10, -10]) {
        let nuevoAncho = ancho + ajuste;
        let nuevoPerfil = perfil + ajuste;
        let nuevoDiametro = calcularDiametro(nuevoAncho, perfil, aro);
        let porcentajeDiferencia = calcularPorcentajeDiferencia(diametroOriginal, nuevoDiametro);
        
        if (porcentajeDiferencia <= 3.1) {
            if (!sugerencia1) {
                sugerencia1 = `${nuevoAncho}/${perfil}/${aro}`;
            } else {
                sugerencia2 = `${nuevoAncho}/${perfil}/${aro}`;
                break;
            }
        }
        
        nuevoDiametro = calcularDiametro(ancho, nuevoPerfil, aro);
        porcentajeDiferencia = calcularPorcentajeDiferencia(diametroOriginal, nuevoDiametro);
        
        if (porcentajeDiferencia <= 3.1) {
            if (!sugerencia1) {
                sugerencia1 = `${ancho}/${nuevoPerfil}/${aro}`;
            } else {
                sugerencia2 = `${ancho}/${nuevoPerfil}/${aro}`;
                break;
            }
        }
    }

    document.getElementById("sugerencia1").innerText = sugerencia1 ? `Opción 1: ${sugerencia1}` : "No hay sugerencias dentro del rango";
    document.getElementById("sugerencia2").innerText = sugerencia2 ? `Opción 2: ${sugerencia2}` : "";
}

function validarValores(ancho, perfil, aro) {
    // Verificar si los valores son numéricos y mayores que 0
    if (isNaN(ancho) || isNaN(perfil) || isNaN(aro)) {
        return false;
    }
    if (ancho <= 0 || perfil <= 0 || aro <= 0) {
        return false;
    }

    // Verificar que el ancho sea múltiplo de 10 y el perfil múltiplo de 5
    if (perfil % 5 !== 0) {
        return false;
    }

    return true;
}

function compararNeumaticos() {
    let ancho1 = parseFloat(document.getElementById("ancho1").value);
    let perfil1 = parseFloat(document.getElementById("perfil1").value);
    let aro1 = parseFloat(document.getElementById("aro1").value);
    
    let ancho2 = parseFloat(document.getElementById("ancho2").value);
    let perfil2 = parseFloat(document.getElementById("perfil2").value);
    let aro2 = parseFloat(document.getElementById("aro2").value);
    
    // Validación de valores
    if (!validarValores(ancho1, perfil1, aro1) || !validarValores(ancho2, perfil2, aro2)) {
        alert("Por favor, ingrese valores válidos en todos los campos (el perfil debe ser múltiplo de 5).");
        return;
    }

    let diametro1 = calcularDiametro(ancho1, perfil1, aro1);
    let diametro2 = calcularDiametro(ancho2, perfil2, aro2);
    
    let diferencia = Math.abs(diametro1 - diametro2);
    let porcentajeDiferencia = (diferencia / diametro1) * 100;
    
    document.getElementById("resultadon1").innerHTML = `El diametro total del neumático 1 es: ${diametro1}mm`;
    document.getElementById("resultadon2").innerHTML = `El diametro total del neumático 2 es: ${diametro2}mm`;

    let resultado = document.getElementById("resultado");
    if (porcentajeDiferencia <= 3.1) {
        resultado.innerHTML = `Los neumáticos son compatibles. Diferencia: ${porcentajeDiferencia.toFixed(2)}%`;
        resultado.style.color = "green";
    } else {
        resultado.innerHTML = `Los neumáticos NO son compatibles. Diferencia: ${porcentajeDiferencia.toFixed(2)}%`;
        resultado.style.color = "red";
    }
    
    generarSugerencias(ancho1, perfil1, aro1);
}
