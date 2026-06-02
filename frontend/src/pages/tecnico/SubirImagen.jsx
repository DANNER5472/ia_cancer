import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

function TecnicoSubirImagen() {
  const { user } = useAuth()
  const { pacienteId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [paciente, setPaciente] = useState(null)
  const [imagen, setImagen] = useState(null)
  const [preview, setPreview] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [medicos, setMedicos] = useState([])
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('paciente').select('*').eq('id', pacienteId).single(),
      supabase.from('profiles').select('id, nombre').eq('rol', 'medico').eq('activo', true)
    ]).then(([{ data: p }, { data: m }]) => {
      setPaciente(p)
      setMedicos(m ?? [])
      if (m?.length === 1) setMedicoSeleccionado(m[0].id)
    })
  }, [pacienteId])

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/bmp'].includes(file.type)) {
      setErrorMsg('Solo se aceptan imágenes JPG, PNG o BMP.'); return
    }
    if (file.size > 10 * 1024 * 1024) { setErrorMsg('La imagen no puede superar 10MB.'); return }
    setErrorMsg('')
    setImagen(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubir = async () => {
    if (!imagen) { setErrorMsg('Selecciona una imagen.'); return }
    if (!medicoSeleccionado) { setErrorMsg('Debes seleccionar un médico para notificar.'); return }
    setSubiendo(true)
    setMensaje('')

    const fileName = `${pacienteId}_${Date.now()}.${imagen.name.split('.').pop()}`
    const { error: storageError } = await supabase.storage.from('muestras').upload(fileName, imagen)
    if (storageError) { setErrorMsg('Error al subir imagen: ' + storageError.message); setSubiendo(false); return }

    const { data: { publicUrl } } = supabase.storage.from('muestras').getPublicUrl(fileName)

    const { error: muestraError } = await supabase.from('muestra').insert({
      paciente_id: pacienteId,
      tecnico_id: user.id,
      tipo_muestra: paciente.tipo_cancer_analizar === 'cervical' ? 'papanicolaou' : 'biopsia',
      tipo_cancer: paciente.tipo_cancer_analizar,
      imagen_url: publicUrl,
      estado_imagen: 'pendiente'
    })
    if (muestraError) { setErrorMsg('Error al registrar muestra: ' + muestraError.message); setSubiendo(false); return }

    const params = new URLSearchParams(window.location.search)
    const notifId = params.get('notifId')
    if (notifId) await supabase.from('notificacion').update({ leida: true }).eq('id', notifId)

    const { data: notifExistente } = await supabase
      .from('notificacion').select('id')
      .eq('tipo', 'imagen_lista').eq('paciente_id', pacienteId)
      .eq('usuario_destino_id', medicoSeleccionado).eq('leida', false)

    if (!notifExistente?.length) {
      await supabase.from('notificacion').insert([{
        usuario_destino_id: medicoSeleccionado,
        usuario_origen_id: user.id,
        tipo: 'imagen_lista',
        paciente_id: pacienteId,
      }])
    }

    setSubiendo(false)
    setMensaje('✅ Imagen subida y médico notificado correctamente.')
    setTimeout(() => navigate('/tecnico/casos'), 2000)
  }

  if (!paciente) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <a href="/tecnico/casos" className="text-sm text-gray-500 hover:underline">← Volver a casos</a>
          <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Subir Imagen de Muestra</h1>
          <p className="text-gray-500 mb-6">{paciente.nombre_completo} — CI: {paciente.ci_dni}</p>

          <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-800 mb-2">Información del Caso</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Tipo de cáncer:</strong> {paciente.tipo_cancer_analizar}</p>
              <p><strong>Muestra requerida:</strong> {paciente.tipo_cancer_analizar === 'cervical' ? 'Papanicolaou' : 'Biopsia'}</p>
              <p><strong>Motivo:</strong> {paciente.motivo_consulta}</p>
            </div>
          </div>

          {/* Selector de médico */}
          <div className="bg-white border rounded-xl p-6 shadow-sm mb-4">
            <h2 className="font-semibold text-gray-800 mb-1">Médico a Notificar *</h2>
            <p className="text-xs text-gray-400 mb-3">Selecciona qué médico revisará este caso</p>
            {medicos.length === 0 ? (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                No hay médicos activos disponibles en este momento.
              </div>
            ) : (
              <div className="space-y-2">
                {medicos.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setMedicoSeleccionado(m.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${
                      medicoSeleccionado === m.id
                        ? 'bg-teal-50 border-teal-400 text-teal-800'
                        : 'bg-white border-gray-200 hover:border-teal-300 text-gray-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${medicoSeleccionado === m.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {m.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.nombre}</p>
                      <p className="text-xs text-gray-400">Médico general</p>
                    </div>
                    {medicoSeleccionado === m.id && <span className="ml-auto text-teal-600 text-sm font-medium">✓ Seleccionado</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subir imagen */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Capturar y Subir Imagen</h2>
            <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition">
              {preview ? (
                <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg object-contain" />
              ) : (
                <div>
                  <div className="text-4xl mb-3">🔬</div>
                  <p className="text-gray-500">Click para seleccionar imagen de la lámina</p>
                  <p className="text-xs text-gray-400 mt-1">JPG / PNG / BMP — máx. 10MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/bmp" onChange={handleImagen} className="hidden" />
            {preview && <button onClick={() => { setImagen(null); setPreview(null) }} className="mt-2 text-sm text-red-500 hover:underline">Quitar imagen</button>}

            {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}
            {mensaje && <p className="mt-3 text-sm text-green-600">{mensaje}</p>}

            <button onClick={handleSubir} disabled={subiendo || !imagen} className="w-full mt-6 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50">
              {subiendo ? 'Subiendo...' : 'Subir Imagen y Notificar al Médico'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TecnicoSubirImagen