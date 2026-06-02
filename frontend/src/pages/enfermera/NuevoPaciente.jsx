import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

function NuevoPaciente() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = new URLSearchParams(window.location.search)
  const ciInicial = params.get('ci') ?? ''

  const [paso, setPaso] = useState(1)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errores, setErrores] = useState({})
  const [tecnicos, setTecnicos] = useState([])
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null)

  const [identificacion, setIdentificacion] = useState({
    ci_dni: ciInicial, nombre_completo: '', fecha_nacimiento: '',
    sexo: 'F', nacionalidad: 'Boliviana', direccion: '', telefono: ''
  })
  const [biometricos, setBiometricos] = useState({
    peso: '', altura: '', tipo_sangre: '', presion_arterial: ''
  })
  const [antPersonales, setAntPersonales] = useState({
    enfermedades_cronicas: '', cirugias_previas: '',
    medicamentos_habituales: '', alergias: '', vacunas: ''
  })
  const [antFamiliares, setAntFamiliares] = useState({
    historial_cancer_familia: '', tipo_cancer_familiar: ''
  })
  const [consulta, setConsulta] = useState({
    motivo_consulta: '', tipo_cancer_analizar: 'cervical', consentimiento_ia: false
  })

  useEffect(() => {
    supabase.from('profiles').select('id, nombre').eq('rol', 'tecnico').eq('activo', true)
      .then(({ data }) => {
        setTecnicos(data ?? [])
      })
  }, [])

  const handleTipoCancer = (tipo) => {
    setConsulta({ ...consulta, tipo_cancer_analizar: tipo })
    // Cervical siempre femenino, otros tipos permiten selección libre
    if (tipo === 'cervical') {
      setIdentificacion(prev => ({ ...prev, sexo: 'F' }))
    }
  }

  const validarPaso = (p) => {
    const nuevosErrores = {}
    if (p === 1) {
      if (!identificacion.ci_dni.trim()) nuevosErrores.ci_dni = 'CI/DNI es obligatorio'
      if (!identificacion.nombre_completo.trim()) nuevosErrores.nombre_completo = 'Nombre completo es obligatorio'
      if (!identificacion.fecha_nacimiento) nuevosErrores.fecha_nacimiento = 'Fecha de nacimiento es obligatoria'
      if (!identificacion.telefono.trim()) nuevosErrores.telefono = 'Teléfono es obligatorio'
    }
    if (p === 2) {
      if (!biometricos.peso) nuevosErrores.peso = 'Peso es obligatorio'
      if (!biometricos.altura) nuevosErrores.altura = 'Altura es obligatoria'
      if (biometricos.peso && (parseFloat(biometricos.peso) < 20 || parseFloat(biometricos.peso) > 300))
        nuevosErrores.peso = 'Peso debe estar entre 20 y 300 kg'
      if (biometricos.altura && (parseFloat(biometricos.altura) < 0.5 || parseFloat(biometricos.altura) > 2.5))
        nuevosErrores.altura = 'Altura debe estar entre 0.5 y 2.5 m'
    }
    if (p === 5) {
      if (!consulta.motivo_consulta.trim()) nuevosErrores.motivo_consulta = 'Motivo de consulta es obligatorio'
      if (!consulta.consentimiento_ia) nuevosErrores.consentimiento_ia = 'El consentimiento informado es obligatorio'
      if (!tecnicoSeleccionado) nuevosErrores.tecnico = 'Debes seleccionar un técnico de laboratorio'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const handleSiguiente = () => {
    if (validarPaso(paso)) { setPaso(p => p + 1); setMensaje('') }
  }

  const handleFinalizar = async () => {
    if (!validarPaso(5)) return
    setGuardando(true)

    let imc = null
    if (biometricos.peso && biometricos.altura)
      imc = parseFloat((parseFloat(biometricos.peso) / (parseFloat(biometricos.altura) ** 2)).toFixed(2))

    const { data: paciente, error } = await supabase.from('paciente').insert({
      ci_dni: identificacion.ci_dni.trim(),
      nombre_completo: identificacion.nombre_completo.trim(),
      fecha_nacimiento: identificacion.fecha_nacimiento,
      sexo: consulta.tipo_cancer_analizar === 'cervical' ? 'F' : identificacion.sexo,
      nacionalidad: identificacion.nacionalidad || null,
      direccion: identificacion.direccion || null,
      telefono: identificacion.telefono.trim(),
      peso: biometricos.peso ? parseFloat(biometricos.peso) : null,
      altura: biometricos.altura ? parseFloat(biometricos.altura) : null,
      tipo_sangre: biometricos.tipo_sangre || null,
      presion_arterial: biometricos.presion_arterial || null,
      imc,
      motivo_consulta: consulta.motivo_consulta.trim(),
      tipo_cancer_analizar: consulta.tipo_cancer_analizar,
      consentimiento_ia: true,
      registrado_por: user.id
    }).select().single()

    if (error) { setMensaje('Error: ' + error.message); setGuardando(false); return }

    await supabase.from('antecedentes_personales').insert({
      paciente_id: paciente.id,
      enfermedades_cronicas: antPersonales.enfermedades_cronicas || null,
      cirugias_previas: antPersonales.cirugias_previas || null,
      medicamentos_habituales: antPersonales.medicamentos_habituales || null,
      alergias: antPersonales.alergias || null,
      vacunas: antPersonales.vacunas || null
    })

    await supabase.from('antecedentes_familiares').insert({
      paciente_id: paciente.id,
      historial_cancer_familia: antFamiliares.historial_cancer_familia || null,
      tipo_cancer_familiar: antFamiliares.tipo_cancer_familiar || null
    })

    await supabase.from('notificacion').insert([{
      usuario_destino_id: tecnicoSeleccionado,
      usuario_origen_id: user.id,
      tipo: 'caso_pendiente',
      paciente_id: paciente.id
    }])

    setGuardando(false)
    setMensaje('✅ Paciente registrado y técnico notificado.')
    setTimeout(() => navigate('/enfermera/pacientes'), 2000)
  }

  const inputClass = (campo) => `w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${errores[campo] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`
  const labelClass = "block text-sm font-medium text-gray-700"
  const errorClass = "text-red-500 text-xs mt-1"

  const calcularEdad = () => {
    if (!identificacion.fecha_nacimiento) return null
    return new Date().getFullYear() - new Date(identificacion.fecha_nacimiento).getFullYear()
  }
  const edad = calcularEdad()
  const imc = biometricos.peso && biometricos.altura
    ? (parseFloat(biometricos.peso) / (parseFloat(biometricos.altura) ** 2)).toFixed(1) : null
  const categoriaIMC = () => {
    if (!imc) return null
    if (imc < 18.5) return { texto: 'Bajo peso', color: 'text-blue-600' }
    if (imc < 25) return { texto: 'Normal', color: 'text-green-600' }
    if (imc < 30) return { texto: 'Sobrepeso', color: 'text-yellow-600' }
    return { texto: 'Obesidad', color: 'text-red-600' }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <a href="/enfermera/pacientes" className="text-sm text-gray-500 hover:underline">← Volver a buscar</a>
          <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-2">Registrar Nuevo Paciente</h1>

          <div className="flex gap-2 mb-2">
            {[1,2,3,4,5].map(p => (
              <div key={p} className={`flex-1 h-2 rounded-full transition-all ${paso >= p ? 'bg-teal-500' : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-6">Paso {paso} de 5</p>

          {mensaje && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${mensaje.includes('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              {mensaje}
            </div>
          )}

          <div className="bg-white border rounded-xl p-6 shadow-sm">

            {/* PASO 1 — Datos de Identificación + Tipo de Cáncer */}
            {paso === 1 && (
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Paso 1 — Datos de Identificación</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Tipo de cáncer PRIMERO para que el sexo se ajuste */}
                  <div className="md:col-span-2">
                    <label className={labelClass}>Tipo de Cáncer a Analizar</label>
                    <div className="grid grid-cols-3 gap-3 mt-1">
                      {[
                        { valor: 'cervical', label: 'Cervical', icono: '🔬', desc: 'Papanicolaou' },
                        { valor: 'mama', label: 'Mama', icono: '🩺', desc: 'Biopsia' },
                        { valor: 'pulmon', label: 'Pulmón', icono: '🫁', desc: 'Biopsia' },
                      ].map(op => (
                        <div
                          key={op.valor}
                          onClick={() => handleTipoCancer(op.valor)}
                          className={`flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition ${
                            consulta.tipo_cancer_analizar === op.valor
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 hover:border-teal-300 text-gray-600'
                          }`}
                        >
                          <span className="text-2xl mb-1">{op.icono}</span>
                          <span className="font-semibold text-sm">{op.label}</span>
                          <span className="text-xs text-gray-400">{op.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>CI/DNI *</label>
                    <input value={identificacion.ci_dni} onChange={e => setIdentificacion({...identificacion, ci_dni: e.target.value})} className={inputClass('ci_dni')} placeholder="12345678" />
                    {errores.ci_dni && <p className={errorClass}>{errores.ci_dni}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Nombre Completo *</label>
                    <input value={identificacion.nombre_completo} onChange={e => setIdentificacion({...identificacion, nombre_completo: e.target.value})} className={inputClass('nombre_completo')} />
                    {errores.nombre_completo && <p className={errorClass}>{errores.nombre_completo}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de Nacimiento *</label>
                    <input type="date" value={identificacion.fecha_nacimiento} onChange={e => setIdentificacion({...identificacion, fecha_nacimiento: e.target.value})} className={inputClass('fecha_nacimiento')} max={new Date().toISOString().split('T')[0]} />
                    {errores.fecha_nacimiento && <p className={errorClass}>{errores.fecha_nacimiento}</p>}
                    {edad && <p className="text-xs text-teal-600 mt-1">Edad: {edad} años</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Sexo</label>
                    {consulta.tipo_cancer_analizar === 'cervical' ? (
                      <div className="mt-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                        Femenino (requerido para cáncer cervical)
                      </div>
                    ) : (
                      <select value={identificacion.sexo} onChange={e => setIdentificacion({...identificacion, sexo: e.target.value})} className={inputClass('sexo')}>
                        <option value="F">Femenino</option>
                        <option value="M">Masculino</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Nacionalidad</label>
                    <input value={identificacion.nacionalidad} onChange={e => setIdentificacion({...identificacion, nacionalidad: e.target.value})} className={inputClass('nacionalidad')} />
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono *</label>
                    <input value={identificacion.telefono} onChange={e => setIdentificacion({...identificacion, telefono: e.target.value})} className={inputClass('telefono')} placeholder="78901234" />
                    {errores.telefono && <p className={errorClass}>{errores.telefono}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Dirección</label>
                    <input value={identificacion.direccion} onChange={e => setIdentificacion({...identificacion, direccion: e.target.value})} className={inputClass('direccion')} />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Paso 2 — Datos Biométricos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Peso (kg) *</label>
                    <input type="number" step="0.1" min="20" max="300" value={biometricos.peso} onChange={e => setBiometricos({...biometricos, peso: e.target.value})} className={inputClass('peso')} placeholder="65.5" />
                    {errores.peso && <p className={errorClass}>{errores.peso}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Altura (m) *</label>
                    <input type="number" step="0.01" min="0.5" max="2.5" value={biometricos.altura} onChange={e => setBiometricos({...biometricos, altura: e.target.value})} className={inputClass('altura')} placeholder="1.65" />
                    {errores.altura && <p className={errorClass}>{errores.altura}</p>}
                  </div>
                  {imc && (
                    <div className="md:col-span-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">IMC calculado: <strong>{imc}</strong> — <span className={`ml-1 font-medium ${categoriaIMC()?.color}`}>{categoriaIMC()?.texto}</span></p>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Tipo de Sangre</label>
                    <select value={biometricos.tipo_sangre} onChange={e => setBiometricos({...biometricos, tipo_sangre: e.target.value})} className={inputClass('tipo_sangre')}>
                      <option value="">Seleccionar</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Presión Arterial</label>
                    <input value={biometricos.presion_arterial} onChange={e => setBiometricos({...biometricos, presion_arterial: e.target.value})} className={inputClass('presion_arterial')} placeholder="120/80" />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Paso 3 — Antecedentes Personales</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Enfermedades Crónicas</label>
                    <textarea value={antPersonales.enfermedades_cronicas} onChange={e => setAntPersonales({...antPersonales, enfermedades_cronicas: e.target.value})} className={inputClass('')} rows={2} placeholder="Diabetes, hipertensión..." />
                  </div>
                  <div>
                    <label className={labelClass}>Cirugías Previas</label>
                    <textarea value={antPersonales.cirugias_previas} onChange={e => setAntPersonales({...antPersonales, cirugias_previas: e.target.value})} className={inputClass('')} rows={2} />
                  </div>
                  <div>
                    <label className={labelClass}>Medicamentos Habituales</label>
                    <textarea value={antPersonales.medicamentos_habituales} onChange={e => setAntPersonales({...antPersonales, medicamentos_habituales: e.target.value})} className={inputClass('')} rows={2} />
                  </div>
                  <div>
                    <label className={labelClass}>Alergias</label>
                    <input value={antPersonales.alergias} onChange={e => setAntPersonales({...antPersonales, alergias: e.target.value})} className={inputClass('')} />
                  </div>
                  <div>
                    <label className={labelClass}>Vacunas</label>
                    <input value={antPersonales.vacunas} onChange={e => setAntPersonales({...antPersonales, vacunas: e.target.value})} className={inputClass('')} />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4 */}
            {paso === 4 && (
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Paso 4 — Antecedentes Familiares</h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Historial de Cáncer en Familia</label>
                    <textarea value={antFamiliares.historial_cancer_familia} onChange={e => setAntFamiliares({...antFamiliares, historial_cancer_familia: e.target.value})} className={inputClass('')} rows={3} placeholder="Madre con cáncer cervical..." />
                  </div>
                  <div>
                    <label className={labelClass}>Tipo de Cáncer Familiar</label>
                    <input value={antFamiliares.tipo_cancer_familiar} onChange={e => setAntFamiliares({...antFamiliares, tipo_cancer_familiar: e.target.value})} className={inputClass('')} placeholder="Cervical, mama, pulmón..." />
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5 */}
            {paso === 5 && (
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Paso 5 — Motivo, Consentimiento y Asignación</h2>

                {/* Resumen tipo de cáncer seleccionado */}
                <div className="mb-4 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700">
                  🔬 Tipo de análisis: <strong className="capitalize">{consulta.tipo_cancer_analizar}</strong>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Motivo de Consulta *</label>
                    <textarea value={consulta.motivo_consulta} onChange={e => setConsulta({...consulta, motivo_consulta: e.target.value})} className={inputClass('motivo_consulta')} rows={3} />
                    {errores.motivo_consulta && <p className={errorClass}>{errores.motivo_consulta}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Técnico de Laboratorio *</label>
                    <p className="text-xs text-gray-400 mb-2">Selecciona quién procesará la muestra</p>
                    {tecnicos.length === 0 ? (
                      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        No hay técnicos activos disponibles en este momento.
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
                            {tecnicoSeleccionado === t.id && (
                              <span className="ml-auto text-teal-600 text-sm font-medium">✓ Seleccionado</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {errores.tecnico && <p className={errorClass}>{errores.tecnico}</p>}
                  </div>

                  <div className={`flex items-start gap-3 p-4 rounded-lg border ${errores.consentimiento_ia ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-200'}`}>
                    <input type="checkbox" id="consentimiento" checked={consulta.consentimiento_ia} onChange={e => setConsulta({...consulta, consentimiento_ia: e.target.checked})} className="mt-1" />
                    <label htmlFor="consentimiento" className="text-sm text-yellow-800">
                      <strong>Consentimiento Informado:</strong> El paciente autoriza el análisis de sus imágenes médicas mediante Inteligencia Artificial para apoyo al triaje. Entiende que el sistema no reemplaza al médico especialista.
                    </label>
                  </div>
                  {errores.consentimiento_ia && <p className={errorClass}>{errores.consentimiento_ia}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => { setPaso(p => p - 1); setErrores({}); setMensaje('') }} disabled={paso === 1} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-30">
                ← Anterior
              </button>
              {paso < 5 ? (
                <button onClick={handleSiguiente} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Siguiente →</button>
              ) : (
                <button onClick={handleFinalizar} disabled={guardando} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Finalizar Registro'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default NuevoPaciente