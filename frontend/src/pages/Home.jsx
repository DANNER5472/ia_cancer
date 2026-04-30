import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center relative overflow-hidden">

      <style>{`
        @keyframes float {
          0%   { transform: translateY(0px) rotate(-1deg); }
          25%  { transform: translateY(-30px) rotate(0deg); }
          50%  { transform: translateY(-20px) rotate(1deg); }
          75%  { transform: translateY(-30px) rotate(0deg); }
          100% { transform: translateY(0px) rotate(-1deg); }
        }
        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 30px rgba(56,189,248,0.6))
                    drop-shadow(0 0 60px rgba(20,184,166,0.4))
                    drop-shadow(0 0 100px rgba(56,189,248,0.2));
          }
          50% {
            filter: drop-shadow(0 0 60px rgba(56,189,248,1))
                    drop-shadow(0 0 100px rgba(20,184,166,0.8))
                    drop-shadow(0 0 160px rgba(56,189,248,0.4));
          }
        }
        @keyframes ring-rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ring-counter {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @keyframes bg-glow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50%       { opacity: 0.18; transform: scale(1.08); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0px); }
        }
        @keyframes btn-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(14,165,233,0.4), 0 0 40px rgba(14,165,233,0.1); }
          50%       { box-shadow: 0 0 40px rgba(14,165,233,0.7), 0 0 80px rgba(14,165,233,0.3); }
        }
        @keyframes particle {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-80px) scale(1); }
        }
        .logo-animate  { animation: float 4s ease-in-out infinite, glow-pulse 3s ease-in-out infinite; }
        .ring-cw       { animation: ring-rotate 20s linear infinite; }
        .ring-ccw      { animation: ring-counter 15s linear infinite; }
        .ring-slow     { animation: ring-rotate 30s linear infinite; }
        .bg-glow-1     { animation: bg-glow 4s ease-in-out infinite; }
        .bg-glow-2     { animation: bg-glow 4s ease-in-out 2s infinite; }
        .fade-up-1     { animation: fade-up 0.8s ease-out 0.1s both; }
        .fade-up-2     { animation: fade-up 0.8s ease-out 0.4s both; }
        .btn-glow      { animation: btn-pulse 2.5s ease-in-out infinite; }
        .p1 { animation: particle 3s ease-out 0.0s infinite; }
        .p2 { animation: particle 3s ease-out 0.5s infinite; }
        .p3 { animation: particle 3s ease-out 1.0s infinite; }
        .p4 { animation: particle 3s ease-out 1.5s infinite; }
        .p5 { animation: particle 3s ease-out 2.0s infinite; }
        .p6 { animation: particle 3s ease-out 2.5s infinite; }
      `}</style>

      {/* Fondo — glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[0,1,2,3,4,5,6,7].map(i => (
          <div key={i} className="absolute rounded-full border border-sky-400/10"
            style={{
              width:  `${180 + i * 160}px`,
              height: `${180 + i * 160}px`,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-3xl bg-glow-1" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-3xl bg-glow-2" />
      </div>

      {/* Anillos giratorios */}
      <div className="absolute" style={{ top: '46%', left: '50%' }}>
        <div className="absolute ring-cw rounded-full border border-dashed border-sky-400/20"
          style={{ width: '520px', height: '520px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute ring-ccw rounded-full border border-teal-400/15"
          style={{ width: '620px', height: '620px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute ring-slow rounded-full border border-dashed border-sky-300/10"
          style={{ width: '720px', height: '720px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>

      {/* Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { cls: 'p1', top: '56%', left: '40%' },
          { cls: 'p2', top: '60%', left: '44%' },
          { cls: 'p3', top: '58%', left: '55%' },
          { cls: 'p4', top: '62%', left: '59%' },
          { cls: 'p5', top: '57%', left: '50%' },
          { cls: 'p6', top: '63%', left: '47%' },
        ].map((p, i) => (
          <div key={i} className={`absolute w-1.5 h-1.5 rounded-full bg-sky-400/70 ${p.cls}`}
            style={{ top: p.top, left: p.left }} />
        ))}
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Glow detrás del logo */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-3xl bg-glow-1 pointer-events-none" />

        {/* Logo — más grande */}
        <img
          src="/Logo_sin_fondo.png"
          alt="CancerScan"
          style={{ width: '580px' }}
          className="relative z-10 logo-animate fade-up-1"
        />

        {/* Botón */}
        <Link
          to="/login"
          className="fade-up-2 btn-glow mt-6 px-16 py-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white font-bold text-base rounded-2xl hover:opacity-95 hover:-translate-y-1 transition-all no-underline tracking-wide"
        >
          Iniciar Sesión →
        </Link>
      </div>
    </div>
  )
}

export default Home