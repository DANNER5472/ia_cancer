import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center relative overflow-hidden">

      <style>{`
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(56,189,248,0.3)) drop-shadow(0 0 20px rgba(20,184,166,0.15)); }
          50% { filter: drop-shadow(0 0 22px rgba(56,189,248,0.6)) drop-shadow(0 0 40px rgba(20,184,166,0.35)); }
        }
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .logo-glow { animation: glow 3s ease-in-out infinite; }
        .fade-down { animation: fade-down 0.6s ease-out forwards; }
        .fade-up { animation: fade-up 0.6s ease-out 0.2s forwards; opacity: 0; }
      `}</style>

      {/* Círculos de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="absolute rounded-full border border-sky-400/10"
            style={{
              width: `${200 + i * 140}px`,
              height: `${200 + i * 140}px`,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 w-full max-w-sm mx-4 flex flex-col items-center">

        {/* Logo arriba */}
        <img
          src="/Logo_sin_fondo.png"
          alt="CancerScan"
          className="w-52 mb-8 logo-glow fade-down"
        />

        {/* Card formulario */}
        <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl fade-up">

          <h2 className="text-lg font-bold text-white mb-1 text-center">Bienvenido</h2>
          <p className="text-slate-400 text-sm text-center mb-6">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="doctor@hospital.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 bg-transparent border-none cursor-pointer text-base"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-sky-400 hover:text-sky-300 transition">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login