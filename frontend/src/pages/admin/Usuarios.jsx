import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Cliente secundario para crear usuarios sin afectar la sesión del admin
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function AdminUsuarios() {
  const { signOut } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'medico' })
  const [mensaje, setMensaje] = useState('')

  const cargarUsuarios = async () => {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*')
    setUsuarios(data ?? [])
    setLoading(false)
  }

  useEffect(() => { cargarUsuarios() }, [])

  const handleRegistrar = async () => {
    setMensaje('')
    // Usar cliente secundario para no afectar sesión del admin
    const { data, error } = await supabaseAdmin.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nombre: form.nombre, rol: form.rol } }
    })
    if (error) { setMensaje('Error: ' + error.message); return }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      nombre: form.nombre,
      email: form.email,
      rol: form.rol,
      activo: true
    })

    // Cerrar sesión del cliente secundario sin afectar al admin
    await supabaseAdmin.auth.signOut()

    setMensaje('Usuario creado correctamente.')
    setShowForm(false)
    setForm({ nombre: '', email: '', password: '', rol: 'medico' })
    cargarUsuarios()
  }

  const handleEditar = async (u) => {
    await supabase.from('profiles').update({ nombre: u.nombre, rol: u.rol }).eq('id', u.id)
    setEditando(null)
    setMensaje('Usuario actualizado correctamente')
    cargarUsuarios()
  }

  const handleDesactivar = async (id, activo) => {
    await supabase.from('profiles').update({ activo: !activo }).eq('id', id)
    setMensaje(activo ? 'Usuario desactivado' : 'Usuario activado')
    cargarUsuarios()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <a href="/admin/dashboard" className="text-sm text-gray-500 hover:underline">← Volver al panel</a>
            <h1 className="text-2xl font-bold text-teal-700 mt-1">Gestión de Usuarios</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            + Nuevo Usuario
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}

        {showForm && (
          <div className="bg-white border rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Registrar Nuevo Usuario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="juan@hospital.com" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Contraseña</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Rol</label>
                <select value={form.rol} onChange={e => setForm({...form, rol: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded-lg">
                  <option value="medico">Médico</option>
                  <option value="enfermera">Enfermera</option>
                  <option value="tecnico">Técnico de Laboratorio</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleRegistrar} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Registrar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancelar</button>
            </div>
          </div>
        )}

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 text-gray-600">Email</th>
                <th className="text-left px-4 py-3 text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editando?.id === u.id
                      ? <input value={editando.nombre} onChange={e => setEditando({...editando, nombre: e.target.value})} className="px-2 py-1 border rounded" />
                      : u.nombre}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {editando?.id === u.id ? (
                      <select value={editando.rol} onChange={e => setEditando({...editando, rol: e.target.value})} className="px-2 py-1 border rounded">
                        <option value="medico">Médico</option>
                        <option value="enfermera">Enfermera</option>
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.rol === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.rol === 'medico' ? 'bg-blue-100 text-blue-700' :
                        u.rol === 'enfermera' ? 'bg-pink-100 text-pink-700' :
                        'bg-yellow-100 text-yellow-700'}`}>
                        {u.rol}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {editando?.id === u.id ? (
                      <>
                        <button onClick={() => handleEditar(editando)} className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700">Guardar</button>
                        <button onClick={() => setEditando(null)} className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditando(u)} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Editar</button>
                        <button onClick={() => handleDesactivar(u.id, u.activo)} className={`text-xs px-2 py-1 rounded ${u.activo ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={signOut} className="mt-8 text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </div>
    </div>
  )
}

export default AdminUsuarios