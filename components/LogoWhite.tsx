export default function LogoWhite({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="white" fillOpacity="0.15"/>
        <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" fill="none"/>
        <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="18" cy="22" r="2" fill="white"/>
        <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      </svg>
      <div>
        <div className="font-bold text-white text-xl leading-none tracking-tight">AgroRate</div>
        <div className="text-[11px] text-emerald-200 leading-none mt-0.5">Score de Crédito Rural</div>
      </div>
    </div>
  )
}
