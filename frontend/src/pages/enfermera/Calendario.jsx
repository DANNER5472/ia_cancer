import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function EnfermeraCalendario() {
  const { user } = useAuth()
  const [controles, setControles] = useState([])
  const [loading, setLoading] = useState(true)
  const [reprogramando, setReprogramando] = useState(null)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [mensaje, setMensaje] = useState('')
  const hoy = new Date().toISOString().split('T')[0]

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('control_paciente')
      .select('*, paciente(nombre_completo, ci_dni), analisis(tipo_cancer, resultado)')
      .eq('enfermera_id', user.id)
      .eq('fecha_control', hoy)
      .order('created_at')
    setControles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const handleAsistencia = async (id, asistio) => {
    await supabase.from('control_paciente').update({
      asistio,
      estado: asistio ? 'completado' : 'no_asistio'
    }).eq('id', id)
    setMensaje(asistio ? 'Asistencia registrada.' : 'No asistencia registrada.')
    cargar()
  }

  const handleReprogramar = async (id) => {
    if (!nuevaFecha) return
    await supabase.from('control_paciente').update({
      estado: 'reprogramado',
      nueva_fecha: nuevaFecha,
      motivo_reprogramacion: 'Paciente no asistió'
    }).eq('id', id)
    setReprogramando(null)
    setNuevaFecha('')
    setMensaje('Cita reprogramada.')
    cargar()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/enfermera/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Calendario de Controles</h1>
        <p className="text-gray-500 mb-6">Pacientes con control hoy: {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {mensaje && <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{mensaje}</div>}

        {loading ? (
          <div className="text-center text-gray-400 py-12">Cargando...</div>
        ) : controles.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-400 shadow-sm">No hay controles programados para hoy.</div>
        ) : (
          <div className="space-y-4">
            {controles.map(c => (
              <div key={c.id} className="bg-white border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.paciente?.nombre_completo}</h3>
                    <p className="text-sm text-gray-500">CI: {c.paciente?.ci_dni}</p>
                    {c.analisis && <p className="text-sm text-gray-500">Último análisis: {c.analisis.tipo_cancer} — <span className={c.analisis.resultado === 'normal' ? 'text-green-600' : 'text-red-600'}>{c.analisis.resultado}</span></p>}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    c.estado === 'completado' ? 'bg-green-100 text-green-700' :
                    c.estado === 'no_asistio' ? 'bg-red-100 text-red-700' :
                    c.estado === 'reprogramado' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'}`}>
                    {c.estado}
                  </span>
                </div>

                {c.estado === 'pendiente' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAsistencia(c.id, true)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">✓ Llegó</button>
                    <button onClick={() => { setReprogramando(c.id); setMensaje('') }} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">✗ No llegó</button>
                  </div>
                )}

                {reprogramando === c.id && (
                  <div className="mt-3 flex gap-2 items-center">
                    <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} min={hoy} className="px-3 py-2 border rounded-lg text-sm" />
                    <button onClick={() => handleReprogramar(c.id)} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Reprogramar</button>
                    <button onClick={() => setReprogramando(null)} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Cancelar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnfermeraCalendario