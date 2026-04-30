import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import Card from '../../components/Card'

function TecnicoDashboard() {
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
          <p className="text-slate-500 mt-1 text-sm">Panel de Técnico de Laboratorio — CancerScan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <Card icon="🧪" title="Casos Pendientes" desc="Ver casos asignados, procesar muestra y subir imagen microscópica" color="yellow" onClick={() => navigate('/tecnico/casos')} />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-2xl">🔬</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-1">Requisitos de imagen</p>
            <p className="text-sm text-yellow-700 leading-relaxed">
              Las imágenes deben ser JPG o PNG, mínimo 224×224px y máximo 10MB para ser procesadas correctamente por el modelo de IA.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default TecnicoDashboard