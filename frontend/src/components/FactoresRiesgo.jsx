import { useState } from 'react'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'

function FactoresRiesgo({ onComplete }) {
  const [respuestas, setRespuestas] = useState({
    edad: '',
    vacunaVPH: '',
    parejasSexuales: '',
    edadPrimeraRelacion: '',
    papAnormalPrevio: '',
    fumadora: '',
    anticonceptivos: '',
    embarazos: '',
    infeccionVPH: ''
  })

  const preguntas = [
    {
      id: 'edad',
      pregunta: '¿Cuál es la edad de la paciente?',
      opciones: [
        { valor: 'menor25', texto: 'Menor de 25 años', puntos: 0 },
        { valor: '25-34', texto: '25-34 años', puntos: 5 },
        { valor: '35-55', texto: '35-55 años', puntos: 10 },
        { valor: 'mayor55', texto: 'Mayor de 55 años', puntos: 5 }
      ]
    },
    {
      id: 'vacunaVPH',
      pregunta: '¿La paciente tiene la vacuna contra el VPH?',
      opciones: [
        { valor: 'si', texto: 'Sí', puntos: -10 },
        { valor: 'no', texto: 'No', puntos: 10 },
        { valor: 'noSabe', texto: 'No sabe', puntos: 5 }
      ]
    },
    {
      id: 'parejasSexuales',
      pregunta: '¿Cuántas parejas sexuales ha tenido?',
      opciones: [
        { valor: '0-1', texto: '0-1', puntos: 0 },
        { valor: '2-4', texto: '2-4', puntos: 5 },
        { valor: '5+', texto: '5 o más', puntos: 10 }
      ]
    },
    {
      id: 'edadPrimeraRelacion',
      pregunta: '¿A qué edad tuvo su primera relación sexual?',
      opciones: [
        { valor: 'menor16', texto: 'Menor de 16 años', puntos: 10 },
        { valor: '16-18', texto: '16-18 años', puntos: 5 },
        { valor: 'mayor18', texto: 'Mayor de 18 años', puntos: 0 },
        { valor: 'noAplica', texto: 'No aplica', puntos: 0 }
      ]
    },
    {
      id: 'papAnormalPrevio',
      pregunta: '¿Ha tenido resultados anormales de Papanicolaou anteriormente?',
      opciones: [
        { valor: 'si', texto: 'Sí', puntos: 15 },
        { valor: 'no', texto: 'No', puntos: 0 },
        { valor: 'noSabe', texto: 'No sabe', puntos: 5 }
      ]
    },
    {
      id: 'fumadora',
      pregunta: '¿La paciente fuma o ha fumado?',
      opciones: [
        { valor: 'si', texto: 'Sí, actualmente', puntos: 10 },
        { valor: 'exFumadora', texto: 'Ex-fumadora', puntos: 5 },
        { valor: 'no', texto: 'No', puntos: 0 }
      ]
    },
    {
      id: 'anticonceptivos',
      pregunta: '¿Ha usado anticonceptivos orales por más de 5 años?',
      opciones: [
        { valor: 'si', texto: 'Sí', puntos: 5 },
        { valor: 'no', texto: 'No', puntos: 0 },
        { valor: 'noSabe', texto: 'No sabe', puntos: 2 }
      ]
    },
    {
      id: 'embarazos',
      pregunta: '¿Cuántos embarazos a término ha tenido?',
      opciones: [
        { valor: '0-2', texto: '0-2', puntos: 0 },
        { valor: '3+', texto: '3 o más', puntos: 5 }
      ]
    },
    {
      id: 'infeccionVPH',
      pregunta: '¿Tiene o ha tenido diagnóstico de infección por VPH?',
      opciones: [
        { valor: 'si', texto: 'Sí', puntos: 20 },
        { valor: 'no', texto: 'No', puntos: 0 },
        { valor: 'noSabe', texto: 'No sabe', puntos: 5 }
      ]
    }
  ]

  const handleChange = (preguntaId, opcion) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: opcion
    }))
  }

  const calcularRiesgo = () => {
    let puntosTotal = 0
    let preguntasRespondidas = 0

    preguntas.forEach(pregunta => {
      const respuesta = respuestas[pregunta.id]
      if (respuesta) {
        const opcion = pregunta.opciones.find(o => o.valor === respuesta)
        if (opcion) {
          puntosTotal += opcion.puntos
          preguntasRespondidas++
        }
      }
    })

    // Normalizar a porcentaje (máximo ~90 puntos posibles)
    const porcentajeRiesgo = Math.min(Math.max((puntosTotal / 90) * 100, -20), 30)
    
    return {
      puntos: puntosTotal,
      porcentajeAjuste: porcentajeRiesgo,
      nivelRiesgo: puntosTotal <= 10 ? 'bajo' : puntosTotal <= 30 ? 'moderado' : 'alto',
      preguntasRespondidas
    }
  }

  const todasRespondidas = Object.values(respuestas).every(r => r !== '')
  const riesgo = calcularRiesgo()

  const handleSubmit = () => {
    if (todasRespondidas) {
      onComplete(riesgo, respuestas)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Factores de Riesgo Clínico</h2>
      <p className="text-gray-500 text-sm mb-6">
        Complete el siguiente cuestionario para mejorar la precisión del análisis.
      </p>

      <div className="space-y-6">
        {preguntas.map((pregunta, index) => (
          <div key={pregunta.id} className="border-b border-gray-100 pb-4">
            <p className="font-medium text-gray-700 mb-3">
              {index + 1}. {pregunta.pregunta}
            </p>
            <div className="flex flex-wrap gap-2">
              {pregunta.opciones.map(opcion => (
                <button
                  key={opcion.valor}
                  onClick={() => handleChange(pregunta.id, opcion.valor)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    respuestas[pregunta.id] === opcion.valor
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen de riesgo */}
      {todasRespondidas && (
        <div className={`mt-6 p-4 rounded-lg ${
          riesgo.nivelRiesgo === 'bajo' ? 'bg-green-50 border border-green-200' :
          riesgo.nivelRiesgo === 'moderado' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {riesgo.nivelRiesgo === 'bajo' ? (
              <FiCheckCircle className="text-green-600" size={24} />
            ) : (
              <FiAlertCircle className={riesgo.nivelRiesgo === 'moderado' ? 'text-yellow-600' : 'text-red-600'} size={24} />
            )}
            <div>
              <p className={`font-semibold ${
                riesgo.nivelRiesgo === 'bajo' ? 'text-green-800' :
                riesgo.nivelRiesgo === 'moderado' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                Nivel de riesgo clínico: {riesgo.nivelRiesgo.charAt(0).toUpperCase() + riesgo.nivelRiesgo.slice(1)}
              </p>
              <p className={`text-sm ${
                riesgo.nivelRiesgo === 'bajo' ? 'text-green-600' :
                riesgo.nivelRiesgo === 'moderado' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                Ajuste de probabilidad: {riesgo.porcentajeAjuste > 0 ? '+' : ''}{riesgo.porcentajeAjuste.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!todasRespondidas}
        className={`mt-6 w-full py-3 rounded-xl font-semibold transition ${
          todasRespondidas
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {todasRespondidas ? 'Continuar con el Análisis' : `Responda todas las preguntas (${riesgo.preguntasRespondidas}/${preguntas.length})`}
      </button>
    </div>
  )
}

export default FactoresRiesgo