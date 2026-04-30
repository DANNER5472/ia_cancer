# ============================================================
# SIMULACIÓN DE FALSOS NEGATIVOS RESCATADOS POR CUESTIONARIO
# Sistema de Detección Temprana de Cáncer Cervical
# Autor: Danner Jamanca — UNIFRANZ Bolivia
# ============================================================

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

np.random.seed(42)

# ============================================================
# 1. DATOS DE LOS FALSOS NEGATIVOS
# 31 FN: imágenes anormales que la IA clasificó como normales
# ============================================================
prob_anormal_fn = np.concatenate([
    np.random.uniform(0.30, 0.50, 20),  # borderline
    np.random.uniform(0.10, 0.30, 11),  # difíciles de rescatar
])
prob_anormal_fn = np.sort(prob_anormal_fn)[::-1]

en_zona_borderline = int(((prob_anormal_fn >= 0.40) & (prob_anormal_fn < 0.60)).sum())

print("=" * 65)
print("SIMULACION DE FALSOS NEGATIVOS RESCATADOS POR CUESTIONARIO")
print("=" * 65)
print(f"\nTotal de Falsos Negativos del modelo: 31")
print(f"Probabilidades de anormalidad (IA):")
print(f"  - Rango: {prob_anormal_fn.min():.1%} — {prob_anormal_fn.max():.1%}")
print(f"  - Media: {prob_anormal_fn.mean():.1%}")
print(f"  - En zona borderline (40-60%): {en_zona_borderline}")

# ============================================================
# 2. PESOS DE FACTORES DE RIESGO
# ============================================================
PESOS_CERVICAL = {
    'VPH diagnosticado':               0.045,
    'Antecedente familiar':            0.025,
    'No Papanicolaou en 3 anos':       0.015,
    'Inmunosupresion':                 0.015,
    'Inicio vida sexual temprana':     0.010,
    'Multiples parejas sexuales':      0.010,
    'Tabaquismo':                      0.0075,
    'Anticonceptivos orales +5 anos':  0.005,
    'Mas de 3 embarazos':              0.003,
}

AJUSTE_MAXIMO = sum(PESOS_CERVICAL.values())
UMBRAL_ANORMAL = 0.60
UMBRAL_BORDERLINE = 0.40

print(f"\nAjuste maximo por cuestionario: {AJUSTE_MAXIMO:.1%}")
print(f"Umbral ANORMAL: {UMBRAL_ANORMAL:.0%}")
print(f"Umbral NO CONCLUYENTE: {UMBRAL_BORDERLINE:.0%}")

# ============================================================
# 3. ESCENARIOS
# ============================================================
escenarios = {
    'Riesgo Bajo\n(0-2 factores)': {
        'factores_positivos': ['No Papanicolaou en 3 anos'],
        'color': '#22c55e'
    },
    'Riesgo Moderado\n(3-5 factores)': {
        'factores_positivos': [
            'Multiples parejas sexuales',
            'Inicio vida sexual temprana',
            'Tabaquismo',
            'No Papanicolaou en 3 anos',
        ],
        'color': '#f59e0b'
    },
    'Riesgo Alto\n(6+ factores)': {
        'factores_positivos': [
            'VPH diagnosticado',
            'Antecedente familiar',
            'Multiples parejas sexuales',
            'Inicio vida sexual temprana',
            'No Papanicolaou en 3 anos',
            'Inmunosupresion',
            'Tabaquismo',
        ],
        'color': '#ef4444'
    }
}

print("\n" + "=" * 65)
print("RESULTADOS POR ESCENARIO")
print("=" * 65)

resultados_escenarios = {}

for nombre_escenario, config in escenarios.items():
    factores = config['factores_positivos']
    ajuste = sum(PESOS_CERVICAL[f] for f in factores if f in PESOS_CERVICAL)

    rescatados = 0
    no_concluyentes = 0
    siguen_fn = 0
    prob_finales = []

    for prob_ia in prob_anormal_fn:
        if prob_ia < UMBRAL_ANORMAL:
            prob_final = min(prob_ia + ajuste, 1.0)
        else:
            prob_final = prob_ia

        prob_finales.append(prob_final)

        if prob_final >= UMBRAL_ANORMAL:
            rescatados += 1
        elif prob_final >= UMBRAL_BORDERLINE:
            no_concluyentes += 1
        else:
            siguen_fn += 1

    resultados_escenarios[nombre_escenario] = {
        'ajuste': ajuste,
        'rescatados': rescatados,
        'no_concluyentes': no_concluyentes,
        'siguen_fn': siguen_fn,
        'prob_finales': prob_finales,
    }

    nombre_limpio = nombre_escenario.replace('\n', ' ')
    pct_rescatados = rescatados / 31 * 100
    pct_nc = no_concluyentes / 31 * 100
    pct_fn = siguen_fn / 31 * 100

    print(f"\n{nombre_limpio}")
    print(f"   Factores: {', '.join(factores)}")
    print(f"   Ajuste aplicado: +{ajuste:.1%}")
    print(f"   Rescatados (ANORMAL):      {rescatados}/31 ({pct_rescatados:.1f}%)")
    print(f"   No concluyentes:           {no_concluyentes}/31 ({pct_nc:.1f}%)")
    print(f"   Siguen como FN:            {siguen_fn}/31 ({pct_fn:.1f}%)")

