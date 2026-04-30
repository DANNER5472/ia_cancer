import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function EnfermeraPacientes() {
  const { signOut } = useAuth()
  const [ci, setCi] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')

  const handleBuscar = async () => {
    if (!ci.trim()) return
    setBuscando(true)
    setError('')

    const { data } = await supabase
      .from('paciente')
      .select('*')
      .eq('ci_dni', ci.trim())
      .single()

    setBuscando(false)

    if (data) {
      window.location.href = `/enfermera/paciente/${data.id}`
    } else {
      window.location.href = `/enfermera/nuevo-paciente?ci=${ci.trim()}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <a href="/enfermera/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
        <h1 className="text-2xl font-bold text-teal-700 mt-1 mb-8">Buscar Paciente</h1>

        <div className="bg-white border rounded-xl p-8 shadow-sm">
          <p className="text-gray-600 mb-6">Ingresa el CI/DNI del paciente para buscarlo o registrarlo.</p>

          <label className="block text-sm font-medium text-gray-700 mb-2">CI / DNI del Paciente</label>
          <input
            value={ci}
            onChange={e => setCi(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuscar()}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Ej: 12345678"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="w-full mt-4 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold disabled:opacity-50"
          >
            {buscando ? 'Buscando...' : 'Buscar Paciente'}
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Si el paciente no existe, será redirigido al formulario de registro.
          </p>
        </div>

        <button onClick={signOut} className="mt-8 text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </div>
    </div>
  )
}

export default EnfermeraPacientes