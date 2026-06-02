import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DashboardLayout from '../../layouts/DashboardLayout'

function EnfermeraPacientes() {
  const navigate = useNavigate()
  const [ci, setCi] = useState('')
  const [buscando, setBuscando] = useState(false)

  const handleBuscar = async () => {
    if (!ci.trim()) return
    setBuscando(true)

    const { data } = await supabase
      .from('paciente')
      .select('*')
      .eq('ci_dni', ci.trim())
      .single()

    setBuscando(false)

    if (data) {
      navigate(`/enfermera/paciente/${data.id}`)
    } else {
      navigate(`/enfermera/nuevo-paciente?ci=${ci.trim()}`)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8">
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
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EnfermeraPacientes