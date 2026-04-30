import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Unauthorized() {
  const navigate = useNavigate()
  const { role } = useAuth()

  const destinos = {
    medico: '/medico/dashboard',
    enfermera: '/enfermera/dashboard',
    tecnico: '/tecnico/dashboard',
    administrador: '/admin/dashboard',
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-4">
      <div className="text-6xl">🚫</div>
      <h1 className="text-2xl font-bold text-gray-800">Acceso denegado</h1>
      <p className="text-gray-500">No tienes permiso para ver esta página.</p>
      <button
        onClick={() => navigate(destinos[role] ?? '/login')}
        className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
      >
        Ir a mi panel
      </button>
    </div>
  )
}

export default Unauthorized