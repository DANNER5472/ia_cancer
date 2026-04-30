import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

function MedicoHistorial() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [detalle, setDetalle] = useState({}) // { [casoId]: { antPersonales, antFamiliares } }

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('analisis')
        .select(`
          *,
          paciente(nombre_completo, ci_dni, fecha_nacimiento, peso, altura, presion_arterial, tipo_cancer_analizar, motivo_consulta),
          cierre_analisis(*),
          cuestionario_riesgo(puntuacion, nivel_riesgo, ajuste_porcentaje)
        `)
        .eq('medico_id', user.id)
        .order('created_at', { ascending: false })
      setCasos(data ?? [])
      setLoading(false)
    }
    cargar()
  }, [])

  const toggleExpandir = async (caso) => {
    if (expandido === caso.id) {
      setExpandido(null)
      return
    }
    setExpandido(caso.id)
    if (!detalle[caso.id]) {
      const [{ data: ap }, { data: af }] = await Promise.all([
        supabase.from('antecedentes_personales').select('*').eq('paciente_id', caso.paciente_id).single(),
        supabase.from('antecedentes_familiares').select('*').eq('paciente_id', caso.paciente_id).single(),
      ])
      setDetalle(prev => ({ ...prev, [caso.id]: { antPersonales: ap, antFamiliares: af } }))
    }
  }

  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '—'
    const hoy = new Date()
    const nac = new Date(fechaNac)
    return hoy.getFullYear() - nac.getFullYear() + ' años'
  }

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return null
    return parseFloat(peso) / (parseFloat(altura) ** 2)
  }

  const casosFiltrados = casos.filter(c => {
    const coincideBusqueda = c.paciente?.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.paciente?.ci_dni?.includes(busqueda)
    const coincideFiltro = filtro === 'todos' || c.resultado === filtro
    return coincideBusqueda && coincideFiltro
  })

  const colorResultado = (r) => {
    if (r === 'normal') return 'bg-green-100 text-green-700'
    if (r === 'anormal') return 'bg-red-100 text-red-700'
    return 'bg-yellow-100 text-yellow-700'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/medico/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-6">Historial de Casos</h1>

        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o CI..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 min-w-48"
          />
          <select
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="todos">Todos</option>
            <option value="normal">Normal</option>
            <option value="anormal">Anormal</option>
            <option value="no_concluyente">No concluyente</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : casosFiltrados.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-400 shadow-sm">
            No hay casos que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="space-y-3">
            {casosFiltrados.map(c => {
              const imc = calcularIMC(c.paciente?.peso, c.paciente?.altura)
              const det = detalle[c.id]
              const cuest = c.cuestionario_riesgo?.[0]
              const cierre = c.cierre_analisis?.[0]

              return (
                <div key={c.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">

                  {/* Cabecera — clickeable para expandir */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition select-none"
                    onClick={() => toggleExpandir(c)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-teal-700">{c.paciente?.nombre_completo}</h3>
                        <p className="text-sm text-gray-500">CI: {c.paciente?.ci_dni} — {calcularEdad(c.paciente?.fecha_nacimiento)}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                            {c.tipo_cancer}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorResultado(c.resultado)}`}>
                            {c.resultado === 'normal' ? '✅ NORMAL' :
                             c.resultado === 'anormal' ? '🔴 ANORMAL' : '⚠️ NO CONCLUYENTE'}
                          </span>
                          {cierre?.accion === 'derivacion' && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                              Derivado: {cierre.centro_derivacion}
                            </span>
                          )}
                          {cierre?.tiempo_proximo_control && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                              Control: {cierre.tiempo_proximo_control.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('es-BO')}</p>
                        <p className="text-sm font-medium text-teal-700">
                          {(c.probabilidad_final * 100 || c.resultado_final * 100)?.toFixed(1)}% anormal
                        </p>
                        <span className="text-xs text-gray-400 mt-1">{expandido === c.id ? '▲ Cerrar' : '▼ Ver detalle'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle expandido */}
                  {expandido === c.id && (
                    <div className="border-t bg-gray-50 px-5 py-5 space-y-5">

                      {/* Datos del paciente */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📋 Datos del paciente</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-700">
                          <span><strong>Fecha nac:</strong> {c.paciente?.fecha_nacimiento || '—'}</span>
                          <span><strong>Edad:</strong> {calcularEdad(c.paciente?.fecha_nacimiento)}</span>
                          <span><strong>Presión:</strong> {c.paciente?.presion_arterial || '—'}</span>
                          <span><strong>Peso:</strong> {c.paciente?.peso ? c.paciente.peso + ' kg' : '—'}</span>
                          <span><strong>Altura:</strong> {c.paciente?.altura ? c.paciente.altura + ' m' : '—'}</span>
                          <span>
                            <strong>IMC:</strong>{' '}
                            {imc
                              ? `${imc.toFixed(1)} ${imc >= 30 ? '🔴 Obesidad' : imc >= 25 ? '🟡 Sobrepeso' : '✅ Normal'}`
                              : '—'}
                          </span>
                          <span><strong>Tipo triaje:</strong> {c.paciente?.tipo_cancer_analizar || '—'}</span>
                          <span className="col-span-2"><strong>Motivo:</strong> {c.paciente?.motivo_consulta || '—'}</span>
                        </div>
                      </div>

                      {/* Antecedentes */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🏥 Antecedentes clínicos</h4>
                        {det ? (
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Enfermedades crónicas:</strong> {det.antPersonales?.enfermedades_cronicas || '—'}</p>
                            <p><strong>Alergias:</strong> {det.antPersonales?.alergias || '—'}</p>
                            <p><strong>Medicamentos habituales:</strong> {det.antPersonales?.medicamentos_habituales || '—'}</p>
                            <p><strong>Antecedentes familiares:</strong> {det.antFamiliares?.historial_cancer_familia || '—'}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Cargando antecedentes...</p>
                        )}
                      </div>

                      {/* Resultado IA */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🤖 Resultado del análisis IA</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <div className="text-center p-2 bg-white rounded-lg border">
                            <p className="text-xs text-gray-500">Prob. Normal</p>
                            <p className="font-bold text-gray-800">
                              {c.probabilidad_ia != null ? (c.probabilidad_ia * 100).toFixed(1) + '%' : '—'}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border">
                            <p className="text-xs text-gray-500">Prob. Anormal</p>
                            <p className="font-bold text-gray-800">
                              {c.probabilidad_ia != null ? ((1 - c.probabilidad_ia) * 100).toFixed(1) + '%' : '—'}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg border">
                            <p className="text-xs text-gray-500">Ajuste factores</p>
                            <p className="font-bold text-blue-700">
                              +{c.ajuste_riesgo != null ? (c.ajuste_riesgo * 100).toFixed(2) + '%' : '0%'}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border">
                            <p className="text-xs text-gray-500">Prob. Final</p>
                            <p className="font-bold text-gray-800">
                              {c.resultado_final != null ? (c.resultado_final * 100).toFixed(1) + '%' : '—'}
                            </p>
                          </div>
                        </div>
                        {cuest && (
                          <p className="text-sm text-gray-700">
                            <strong>Factores de riesgo:</strong> {cuest.puntuacion}/9 positivos —{' '}
                            Nivel:{' '}
                            <span className={`font-semibold ${
                              cuest.nivel_riesgo === 'alto' ? 'text-red-600' :
                              cuest.nivel_riesgo === 'moderado' ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {cuest.nivel_riesgo}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Cierre del caso */}
                      {cierre && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📝 Cierre del caso</h4>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Diagnóstico final:</strong> {cierre.diagnostico_final}</p>
                            {cierre.centro_derivacion && (
                              <p><strong>Derivado a:</strong> {cierre.centro_derivacion}</p>
                            )}
                            {cierre.tiempo_proximo_control && (
                              <p><strong>Próximo control:</strong> {cierre.tiempo_proximo_control.replace('_', ' ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Botón imprimir */}
                      {cierre && (
                        <button
                          onClick={() => window.open(`/medico/imprimir/${c.id}`, '_blank')}
                          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
                        >
                          🖨️ Imprimir documento
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicoHistorial