// script.js

// 1. MATRICES DE TARIFAS (Los precios de Ecoex y TVP)
const tarifasTransporte = {
    ecoex: {
        rancagua: { tramos: [{ max: 10, precio: 11200 }, { max: 20, precio: 12800 }, { max: 30, precio: 14100 }, { max: 40, precio: 15600 }, { max: 50, precio: 17100 }, { max: 60, precio: 18600 }, { max: 70, precio: 20000 }, { max: 80, precio: 21500 }, { max: 90, precio: 23000 }, { max: 100, precio: 24500 }], kiloExtra: 185 },
        talca: { tramos: [{ max: 10, precio: 4800 }, { max: 20, precio: 6300 }, { max: 30, precio: 7600 }, { max: 40, precio: 11300 }, { max: 50, precio: 12800 }, { max: 60, precio: 14100 }, { max: 70, precio: 15500 }, { max: 80, precio: 17000 }, { max: 90, precio: 18400 }, { max: 100, precio: 19700 }], kiloExtra: 191 },
        chillan: { tramos: [ { max: 10, precio: 7200 }, { max: 20, precio: 10500 }, { max: 30, precio: 14100 }, { max: 40, precio: 18300 }, { max: 50, precio: 20600 }, { max: 60, precio: 22800 }, { max: 70, precio: 24500 }, { max: 80, precio: 27400 }, { max: 90, precio: 29000 }, { max: 100, precio: 30800 } ], kiloExtra: 228 },
        temuco: { tramos: [ { max: 10, precio: 8000 }, { max: 20, precio: 13500 }, { max: 30, precio: 15800 }, { max: 40, precio: 18900 }, { max: 50, precio: 22000 }, { max: 60, precio: 25100 }, { max: 70, precio: 29000 }, { max: 80, precio: 31400 }, { max: 90, precio: 34500 }, { max: 100, precio: 37500 } ], kiloExtra: 236 },
        valdivia: { tramos: [ { max: 10, precio: 9600 }, { max: 20, precio: 15200 }, { max: 30, precio: 17300 }, { max: 40, precio: 20600 }, { max: 50, precio: 23600 }, { max: 60, precio: 26700 }, { max: 70, precio: 31400 }, { max: 80, precio: 34500 }, { max: 90, precio: 37600 }, { max: 100, precio: 39200 } ], kiloExtra: 243 },
        villarrica: { tramos: [ { max: 10, precio: 11100 }, { max: 20, precio: 17300 }, { max: 30, precio: 20600 }, { max: 40, precio: 23600 }, { max: 50, precio: 25800 }, { max: 60, precio: 29000 }, { max: 70, precio: 33800 }, { max: 80, precio: 37500 }, { max: 90, precio: 39900 }, { max: 100, precio: 41600 } ], kiloExtra: 258 },
        futrono: { tramos: [ { max: 10, precio: 11800 }, { max: 20, precio: 19600 }, { max: 30, precio: 22800 }, { max: 40, precio: 25700 }, { max: 50, precio: 27400 }, { max: 60, precio: 29900 }, { max: 70, precio: 34500 }, { max: 80, precio: 39200 }, { max: 90, precio: 41600 }, { max: 100, precio: 42400 } ], kiloExtra: 267 },
        calbuco: { tramos: [ { max: 10, precio: 13500 }, { max: 20, precio: 20600 }, { max: 30, precio: 23600 }, { max: 40, precio: 26700 }, { max: 50, precio: 28400 }, { max: 60, precio: 31400 }, { max: 70, precio: 36000 }, { max: 80, precio: 40600 }, { max: 90, precio: 42400 }, { max: 100, precio: 43800 } ], kiloExtra: 274 },
        castro_oficina: { tramos: [ { max: 10, precio: 7500 }, { max: 20, precio: 20300 }, { max: 30, precio: 23600 }, { max: 40, precio: 26400 }, { max: 50, precio: 29900 }, { max: 60, precio: 32700 }, { max: 70, precio: 34700 }, { max: 80, precio: 37700 }, { max: 90, precio: 40600 }, { max: 100, precio: 43400 } ], kiloExtra: 375 },
        castro_domicilio: { tramos: [ { max: 10, precio: 20700 }, { max: 20, precio: 26400 }, { max: 30, precio: 30500 }, { max: 40, precio: 34200 }, { max: 50, precio: 38900 }, { max: 60, precio: 42500 }, { max: 70, precio: 45000 }, { max: 80, precio: 49000 }, { max: 90, precio: 52800 }, { max: 100, precio: 56300 } ], kiloExtra: 375 },
        chonchi: { tramos: [ { max: 10, precio: 23000 }, { max: 20, precio: 29300 }, { max: 30, precio: 33900 }, { max: 40, precio: 36800 }, { max: 50, precio: 42900 }, { max: 60, precio: 45500 }, { max: 70, precio: 50000 }, { max: 80, precio: 53100 }, { max: 90, precio: 59200 }, { max: 100, precio: 61600 } ], kiloExtra: 395 }
    },
    tvp: {
        zona_0: { tramosFijos: [ { max: 20, precio: 6000 }, { max: 30, precio: 7200 } ], tramosKilo: [ { max: 120, precioKilo: 240 }, { max: 150, precioKilo: 231 }, { max: 180, precioKilo: 222 }, { max: 210, precioKilo: 216 }, { max: 240, precioKilo: 208 }, { max: 270, precioKilo: 200 }, { max: 500, precioKilo: 192 }, { max: 600, precioKilo: 184 }, { max: 700, precioKilo: 176 }, { max: 800, precioKilo: 170 }, { max: 900, precioKilo: 168 }, { max: 1000, precioKilo: 163 }, { max: 2000, precioKilo: 126 }, { max: 99999, precioKilo: 110 } ] },
        zona_1: { tramosFijos: [ { max: 20, precio: 7200 }, { max: 30, precio: 8400 } ], tramosKilo: [ { max: 120, precioKilo: 280 }, { max: 150, precioKilo: 270 }, { max: 180, precioKilo: 264 }, { max: 210, precioKilo: 252 }, { max: 240, precioKilo: 240 }, { max: 270, precioKilo: 228 }, { max: 500, precioKilo: 216 }, { max: 600, precioKilo: 205 }, { max: 700, precioKilo: 197 }, { max: 800, precioKilo: 192 }, { max: 900, precioKilo: 190 }, { max: 1000, precioKilo: 188 }, { max: 2000, precioKilo: 151 }, { max: 99999, precioKilo: 130 } ] },
        zona_2: { tramosFijos: [ { max: 20, precio: 7800 }, { max: 30, precio: 9000 } ], tramosKilo: [ { max: 120, precioKilo: 300 }, { max: 150, precioKilo: 290 }, { max: 180, precioKilo: 280 }, { max: 210, precioKilo: 270 }, { max: 240, precioKilo: 260 }, { max: 270, precioKilo: 250 }, { max: 500, precioKilo: 240 }, { max: 600, precioKilo: 230 }, { max: 700, precioKilo: 220 }, { max: 800, precioKilo: 210 }, { max: 900, precioKilo: 200 }, { max: 1000, precioKilo: 200 }, { max: 2000, precioKilo: 163 }, { max: 99999, precioKilo: 140 } ] },
        zona_3: { tramosFijos: [ { max: 20, precio: 8400 }, { max: 30, precio: 9600 } ], tramosKilo: [ { max: 120, precioKilo: 320 }, { max: 150, precioKilo: 310 }, { max: 180, precioKilo: 300 }, { max: 210, precioKilo: 291 }, { max: 240, precioKilo: 282 }, { max: 270, precioKilo: 273 }, { max: 500, precioKilo: 264 }, { max: 600, precioKilo: 258 }, { max: 700, precioKilo: 232 }, { max: 800, precioKilo: 218 }, { max: 900, precioKilo: 204 }, { max: 1000, precioKilo: 190 }, { max: 2000, precioKilo: 176 }, { max: 99999, precioKilo: 150 } ] },
        zona_4: { tramosFijos: [ { max: 20, precio: 9600 }, { max: 30, precio: 10800 } ], tramosKilo: [ { max: 120, precioKilo: 360 }, { max: 150, precioKilo: 348 }, { max: 180, precioKilo: 336 }, { max: 210, precioKilo: 324 }, { max: 240, precioKilo: 312 }, { max: 270, precioKilo: 300 }, { max: 500, precioKilo: 288 }, { max: 600, precioKilo: 270 }, { max: 700, precioKilo: 260 }, { max: 800, precioKilo: 245 }, { max: 900, precioKilo: 230 }, { max: 1000, precioKilo: 215 }, { max: 2000, precioKilo: 200 }, { max: 99999, precioKilo: 170 } ] }
    }
};

