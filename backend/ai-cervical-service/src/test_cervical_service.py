import pytest
import json
import io
import sys
import os


# BLOQUE 1: Tests de lógica de umbrales (sin necesitar el modelo cargado)


class TestUmbrales:
    """
    Valida que la clasificación de resultados según umbrales
    acordados con el tutor sea correcta.
    Umbrales: < 40% → NORMAL | 40-60% → NO CONCLUYENTE | > 60% → ANORMAL
    """

    def clasificar(self, prob_anormal: float) -> str:
        """Replica la lógica de clasificación del app.py"""
        if prob_anormal < 0.40:
            return "NORMAL"
        elif prob_anormal <= 0.60:
            return "NO CONCLUYENTE"
        else:
            return "ANORMAL"

    # --- Casos claros ---
    def test_probabilidad_0_es_normal(self):
        assert self.clasificar(0.0) == "NORMAL"

    def test_probabilidad_baja_es_normal(self):
        assert self.clasificar(0.25) == "NORMAL"

    def test_probabilidad_justo_bajo_umbral_normal(self):
        assert self.clasificar(0.399) == "NORMAL"

    def test_probabilidad_umbral_40_es_no_concluyente(self):
        assert self.clasificar(0.40) == "NO CONCLUYENTE"

    def test_probabilidad_media_es_no_concluyente(self):
        assert self.clasificar(0.50) == "NO CONCLUYENTE"

    def test_probabilidad_justo_en_umbral_60_es_no_concluyente(self):
        assert self.clasificar(0.60) == "NO CONCLUYENTE"

    def test_probabilidad_sobre_60_es_anormal(self):
        assert self.clasificar(0.601) == "ANORMAL"

    def test_probabilidad_alta_es_anormal(self):
        assert self.clasificar(0.85) == "ANORMAL"

    def test_probabilidad_1_es_anormal(self):
        assert self.clasificar(1.0) == "ANORMAL"

    # --- Casos borde críticos ---
    def test_frontera_exacta_40(self):
        """El límite inferior de NO CONCLUYENTE debe ser inclusivo"""
        assert self.clasificar(0.40) != "NORMAL"

    def test_frontera_exacta_60(self):
        """El límite superior de NO CONCLUYENTE debe ser inclusivo"""
        assert self.clasificar(0.60) != "ANORMAL"


# BLOQUE 2: Tests del cuestionario de factores de riesgo cervical


