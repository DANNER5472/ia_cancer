// ============================================================
// CONFIGURACIÓN DE CUESTIONARIOS POR TIPO DE CÁNCER
// Solo preguntas y textos — los pesos están en cada backend
// ============================================================

export const PREGUNTAS = {
  cervical: [
    { id: 'pregunta_1', texto: 'Inicio de vida sexual antes de los 18 años', edadMin: 18 },
    { id: 'pregunta_2', texto: 'Múltiples parejas sexuales (3 o más)', edadMin: 18 },
    { id: 'pregunta_3', texto: 'Infección por VPH diagnosticada', edadMin: 0 },
    { id: 'pregunta_4', texto: 'Tabaquismo activo o pasivo', edadMin: 0 },
    { id: 'pregunta_5', texto: 'Uso prolongado de anticonceptivos orales (+5 años)', edadMin: 18 },
    { id: 'pregunta_6', texto: 'Más de 3 embarazos', edadMin: 18 },
    { id: 'pregunta_7', texto: 'Antecedente familiar de cáncer cervical', edadMin: 0 },
    { id: 'pregunta_8', texto: 'No realizó Papanicolaou en los últimos 3 años', edadMin: 21 },
    { id: 'pregunta_9', texto: 'Inmunosupresión (VIH, medicamentos)', edadMin: 0 },
  ],
  mama: [
    { id: 'pregunta_1', texto: 'Antecedente familiar de cáncer de mama', edadMin: 0 },
    { id: 'pregunta_2', texto: 'Mutación BRCA1/BRCA2 diagnosticada', edadMin: 0 },
    { id: 'pregunta_3', texto: 'Primera menstruación antes de los 12 años', edadMin: 20 },
    { id: 'pregunta_4', texto: 'Menopausia después de los 55 años', edadMin: 45 },
    { id: 'pregunta_5', texto: 'Nunca tuvo hijos o primer hijo después de los 30', edadMin: 30 },
    { id: 'pregunta_6', texto: 'Uso de terapia hormonal por más de 5 años', edadMin: 40 },
    { id: 'pregunta_7', texto: 'Consumo frecuente de alcohol', edadMin: 0 },
    { id: 'pregunta_8', texto: 'Radioterapia previa en tórax', edadMin: 0 },
    { id: 'pregunta_9', texto: 'Biopsia mamaria previa con resultado anormal', edadMin: 0 },
    { id: 'pregunta_10', texto: 'Sobrepeso u obesidad (IMC > 25)', edadMin: 0 },
  ],
  pulmon: [
    { id: 'pregunta_1', texto: 'Fumador activo actualmente', edadMin: 18 },
    { id: 'pregunta_2', texto: 'Ex fumador (dejó hace menos de 10 años)', edadMin: 18 },
    { id: 'pregunta_3', texto: 'Exposición a humo de segunda mano por más de 10 años', edadMin: 0 },
    { id: 'pregunta_4', texto: 'Exposición laboral a asbesto, arsénico o radón', edadMin: 0 },
    { id: 'pregunta_5', texto: 'Antecedente familiar de cáncer de pulmón', edadMin: 0 },
    { id: 'pregunta_6', texto: 'Diagnóstico previo de EPOC o enfisema', edadMin: 30 },
    { id: 'pregunta_7', texto: 'Tos crónica o con sangre sin causa explicada', edadMin: 0 },
    { id: 'pregunta_8', texto: 'Pérdida de peso inexplicable en los últimos 3 meses', edadMin: 0 },
  ],
}

// Modelos disponibles — cambiar a true cuando se entrene cada modelo
export const MODELOS_DISPONIBLES = {
  cervical: true,
  mama: true,
  pulmon: true,
}