# ============================================================
# 4. RESUMEN GENERAL
# ============================================================
res_bajo = resultados_escenarios['Riesgo Bajo\n(0-2 factores)']
res_mod  = resultados_escenarios['Riesgo Moderado\n(3-5 factores)']
res_alto = resultados_escenarios['Riesgo Alto\n(6+ factores)']

mejora = res_alto['rescatados'] / 139 * 100
total_atencion = res_alto['rescatados'] + res_alto['no_concluyentes']

print("\n" + "=" * 65)
print("RESUMEN: IMPACTO DEL CUESTIONARIO EN FALSOS NEGATIVOS")
print("=" * 65)
print(f"\nSIN cuestionario (solo IA):")
print(f"  Sensibilidad: 77.70%")
print(f"  Falsos negativos: 31 casos anormales no detectados")
print(f"\nCON cuestionario (escenario riesgo alto):")
print(f"  FN rescatados como ANORMAL:          {res_alto['rescatados']}")
print(f"  FN elevados a NO CONCLUYENTE:        {res_alto['no_concluyentes']}")
print(f"  Total casos con atencion adicional:  {total_atencion}")
print(f"  Mejora estimada de sensibilidad:     +{mejora:.1f}%")
print(f"\nCONCLUSION:")
print(f"  El cuestionario actua como red de seguridad adicional.")
print(f"  No modifica casos donde la IA es segura (prob > 60%).")
print(f"  Respeta el 81.79% de accuracy del modelo entrenado.")

# ============================================================
# 5. GRAFICO
# ============================================================
fig, axes = plt.subplots(1, 3, figsize=(16, 6))
fig.suptitle(
    'Simulacion: Rescate de Falsos Negativos mediante\nCuestionario de Factores de Riesgo — Cancer Cervical',
    fontsize=14, fontweight='bold', y=1.02
)

for idx, (nombre, config) in enumerate(escenarios.items()):
    ax = axes[idx]
    res = resultados_escenarios[nombre]

    prob_antes = prob_anormal_fn
    prob_despues = np.array(res['prob_finales'])

    colores_puntos = []
    for p in prob_despues:
        if p >= UMBRAL_ANORMAL:
            colores_puntos.append('#ef4444')
        elif p >= UMBRAL_BORDERLINE:
            colores_puntos.append('#f59e0b')
        else:
            colores_puntos.append('#94a3b8')

    ax.scatter(range(31), prob_antes, alpha=0.4, color='#94a3b8', s=40, marker='o')
    ax.scatter(range(31), prob_despues, alpha=0.8, color=colores_puntos, s=60, marker='D')

    ax.axhline(y=UMBRAL_ANORMAL, color='#ef4444', linestyle='--', linewidth=1.5)
    ax.axhline(y=UMBRAL_BORDERLINE, color='#f59e0b', linestyle='--', linewidth=1.5)

    ajuste_pct = res['ajuste'] * 100
    ax.set_title(f'{nombre}\n+{ajuste_pct:.1f}% ajuste', fontsize=11, fontweight='bold')
    ax.set_xlabel('Caso (FN ordenados por prob. IA)', fontsize=9)
    ax.set_ylabel('Probabilidad de Anormalidad', fontsize=9)
    ax.set_ylim(0, 1)
    ax.set_yticks([0, 0.2, 0.4, 0.6, 0.8, 1.0])
    ax.set_yticklabels(['0%', '20%', '40%', '60%', '80%', '100%'])

    resc = res['rescatados']
    nc = res['no_concluyentes']
    fn = res['siguen_fn']
    textstr = f'Rescatados: {resc}/31\nNC: {nc}/31\nFN: {fn}/31'
    ax.text(0.97, 0.05, textstr, transform=ax.transAxes,
            fontsize=9, va='bottom', ha='right',
            bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

leyenda = [
    mpatches.Patch(color='#ef4444', label='Rescatado -> ANORMAL'),
    mpatches.Patch(color='#f59e0b', label='Elevado -> NO CONCLUYENTE'),
    mpatches.Patch(color='#94a3b8', label='Sigue como FN'),
]
fig.legend(handles=leyenda, loc='lower center', ncol=3,
           bbox_to_anchor=(0.5, -0.05), fontsize=10)

plt.tight_layout()
plt.savefig('simulacion_falsos_negativos.png', dpi=150, bbox_inches='tight')
plt.show()
print("\nGrafico guardado como 'simulacion_falsos_negativos.png'")

# ============================================================
# 6. TABLA RESUMEN PARA TESIS
# ============================================================
aj_b = res_bajo['ajuste'] * 100
aj_m = res_mod['ajuste'] * 100
aj_a = res_alto['ajuste'] * 100

print("\n" + "=" * 65)
print("TABLA RESUMEN PARA TESIS")
print("=" * 65)
print(f"| Escenario       | Ajuste  | Rescatados | No Concluyentes | Siguen FN |")
print(f"|-----------------|---------|------------|-----------------|-----------|")
print(f"| Riesgo Bajo     | +{aj_b:.1f}%  | {res_bajo['rescatados']}/31       | {res_bajo['no_concluyentes']}/31            | {res_bajo['siguen_fn']}/31     |")
print(f"| Riesgo Moderado | +{aj_m:.1f}%  | {res_mod['rescatados']}/31       | {res_mod['no_concluyentes']}/31            | {res_mod['siguen_fn']}/31     |")
print(f"| Riesgo Alto     | +{aj_a:.1f}%  | {res_alto['rescatados']}/31       | {res_alto['no_concluyentes']}/31            | {res_alto['siguen_fn']}/31     |")