class TestCuestionarioRiesgo:
    """
    Valida que los 9 factores de riesgo sumen correctamente
    y que la regla 'solo suma, nunca resta' se cumpla.

    Pesos definidos:
    1. Inicio vida sexual temprana  → 1.0%
    2. Múltiples parejas            → 1.0%
    3. VPH diagnosticado            → 4.5%
    4. Tabaquismo                   → 0.75%
    5. Anticonceptivos +5 años      → 0.5%
    6. Más de 3 embarazos           → 0.3%
    7. Antecedente familiar         → 2.5%
    8. No Papanicolaou en 3 años    → 1.5%
    9. Inmunosupresión              → 1.5%
    Máximo total: ~13.6%
    """

    PESOS = {
        "inicio_sexual_temprano":   1.00,
        "multiples_parejas":        1.00,
        "vph_diagnosticado":        4.50,
        "tabaquismo":               0.75,
        "anticonceptivos_5_años":   0.50,
        "mas_3_embarazos":          0.30,
        "antecedente_familiar":     2.50,
        "sin_papanicolaou_3_años":  1.50,
        "inmunosupresion":          1.50,
    }
    MAXIMO = 13.55  # suma de todos los pesos

    def calcular_riesgo(self, respuestas: dict) -> float:
        """
        respuestas: dict con claves = factores, valores = True/False/None
        True  = Sí   → suma el peso
        False = No   → no suma
        None  = No sabe → no suma (regla del sistema)
        """
        total = 0.0
        for factor, peso in self.PESOS.items():
            respuesta = respuestas.get(factor)
            if respuesta is True:
                total += peso
        return round(total, 4)

    def todos_si(self) -> dict:
        return {k: True for k in self.PESOS}

    def todos_no(self) -> dict:
        return {k: False for k in self.PESOS}

    def todos_no_sabe(self) -> dict:
        return {k: None for k in self.PESOS}

    # --- Tests principales ---
    def test_ninguna_respuesta_si_da_cero(self):
        assert self.calcular_riesgo(self.todos_no()) == 0.0

    def test_no_sabe_equivale_a_cero(self):
        assert self.calcular_riesgo(self.todos_no_sabe()) == 0.0

    def test_todos_si_da_maximo(self):
        resultado = self.calcular_riesgo(self.todos_si())
        assert abs(resultado - self.MAXIMO) < 0.01

    def test_maximo_no_supera_14_por_ciento(self):
        """El total nunca debe ser absurdamente alto"""
        resultado = self.calcular_riesgo(self.todos_si())
        assert resultado <= 14.0

    def test_solo_vph_suma_4_punto_5(self):
        respuestas = self.todos_no()
        respuestas["vph_diagnosticado"] = True
        assert self.calcular_riesgo(respuestas) == pytest.approx(4.50)

    def test_vph_mas_antecedente_familiar(self):
        """El factor más grave + antecedente familiar = 7.0%"""
        respuestas = self.todos_no()
        respuestas["vph_diagnosticado"] = True
        respuestas["antecedente_familiar"] = True
        assert self.calcular_riesgo(respuestas) == pytest.approx(7.00)

    def test_sin_papanicolaou_mas_inmunosupresion(self):
        """Dos factores de 1.5% deben dar 3.0%"""
        respuestas = self.todos_no()
        respuestas["sin_papanicolaou_3_años"] = True
        respuestas["inmunosupresion"] = True
        assert self.calcular_riesgo(respuestas) == pytest.approx(3.00)

    def test_no_sabe_no_resta_ni_suma(self):
        """'No sabe' en VPH no debe cambiar el total vs solo decir 'No'"""
        respuestas_no = self.todos_no()
        respuestas_no["tabaquismo"] = True

        respuestas_no_sabe = self.todos_no()
        respuestas_no_sabe["tabaquismo"] = True
        respuestas_no_sabe["vph_diagnosticado"] = None  # No sabe en VPH

        assert self.calcular_riesgo(respuestas_no) == self.calcular_riesgo(respuestas_no_sabe)

    def test_riesgo_nunca_es_negativo(self):
        """El sistema solo suma, nunca resta"""
        resultado = self.calcular_riesgo(self.todos_no())
        assert resultado >= 0.0

    def test_factor_desconocido_se_ignora(self):
        """Factores no reconocidos no deben causar errores ni sumar"""
        respuestas = {"factor_inventado": True}
        assert self.calcular_riesgo(respuestas) == 0.0



# BLOQUE 3: Tests de validación de imágenes


class TestValidacionImagen:
    """
    Valida las reglas de validación de imágenes antes de enviarse al modelo.
    Reglas: extensión válida, tamaño <= 10MB, dimensiones 224x224 px.
    """

    EXTENSIONES_VALIDAS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}
    TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024  # 10 MB

    def validar_extension(self, filename: str) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in self.EXTENSIONES_VALIDAS

    def validar_tamano(self, tamano_bytes: int) -> bool:
        return tamano_bytes <= self.TAMANO_MAXIMO_BYTES

    # --- Extensiones ---
    def test_jpg_es_valido(self):
        assert self.validar_extension("muestra.jpg") is True

    def test_jpeg_es_valido(self):
        assert self.validar_extension("celulas.jpeg") is True

    def test_png_es_valido(self):
        assert self.validar_extension("imagen.png") is True

    def test_tif_es_valido(self):
        assert self.validar_extension("papanicolaou.tif") is True

    def test_pdf_es_invalido(self):
        assert self.validar_extension("resultado.pdf") is False

    def test_mp4_es_invalido(self):
        assert self.validar_extension("video.mp4") is False

    def test_exe_es_invalido(self):
        assert self.validar_extension("virus.exe") is False

    def test_sin_extension_es_invalido(self):
        assert self.validar_extension("archivo") is False

    # --- Tamaño ---
    def test_imagen_1mb_es_valida(self):
        assert self.validar_tamano(1 * 1024 * 1024) is True

    def test_imagen_exactamente_10mb_es_valida(self):
        assert self.validar_tamano(10 * 1024 * 1024) is True

    def test_imagen_10mb_mas_1_byte_es_invalida(self):
        assert self.validar_tamano(10 * 1024 * 1024 + 1) is False

    def test_imagen_vacia_0_bytes(self):
        """Imagen vacía no debe ser válida en producción, pero técnicamente pasa el límite"""
        assert self.validar_tamano(0) is True  # la validación de contenido es otra

    def test_imagen_20mb_es_invalida(self):
        assert self.validar_tamano(20 * 1024 * 1024) is False



