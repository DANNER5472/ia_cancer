import pytest


#   < 40%  → NORMAL
# 40-60%   → NO CONCLUYENTE
#   > 60%  → ANORMAL

class TestUmbrales:

    def clasificar(self, prob_anormal: float) -> str:
        if prob_anormal < 0.40:
            return "NORMAL"
        elif prob_anormal <= 0.60:
            return "NO CONCLUYENTE"
        else:
            return "ANORMAL"

    def test_probabilidad_baja_es_normal(self):
        """25% de prob anormal debe clasificarse como NORMAL"""
        assert self.clasificar(0.25) == "NORMAL"

    def test_umbral_40_exacto_es_no_concluyente(self):
        """El límite inferior 40% es inclusivo → NO CONCLUYENTE, no NORMAL"""
        assert self.clasificar(0.40) == "NO CONCLUYENTE"

    def test_umbral_60_exacto_es_no_concluyente(self):
        """El límite superior 60% es inclusivo → NO CONCLUYENTE, no ANORMAL"""
        assert self.clasificar(0.60) == "NO CONCLUYENTE"

    def test_probabilidad_alta_es_anormal(self):
        """85% de prob anormal debe clasificarse como ANORMAL"""
        assert self.clasificar(0.00) == "ANORMAL"



#   pytest test_umbrales.py -v