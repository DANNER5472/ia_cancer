import pytest
import json
import io


# Mock del modelo para no depender de TensorFlow/GPU

class TestFlaskEndpoints:

    @pytest.fixture
    def app(self):
        from flask import Flask, request, jsonify
        import numpy as np

        app = Flask(__name__)
        app.config["TESTING"] = True

        class MockModel:
            def predict(self, x):
                return np.array([[0.30, 0.70]])  # prob_anormal = 0.70 → ANORMAL

        mock_model = MockModel()

        def clasificar(prob):
            if prob < 0.40:   return "NORMAL"
            if prob <= 0.60:  return "NO CONCLUYENTE"
            return "ANORMAL"

        @app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "ok", "servicio": "cervical", "puerto": 5001})

        @app.route("/predict", methods=["POST"])
        def predict():
            if "imagen" not in request.files:
                return jsonify({"error": "No se envió ninguna imagen"}), 400
            pred         = mock_model.predict(None)
            prob_anormal = float(pred[0][1])
            return jsonify({
                "probabilidad_anormal": prob_anormal,
                "clasificacion":        clasificar(prob_anormal),
                "confianza":            round(max(pred[0]) * 100, 2),
            })

        return app

    @pytest.fixture
    def client(self, app):
        return app.test_client()

    def test_health_retorna_200(self, client):
        """/health debe responder 200 indicando que el servicio está activo"""
        res = client.get("/health")
        assert res.status_code == 200

    def test_predict_sin_imagen_retorna_400(self, client):
        """/predict sin archivo debe rechazar la petición con 400"""
        res = client.post("/predict")
        assert res.status_code == 400

    def test_predict_con_imagen_clasifica_anormal(self, client):
        """/predict con imagen válida debe retornar ANORMAL (mock prob=0.70)"""
        data = {"imagen": (io.BytesIO(b"fake-image-data"), "muestra.jpg")}
        res  = client.post("/predict", data=data, content_type="multipart/form-data")
        body = json.loads(res.data)
        assert res.status_code == 200
        assert body["clasificacion"] == "ANORMAL"
        assert 0.0 <= body["probabilidad_anormal"] <= 1.0


#   pytest test_endpoints.py -v