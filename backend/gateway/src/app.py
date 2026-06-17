from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# ============================================================
# SERVICIOS DE IA
# ============================================================
SERVICIOS = {
    'cervical': 'http://localhost:5001',
    'mama':     'http://localhost:5002',
    'pulmon':   'http://localhost:5003',
}

# ============================================================
# HOSPITALES BOLIVIA
# ============================================================
HOSPITALES_BOLIVIA = [
    { 'ciudad': 'La Paz',       'nombre': 'Hospital de Clínicas — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Hospital del Tórax — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Hospital Oncológico — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Clínica Foianini — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Hospital Obrero N°1 — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Hospital de la Mujer — La Paz' },
    { 'ciudad': 'La Paz',       'nombre': 'Clínica Americana — La Paz' },
    { 'ciudad': 'Cochabamba',   'nombre': 'Hospital Viedma — Cochabamba' },
    { 'ciudad': 'Cochabamba',   'nombre': 'Clínica Los Olivos — Cochabamba' },
    { 'ciudad': 'Cochabamba',   'nombre': 'Hospital IESS — Cochabamba' },
    { 'ciudad': 'Cochabamba',   'nombre': 'Clínica Belga — Cochabamba' },
    { 'ciudad': 'Cochabamba',   'nombre': 'Hospital Univalle — Cochabamba' },
    { 'ciudad': 'Santa Cruz',   'nombre': 'Hospital Japonés — Santa Cruz' },
    { 'ciudad': 'Santa Cruz',   'nombre': 'Hospital Oncológico — Santa Cruz' },
    { 'ciudad': 'Santa Cruz',   'nombre': 'Clínica Foianini — Santa Cruz' },
    { 'ciudad': 'Santa Cruz',   'nombre': 'Hospital de la Mujer — Santa Cruz' },
    { 'ciudad': 'Santa Cruz',   'nombre': 'Clínica Los Olivos — Santa Cruz' },
    { 'ciudad': 'Oruro',        'nombre': 'Hospital General San Juan de Dios — Oruro' },
    { 'ciudad': 'Oruro',        'nombre': 'Hospital Obrero — Oruro' },
    { 'ciudad': 'Potosí',       'nombre': 'Hospital Daniel Bracamonte — Potosí' },
    { 'ciudad': 'Potosí',       'nombre': 'Hospital San Pedro — Potosí' },
    { 'ciudad': 'Sucre',        'nombre': 'Hospital Santa Bárbara — Sucre' },
    { 'ciudad': 'Sucre',        'nombre': 'Hospital Universitario — Sucre' },
    { 'ciudad': 'Beni',         'nombre': 'Hospital de Trinidad — Beni' },
    { 'ciudad': 'Pando',        'nombre': 'Hospital Roberto Galindo — Pando' },
    { 'ciudad': 'Tarija',       'nombre': 'Hospital San Juan de Dios — Tarija' },
    { 'ciudad': 'Tarija',       'nombre': 'Hospital Regional — Tarija' },
]

# ============================================================
# RUTAS
# ============================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'service': 'gateway' })


@app.route('/hospitales', methods=['GET'])
def get_hospitales():
    return jsonify(HOSPITALES_BOLIVIA)


@app.route('/modelos/status', methods=['GET'])
def modelos_status():
    status = {}
    for tipo, url in SERVICIOS.items():
        try:
            res = requests.get(f"{url}/health", timeout=2)
            status[tipo] = res.status_code == 200
        except Exception:
            status[tipo] = False
    return jsonify(status)


@app.route('/predict/<tipo_cancer>', methods=['POST'])
def predict(tipo_cancer):
    if tipo_cancer not in SERVICIOS:
        return jsonify({ 'error': f'Tipo de cáncer no válido: {tipo_cancer}' }), 400

    url_servicio = SERVICIOS[tipo_cancer]

    try:
        files = { 'image': (
            request.files['image'].filename,
            request.files['image'].read(),
            request.files['image'].content_type
        )}
        data = { 'factores': request.form.get('factores', '{}') }

        res = requests.post(f"{url_servicio}/predict", files=files, data=data, timeout=30)
        return jsonify(res.json()), res.status_code

    except requests.exceptions.ConnectionError:
        return jsonify({ 'error': f'Servicio {tipo_cancer} no disponible' }), 503
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


# ============================================================
# INICIO
# ============================================================
if __name__ == '__main__':
    print("\n🚀 Gateway iniciado en http://localhost:5000")
    print("📡 Servicios registrados:", list(SERVICIOS.keys()))
    app.run(host='0.0.0.0', port=5000, debug=True)