# BLOQUE 4: Tests de integración con Flask (mock del modelo)


class TestFlaskEndpoints:
    """
    Tests de integración para los endpoints de la API Flask.
    El modelo TensorFlow se mockea para no requerir GPU.
    """

    @pytest.fixture
    def app(self, monkeypatch):
        """
        Crea una app Flask mínima que replica los endpoints del servicio cervical
        sin cargar el modelo real (usa mock).
        """
        from flask import Flask, request, jsonify
        import numpy as np

        app = Flask(__name__)
        app.config["TESTING"] = True

        # --- Mock del modelo ---
        class MockModel:
            def predict(self, x):
                # Simula salida del modelo: [prob_normal, prob_anormal]
                return np.array([[0.30, 0.70]])  # → ANORMAL

        mock_model = MockModel()

        def clasificar(prob):
            if prob < 0.40:
                return "NORMAL"
            elif prob <= 0.60:
                return "NO CONCLUYENTE"
            return "ANORMAL"

        @app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "ok", "servicio": "cervical", "puerto": 5001})

        @app.route("/predict", methods=["POST"])
        def predict():
            if "imagen" not in request.files:
                return jsonify({"error": "No se envió ninguna imagen"}), 400

            file = request.files["imagen"]
            if file.filename == "":
                return jsonify({"error": "Archivo vacío"}), 400

            # Simula preprocesamiento y predicción
            pred = mock_model.predict(None)
            prob_anormal = float(pred[0][1])
            clasificacion = clasificar(prob_anormal)

            return jsonify({
                "probabilidad_anormal": prob_anormal,
                "clasificacion": clasificacion,
                "confianza": round(max(pred[0]) * 100, 2)
            })

        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    def imagen_fake(self, nombre="muestra.jpg", contenido=b"fake-image-data"):
        return (io.BytesIO(contenido), nombre)

    # --- /health ---
    def test_health_responde_200(self, client):
        res = client.get("/health")
        assert res.status_code == 200

    def test_health_contiene_status_ok(self, client):
        data = json.loads(client.get("/health").data)
        assert data["status"] == "ok"

    def test_health_identifica_servicio_cervical(self, client):
        data = json.loads(client.get("/health").data)
        assert data["servicio"] == "cervical"

    # --- /predict ---
    def test_predict_sin_imagen_retorna_400(self, client):
        res = client.post("/predict")
        assert res.status_code == 400

    def test_predict_con_imagen_retorna_200(self, client):
        data = {"imagen": self.imagen_fake()}
        res = client.post("/predict", data=data, content_type="multipart/form-data")
        assert res.status_code == 200

    def test_predict_retorna_clasificacion(self, client):
        data = {"imagen": self.imagen_fake()}
        res = client.post("/predict", data=data, content_type="multipart/form-data")
        body = json.loads(res.data)
        assert "clasificacion" in body
        assert body["clasificacion"] in ["NORMAL", "NO CONCLUYENTE", "ANORMAL"]

    def test_predict_retorna_probabilidad(self, client):
        data = {"imagen": self.imagen_fake()}
        res = client.post("/predict", data=data, content_type="multipart/form-data")
        body = json.loads(res.data)
        assert "probabilidad_anormal" in body
        assert 0.0 <= body["probabilidad_anormal"] <= 1.0

    def test_predict_retorna_confianza(self, client):
        data = {"imagen": self.imagen_fake()}
        res = client.post("/predict", data=data, content_type="multipart/form-data")
        body = json.loads(res.data)
        assert "confianza" in body
        assert 0.0 <= body["confianza"] <= 100.0

    def test_predict_mock_da_anormal(self, client):
        """Con el mock configurado en 0.70 de prob anormal, debe decir ANORMAL"""
        data = {"imagen": self.imagen_fake()}
        res = client.post("/predict", data=data, content_type="multipart/form-data")
        body = json.loads(res.data)
        assert body["clasificacion"] == "ANORMAL"

"""
        Cómo correr:
    pip install pytest flask
    pytest test_cervical_service.py -v
"""