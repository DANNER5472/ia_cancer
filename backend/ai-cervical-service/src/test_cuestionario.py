import pytest


# Regla del sistema: solo suma, nunca resta. "No sabe" = 0%

class TestCuestionarioRiesgo:

    PESOS = {
        "inicio_sexual_temprano":  1.00,
        "multiples_parejas":       1.00,
        "vph_diagnosticado":       4.50,
        "tabaquismo":              0.75,
        "anticonceptivos_5_años":  0.50,
        "mas_3_embarazos":         0.30,
        "antecedente_familiar":    2.50,
        "sin_papanicolaou_3_años": 1.50,
        "inmunosupresion":         1.50,
    }

    def calcular_riesgo(self, respuestas: dict) -> float:
        total = 0.0
        for factor, peso in self.PESOS.items():
            if respuestas.get(factor) is True:
                total += peso
        return round(total, 4)

    def test_todos_no_da_cero(self):
        """Sin ningún factor de riesgo, el puntaje debe ser 0%"""
        respuestas = {k: False for k in self.PESOS}
        assert self.calcular_riesgo(respuestas) == 0.0

    def test_solo_vph_suma_4_punto_5(self):
        """VPH es el factor más grave del sistema → debe sumar exactamente 4.5%"""
        respuestas = {k: False for k in self.PESOS}
        respuestas["vph_diagnosticado"] = True
        assert self.calcular_riesgo(respuestas) == pytest.approx(4.50)

    def test_no_sabe_equivale_a_no_sumar(self):
        """'No sabe' en VPH no debe sumar nada, igual que responder 'No'"""
        solo_tabaquismo = {k: False for k in self.PESOS}
        solo_tabaquismo["tabaquismo"] = True

        con_vph_no_sabe = {**solo_tabaquismo, "vph_diagnosticado": None}

        assert self.calcular_riesgo(solo_tabaquismo) == self.calcular_riesgo(con_vph_no_sabe)


#   pytest test_cuestionario.py -v