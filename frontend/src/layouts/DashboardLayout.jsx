import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_ITEMS = {
  medico: [
    { label: 'Panel',            icon: '🏠', href: '/medico/dashboard' },
    { label: 'Casos Pendientes', icon: '🔬', href: '/medico/casos'     },
    { label: 'Historial',        icon: '📋', href: '/medico/historial' },
  ],
  enfermera: [
    { label: 'Panel',            icon: '🏠', href: '/enfermera/dashboard'  },
    { label: 'Buscar Paciente',  icon: '👤', href: '/enfermera/pacientes'  },
    { label: 'Calendario',       icon: '📅', href: '/enfermera/calendario' },
  ],
  tecnico: [
    { label: 'Panel',            icon: '🏠', href: '/tecnico/dashboard' },
    { label: 'Casos Pendientes', icon: '🧪', href: '/tecnico/casos'    },
  ],
  admin: [
    { label: 'Panel',            icon: '🏠', href: '/admin/dashboard'     },
    { label: 'Usuarios',         icon: '👥', href: '/admin/usuarios'      },
    { label: 'Estadísticas',     icon: '📊', href: '/admin/estadisticas'  },
  ],
}

const ROL_LABEL = {
  medico:   'Médico General',
  enfermera: 'Enfermera',
  tecnico:  'Técnico de Lab.',
  admin:    'Administrador',
}

const ROL_BADGE = {
  medico:   'bg-blue-500',
  enfermera: 'bg-pink-500',
  tecnico:  'bg-yellow-500',
  admin:    'bg-purple-500',
}

const ROL_ACTIVE = {
  medico:   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  enfermera: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  tecnico:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  admin:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function DashboardLayout({ children }) {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const items = NAV_ITEMS[role] ?? []

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">

      {/* SIDEBAR */}
      <aside className={`${collapsed ? 'w-18' : 'w-60'} bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col transition-all duration-300 shrink-0 shadow-xl`}>

        {/* Logo */}
        <div className={`${collapsed ? 'px-3 py-5 justify-center' : 'px-5 py-6'} border-b border-white/10 flex items-center`}>
          <img
            src="/Logo.png"
            alt="CancerScan"
            className={`${collapsed ? 'w-9' : 'w-32'} transition-all duration-300 object-contain object-left`}
          />
        </div>

        {/* Perfil */}
        {!collapsed && (
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${ROL_BADGE[role] ?? 'bg-teal-500'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {profile?.nombre?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{profile?.nombre}</p>
              <p className={`text-xs font-medium ${ROL_BADGE[role]?.replace('bg-', 'text-')?.replace('-500', '-400') ?? 'text-teal-400'}`}>
                {ROL_LABEL[role]}
              </p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => {
            const active = location.pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border transition-all duration-150 no-underline
                  ${collapsed ? 'justify-center' : ''}
                  ${active
                    ? `${ROL_ACTIVE[role] ?? 'bg-teal-500/20 text-teal-400 border-teal-500/30'} font-semibold`
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </a>
            )
          })}
        </nav>

        {/* Colapsar + Cerrar sesión */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full py-2 px-3 rounded-xl text-slate-400 text-sm bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}
          >
            <span>{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Colapsar</span>}
          </button>
          <button
            onClick={handleSignOut}
            className={`w-full py-2 px-3 rounded-xl text-red-400 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}
          >
            <span>🚪</span>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  )
}