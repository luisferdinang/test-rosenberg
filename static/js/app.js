// Variables globales
let respuestasChart;
let preguntas = [];
let datosCompletos = [];

// Inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    cargarFiltros();
    cargarDatos();
    configurarEventos();
});

// Cargar opciones de filtro
async function cargarFiltros() {
    try {
        console.log('Cargando opciones de filtro...');
        const response = await fetch('/api/filters');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos de filtros recibidos:', data);
        
        // Cargar facultades
        const selectFacultad = document.getElementById('facultad');
        selectFacultad.innerHTML = '<option value="">Todas las facultades</option>';
        
        if (data.facultades && Array.isArray(data.facultades)) {
            data.facultades.forEach(facultad => {
                if (facultad && facultad.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = facultad;
                    option.textContent = facultad;
                    selectFacultad.appendChild(option);
                }
            });
        } else {
            console.warn('No se encontraron facultades en los datos:', data.facultades);
        }
        
        // Cargar géneros
        const selectGenero = document.getElementById('genero');
        selectGenero.innerHTML = '<option value="">Todos los géneros</option>';
        
        if (data.generos && Array.isArray(data.generos)) {
            data.generos.forEach(genero => {
                if (genero && genero.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = genero;
                    option.textContent = genero;
                    selectGenero.appendChild(option);
                }
            });
        } else {
            console.warn('No se encontraron géneros en los datos:', data.generos);
        }
        
        // Configurar rango de edades
        const inputEdad = document.getElementById('edad');
        const minEdad = parseInt(data.min_edad) || 0;
        const maxEdad = parseInt(data.max_edad) || 100;
        
        inputEdad.min = minEdad;
        inputEdad.max = maxEdad;
        inputEdad.value = maxEdad;
        document.getElementById('edadValue').textContent = `Hasta ${maxEdad} años`;
        
        console.log('Filtros cargados correctamente');
        
    } catch (error) {
        console.error('Error al cargar los filtros:', error);
        alert('Error al cargar las opciones de filtro. Por favor, recarga la página.');
    }
}

// Cargar datos iniciales
async function cargarDatos() {
    try {
        const response = await fetch('/api/data');
        datosCompletos = await response.json();
        
        if (datosCompletos.length > 0) {
            // Extraer las preguntas (todas las claves que no son metadatos)
            const metadatos = ['Timestamp', 'Nombre', 'Apellido', 'Edad', 'Sexo', 'Facultad'];
            preguntas = Object.keys(datosCompletos[0]).filter(key => !metadatos.includes(key));
            
            // Cargar selector de preguntas
            const selectPregunta = document.getElementById('pregunta');
            preguntas.forEach((pregunta, index) => {
                const option = document.createElement('option');
                option.value = pregunta;
                option.textContent = `Pregunta ${index + 1}`;
                selectPregunta.appendChild(option);
            });
            
            // Inicializar gráfico con la primera pregunta
            if (preguntas.length > 0) {
                actualizarGrafico(preguntas[0]);
            }
            
            // Actualizar tabla
            actualizarTabla(datosCompletos);
        }
    } catch (error) {
        console.error('Error al cargar los datos:', error);
    }
}

// Configurar eventos de los filtros
function configurarEventos() {
    // Eventos de cambio en los filtros
    document.getElementById('facultad').addEventListener('change', filtrarDatos);
    document.getElementById('genero').addEventListener('change', filtrarDatos);
    document.getElementById('edad').addEventListener('input', function() {
        document.getElementById('edadValue').textContent = `Hasta ${this.value} años`;
        filtrarDatos();
    });
    
    // Evento para cambiar la pregunta
    document.getElementById('pregunta').addEventListener('change', function() {
        const preguntaSeleccionada = this.value;
        actualizarGrafico(preguntaSeleccionada);
    });
}

