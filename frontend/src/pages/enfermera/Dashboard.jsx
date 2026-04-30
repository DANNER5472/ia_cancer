import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import Card from '../../components/Card'

function EnfermeraDashboard() {
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
            Bienvenida, {profile?.nombre} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Panel de Enfermería — CancerScan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card icon="👤" title="Registrar / Buscar Paciente" desc="Nuevo ingreso o seguimiento de paciente existente"     color="pink"   onClick={() => navigate('/enfermera/pacientes')}  />
          <Card icon="📅" title="Calendario de Citas"         desc="Ver controles pendientes y programar seguimientos"     color="purple" onClick={() => navigate('/enfermera/calendario')} />
        </div>

      </div>
    </DashboardLayout>
  )
}

export default EnfermeraDashboard