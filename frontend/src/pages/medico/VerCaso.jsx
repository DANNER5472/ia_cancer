import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'
import { PREGUNTAS, MODELOS_DISPONIBLES } from '../../config/factoresRiesgo'
import DashboardLayout from '../../layouts/DashboardLayout'

const HOSPITALES_BOLIVIA = [
  { ciudad: 'La Paz', nombre: 'Hospital de Clínicas — La Paz' },
  { ciudad: 'La Paz', nombre: 'Hospital del Tórax — La Paz' },
  { ciudad: 'La Paz', nombre: 'Hospital Oncológico — La Paz' },
  { ciudad: 'La Paz', nombre: 'Clínica Foianini — La Paz' },
  { ciudad: 'La Paz', nombre: 'Hospital Obrero N°1 — La Paz' },
  { ciudad: 'La Paz', nombre: 'Hospital de la Mujer — La Paz' },
  { ciudad: 'La Paz', nombre: 'Clínica Americana — La Paz' },
  { ciudad: 'Cochabamba', nombre: 'Hospital Viedma — Cochabamba' },
  { ciudad: 'Cochabamba', nombre: 'Clínica Los Olivos — Cochabamba' },
  { ciudad: 'Cochabamba', nombre: 'Hospital IESS — Cochabamba' },
  { ciudad: 'Cochabamba', nombre: 'Clínica Belga — Cochabamba' },
  { ciudad: 'Cochabamba', nombre: 'Hospital Univalle — Cochabamba' },
  { ciudad: 'Santa Cruz', nombre: 'Hospital Japonés — Santa Cruz' },
  { ciudad: 'Santa Cruz', nombre: 'Hospital Oncológico — Santa Cruz' },
  { ciudad: 'Santa Cruz', nombre: 'Clínica Foianini — Santa Cruz' },
  { ciudad: 'Santa Cruz', nombre: 'Hospital de la Mujer — Santa Cruz' },
  { ciudad: 'Santa Cruz', nombre: 'Clínica Los Olivos — Santa Cruz' },
  { ciudad: 'Oruro', nombre: 'Hospital General San Juan de Dios — Oruro' },
  { ciudad: 'Oruro', nombre: 'Hospital Obrero — Oruro' },
  { ciudad: 'Potosí', nombre: 'Hospital Daniel Bracamonte — Potosí' },
  { ciudad: 'Potosí', nombre: 'Hospital San Pedro — Potosí' },
  { ciudad: 'Sucre', nombre: 'Hospital Santa Bárbara — Sucre' },
  { ciudad: 'Sucre', nombre: 'Hospital Universitario — Sucre' },
  { ciudad: 'Beni', nombre: 'Hospital de Trinidad — Beni' },
  { ciudad: 'Pando', nombre: 'Hospital Roberto Galindo — Pando' },
  { ciudad: 'Tarija', nombre: 'Hospital San Juan de Dios — Tarija' },
  { ciudad: 'Tarija', nombre: 'Hospital Regional — Tarija' },
]

