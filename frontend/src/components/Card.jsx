function Card({ icon, title, desc, color = 'teal', onClick }) {
  const colors = {
    teal:   { border: 'border-teal-200',   bg: 'bg-teal-50',   icon: 'bg-teal-100',   text: 'text-teal-600'   },
    blue:   { border: 'border-blue-200',   bg: 'bg-blue-50',   icon: 'bg-blue-100',   text: 'text-blue-600'   },
    pink:   { border: 'border-pink-200',   bg: 'bg-pink-50',   icon: 'bg-pink-100',   text: 'text-pink-600'   },
    purple: { border: 'border-purple-200', bg: 'bg-purple-50', icon: 'bg-purple-100', text: 'text-purple-600' },
    yellow: { border: 'border-yellow-200', bg: 'bg-yellow-50', icon: 'bg-yellow-100', text: 'text-yellow-600' },
  }

  const c = colors[color] ?? colors.teal

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-7 cursor-pointer border ${c.border} shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}
    >
      <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      <p className={`text-sm font-semibold mt-4 ${c.text}`}>Ir →</p>
    </div>
  )
}

export default Card