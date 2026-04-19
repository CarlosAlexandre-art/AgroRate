export default function Logo({ size = 36, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#065f46"/>
        {/* Gauge arc */}
        <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" fill="none"/>
        <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        {/* Center dot */}
        <circle cx="18" cy="22" r="2" fill="white"/>
        {/* Needle */}
        <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        {/* Leaf */}
        <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      </svg>
      {showText && (
        <div>
          <div className="font-bold text-slate-900 text-lg leading-none tracking-tight">AgroRate</div>
          <div className="text-[10px] text-slate-400 leading-none mt-0.5">Score de Crédito Rural</div>
        </div>
      )}
    </div>
  )
}