function SelectorUsuario({ usuarios, seleccionado, onSeleccionar, rol }) {
  if (usuarios.length === 0) return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      No hay {rol === 'enfermera' ? 'enfermeras' : 'técnicos'} activos disponibles.
    </div>
  )
  return (
    <div className="space-y-2">
      {usuarios.map(u => (
        <div
          key={u.id}
          onClick={() => onSeleccionar(u.id)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
            seleccionado === u.id
              ? 'bg-teal-50 border-teal-400 text-teal-800'
              : 'bg-white border-gray-200 hover:border-teal-300 text-gray-700'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${seleccionado === u.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {u.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{u.nombre}</p>
            <p className="text-xs text-gray-400 capitalize">{rol}</p>
          </div>
          {seleccionado === u.id && <span className="ml-auto text-teal-600 text-sm font-medium">✓ Seleccionado</span>}
        </div>
      ))}
    </div>
  )
}

function MedicoVerCaso() {
  const { user } = useAuth()
  const { pacienteId } = useParams()
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const notifId = params.get('notifId')

  const [paso, setPaso] = useState(1)
  const [paciente, setPaciente] = useState(null)
  const [muestra, setMuestra] = useState(null)
  const [antPersonales, setAntPersonales] = useState(null)
  const [antFamiliares, setAntFamiliares] = useState(null)
  const [noConcluyentePrevio, setNoConcluyentePrevio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [respuestas, setRespuestas] = useState({})
  const [analizando, setAnalizando] = useState(false)
  const [loaderMsg, setLoaderMsg] = useState('')
  const [resultado, setResultado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorIA, setErrorIA] = useState('')
  const [analisisGuardadoId, setAnalisisGuardadoId] = useState(null)
  const [ciudadFiltro, setCiudadFiltro] = useState('')
  const [busquedaHospital, setBusquedaHospital] = useState('')
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState('')
  const [tiempoControl, setTiempoControl] = useState('6_meses')
  const [enfermeras, setEnfermeras] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [enfermeraSeleccionada, setEnfermeraSeleccionada] = useState(null)
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const [{ data: p }, { data: m }, { data: ap }, { data: af }, { data: prev }, { data: enf }, { data: tec }] = await Promise.all([
        supabase.from('paciente').select('*').eq('id', pacienteId).single(),
        supabase.from('muestra').select('*').eq('paciente_id', pacienteId).eq('estado_imagen', 'pendiente').order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('antecedentes_personales').select('*').eq('paciente_id', pacienteId).single(),
        supabase.from('antecedentes_familiares').select('*').eq('paciente_id', pacienteId).single(),
        supabase.from('analisis').select('resultado').eq('paciente_id', pacienteId).eq('resultado', 'no_concluyente'),
        supabase.from('profiles').select('id, nombre').eq('rol', 'enfermera').eq('activo', true),
        supabase.from('profiles').select('id, nombre').eq('rol', 'tecnico').eq('activo', true),
      ])
      setPaciente(p)
      setMuestra(m)
      setAntPersonales(ap)
      setAntFamiliares(af)
      if (prev?.length >= 1) setNoConcluyentePrevio(true)
      setEnfermeras(enf ?? [])
      setTecnicos(tec ?? [])
      // ← eliminada autoselección
      setLoading(false)
    }
    cargar()
  }, [pacienteId])

  const calcularEdad = () => {
    if (!paciente?.fecha_nacimiento) return 0
    return new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear()
  }

  const calcularIMC = () => {
    if (!paciente?.peso || !paciente?.altura) return null
    return parseFloat(paciente.peso) / (parseFloat(paciente.altura) ** 2)
  }

  const obtenerPreguntas = () => {
    if (!paciente?.tipo_cancer_analizar) return []
    const edad = calcularEdad()
    const base = PREGUNTAS[paciente.tipo_cancer_analizar] ?? []
    return base.filter(p => edad >= p.edadMin)
  }

  const imcPaciente = calcularIMC()
  const tieneSobrepeso = imcPaciente ? imcPaciente >= 25 : false

  const handleRechazarImagen = async () => {
    if (!tecnicoSeleccionado) { setMensaje('Selecciona un técnico para notificar el rechazo.'); return }
    await supabase.from('muestra').update({ estado_imagen: 'rechazada', motivo_rechazo: 'Imagen no apta para análisis' }).eq('id', muestra.id)
    await supabase.from('notificacion').insert([{
      usuario_destino_id: tecnicoSeleccionado,
      usuario_origen_id: user.id,
      tipo: 'imagen_rechazada',
      paciente_id: pacienteId
    }])
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)
    setMensaje('Imagen rechazada. Técnico notificado.')
    setTimeout(() => navigate('/medico/casos'), 2000)
  }

  const handleAnalizar = async () => {
    if (!muestra?.imagen_url) {
      setErrorIA('⚠️ No hay imagen disponible. No es posible ejecutar el análisis.')
      return
    }
    setErrorIA('')
    setAnalizando(true)

    const loaders = ['Procesando imagen...', 'Analizando con IA...', 'Calculando resultado...']
    for (const msg of loaders) {
      setLoaderMsg(msg)
      await new Promise(r => setTimeout(r, 1200))
    }

    const factores = { ...respuestas }
    if (paciente?.tipo_cancer_analizar === 'mama' && tieneSobrepeso) {
      factores['pregunta_10'] = true
    }

    try {
      const imgResponse = await fetch(muestra.imagen_url)
      const blob = await imgResponse.blob()
      const formData = new FormData()
      formData.append('image', blob, 'imagen.jpg')
      formData.append('factores', JSON.stringify(factores))

      const puertos = { cervical: 5001, mama: 5002, pulmon: 5003 }
      const puerto = puertos[paciente.tipo_cancer_analizar]
      const res = await fetch(`http://localhost:${puerto}/predict`, { method: 'POST', body: formData })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error en el servidor de IA')
      }

      const data = await res.json()
      setResultado({
        resultado: data.resultado,
        probabilidadNormal: data.probabilidad_normal,
        probabilidadAnormal: data.probabilidad_anormal,
        ajusteAplicado: data.ajuste_aplicado,
        probabilidadFinal: data.probabilidad_final,
        confianza: data.confianza,
        factoresPositivos: data.factores_positivos,
      })
      setPaso(3)
    } catch (err) {
      setErrorIA(`❌ No se pudo conectar con el servidor de IA. Verifica que el servicio esté corriendo en el puerto correcto. (${err.message})`)
    } finally {
      setAnalizando(false)
    }
  }

  const guardarAnalisis = async (resultadoTexto) => {
    const puntaje = Object.values(respuestas).filter(r => r === true).length
    const { data: analisis, error } = await supabase.from('analisis').insert({
      paciente_id: pacienteId, medico_id: user.id, muestra_id: muestra.id,
      tipo_cancer: paciente.tipo_cancer_analizar,
      probabilidad_ia: resultado.probabilidadNormal / 100,
      ajuste_riesgo: resultado.ajusteAplicado / 100,
      resultado_final: resultado.probabilidadFinal / 100,
      resultado: resultadoTexto, confianza: resultado.confianza / 100
    }).select('id').single()
    if (error || !analisis?.id) return null

    const cuestionarioData = { analisis_id: analisis.id, puntuacion: puntaje }
    const preguntas = obtenerPreguntas()
    preguntas.forEach((_, i) => {
      cuestionarioData[`pregunta_${i + 1}`] = respuestas[`pregunta_${i + 1}`] ?? false
    })
    cuestionarioData.nivel_riesgo = puntaje >= 7 ? 'alto' : puntaje >= 4 ? 'moderado' : 'bajo'
    cuestionarioData.ajuste_porcentaje = resultado.ajusteAplicado
    await supabase.from('cuestionario_riesgo').insert(cuestionarioData)
    return analisis.id
  }

  const handleCerrarNormal = async () => {
    if (!enfermeraSeleccionada) { setMensaje('Selecciona una enfermera para notificar.'); return }
    setGuardando(true)
    const analisisId = await guardarAnalisis('normal')
    if (!analisisId) { setGuardando(false); return }
    await supabase.from('cierre_analisis').insert({
      analisis_id: analisisId, medico_id: user.id,
      diagnostico_final: 'NORMAL — Sin células anormales detectadas',
      accion: 'normal', tiempo_proximo_control: tiempoControl
    })
    await supabase.from('muestra').update({ estado_imagen: 'aprobada' }).eq('id', muestra.id)
    await supabase.from('notificacion').insert([{
      usuario_destino_id: enfermeraSeleccionada,
      usuario_origen_id: user.id,
      tipo: 'resultado_normal',
      paciente_id: pacienteId,
      analisis_id: analisisId
    }])
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)
    setAnalisisGuardadoId(analisisId)
    setGuardando(false)
    setMensaje('✅ Caso cerrado. Enfermera notificada.')
  }

  const handleCerrarAnormal = async () => {
    if (!hospitalSeleccionado) { setMensaje('Selecciona un centro de derivación.'); return }
    if (!enfermeraSeleccionada) { setMensaje('Selecciona una enfermera para notificar.'); return }
    setGuardando(true)
    const analisisId = await guardarAnalisis('anormal')
    if (!analisisId) { setGuardando(false); return }
    await supabase.from('cierre_analisis').insert({
      analisis_id: analisisId, medico_id: user.id,
      diagnostico_final: 'ANORMAL — Se detectaron células anormales',
      accion: 'derivacion', centro_derivacion: hospitalSeleccionado
    })
    await supabase.from('muestra').update({ estado_imagen: 'aprobada' }).eq('id', muestra.id)
    await supabase.from('notificacion').insert([{
      usuario_destino_id: enfermeraSeleccionada,
      usuario_origen_id: user.id,
      tipo: 'resultado_anormal',
      paciente_id: pacienteId,
      analisis_id: analisisId
    }])
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)
    setAnalisisGuardadoId(analisisId)
    setGuardando(false)
    setMensaje('🔴 Caso cerrado. Paciente derivado. Enfermera notificada.')
  }

  const handleDerivarNoConcluyente = async () => {
    if (!hospitalSeleccionado) { setMensaje('Selecciona un centro de derivación.'); return }
    if (!enfermeraSeleccionada) { setMensaje('Selecciona una enfermera para notificar.'); return }
    setGuardando(true)
    const analisisId = await guardarAnalisis('no_concluyente')
    if (!analisisId) { setGuardando(false); return }
    await supabase.from('cierre_analisis').insert({
      analisis_id: analisisId, medico_id: user.id,
      diagnostico_final: 'NO CONCLUYENTE — Segundo resultado, derivado a especialista',
      accion: 'derivacion', centro_derivacion: hospitalSeleccionado
    })
    await supabase.from('muestra').update({ estado_imagen: 'aprobada' }).eq('id', muestra.id)
    await supabase.from('notificacion').insert([{
      usuario_destino_id: enfermeraSeleccionada,
      usuario_origen_id: user.id,
      tipo: 'resultado_anormal',
      paciente_id: pacienteId,
      analisis_id: analisisId
    }])
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)
    setAnalisisGuardadoId(analisisId)
    setGuardando(false)
    setMensaje('⚠️ Caso cerrado. Paciente derivado. Enfermera notificada.')
  }

  const handleNoConcluyente = async () => {
    if (!tecnicoSeleccionado) { setMensaje('Selecciona un técnico para solicitar nueva muestra.'); return }
    setGuardando(true)
    const analisisId = await guardarAnalisis('no_concluyente')
    if (!analisisId) { setGuardando(false); return }
    await supabase.from('notificacion').insert([{
      usuario_destino_id: tecnicoSeleccionado,
      usuario_origen_id: user.id,
      tipo: 'no_concluyente',
      paciente_id: pacienteId
    }])
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)
    setAnalisisGuardadoId(analisisId)
    setGuardando(false)
    setMensaje('⚠️ Técnico notificado para nueva muestra.')
  }

  const preguntas = obtenerPreguntas()
  const modeloDisponible = MODELOS_DISPONIBLES[paciente?.tipo_cancer_analizar]
  const ciudades = [...new Set(HOSPITALES_BOLIVIA.map(h => h.ciudad))]
  const hospitalesFiltrados = HOSPITALES_BOLIVIA.filter(h => {
    const coincideCiudad = !ciudadFiltro || h.ciudad === ciudadFiltro
    const coincideBusqueda = h.nombre.toLowerCase().includes(busquedaHospital.toLowerCase())
    return coincideCiudad && coincideBusqueda
  })

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <a href="/medico/casos" className="text-sm text-gray-500 hover:underline">← Volver a casos</a>
          <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Análisis de Caso</h1>
          <p className="text-gray-500 mb-6">{paciente?.nombre_completo} — CI: {paciente?.ci_dni}</p>

          <div className="flex gap-2 mb-8">
            {['Verificar imagen', 'Cuestionario IA', 'Resultado'].map((p, i) => (
              <div key={i} className={`flex-1 text-center text-xs py-2 rounded-lg font-medium ${paso >= i + 1 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{p}</div>
            ))}
          </div>

          {mensaje && (
            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {mensaje}
              {analisisGuardadoId && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => window.open(`/medico/imprimir/${analisisGuardadoId}`, '_blank')} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium">
                    🖨️ Imprimir documento de referencia
                  </button>
                  <button onClick={() => navigate('/medico/casos')} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
                    Volver a casos →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PASO 1 */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-3">Historial Clínico</h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span><strong>Fecha nac:</strong> {paciente?.fecha_nacimiento}</span>
                  <span><strong>Edad:</strong> {calcularEdad()} años</span>
                  <span><strong>Peso:</strong> {paciente?.peso} kg</span>
                  <span><strong>Altura:</strong> {paciente?.altura} m</span>
                  <span><strong>IMC:</strong> {imcPaciente?.toFixed(1)} {imcPaciente >= 30 ? '🔴 Obesidad' : imcPaciente >= 25 ? '🟡 Sobrepeso' : '✅ Normal'}</span>
                  <span><strong>Presión:</strong> {paciente?.presion_arterial}</span>
                  <span><strong>Tipo triaje:</strong> {paciente?.tipo_cancer_analizar}</span>
                  <span><strong>Motivo:</strong> {paciente?.motivo_consulta}</span>
                </div>
                {antPersonales && (
                  <div className="mt-3 text-sm text-gray-600 space-y-1 border-t pt-3">
                    <p><strong>Enfermedades crónicas:</strong> {antPersonales.enfermedades_cronicas || '—'}</p>
                    <p><strong>Alergias:</strong> {antPersonales.alergias || '—'}</p>
                    <p><strong>Medicamentos:</strong> {antPersonales.medicamentos_habituales || '—'}</p>
                  </div>
                )}
                {antFamiliares && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Antecedentes familiares:</strong> {antFamiliares.historial_cancer_familia || '—'}</p>
                  </div>
                )}
              </div>

              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-3">Imagen Subida por el Técnico</h2>
                {muestra?.imagen_url ? (
                  <>
                    <img src={muestra.imagen_url} alt="muestra" className="max-h-80 mx-auto rounded-lg object-contain border" />

                    {/* Selector de técnico siempre visible para rechazo */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Técnico a notificar si rechazas la imagen:</p>
                      <SelectorUsuario usuarios={tecnicos} seleccionado={tecnicoSeleccionado} onSeleccionar={setTecnicoSeleccionado} rol="tecnico" />
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setPaso(2)} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">
                        ✓ Aprobar imagen y continuar
                      </button>
                      <button onClick={handleRechazarImagen} className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium">
                        ✗ Rechazar imagen
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-4xl mb-3">⚠️</p>
                    <p className="text-red-700 font-semibold text-lg mb-2">Sin imagen disponible</p>
                    <p className="text-red-600 text-sm mb-4">El técnico aún no ha subido la imagen de la muestra.<br />No es posible continuar con el análisis.</p>
                    <button onClick={() => navigate('/medico/casos')} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                      ← Volver a casos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div className="bg-white border rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-1">Cuestionario de Factores de Riesgo</h2>
              <p className="text-sm text-gray-500 mb-4">
                Mostrando {preguntas.length} preguntas para paciente de {calcularEdad()} años.
              </p>

              {paciente?.tipo_cancer_analizar === 'mama' && imcPaciente && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${imcPaciente >= 30 ? 'bg-red-50 border-red-200 text-red-700' : imcPaciente >= 25 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <strong>IMC del paciente: {imcPaciente.toFixed(1)}</strong> —
                  {imcPaciente >= 30 ? ' 🔴 Obesidad (factor automático activado)' : imcPaciente >= 25 ? ' 🟡 Sobrepeso (factor automático activado)' : ' ✅ Peso normal'}
                </div>
              )}

              <div className="space-y-3">
                {preguntas.map((p, i) => (
                  <div key={p.id} className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-sm text-gray-700 mb-2">{i + 1}. {p.texto}</p>
                    <div className="flex gap-2">
                      {[
                        { val: true, label: 'Sí', active: 'bg-red-500 text-white border-red-500', inactive: 'bg-white text-gray-600 border-gray-300 hover:border-red-300' },
                        { val: false, label: 'No', active: 'bg-green-500 text-white border-green-500', inactive: 'bg-white text-gray-600 border-gray-300 hover:border-green-300' },
                        { val: null, label: 'No sabe', active: 'bg-gray-400 text-white border-gray-400', inactive: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400' },
                      ].map(btn => (
                        <button key={btn.label}
                          onClick={() => setRespuestas(prev => ({ ...prev, [p.id]: btn.val }))}
                          className={`px-3 py-1 rounded text-xs font-medium border transition ${respuestas[p.id] === btn.val ? btn.active : btn.inactive}`}
                        >{btn.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                Factores positivos: <strong>{Object.values(respuestas).filter(r => r === true).length}/{preguntas.length}</strong>
                {paciente?.tipo_cancer_analizar === 'mama' && tieneSobrepeso && (
                  <span className="ml-2">+ IMC automático activado</span>
                )}
              </div>

              {errorIA && (
                <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {errorIA}
                </div>
              )}

              {!modeloDisponible ? (
                <div className="mt-6 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm text-center">
                  ⚠️ El modelo de IA para <strong>{paciente?.tipo_cancer_analizar}</strong> aún no está disponible.
                </div>
              ) : analizando ? (
                <div className="mt-6 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-3" />
                  <p className="text-teal-700 font-medium">{loaderMsg}</p>
                </div>
              ) : (
                <button onClick={handleAnalizar} className="w-full mt-6 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold">
                  Ejecutar Análisis de IA →
                </button>
              )}
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && resultado && (
            <div className="space-y-4">
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-800 mb-4">Resultado del Análisis</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Prob. Normal</p><p className="text-xl font-bold text-gray-800">{resultado.probabilidadNormal?.toFixed(1)}%</p></div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Prob. Anormal</p><p className="text-xl font-bold text-gray-800">{resultado.probabilidadAnormal?.toFixed(1)}%</p></div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl"><p className="text-xs text-gray-500">Ajuste factores</p><p className="text-xl font-bold text-blue-700">+{resultado.ajusteAplicado?.toFixed(2)}%</p></div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-xs text-gray-500">Prob. Final</p><p className="text-xl font-bold text-gray-800">{resultado.probabilidadFinal?.toFixed(1)}%</p></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-1">
                  <div className={`h-4 rounded-full transition-all ${resultado.resultado === 'normal' ? 'bg-green-500' : resultado.resultado === 'anormal' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${resultado.probabilidadFinal}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mb-4">
                  <span>Normal (0-40%)</span><span>No concluyente (40-60%)</span><span>Anormal (+60%)</span>
                </div>
                <div className={`text-center p-6 rounded-xl font-bold text-2xl ${resultado.resultado === 'normal' ? 'bg-green-50 text-green-700 border border-green-200' : resultado.resultado === 'anormal' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                  {resultado.resultado === 'normal' ? '✅ NORMAL' : resultado.resultado === 'anormal' ? '🔴 ANORMAL' : '⚠️ NO CONCLUYENTE'}
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">Sistema de apoyo al triaje. No reemplaza al especialista médico.</p>
              </div>

              {/* CIERRE NORMAL */}
              {resultado.resultado === 'normal' && !analisisGuardadoId && (
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-gray-800">Cierre: Resultado Normal</h2>
                  <div>
                    <label className="text-sm text-gray-600">Tiempo de próximo control</label>
                    <select value={tiempoControl} onChange={e => setTiempoControl(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg">
                      <option value="3_meses">3 meses</option>
                      <option value="6_meses">6 meses</option>
                      <option value="1_anio">1 año</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Enfermera a notificar *</p>
                    <SelectorUsuario usuarios={enfermeras} seleccionado={enfermeraSeleccionada} onSeleccionar={setEnfermeraSeleccionada} rol="enfermera" />
                  </div>
                  <button onClick={handleCerrarNormal} disabled={guardando} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Cerrar caso y notificar enfermera'}
                  </button>
                </div>
              )}

              {/* CIERRE ANORMAL */}
              {resultado.resultado === 'anormal' && !analisisGuardadoId && (
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-gray-800">Cierre: Resultado Anormal</h2>
                  <p className="text-sm text-gray-600">Selecciona el centro de derivación:</p>
                  <div className="flex gap-2">
                    <select value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                      <option value="">Todas las ciudades</option>
                      {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input value={busquedaHospital} onChange={e => setBusquedaHospital(e.target.value)} placeholder="Buscar hospital..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                    {hospitalesFiltrados.map(h => (
                      <div key={h.nombre} onClick={() => setHospitalSeleccionado(h.nombre)} className={`px-4 py-3 cursor-pointer text-sm transition ${hospitalSeleccionado === h.nombre ? 'bg-teal-50 text-teal-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                        {h.nombre}
                      </div>
                    ))}
                  </div>
                  {hospitalSeleccionado && <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">✓ <strong>{hospitalSeleccionado}</strong></div>}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Enfermera a notificar *</p>
                    <SelectorUsuario usuarios={enfermeras} seleccionado={enfermeraSeleccionada} onSeleccionar={setEnfermeraSeleccionada} rol="enfermera" />
                  </div>
                  <button onClick={handleCerrarAnormal} disabled={guardando || !hospitalSeleccionado} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50">
                    {guardando ? 'Guardando...' : 'Cerrar caso y derivar a especialista'}
                  </button>
                </div>
              )}

              {/* CIERRE NO CONCLUYENTE */}
              {resultado.resultado === 'no_concluyente' && !analisisGuardadoId && (
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-gray-800">Resultado No Concluyente</h2>
                  {noConcluyentePrevio ? (
                    <>
                      <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                        ⚠️ Este paciente ya tuvo un resultado no concluyente previo. Se recomienda derivar.
                      </div>
                      <div className="flex gap-2">
                        <select value={ciudadFiltro} onChange={e => setCiudadFiltro(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                          <option value="">Todas las ciudades</option>
                          {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={busquedaHospital} onChange={e => setBusquedaHospital(e.target.value)} placeholder="Buscar hospital..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                        {hospitalesFiltrados.map(h => (
                          <div key={h.nombre} onClick={() => setHospitalSeleccionado(h.nombre)} className={`px-4 py-3 cursor-pointer text-sm transition ${hospitalSeleccionado === h.nombre ? 'bg-teal-50 text-teal-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>
                            {h.nombre}
                          </div>
                        ))}
                      </div>
                      {hospitalSeleccionado && <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">✓ <strong>{hospitalSeleccionado}</strong></div>}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Enfermera a notificar *</p>
                        <SelectorUsuario usuarios={enfermeras} seleccionado={enfermeraSeleccionada} onSeleccionar={setEnfermeraSeleccionada} rol="enfermera" />
                      </div>
                      <button onClick={handleDerivarNoConcluyente} disabled={guardando || !hospitalSeleccionado} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50">
                        {guardando ? 'Guardando...' : 'Derivar a especialista'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">El resultado no es concluyente. Se solicitará nueva muestra al técnico.</p>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Técnico a notificar *</p>
                        <SelectorUsuario usuarios={tecnicos} seleccionado={tecnicoSeleccionado} onSeleccionar={setTecnicoSeleccionado} rol="tecnico" />
                      </div>
                      <button onClick={handleNoConcluyente} disabled={guardando} className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold disabled:opacity-50">
                        {guardando ? 'Enviando...' : 'Solicitar nueva muestra al técnico'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MedicoVerCaso