// 2. DICCIONARIO MAESTRO DE COBERTURA Y RENDERIZADO
// Si una agencia dice "null", esa opción no se dibujará en pantalla.
const estructuraZonas = [
    {
        grupo: "Norte Chico",
        zonas: [ { id: "coquimbo", texto: "La Serena / Coquimbo / Ovalle", ecoex: null, tvp: 'zona_2' } ]
    },
    {
        grupo: "Región Metropolitana",
        zonas: [
            { id: "santiago_centro", texto: "Santiago (Dentro Vespucio)", ecoex: null, tvp: 'zona_0' },
            { id: "santiago_periferia", texto: "Santiago (Periferia y Provincias)", ecoex: null, tvp: 'zona_1' }
        ]
    },
    {
        grupo: "Valparaíso",
        zonas: [
            { id: "valparaiso_vina", texto: "Valparaíso / Viña / Quilpué / V. Alemana", ecoex: null, tvp: 'zona_1' },
            { id: "san_antonio", texto: "San Antonio / Litoral Central / Melipilla", ecoex: null, tvp: 'zona_2' }
        ]
    },
    {
        grupo: "O'Higgins y Maule",
        zonas: [
            { id: "rancagua", texto: "Rancagua / San Fernando / Santa Cruz", ecoex: 'rancagua', tvp: 'zona_1' },
            { id: "talca", texto: "Curicó / Talca / Linares / Cauquenes", ecoex: 'talca', tvp: 'zona_1' }
        ]
    },
    {
        grupo: "Ñuble y Biobío",
        zonas: [
            { id: "chillan", texto: "Chillán / San Carlos (Ñuble)", ecoex: 'chillan', tvp: 'zona_2' },
            { id: "concepcion", texto: "Concepción / Talcahuano / Coronel", ecoex: 'chillan', tvp: 'zona_2' },
            { id: "los_angeles", texto: "Los Ángeles / Angol / Laja / Cañete", ecoex: 'chillan', tvp: 'zona_2' }
        ]
    },
    {
        grupo: "Araucanía y Los Ríos",
        zonas: [
            { id: "temuco", texto: "Temuco / Victoria / Lautaro", ecoex: 'temuco', tvp: 'zona_3' },
            { id: "villarrica", texto: "Villarrica / Pucón / Loncoche", ecoex: 'villarrica', tvp: 'zona_3' },
            { id: "valdivia", texto: "Valdivia / Panguipulli / Mariquina", ecoex: 'valdivia', tvp: 'zona_3' },
            { id: "la_union", texto: "La Unión / Río Bueno / Paillaco", ecoex: 'villarrica', tvp: 'zona_3' }
        ]
    },
    {
        grupo: "Los Lagos (Continente)",
        zonas: [
            { id: "osorno", texto: "Osorno / Purranque / Pto. Octay", ecoex: 'futrono', tvp: 'zona_4' },
            { id: "puerto_montt", texto: "Puerto Montt / Pto. Varas / Frutillar", ecoex: 'futrono', tvp: 'zona_4' },
            { id: "calbuco", texto: "Calbuco", ecoex: 'calbuco', tvp: 'zona_4' }
        ]
    },
    {
        grupo: "Chiloé",
        zonas: [
            { id: "castro_oficina", texto: "Castro / Ancud / Dalcahue (Oficina)", ecoex: 'castro_oficina', tvp: 'zona_4' },
            { id: "castro_domicilio", texto: "Castro / Ancud / Dalcahue (Domicilio)", ecoex: 'castro_domicilio', tvp: 'zona_4' },
            { id: "chonchi", texto: "Chonchi / Quellón", ecoex: 'chonchi', tvp: 'zona_4' }
        ]
    }
];


