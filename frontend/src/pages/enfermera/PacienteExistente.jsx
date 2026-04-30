import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function PacienteExistente() {
  const { user } = useAuth()
  const id = window.location.pathname.split('/').pop()
  const [paciente, setPaciente] = useState(null)
  const [antPersonales, setAntPersonales] = useState(null)
  const [antFamiliares, setAntFamiliares] = useState(null)
  const [analisis, setAnalisis] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [biometricos, setBiometricos] = useState({ peso: '', presion_arterial: '' })
  const [nuevoMotivo, setNuevoMotivo] = useState({ motivo_consulta: '', tipo_cancer_analizar: 'cervical', consentimiento_ia: false })
  const [mensaje, setMensaje] = useState('')
  const [yaNotificado, setYaNotificado] = useState(false)
  const [notificando, setNotificando] = useState(false)
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const [{ data: p }, { data: ap }, { data: af }, { data: an }, { data: notifExistente }, { data: tecData }] = await Promise.all([
        supabase.from('paciente').select('*').eq('id', id).single(),
        supabase.from('antecedentes_personales').select('*').eq('paciente_id', id).single(),
        supabase.from('antecedentes_familiares').select('*').eq('paciente_id', id).single(),
        supabase.from('analisis').select('*').eq('paciente_id', id).order('created_at', { ascending: false }),
        supabase.from('notificacion').select('id').eq('paciente_id', id).eq('tipo', 'caso_pendiente').eq('leida', false).limit(1),
        supabase.from('profiles').select('id, nombre').eq('rol', 'tecnico').eq('activo', true)
      ])
      setPaciente(p)
      setAntPersonales(ap)
      setAntFamiliares(af)
      setAnalisis(an ?? [])
      setBiometricos({ peso: p?.peso ?? '', presion_arterial: p?.presion_arterial ?? '' })
      setTecnicos(tecData ?? [])
      if (tecData?.length === 1) setTecnicoSeleccionado(tecData[0].id)
      if (notifExistente?.length > 0) setYaNotificado(true)
      setLoading(false)
    }
    cargar()
  }, [id])

  const handleActualizarBiometricos = async () => {
    await supabase.from('paciente').update(biometricos).eq('id', id)
    setMensaje('Datos biométricos actualizados.')
    setEditando(false)
  }

  const handleNuevoMotivo = async () => {
    if (!nuevoMotivo.consentimiento_ia) { setMensaje('Sin consentimiento el sistema bloquea el caso.'); return }
    if (!tecnicoSeleccionado) { setMensaje('Debes seleccionar un técnico de laboratorio.'); return }
    if (yaNotificado) { setMensaje('Ya existe una notificación pendiente. El técnico ya fue notificado.'); return }

    setNotificando(true)
    await supabase.from('paciente').update({
      motivo_consulta: nuevoMotivo.motivo_consulta,
      tipo_cancer_analizar: nuevoMotivo.tipo_cancer_analizar,
      consentimiento_ia: true
    }).eq('id', id)

    await supabase.from('notificacion').insert([{
      usuario_destino_id: tecnicoSeleccionado,
      usuario_origen_id: user.id,
      tipo: 'caso_pendiente',
      paciente_id: id
    }])

    setYaNotificado(true)
    setNotificando(false)
    setMensaje('✅ Nuevo motivo registrado y técnico notificado.')
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" /></div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/enfermera/pacientes" className="text-sm text-gray-500 hover:underline">← Volver a buscar</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Paciente Existente</h1>
        <p className="text-gray-500 mb-6">{paciente?.nombre_completo} — CI: {paciente?.ci_dni}</p>

        {mensaje && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
            mensaje.includes('bloquea') || mensaje.includes('Ya existe') || mensaje.includes('Debes')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>{mensaje}</div>
        )}

        {/* Historial clínico */}
        <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Historial Clínico</h2>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <span><strong>Fecha nac:</strong> {paciente?.fecha_nacimiento}</span>
            <span><strong>Sexo:</strong> {paciente?.sexo}</span>
            <span><strong>Teléfono:</strong> {paciente?.telefono}</span>
            <span><strong>Tipo sangre:</strong> {paciente?.tipo_sangre}</span>
          </div>
          {antPersonales && (
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p><strong>Enfermedades crónicas:</strong> {antPersonales.enfermedades_cronicas || '—'}</p>
              <p><strong>Alergias:</strong> {antPersonales.alergias || '—'}</p>
              <p><strong>Medicamentos:</strong> {antPersonales.medicamentos_habituales || '—'}</p>
            </div>
          )}
          {antFamiliares && (
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Antecedentes familiares de cáncer:</strong> {antFamiliares.historial_cancer_familia || '—'}</p>
            </div>
          )}
        </div>

        {/* Datos biométricos */}
        <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Datos Biométricos</h2>
            <button onClick={() => setEditando(!editando)} className="text-sm text-teal-600 hover:underline">
              {editando ? 'Cancelar' : 'Actualizar'}
            </button>
          </div>
          {editando ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Peso (kg)</label>
                <input type="number" value={biometricos.peso} onChange={e => setBiometricos({...biometricos, peso: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Presión Arterial</label>
                <input value={biometricos.presion_arterial} onChange={e => setBiometricos({...biometricos, presion_arterial: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <button onClick={handleActualizarBiometricos} className="col-span-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Guardar</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <span><strong>Peso:</strong> {paciente?.peso} kg</span>
              <span><strong>Altura:</strong> {paciente?.altura} m</span>
              <span><strong>IMC:</strong> {paciente?.imc}</span>
              <span><strong>Presión:</strong> {paciente?.presion_arterial}</span>
            </div>
          )}
        </div>

        {/* Historial de análisis */}
        <div className="bg-white border rounded-xl p-6 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Historial de Análisis</h2>
          {analisis.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin análisis previos.</p>
          ) : (
            <div className="space-y-2">
              {analisis.map(a => (
                <div key={a.id} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{a.tipo_cancer}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${a.resultado === 'normal' ? 'bg-green-100 text-green-700' : a.resultado === 'anormal' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.resultado}
                  </span>
                  <span className="text-gray-400">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nuevo motivo de consulta */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Nuevo Motivo de Consulta</h2>

          {yaNotificado ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              <p className="font-semibold mb-1">✅ Técnico ya notificado</p>
              <p>Ya existe una notificación pendiente para este paciente. El técnico procesará la muestra en breve.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Motivo</label>
                <textarea value={nuevoMotivo.motivo_consulta} onChange={e => setNuevoMotivo({...nuevoMotivo, motivo_consulta: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" rows={2} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Tipo de Cáncer a Analizar</label>
                <select value={nuevoMotivo.tipo_cancer_analizar} onChange={e => setNuevoMotivo({...nuevoMotivo, tipo_cancer_analizar: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg">
                  <option value="cervical">Cervical</option>
                  <option value="mama">Mama</option>
                  <option value="pulmon">Pulmón</option>
                </select>
              </div>

              {/* Selector de técnico */}
              <div>
                <label className="text-sm font-medium text-gray-700">Técnico de Laboratorio *</label>
                <p className="text-xs text-gray-400 mb-2">Selecciona quién procesará la muestra</p>
                {tecnicos.length === 0 ? (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    No hay técnicos activos disponibles.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tecnicos.map(t => (
                      <div
                        key={t.id}
                        onClick={() => setTecnicoSeleccionado(t.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
                          tecnicoSeleccionado === t.id
                            ? 'bg-teal-50 border-teal-400 text-teal-800'
                            : 'bg-white border-gray-200 hover:border-teal-300 text-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tecnicoSeleccionado === t.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {t.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.nombre}</p>
                          <p className="text-xs text-gray-400">Técnico de laboratorio</p>
                        </div>
                        {tecnicoSeleccionado === t.id && <span className="ml-auto text-teal-600 text-sm font-medium">✓ Seleccionado</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input type="checkbox" id="consent2" checked={nuevoMotivo.consentimiento_ia} onChange={e => setNuevoMotivo({...nuevoMotivo, consentimiento_ia: e.target.checked})} className="mt-1" />
                <label htmlFor="consent2" className="text-sm text-yellow-800">El paciente autoriza el análisis con IA para apoyo al triaje.</label>
              </div>

              <button onClick={handleNuevoMotivo} disabled={notificando} className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {notificando ? 'Notificando...' : 'Registrar y Notificar al Técnico'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PacienteExistente