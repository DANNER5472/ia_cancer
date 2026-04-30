import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Home from './pages/Home'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Unauthorized from './pages/Unauthorized'
import Perfil from './pages/Perfil'

import MedicoDashboard from './pages/medico/Dashboard'
import MedicoCasos from './pages/medico/Casos'
import MedicoVerCaso from './pages/medico/VerCaso'
import MedicoHistorial from './pages/medico/Historial'
import ImprimirResultado from './pages/medico/ImprimirResultado'

import EnfermeraDashboard from './pages/enfermera/Dashboard'
import EnfermeraPacientes from './pages/enfermera/Pacientes'
import NuevoPaciente from './pages/enfermera/NuevoPaciente'
import PacienteExistente from './pages/enfermera/PacienteExistente'
import EnfermeraCalendario from './pages/enfermera/Calendario'

import TecnicoDashboard from './pages/tecnico/Dashboard'
import TecnicoCasos from './pages/tecnico/Casos'
import TecnicoSubirImagen from './pages/tecnico/SubirImagen'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsuarios from './pages/admin/Usuarios'
import AdminEstadisticas from './pages/admin/Estadisticas'

import ProtectedRoute from './components/ProtectedRoute'

function RoleRedirect() {
  const { role, user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!role) return <Navigate to="/login" replace />
  const destinos = {
    medico: '/medico/dashboard',
    enfermera: '/enfermera/dashboard',
    tecnico: '/tecnico/dashboard',
    admin: '/admin/dashboard'
  }
  return <Navigate to={destinos[role] ?? '/login'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* Médico */}
        <Route path="/medico/dashboard" element={<ProtectedRoute roles={['medico']}><MedicoDashboard /></ProtectedRoute>} />
        <Route path="/medico/casos" element={<ProtectedRoute roles={['medico']}><MedicoCasos /></ProtectedRoute>} />
        <Route path="/medico/historial" element={<ProtectedRoute roles={['medico']}><MedicoHistorial /></ProtectedRoute>} />
        <Route path="/medico/caso/:pacienteId" element={<ProtectedRoute roles={['medico']}><MedicoVerCaso /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute roles={['medico', 'enfermera', 'tecnico', 'admin']}><Perfil /></ProtectedRoute>} />
        <Route path="/medico/imprimir/:analisisId" element={<ProtectedRoute roles={['medico']}><ImprimirResultado /></ProtectedRoute>} />

        {/* Enfermera */}
        <Route path="/enfermera/dashboard" element={<ProtectedRoute roles={['enfermera']}><EnfermeraDashboard /></ProtectedRoute>} />
        <Route path="/enfermera/pacientes" element={<ProtectedRoute roles={['enfermera']}><EnfermeraPacientes /></ProtectedRoute>} />
        <Route path="/enfermera/nuevo-paciente" element={<ProtectedRoute roles={['enfermera']}><NuevoPaciente /></ProtectedRoute>} />
        <Route path="/enfermera/paciente/:id" element={<ProtectedRoute roles={['enfermera']}><PacienteExistente /></ProtectedRoute>} />
        <Route path="/enfermera/calendario" element={<ProtectedRoute roles={['enfermera']}><EnfermeraCalendario /></ProtectedRoute>} />

        {/* Técnico */}
        <Route path="/tecnico/dashboard" element={<ProtectedRoute roles={['tecnico']}><TecnicoDashboard /></ProtectedRoute>} />
        <Route path="/tecnico/casos" element={<ProtectedRoute roles={['tecnico']}><TecnicoCasos /></ProtectedRoute>} />
        <Route path="/tecnico/subir/:pacienteId" element={<ProtectedRoute roles={['tecnico']}><TecnicoSubirImagen /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/usuarios" element={<ProtectedRoute roles={['admin']}><AdminUsuarios /></ProtectedRoute>} />
        <Route path="/admin/estadisticas" element={<ProtectedRoute roles={['admin']}><AdminEstadisticas /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App