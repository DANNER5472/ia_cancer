from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
from PIL import Image
import numpy as np
import io
import json

app = Flask(__name__)
CORS(app)

# ============================================================
# PESOS DE FACTORES DE RIESGO — PULMÓN
# ============================================================
PESOS_PULMON = {
    'pregunta_1': 0.045,  # Fumador activo actualmente 🔥
    'pregunta_2': 0.025,  # Ex fumador (dejó hace menos de 10 años)
    'pregunta_3': 0.010,  # Exposición a humo de segunda mano +10 años
    'pregunta_4': 0.020,  # Exposición laboral a asbesto, arsénico o radón
    'pregunta_5': 0.010,  # Antecedente familiar de cáncer de pulmón
    'pregunta_6': 0.015,  # Diagnóstico previo de EPOC o enfisema
    'pregunta_7': 0.0075, # Tos crónica o con sangre sin causa explicada
    'pregunta_8': 0.005,  # Pérdida de peso inexplicable últimos 3 meses
}

UMBRAL_ANORMAL    = 0.60
UMBRAL_BORDERLINE = 0.40

# ============================================================
# CARGAR MODELO
# ============================================================
print("🔄 Cargando modelo pulmón...")
model = load_model('../models/modelo_pulmon.keras')
print("✅ Modelo cargado correctamente")


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================
def preparar_imagen(imagen_bytes):
    img = Image.open(io.BytesIO(imagen_bytes))
    img = img.convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    img_array = preprocess_input(img_array)
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def calcular_ajuste(factores):
    ajuste = 0.0
    for pregunta, peso in PESOS_PULMON.items():
        if factores.get(pregunta) is True:
            ajuste += peso
    return round(ajuste, 4)


def interpretar_resultado(probabilidad_anormal):
    if probabilidad_anormal >= UMBRAL_ANORMAL:
        return 'anormal'
    elif probabilidad_anormal >= UMBRAL_BORDERLINE:
        return 'no_concluyente'
    else:
        return 'normal'


# ============================================================
# RUTAS
# ============================================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'pulmon',
        'version': '1.0',
        'ajuste_maximo': f"{sum(PESOS_PULMON.values()) * 100:.1f}%"
    })


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No se envió imagen'}), 400

        imagen_bytes = request.files['image'].read()
        img_array = preparar_imagen(imagen_bytes)

        prediccion = float(model.predict(img_array, verbose=0)[0][0])

        print(f"🔍 PREDICCION RAW: {prediccion}")
        print(f"🔍 NORMAL: {prediccion*100:.2f}% | ANORMAL: {(1-prediccion)*100:.2f}%")

        probabilidad_normal  = prediccion
        probabilidad_anormal = 1 - prediccion

        factores = {}
        if 'factores' in request.form:
            try:
                factores = json.loads(request.form['factores'])
            except Exception:
                factores = {}

        ajuste = calcular_ajuste(factores)
        print(f"🔍 AJUSTE POR FACTORES: +{ajuste*100:.2f}%")

        if probabilidad_anormal < UMBRAL_ANORMAL:
            probabilidad_anormal_final = min(probabilidad_anormal + ajuste, 1.0)
        else:
            probabilidad_anormal_final = probabilidad_anormal
            ajuste = 0.0

        resultado = interpretar_resultado(probabilidad_anormal_final)
        print(f"🔍 RESULTADO FINAL: {resultado} ({probabilidad_anormal_final*100:.2f}% anormal)")

        factores_positivos = [k for k, v in factores.items() if v is True]

        return jsonify({
            'resultado':            resultado,
            'probabilidad_normal':  round(probabilidad_normal * 100, 2),
            'probabilidad_anormal': round(probabilidad_anormal * 100, 2),
            'ajuste_aplicado':      round(ajuste * 100, 2),
            'factores_positivos':   len(factores_positivos),
            'probabilidad_final':   round(probabilidad_anormal_final * 100, 2),
            'confianza': round(
                probabilidad_normal * 100 if resultado == 'normal'
                else probabilidad_anormal_final * 100, 2
            )
        })

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# INICIO
# ============================================================
if __name__ == '__main__':
    print(f"\n🚀 Servidor pulmón iniciado en http://localhost:5003")
    print(f"📊 Ajuste máximo por factores: {sum(PESOS_PULMON.values()) * 100:.1f}%")
    print(f"📏 Umbrales: NORMAL <40% | NO CONCLUYENTE 40-60% | ANORMAL >60%\n")
    app.run(host='0.0.0.0', port=5003, debug=True)