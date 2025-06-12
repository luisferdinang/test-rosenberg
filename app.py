from flask import Flask, render_template, jsonify, request
import json
import os
from collections import defaultdict

app = Flask(__name__)

# Cargar los datos del JSON
def load_data():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'ESCALA DE AUTOESTIMA DE ROSENBERG (Responses).json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# Ruta principal
@app.route('/')
def index():
    return render_template('index.html')

# Ruta para obtener datos con filtros
@app.route('/api/data', methods=['GET'])
def get_filtered_data():
    data = load_data()
    
    # Obtener parámetros de filtro
    facultad = request.args.get('Facultad', '').strip()
    genero = request.args.get('Sexo', '').strip()
    edad_maxima = request.args.get('Edad', '')
    
    filtered_data = []
    
    for entry in data:
        match = True
        
        # Filtrar por facultad
        if facultad and entry.get('Facultad', '').strip().lower() != facultad.lower():
            match = False
        
        # Filtrar por género
        if match and genero and entry.get('Sexo', '').strip().lower() != genero.lower():
            match = False
            
        # Filtrar por edad máxima
        if match and edad_maxima:
            try:
                edad = int(entry.get('Edad', 0))
                if edad > int(edad_maxima):
                    match = False
            except (ValueError, TypeError):
                # Si hay un error al convertir la edad, omitir este filtro
                pass
        
        if match:
            filtered_data.append(entry)
    
    return jsonify(filtered_data)

# Ruta para estadísticas
@app.route('/api/stats', methods=['GET'])
def get_stats():
    data = load_data()
    
    # Obtener parámetros de filtro
    facultad = request.args.get('Facultad', '').strip()
    genero = request.args.get('Sexo', '').strip()
    edad_maxima = request.args.get('Edad', '')
    question = request.args.get('question', '')
    
    if not question:
        return jsonify({'error': 'No se especificó una pregunta'}), 400
    
    # Aplicar filtros
    filtered_data = []
    for entry in data:
        match = True
        
        # Filtrar por facultad
        if facultad and entry.get('Facultad', '').strip().lower() != facultad.lower():
            match = False
        
        # Filtrar por género
        if match and genero and entry.get('Sexo', '').strip().lower() != genero.lower():
            match = False
            
        # Filtrar por edad máxima
        if match and edad_maxima:
            try:
                edad = int(entry.get('Edad', 0))
                if edad > int(edad_maxima):
                    match = False
            except (ValueError, TypeError):
                # Si hay un error al convertir la edad, omitir este filtro
                pass
        
        if match:
            filtered_data.append(entry)
    
    # Inicializar contadores para todas las posibles respuestas
    respuestas_posibles = [
        'Muy de Acuerdo',
        'De Acuerdo',
        'En Desacuerdo',
        'Muy en Desacuerdo'
    ]
    
    counts = {resp: 0 for resp in respuestas_posibles}
    
    # Contar respuestas para la pregunta específica
    for entry in filtered_data:
        respuesta = entry.get(question, '').strip()
        
        # Manejar caso especial de la Pregunta 10
        if '10. ' in question and 'bueno/a' in question.lower():
            # Normalizar la respuesta para la Pregunta 10
            if 'bueno/a' in respuesta.lower() or 'bueno / a' in respuesta.lower() or 'bueno (a)' in respuesta.lower():
                # Extraer solo la parte de la respuesta que importa (Muy de Acuerdo, De Acuerdo, etc.)
                for resp in respuestas_posibles:
                    if resp.lower() in respuesta.lower():
                        counts[resp] += 1
                        break
        else:
            # Para las demás preguntas, buscar coincidencia exacta o parcial
            for resp in respuestas_posibles:
                if resp in respuesta:
                    counts[resp] += 1
                    break
    
    # Preparar datos para el gráfico
    labels = []
    values = []
    
    for resp in respuestas_posibles:
        if counts[resp] > 0 or not filtered_data:  # Incluir todas las opciones si no hay datos
            labels.append(resp)
            values.append(counts[resp])
    
    total_respuestas = sum(values)
    
    # Si no hay datos, mostrar ceros
    if total_respuestas == 0 and filtered_data:
        for resp in respuestas_posibles:
            labels.append(resp)
            values.append(0)
        total_respuestas = len(filtered_data)
    
    return jsonify({
        'labels': labels,
        'values': values,
        'total': total_respuestas if total_respuestas > 0 else len(filtered_data)
    })

# Ruta para obtener opciones de filtro
@app.route('/api/filters', methods=['GET'])
def get_filters():
    data = load_data()
    
    # Obtener valores únicos para cada filtro, eliminando espacios en blanco y valores vacíos
    faculties = sorted(list(set(
        str(entry.get('Facultad', '')).strip() 
        for entry in data 
        if str(entry.get('Facultad', '')).strip()
    )))
    
    genders = sorted(list(set(
        str(entry.get('Sexo', '')).strip()
        for entry in data
        if str(entry.get('Sexo', '')).strip()
    )))
    
    # Obtener rango de edades
    ages = []
    for entry in data:
        try:
            edad = entry.get('Edad')
            if isinstance(edad, (int, float)) or (isinstance(edad, str) and edad.strip() and edad.replace('.', '', 1).isdigit()):
                edad_num = float(edad)
                if edad_num > 0 and edad_num < 120:  # Validar rango razonable de edades
                    ages.append(int(edad_num))
        except (ValueError, TypeError):
            continue
    
    min_age = min(ages) if ages else 0
    max_age = max(ages) if ages else 100
    
    print(f"Facultades encontradas: {faculties}")
    print(f"Géneros encontrados: {genders}")
    print(f"Rango de edades: {min_age} - {max_age}")
    
    return jsonify({
        'facultades': faculties,
        'generos': genders,
        'min_edad': min_age,
        'max_edad': max_age
    })

if __name__ == '__main__':
    app.run(debug=True)
