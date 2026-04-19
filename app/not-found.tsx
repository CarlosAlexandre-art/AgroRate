import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="text-center">
        <div className="text-6xl font-black text-[#065f46] mb-4">404</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-6">A página que você procura não existe.</p>
        <Link href="/" className="bg-[#065f46] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#047857] transition-colors">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
