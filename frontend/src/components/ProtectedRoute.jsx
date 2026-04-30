import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, roles }) {
  const { user, role, loading } = useAuth()

  console.log('ProtectedRoute → user:', user?.email, 'role:', role, 'loading:', loading)

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600" />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(role)) return <Navigate to="/unauthorized" replace />

  return children
}

export default ProtectedRoute