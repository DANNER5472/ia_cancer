import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import Card from '../../components/Card'

function MedicoDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardLayout>
      <div className="p-10 max-w-4xl">

        <div className="mb-10">
          <p className="text-slate-400 text-sm mb-1 capitalize">
            {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-slate-800">
            Bienvenido, {profile?.nombre} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Panel de Médico General — CancerScan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <Card icon="🔬" title="Casos Pendientes"  desc="Imágenes listas para análisis de triaje con IA"        color="blue"  onClick={() => navigate('/medico/casos')}    />
          <Card icon="📋" title="Historial de Casos" desc="Ver todos los casos analizados y sus resultados"       color="teal"  onClick={() => navigate('/medico/historial')} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Sistema de Apoyo al Triaje</p>
            <p className="text-sm text-blue-600 leading-relaxed">
              CancerScan es una herramienta de apoyo clínico. Los resultados son orientativos y no reemplazan el criterio del especialista médico.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default MedicoDashboard