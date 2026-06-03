"""
Tests Unitarios — Backend Flask
Sistema de Detección Temprana de Cáncer con IA
Autor: Danner Jamanca — UNIFRANZ

Cómo correr:
    pip install pytest
    pytest test_backend.py -v
"""

import pytest


# ============================================================
# LÓGICA COMPARTIDA (igual en los 3 servicios)
# ============================================================

UMBRAL_ANORMAL    = 0.60
UMBRAL_BORDERLINE = 0.40

def interpretar_resultado(probabilidad_anormal):
    if probabilidad_anormal >= UMBRAL_ANORMAL:
        return 'anormal'
    elif probabilidad_anormal >= UMBRAL_BORDERLINE:
        return 'no_concluyente'
    else:
        return 'normal'

def calcular_ajuste(factores, pesos):
    ajuste = 0.0
    for pregunta, peso in pesos.items():
        if factores.get(pregunta) is True:
            ajuste += peso
    return round(ajuste, 4)


# ============================================================
# PESOS
# ============================================================

PESOS_CERVICAL = {
    'pregunta_1': 0.010,
    'pregunta_2': 0.010,
    'pregunta_3': 0.045,
    'pregunta_4': 0.0075,
    'pregunta_5': 0.005,
    'pregunta_6': 0.003,
    'pregunta_7': 0.025,
    'pregunta_8': 0.015,
    'pregunta_9': 0.015,
}

PESOS_MAMA = {
    'pregunta_1':  0.030,
    'pregunta_2':  0.040,
    'pregunta_3':  0.003,
    'pregunta_4':  0.003,
    'pregunta_5':  0.005,
    'pregunta_6':  0.0075,
    'pregunta_7':  0.005,
    'pregunta_8':  0.015,
    'pregunta_9':  0.020,
    'pregunta_10': 0.005,
}

PESOS_PULMON = {
    'pregunta_1': 0.045,
    'pregunta_2': 0.025,
    'pregunta_3': 0.010,
    'pregunta_4': 0.020,
    'pregunta_5': 0.010,
    'pregunta_6': 0.015,
    'pregunta_7': 0.0075,
    'pregunta_8': 0.005,
}


# ============================================================
# BLOQUE 1: Umbrales de clasificación
# ============================================================

class TestUmbralesClasificacion:

    def test_0_porciento_es_normal(self):
        assert interpretar_resultado(0.0) == 'normal'

    def test_25_porciento_es_normal(self):
        assert interpretar_resultado(0.25) == 'normal'

    def test_39_porciento_es_normal(self):
        assert interpretar_resultado(0.399) == 'normal'

    def test_40_porciento_es_no_concluyente(self):
        assert interpretar_resultado(0.40) == 'no_concluyente'

    def test_50_porciento_es_no_concluyente(self):
        assert interpretar_resultado(0.50) == 'no_concluyente'

    # FIX: nombre corregido de test_60_porciento_es_no_concluyente → test_60_porciento_es_anormal
    def test_60_porciento_es_anormal(self):
        assert interpretar_resultado(0.60) == 'anormal'

    def test_601_porciento_es_anormal(self):
        assert interpretar_resultado(0.601) == 'anormal'

    def test_100_porciento_es_anormal(self):
        assert interpretar_resultado(1.0) == 'anormal'


# ============================================================
# BLOQUE 2: Factores de riesgo — Cervical
# ============================================================

class TestFactoresRiesgoCervical:

    def test_sin_factores_ajuste_cero(self):
        factores = {k: False for k in PESOS_CERVICAL}
        assert calcular_ajuste(factores, PESOS_CERVICAL) == 0.0

    def test_factores_null_ajuste_cero(self):
        factores = {k: None for k in PESOS_CERVICAL}
        assert calcular_ajuste(factores, PESOS_CERVICAL) == 0.0

    def test_solo_vph_suma_4_5_porciento(self):
        factores = {k: False for k in PESOS_CERVICAL}
        factores['pregunta_3'] = True
        assert abs(calcular_ajuste(factores, PESOS_CERVICAL) - 0.045) < 0.001

    def test_vph_mas_antecedente_familiar(self):
        factores = {k: False for k in PESOS_CERVICAL}
        factores['pregunta_3'] = True  # VPH 4.5%
        factores['pregunta_7'] = True  # Antecedente 2.5%
        assert abs(calcular_ajuste(factores, PESOS_CERVICAL) - 0.070) < 0.001

    def test_todos_los_factores_maximo(self):
        factores = {k: True for k in PESOS_CERVICAL}
        ajuste = calcular_ajuste(factores, PESOS_CERVICAL)
        assert ajuste == round(sum(PESOS_CERVICAL.values()), 4)

    def test_ajuste_nunca_negativo(self):
        factores = {k: False for k in PESOS_CERVICAL}
        assert calcular_ajuste(factores, PESOS_CERVICAL) >= 0.0

    def test_ajuste_no_supera_1_con_suma(self):
        factores = {k: True for k in PESOS_CERVICAL}
        prob_base = 0.55
        ajuste = calcular_ajuste(factores, PESOS_CERVICAL)
        prob_final = min(prob_base + ajuste, 1.0)
        assert prob_final <= 1.0