// 3. FUNCIÓN MAGICA: Pinta y oculta zonas según la agencia seleccionada
function poblarZonas() {
    const agenciaSeleccionada = document.getElementById('agencia').value;
    const selectZona = document.getElementById('zona');
    const zonaAnterior = selectZona.value; // Guardar lo que el usuario tenía elegido

    // Vaciar todo el selector
    selectZona.innerHTML = '';
    let laZonaSigueDisponible = false;

    // Recorrer el diccionario maestro
    estructuraZonas.forEach(grupo => {
        // Filtrar las zonas de este grupo que SÍ cubre la agencia elegida
        const zonasValidas = grupo.zonas.filter(zona => zona[agenciaSeleccionada] !== null);

        if (zonasValidas.length > 0) {
            // Crear el OptGroup (ej: "Valparaíso")
            const optgroup = document.createElement('optgroup');
            optgroup.label = grupo.grupo;

            zonasValidas.forEach(zona => {
                // Crear la Opción (ej: "San Antonio / Litoral Central")
                const option = document.createElement('option');
                option.value = zona.id;
                option.textContent = zona.texto;
                optgroup.appendChild(option);

                // Verificar si la zona que estaba puesta antes, sobrevive con esta nueva agencia
                if (zona.id === zonaAnterior) {
                    laZonaSigueDisponible = true;
                }
            });

            selectZona.appendChild(optgroup);
        }
    });

    // Si la zona que estaba puesta ya no existe (ej: Estaba en La Serena con TVP y lo cambió a Ecoex),
    // el sistema salta automáticamente a la primera ciudad de la lista para evitar errores.
    if (!laZonaSigueDisponible && selectZona.options.length > 0) {
        selectZona.selectedIndex = 0;
    }

    // Forzar el recálculo con los datos frescos
    calcularCotizacion();
}


