import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

function MedicoCasos() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notificacion')
      .select('*, paciente(id, nombre_completo, ci_dni, tipo_cancer_analizar, motivo_consulta)')
      .eq('usuario_destino_id', user.id)
      .eq('tipo', 'imagen_lista')
      .eq('leida', false)
      .order('created_at', { ascending: false })

    // Deduplicar — solo el caso más reciente por paciente
    const vistos = new Set()
    const unicos = (data ?? []).filter(c => {
      const pid = c.paciente?.id
      if (!pid || vistos.has(pid)) return false
      vistos.add(pid)
      return true
    })

    setCasos(unicos)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/medico/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Casos Listos para Analizar</h1>
        <p className="text-gray-500 mb-6">Imágenes subidas por el técnico pendientes de análisis.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : casos.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-gray-400 shadow-sm">
            No hay casos pendientes de análisis.
          </div>
        ) : (
          <div className="space-y-4">
            {casos.map(c => (
              <div key={c.id} className="bg-white border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.paciente?.nombre_completo}</h3>
                    <p className="text-sm text-gray-500">CI: {c.paciente?.ci_dni}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Tipo: <span className="font-medium text-teal-700">{c.paciente?.tipo_cancer_analizar}</span>
                    </p>
                    {c.paciente?.motivo_consulta && (
                      <p className="text-sm text-gray-400 mt-1">Motivo: {c.paciente.motivo_consulta}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-2">{new Date(c.created_at).toLocaleDateString('es-BO')}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/medico/caso/${c.paciente.id}?notifId=${c.id}`)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                  >
                    Analizar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={signOut} className="mt-8 text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </div>
    </div>
  )
}

export default MedicoCasos