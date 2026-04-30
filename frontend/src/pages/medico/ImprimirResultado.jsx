import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function ImprimirResultado() {
  const { analisisId } = useParams()
  const [datos, setDatos] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    const cargar = async () => {
      const { data: analisis } = await supabase
        .from('analisis')
        .select(`
          *,
          paciente(nombre_completo, ci_dni, fecha_nacimiento, sexo, telefono),
          cierre_analisis(*),
          cuestionario_riesgo(*),
          profiles!analisis_medico_id_fkey(nombre)
        `)
        .eq('id', analisisId)
        .single()
      setDatos(analisis)
      setLoading(false)
    }
    cargar()
  }, [analisisId])

  const handleImprimir = () => window.print()

  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '—'
    const hoy = new Date()
    const nac = new Date(fechaNac)
    return hoy.getFullYear() - nac.getFullYear()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
    </div>
  )

  if (!datos) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Análisis no encontrado.
    </div>
  )

  const cierre = datos.cierre_analisis?.[0]
  const cuestionario = datos.cuestionario_riesgo?.[0]

  const colorResultado = datos.resultado === 'normal' ? '#16a34a'
    : datos.resultado === 'anormal' ? '#dc2626' : '#d97706'

  const textoResultado = datos.resultado === 'normal' ? '✅ NORMAL'
    : datos.resultado === 'anormal' ? '🔴 ANORMAL — REQUIERE ATENCIÓN ESPECIALIZADA'
    : '⚠️ NO CONCLUYENTE — REQUIERE NUEVA EVALUACIÓN'

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Barra superior — NO se imprime */}
      <div className="print:hidden bg-white border-b p-4 flex gap-3 items-center sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
        >
          ✕ Cerrar pestaña
        </button>
        <button
          onClick={handleImprimir}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold text-sm"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
        <p className="text-xs text-gray-400">
          En el diálogo de impresión selecciona "Guardar como PDF" para obtener el archivo.
        </p>
      </div>

      {/* DOCUMENTO IMPRIMIBLE */}
      <div ref={printRef} className="max-w-2xl mx-auto bg-white my-6 p-8 shadow-lg print:shadow-none print:my-0 print:max-w-full">

        {/* Encabezado */}
        <div className="border-b-2 border-teal-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-teal-700">
                Sistema de Apoyo al Triaje de Cáncer con IA
              </h1>
              <p className="text-sm text-gray-500">Herramienta de apoyo clínico — UNIFRANZ Bolivia</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>ID: {datos.id?.slice(0, 8).toUpperCase()}</p>
              <p>Fecha: {new Date(datos.created_at).toLocaleDateString('es-BO')}</p>
              <p>Hora: {new Date(datos.created_at).toLocaleTimeString('es-BO')}</p>
            </div>
          </div>
          <div className="mt-3 px-3 py-1 bg-teal-50 rounded text-xs text-teal-700 inline-block">
            DOCUMENTO DE REFERENCIA MÉDICA
          </div>
        </div>

        {/* Datos del paciente */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">
            Datos del Paciente
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Nombre:</span> <strong>{datos.paciente?.nombre_completo}</strong></div>
            <div><span className="text-gray-500">CI/DNI:</span> <strong>{datos.paciente?.ci_dni}</strong></div>
            <div><span className="text-gray-500">Edad:</span> <strong>{calcularEdad(datos.paciente?.fecha_nacimiento)} años</strong></div>
            <div><span className="text-gray-500">Sexo:</span> <strong>{datos.paciente?.sexo === 'F' ? 'Femenino' : 'Masculino'}</strong></div>
            <div><span className="text-gray-500">Teléfono:</span> <strong>{datos.paciente?.telefono || '—'}</strong></div>
            <div><span className="text-gray-500">Fecha nac.:</span> <strong>{datos.paciente?.fecha_nacimiento}</strong></div>
          </div>
        </div>

        {/* Resultado del análisis */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">
            Resultado del Análisis de Triaje con IA
          </h2>

          <div className="p-4 rounded-xl border-2 text-center mb-4"
            style={{ borderColor: colorResultado, backgroundColor: colorResultado + '10' }}>
            <p className="text-2xl font-bold" style={{ color: colorResultado }}>
              {textoResultado}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Tipo de análisis: <strong>{datos.tipo_cancer?.toUpperCase()}</strong>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Prob. Normal (IA)</p>
              <p className="font-bold text-gray-800">{(datos.probabilidad_ia * 100)?.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Ajuste factores</p>
              <p className="font-bold text-blue-700">+{(datos.ajuste_riesgo * 100)?.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Probabilidad final</p>
              <p className="font-bold text-gray-800">{(datos.resultado_final * 100)?.toFixed(1)}%</p>
            </div>
          </div>

          {cuestionario && (
            <div className="text-sm">
              <p className="text-gray-500 mb-1">Factores de riesgo evaluados:</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                cuestionario.nivel_riesgo === 'alto' ? 'bg-red-100 text-red-700' :
                cuestionario.nivel_riesgo === 'moderado' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'}`}>
                Riesgo {cuestionario.nivel_riesgo} — {cuestionario.puntuacion} factores positivos
              </span>
            </div>
          )}
        </div>

        {/* Indicaciones */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">
            Indicaciones
          </h2>

          {datos.resultado === 'normal' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              <p className="font-semibold mb-1">✅ Resultado dentro de parámetros normales</p>
              <p>El análisis no identificó indicadores de anormalidad. Se recomienda continuar con los controles preventivos periódicos.</p>
              {cierre?.tiempo_proximo_control && (
                <p className="mt-2 font-medium">
                  Próximo control recomendado: <strong>{cierre.tiempo_proximo_control.replace('_', ' ')}</strong>
                </p>
              )}
            </div>
          )}

          {datos.resultado === 'anormal' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p className="font-semibold mb-1">🔴 Se identificaron indicadores de anormalidad</p>
              <p>El análisis identificó indicadores que requieren atención prioritaria. Se recomienda evaluación por especialista en patología.</p>
              {cierre?.centro_derivacion && (
                <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                  <p className="font-semibold text-gray-800">Centro de derivación:</p>
                  <p className="text-gray-700 text-base mt-1">{cierre.centro_derivacion}</p>
                  <p className="text-xs text-gray-500 mt-1">Presentar este documento al momento de la consulta</p>
                </div>
              )}
            </div>
          )}

          {datos.resultado === 'no_concluyente' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Resultado no concluyente</p>
              <p>El análisis no pudo determinar un resultado definitivo. Se requiere evaluación adicional por especialista.</p>
              {cierre?.centro_derivacion && (
                <div className="mt-3 p-3 bg-white border border-yellow-200 rounded-lg">
                  <p className="font-semibold text-gray-800">Centro de derivación:</p>
                  <p className="text-gray-700 text-base mt-1">{cierre.centro_derivacion}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Médico responsable */}
        <div className="mb-6">
          <h2 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide border-b pb-1">
            Médico Responsable
          </h2>
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p><strong>{datos.profiles?.nombre || 'Médico General'}</strong></p>
              <p>Sistema de Apoyo al Triaje de Cáncer con IA</p>
              <p>UNIFRANZ — Bolivia</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b-2 border-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Firma y sello</p>
            </div>
          </div>
        </div>

        {/* DISCLAIMER */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
          <p className="text-xs font-bold text-gray-700 mb-2 uppercase">⚠️ Aviso Legal Importante</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Este documento ha sido generado por un <strong>sistema de apoyo al triaje basado en Inteligencia Artificial</strong>.
            Los resultados presentados son orientativos y tienen como objetivo apoyar la decisión clínica del médico tratante,
            <strong> no reemplazar el criterio del médico especialista</strong>. El diagnóstico definitivo debe ser realizado
            por un profesional de la salud calificado mediante los métodos clínicos establecidos. Este sistema ha sido
            desarrollado como herramienta de triaje para zonas con acceso limitado a especialistas.
            <strong> UNIFRANZ Bolivia — Sistema de Apoyo al Triaje de Cáncer mediante IA.</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t text-center text-xs text-gray-400">
          <p>Documento generado el {new Date().toLocaleDateString('es-BO')} a las {new Date().toLocaleTimeString('es-BO')}</p>
          <p>ID de análisis: {datos.id} — Este documento es válido solo con firma y sello del médico responsable</p>
        </div>
      </div>
    </div>
  )
}

export default ImprimirResultado