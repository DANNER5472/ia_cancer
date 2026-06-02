import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'

function TecnicoCasos() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [retrabajo, setRetrabajo] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    const [{ data: notifs }, { data: retrabajos }] = await Promise.all([
      supabase
        .from('notificacion')
        .select('*, paciente(id, nombre_completo, ci_dni, tipo_cancer_analizar, motivo_consulta)')
        .eq('usuario_destino_id', user.id)
        .eq('tipo', 'caso_pendiente')
        .eq('leida', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('notificacion')
        .select('*, paciente(id, nombre_completo, ci_dni, tipo_cancer_analizar)')
        .eq('usuario_destino_id', user.id)
        .in('tipo', ['imagen_rechazada', 'no_concluyente'])
        .eq('leida', false)
        .order('created_at', { ascending: false })
    ])
    setCasos(notifs ?? [])
    setRetrabajo(retrabajos ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const handleProcesar = (notificacion) => {
    navigate(`/tecnico/subir/${notificacion.paciente.id}?notifId=${notificacion.id}`)
  }

  const tipoMuestra = (tipo) => tipo === 'cervical' ? 'Papanicolaou' : 'Biopsia'

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <a href="/tecnico/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
          <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-1">Casos Pendientes</h1>
          <p className="text-gray-500 mb-6">Casos asignados para procesar muestra e imagen.</p>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando...</div>
          ) : (
            <>
              {casos.length === 0 && retrabajo.length === 0 ? (
                <div className="bg-white border rounded-xl p-12 text-center text-gray-400 shadow-sm">
                  No hay casos pendientes por procesar.
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
                            Tipo de análisis: <span className="font-medium text-teal-700">{c.paciente?.tipo_cancer_analizar}</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Muestra requerida: <span className="font-medium">{tipoMuestra(c.paciente?.tipo_cancer_analizar)}</span>
                          </p>
                          {c.paciente?.motivo_consulta && (
                            <p className="text-sm text-gray-400 mt-1">Motivo: {c.paciente.motivo_consulta}</p>
                          )}
                          <p className="text-xs text-gray-300 mt-2">{new Date(c.created_at).toLocaleDateString('es-BO')}</p>
                        </div>
                        <button
                          onClick={() => handleProcesar(c)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                        >
                          Procesar →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {retrabajo.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-red-600 mb-4">⚠️ Retrabajo Requerido</h2>
                  <div className="space-y-4">
                    {retrabajo.map(r => (
                      <div key={r.id} className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{r.paciente?.nombre_completo}</h3>
                            <p className="text-sm text-gray-500">CI: {r.paciente?.ci_dni}</p>
                            <p className="text-sm text-red-600 mt-1 font-medium">
                              {r.tipo === 'imagen_rechazada'
                                ? '🔴 Imagen rechazada — subir nueva imagen'
                                : '🟡 Resultado no concluyente — nueva muestra requerida'}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              await supabase.from('notificacion').update({ leida: true }).eq('id', r.id)
                              navigate(`/tecnico/subir/${r.paciente.id}`)
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Procesar →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TecnicoCasos