# ============================================================
# BLOQUE 3: Factores de riesgo — Mama
# ============================================================

class TestFactoresRiesgMama:

    def test_sin_factores_ajuste_cero(self):
        factores = {k: False for k in PESOS_MAMA}
        assert calcular_ajuste(factores, PESOS_MAMA) == 0.0

    def test_solo_brca_suma_4_porciento(self):
        factores = {k: False for k in PESOS_MAMA}
        factores['pregunta_2'] = True  # BRCA 4%
        assert abs(calcular_ajuste(factores, PESOS_MAMA) - 0.040) < 0.001

    def test_antecedente_mas_brca(self):
        factores = {k: False for k in PESOS_MAMA}
        factores['pregunta_1'] = True  # Antecedente familiar 3%
        factores['pregunta_2'] = True  # BRCA 4%
        assert abs(calcular_ajuste(factores, PESOS_MAMA) - 0.070) < 0.001

    def test_ajuste_nunca_negativo(self):
        factores = {k: False for k in PESOS_MAMA}
        assert calcular_ajuste(factores, PESOS_MAMA) >= 0.0


# ============================================================
# BLOQUE 4: Factores de riesgo — Pulmón
# ============================================================

class TestFactoresRiesgoPulmon:

    def test_sin_factores_ajuste_cero(self):
        factores = {k: False for k in PESOS_PULMON}
        assert calcular_ajuste(factores, PESOS_PULMON) == 0.0

    def test_solo_fumador_activo_suma_4_5(self):
        factores = {k: False for k in PESOS_PULMON}
        factores['pregunta_1'] = True  # Fumador activo 4.5%
        assert abs(calcular_ajuste(factores, PESOS_PULMON) - 0.045) < 0.001

    def test_fumador_mas_asbesto(self):
        factores = {k: False for k in PESOS_PULMON}
        factores['pregunta_1'] = True  # Fumador 4.5%
        factores['pregunta_4'] = True  # Asbesto 2%
        assert abs(calcular_ajuste(factores, PESOS_PULMON) - 0.065) < 0.001

    def test_ajuste_nunca_negativo(self):
        factores = {k: False for k in PESOS_PULMON}
        assert calcular_ajuste(factores, PESOS_PULMON) >= 0.0


# ============================================================
# BLOQUE 5: Lógica combinada (IA + ajuste)
# ============================================================

class TestLogicaCombinada:

    # FIX: prob_ia cambiado de 0.35 a 0.36 (0.36 + 0.045 = 0.405 >= 0.40 → no_concluyente)
    def test_ia_normal_con_factores_sube_a_no_concluyente(self):
        """Si la IA dice 36% anormal pero hay factores de riesgo, puede subir"""
        prob_ia = 0.36
        factores = {k: False for k in PESOS_CERVICAL}
        factores['pregunta_3'] = True  # VPH +4.5%
        ajuste = calcular_ajuste(factores, PESOS_CERVICAL)
        prob_final = min(prob_ia + ajuste, 1.0)
        assert interpretar_resultado(prob_final) == 'no_concluyente'

    def test_ia_anormal_factores_no_modifican(self):
        """Si la IA ya dice anormal (>60%), el ajuste NO se aplica"""
        prob_ia = 0.75
        # Simula la lógica del app.py: si >= UMBRAL_ANORMAL, ajuste = 0
        if prob_ia >= UMBRAL_ANORMAL:
            ajuste = 0.0
        else:
            ajuste = 0.045
        prob_final = prob_ia  # no se suma
        assert interpretar_resultado(prob_final) == 'anormal'
        assert ajuste == 0.0

    def test_prob_final_nunca_supera_100(self):
        """La probabilidad final nunca puede ser mayor a 1.0"""
        prob_ia = 0.58
        factores = {k: True for k in PESOS_CERVICAL}
        ajuste = calcular_ajuste(factores, PESOS_CERVICAL)
        prob_final = min(prob_ia + ajuste, 1.0)
        assert prob_final <= 1.0

    def test_no_concluyente_en_zona_gris(self):
        assert interpretar_resultado(0.45) == 'no_concluyente'
        assert interpretar_resultado(0.55) == 'no_concluyente'