// 4. EL MOTOR DE CÁLCULO
function calcularCotizacion() {
    const agenciaSeleccionada = document.getElementById('agencia').value;
    const destinoSeleccionado = document.getElementById('zona').value;
    
    // Si por algún motivo no hay destino, abortamos para no dar error
    if (!destinoSeleccionado) return;

    const ancho = parseFloat(document.getElementById('ancho').value) || 0;
    const perfil = parseFloat(document.getElementById('perfil').value) || 0;
    const aro = parseFloat(document.getElementById('aro').value) || 0;
    const pesoFisicoUni = parseFloat(document.getElementById('pesoFisico').value) || 0;
    const cantidad = parseInt(document.getElementById('cantidad').value) || 0;

    // Cálculo Volumétrico
    const diametroCm = (aro * 2.54) + (2 * (ancho * (perfil / 100) / 10));
    const anchoCm = ancho / 10;
    const volumenUnidad = (diametroCm * diametroCm * anchoCm) / 4000; 
    
    const pesoVolumetricoTotal = volumenUnidad * cantidad;
    const pesoFisicoTotal = pesoFisicoUni * cantidad;
    const pesoFacturable = Math.max(pesoVolumetricoTotal, pesoFisicoTotal);

    // Buscar el identificador tarifario cruzando estructuraZonas
    let tarifaInternaDeZona = null;
    for (let grupo of estructuraZonas) {
        let zonaEncontrada = grupo.zonas.find(z => z.id === destinoSeleccionado);
        if (zonaEncontrada) {
            tarifaInternaDeZona = zonaEncontrada[agenciaSeleccionada];
            break;
        }
    }

    let precioFinal = 0;
    const tarifaAgencia = tarifasTransporte[agenciaSeleccionada][tarifaInternaDeZona];

    // CÁLCULOS
    if (agenciaSeleccionada === 'ecoex') {
        if (pesoFacturable > 100) {
            precioFinal = pesoFacturable * tarifaAgencia.kiloExtra;
        } else {
            for (let tramo of tarifaAgencia.tramos) {
                if (pesoFacturable <= tramo.max) {
                    precioFinal = tramo.precio;
                    break;
                }
            }
        }
    } else if (agenciaSeleccionada === 'tvp') {
        if (pesoFacturable <= 30) {
            for (let tramo of tarifaAgencia.tramosFijos) {
                if (pesoFacturable <= tramo.max) {
                    precioFinal = tramo.precio;
                    break;
                }
            }
        } else {
            for (let tramo of tarifaAgencia.tramosKilo) {
                if (pesoFacturable <= tramo.max) {
                    precioFinal = pesoFacturable * tramo.precioKilo;
                    break;
                }
            }
        }
    }

    // PINTAR RESULTADOS
    document.getElementById('resFisico').innerText = pesoFisicoTotal.toFixed(1) + ' kg';
    document.getElementById('resVolumetrico').innerText = pesoVolumetricoTotal.toFixed(1) + ' kg';
    document.getElementById('resFacturable').innerText = pesoFacturable.toFixed(1) + ' kg';
    
    const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(precioFinal));
    
    document.getElementById('labelCosto').innerText = `Costo Final ${agenciaSeleccionada.toUpperCase()} (IVA inc.)`;
    document.getElementById('resPrecio').innerText = formatoCLP;
}

// 5. INICIADOR
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios en la agencia para repintar las zonas
    document.getElementById('agencia').addEventListener('change', poblarZonas);
    
    // Escuchar el resto de los inputs para el cálculo
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        // Excluimos 'agencia' de este evento directo para que no calcule dos veces
        if(input.id !== 'agencia') {
            input.addEventListener('input', calcularCotizacion);
        }
    });

    // Arrancar la app por primera vez
    poblarZonas(); 
});