// Filtrar datos según los filtros seleccionados
async function filtrarDatos() {
    const selectFacultad = document.getElementById('facultad');
    const selectGenero = document.getElementById('genero');
    const inputEdad = document.getElementById('edad');
    
    // Obtener valores seleccionados
    const facultad = selectFacultad.value;
    const genero = selectGenero.value;
    const edadMaxima = inputEdad.value;
    
    // Construir parámetros de consulta
    const params = new URLSearchParams();
    
    // Solo agregar los parámetros que tengan valor
    if (facultad && facultad !== 'Todas las facultades') {
        params.append('Facultad', facultad);
    }
    
    if (genero && genero !== 'Todos los géneros') {
        params.append('Sexo', genero);
    }
    
    if (edadMaxima) {
        params.append('Edad', edadMaxima);
    }
    
    try {
        const url = `/api/data${params.toString() ? '?' + params.toString() : ''}`;
        console.log('Solicitando datos a:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const datosFiltrados = await response.json();
        console.log('Datos recibidos:', datosFiltrados);
        
        // Actualizar tabla con datos filtrados
        actualizarTabla(datosFiltrados);
        
        // Actualizar gráfico con la pregunta actual
        const preguntaActual = document.getElementById('pregunta').value;
        if (preguntaActual) {
            actualizarGrafico(preguntaActual);
        }
    } catch (error) {
        console.error('Error al filtrar los datos:', error);
        alert('Error al cargar los datos. Por favor, revisa la consola para más detalles.');
    }
}

// Actualizar el gráfico con los datos de una pregunta específica
async function actualizarGrafico(pregunta) {
    const selectFacultad = document.getElementById('facultad');
    const selectGenero = document.getElementById('genero');
    const inputEdad = document.getElementById('edad');
    
    // Obtener valores seleccionados
    const facultad = selectFacultad.value === 'Todas las facultades' ? '' : selectFacultad.value;
    const genero = selectGenero.value === 'Todos los géneros' ? '' : selectGenero.value;
    const edadMaxima = inputEdad.value;
    
    // Construir parámetros de consulta
    const params = new URLSearchParams();
    params.append('question', pregunta);
    
    if (facultad) params.append('Facultad', facultad);
    if (genero) params.append('Sexo', genero);
    if (edadMaxima) params.append('Edad', edadMaxima);
    
    try {
        const url = `/api/stats?${params.toString()}`;
        console.log('Solicitando estadísticas a:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos de estadísticas recibidos:', data);
        
        // Si hay un error, mostrarlo
        if (data.error) {
            console.error('Error del servidor:', data.error);
            alert('Error al cargar las estadísticas: ' + data.error);
            return;
        }
        
        // Si no hay datos, mostrar mensaje
        if (!data.labels || !data.values || data.labels.length === 0 || data.values.length === 0) {
            console.warn('No hay datos para mostrar');
            actualizarEstadisticas({ labels: [], values: [], total: 0 });
            return;
        }
        
        // Actualizar estadísticas
        actualizarEstadisticas(data);
        
        // Obtener el contexto del canvas
        const ctx = document.getElementById('respuestasChart').getContext('2d');
        
        // Destruir el gráfico anterior si existe
        if (respuestasChart) {
            respuestasChart.destroy();
        }
        
        // Mapeo de respuestas a colores
        const colores = {
            'Muy de Acuerdo': 'rgba(46, 184, 92, 0.7)',    // Verde
            'De Acuerdo': 'rgba(52, 152, 219, 0.7)',      // Azul
            'En Desacuerdo': 'rgba(230, 126, 34, 0.7)',   // Naranja
            'Muy en Desacuerdo': 'rgba(231, 76, 60, 0.7)' // Rojo
        };
        
        // Crear el nuevo gráfico
        respuestasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Número de respuestas',
                    data: data.values,
                    backgroundColor: data.labels.map(label => colores[label] || '#999999'),
                    borderColor: data.labels.map(label => {
                        // Oscurecer el color para el borde
                        const color = colores[label] || '#999999';
                        return color.replace('0.7', '1');
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Distribución de respuestas: ${pregunta.substring(0, 15)}...`,
                        font: {
                            size: 16
                        },
                        padding: { bottom: 20 }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Número de respuestas'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Respuestas'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    } catch (error) {
        console.error('Error al actualizar el gráfico:', error);
        alert('Error al cargar el gráfico. Por favor, revisa la consola para más detalles.');
    }
}

// Actualizar las estadísticas mostradas
function actualizarEstadisticas(data) {
    const contenedor = document.getElementById('estadisticas');
    
    // Si no hay datos, mostrar mensaje
    if (!data || !data.labels || data.labels.length === 0) {
        contenedor.innerHTML = `
            <div class="alert alert-warning mb-0">
                No hay datos disponibles para mostrar con los filtros actuales.
            </div>
        `;
        return;
    }
    
    const total = data.total > 0 ? data.total : 1; // Evitar división por cero
    let html = `
        <div class="estadistica-item mb-3">
            <h6 class="mb-2">Resumen de respuestas</h6>
            <div class="progress mb-3" style="height: 20px;">
    `;
    
    // Colores para las barras de progreso
    const colores = {
        'Muy de Acuerdo': 'bg-success',
        'De Acuerdo': 'bg-primary',
        'En Desacuerdo': 'bg-warning',
        'Muy en Desacuerdo': 'bg-danger'
    };
    
    // Calcular el ancho de cada barra
    data.labels.forEach((label, index) => {
        const valor = data.values[index] || 0;
        const porcentaje = Math.round((valor / total) * 100);
        const color = colores[label] || 'bg-secondary';
        
        if (valor > 0) {
            html += `
                <div class="progress-bar ${color}" role="progressbar" 
                     style="width: ${porcentaje}%" 
                     title="${label}: ${valor} (${porcentaje}%)">
                    ${porcentaje > 10 ? `${porcentaje}%` : ''}
                </div>
            `;
        }
    });
    
    html += `
            </div>
            <div class="table-responsive">
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Respuesta</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-center">Porcentaje</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Agregar filas de estadísticas
    data.labels.forEach((label, index) => {
        const valor = data.values[index] || 0;
        const porcentaje = Math.round((valor / total) * 100);
        
        if (valor > 0) {
            html += `
                <tr>
                    <td>${label}</td>
                    <td class="text-center">${valor}</td>
                    <td class="text-center">${porcentaje}%</td>
                </tr>
            `;
        }
    });
    
    // Pie de tabla con totales
    html += `
                        <tr class="table-active fw-bold">
                            <td>Total</td>
                            <td class="text-center">${data.total}</td>
                            <td class="text-center">100%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    contenedor.innerHTML = html;
}

// Función para mapear cualquier respuesta a su abreviatura y valor
function mapearRespuesta(respuesta) {
    if (respuesta === null || respuesta === undefined) return { abreviatura: '', valor: 0 };
    
    const respuestaStr = String(respuesta).trim();
    const respuestaLower = respuestaStr.toLowerCase();
    
    // Mapeo de respuestas a valores
    if (respuestaLower.includes('muy de acuerdo') || respuestaLower.includes('muy deacuerdo') || 
        respuestaLower === 'ma' || respuestaLower === '4' || 
        respuestaLower === 'muy de acuerd') {  // Para manejar posibles errores ortográficos
        return { abreviatura: 'MA', valor: 4 };
    } 
    if (respuestaLower.includes('de acuerdo') || respuestaLower === 'a' || 
        respuestaLower === 'acuerdo' || respuestaLower === '3' || 
        respuestaLower === 'de acuerd') {  // Para manejar posibles errores ortográficos
        return { abreviatura: 'A', valor: 3 };
    }
    if (respuestaLower.includes('en desacuerdo') || respuestaLower === 'd' || 
        respuestaLower === 'desacuerdo' || respuestaLower === '2' ||
        respuestaLower === 'en desacuerd') {  // Para manejar posibles errores ortográficos
        return { abreviatura: 'D', valor: 2 };
    }
    if (respuestaLower.includes('muy en desacuerdo') || respuestaLower === 'md' || 
        respuestaLower === '1' || respuestaLower === 'muy en desacuerd') {  // Para manejar posibles errores ortográficos
        return { abreviatura: 'MD', valor: 1 };
    }
    
    // Si es un número, intentar mapearlo
    const numValor = parseInt(respuesta);
    if (!isNaN(numValor) && numValor >= 1 && numValor <= 4) {
        const mapNumero = {1: 'MD', 2: 'D', 3: 'A', 4: 'MA'};
        return { abreviatura: mapNumero[numValor] || '', valor: numValor };
    }
    
    // Si no se puede determinar, devolver vacío
    return { abreviatura: '', valor: 0 };
}

// Función para actualizar la tabla de respuestas
function actualizarTabla(datos) {
    const tbody = document.querySelector('#tablaDatos tbody');
    const thead = document.querySelector('#tablaDatos thead');
    
    if (!tbody || !thead) {
        console.error('No se encontraron los elementos de la tabla');
        return;
    }
    
    // Limpiar la tabla
    tbody.innerHTML = '';
    thead.innerHTML = ''; // Limpiar encabezados existentes
    
    // Si no hay datos, mostrar mensaje
    if (!datos || datos.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="15" class="text-center">No se encontraron datos que coincidan con los filtros</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Obtener las preguntas (todas las claves que no son datos personales)
    const preguntas = Object.keys(datos[0] || {}).filter(key => 
        !['Timestamp', 'Nombre', 'Apellido', 'Edad', 'Sexo', 'Facultad'].includes(key)
    );
    
    // Ordenar las preguntas numéricamente
    preguntas.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });
    
    // Crear encabezados de la tabla
    const headerRow = document.createElement('tr');
    
    // Agregar encabezados de información personal
    ['Nombre', 'Apellido', 'Edad', 'Sexo', 'Facultad'].forEach(texto => {
        const th = document.createElement('th');
        th.textContent = texto;
        headerRow.appendChild(th);
    });
    
    // Agregar columnas de preguntas
    preguntas.forEach((pregunta, index) => {
        const th = document.createElement('th');
        th.textContent = `P${index + 1}`;
        th.title = pregunta; // Mostrar el texto completo al pasar el ratón
        headerRow.appendChild(th);
    });
    
    // Agregar columna de puntuación total
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Total';
    headerRow.appendChild(thTotal);
    
    thead.appendChild(headerRow);
    
    // Llenar la tabla con los datos
    datos.forEach(registro => {
        const tr = document.createElement('tr');
        let puntuacionTotal = 0;
        
        // Agregar celdas de información personal
        ['Nombre', 'Apellido', 'Edad', 'Sexo', 'Facultad'].forEach(campo => {
            const td = document.createElement('td');
            td.textContent = registro[campo] || '';
            tr.appendChild(td);
        });

        // Procesar cada pregunta
        preguntas.forEach((pregunta, index) => {
            const respuesta = registro[pregunta];
            const td = document.createElement('td');
            
            // Mapear la respuesta
            const { abreviatura, valor } = mapearRespuesta(respuesta);
            
            // Determinar si la pregunta es invertida (3, 5, 8, 9, 10)
            const esInvertida = [2, 4, 7, 8, 9].includes(index);
            const valorFinal = esInvertida ? (5 - (valor || 0)) : (valor || 0);
            
            // Sumar a la puntuación total si es una respuesta válida
            if (abreviatura) {
                puntuacionTotal += valorFinal;
            }
            
            // Configurar la celda
            td.textContent = abreviatura || '-';
            td.title = `${pregunta}: ${respuesta || 'Sin respuesta'}`;
            td.className = `respuesta ${abreviatura ? abreviatura.toLowerCase() : 'sin-respuesta'}`;
            
            tr.appendChild(td);
        });

        // Agregar celda de puntuación total
        const tdTotal = document.createElement('td');
        tdTotal.textContent = puntuacionTotal;
        tdTotal.className = 'puntuacion-total';
        tdTotal.title = `Puntuación total: ${puntuacionTotal} de ${preguntas.length * 4}`;
        tr.appendChild(tdTotal);

        tbody.appendChild(tr);
    });
}
