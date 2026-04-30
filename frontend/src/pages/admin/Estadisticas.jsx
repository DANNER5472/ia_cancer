import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function AdminEstadisticas() {
  const [stats, setStats] = useState({ pacientes: 0, analisis: 0, derivaciones: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const [{ count: pacientes }, { count: analisis }, { count: derivaciones }] = await Promise.all([
        supabase.from('paciente').select('*', { count: 'exact', head: true }),
        supabase.from('analisis').select('*', { count: 'exact', head: true }),
        supabase.from('cierre_analisis').select('*', { count: 'exact', head: true }).eq('accion', 'derivacion'),
      ])
      setStats({ pacientes: pacientes ?? 0, analisis: analisis ?? 0, derivaciones: derivaciones ?? 0 })
      setLoading(false)
    }
    cargar()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/admin/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-8">Estadísticas del Sistema</h1>

        {loading ? (
          <div className="text-center text-gray-400">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard titulo="Total Pacientes" valor={stats.pacientes} color="blue" icon="👤" />
            <StatCard titulo="Total Análisis" valor={stats.analisis} color="teal" icon="🔬" />
            <StatCard titulo="Derivaciones" valor={stats.derivaciones} color="purple" icon="🏥" />
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ titulo, valor, color, icon }) {
  const colores = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <div className={`border rounded-xl p-6 ${colores[color]}`}>
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-4xl font-bold">{valor}</div>
      <div className="text-sm mt-1 opacity-75">{titulo}</div>
    </div>
  )
}

export default AdminEstadisticas