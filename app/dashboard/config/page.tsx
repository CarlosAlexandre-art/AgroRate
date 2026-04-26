'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserData = { name: string; email: string; phone: string; avatarUrl: string; createdAt: string }

const CONSENTS = [
  { id: 'sicredi',   label: 'Sicredi',         desc: 'Compartilhar score para análise de crédito rural premium' },
  { id: 'bb',        label: 'Banco do Brasil',  desc: 'Compartilhar para acesso às linhas Finagro e Pronaf' },
  { id: 'sicoob',    label: 'Sicoob',           desc: 'Compartilhar para ofertas de custeio e investimento' },
  { id: 'bradesco',  label: 'Bradesco',         desc: 'Compartilhar para financiamento agrícola' },
  { id: 'santander', label: 'Santander',        desc: 'Compartilhar para custeio e capital de giro' },
  { id: 'agrocred',  label: 'AgroCred',         desc: 'Compartilhar para antecipação de recebíveis' },
]
const DEFAULT_CONSENTS = Object.fromEntries(CONSENTS.map(c => [c.id, false]))

export default function ConfigPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit profile
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Consents
  const [consents, setConsents] = useState<Record<string, boolean>>(DEFAULT_CONSENTS)
  const [consentSaving, setConsentSaving] = useState(false)
  const [consentMsg, setConsentMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }

      const [profileRes, consentsRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/consents'),
      ])

      if (profileRes.ok) {
        const p = await profileRes.json()
        setUser(p)
        setEditName(p.name)
        setEditPhone(p.phone ?? '')
        setEditAvatar(p.avatarUrl ?? '')
      }
      if (consentsRes.ok) {
        const c = await consentsRes.json()
        if (c.consents && Object.keys(c.consents).length > 0) {
          setConsents({ ...DEFAULT_CONSENTS, ...c.consents })
        } else {
          // Fall back to localStorage for migration
          try {
            const stored = localStorage.getItem('agrorate_consents')
            if (stored) setConsents({ ...DEFAULT_CONSENTS, ...JSON.parse(stored) })
          } catch { /* ignore */ }
        }
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatares').upload(path, file, { upsert: true })
    if (error) { setProfileMsg({ ok: false, text: 'Erro ao fazer upload da foto.' }); return }
    const { data } = supabase.storage.from('avatares').getPublicUrl(path)
    setEditAvatar(data.publicUrl)
  }

  async function handleSaveProfile() {
    if (!editName.trim()) { setProfileMsg({ ok: false, text: 'Nome não pode ser vazio.' }); return }
    setProfileSaving(true)
    setProfileMsg(null)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, phone: editPhone, avatarUrl: editAvatar }),
    })
    setProfileSaving(false)
    if (res.ok) {
      setUser(u => u ? { ...u, name: editName, phone: editPhone, avatarUrl: editAvatar } : u)
      setEditing(false)
      setProfileMsg({ ok: true, text: 'Perfil atualizado com sucesso.' })
      setTimeout(() => setProfileMsg(null), 3000)
    } else {
      setProfileMsg({ ok: false, text: 'Erro ao salvar. Tente novamente.' })
    }
  }

  function toggleConsent(id: string) {
    setConsents(c => ({ ...c, [id]: !c[id] }))
  }

  function toggleAll() {
    const next = !Object.values(consents).every(Boolean)
    setConsents(Object.fromEntries(CONSENTS.map(c => [c.id, next])))
  }

  async function handleSaveConsents() {
    setConsentSaving(true)
    setConsentMsg(null)
    try { localStorage.setItem('agrorate_consents', JSON.stringify(consents)) } catch { /* ignore */ }
    const res = await fetch('/api/user/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consents }),
    })
    setConsentSaving(false)
    if (res.ok) {
      setConsentMsg({ ok: true, text: 'Consentimentos salvos com sucesso.' })
    } else {
      setConsentMsg({ ok: false, text: 'Erro ao salvar. Tente novamente.' })
    }
    setTimeout(() => setConsentMsg(null), 3000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const activeCount = Object.values(consents).filter(Boolean).length
  const allActive = activeCount === CONSENTS.length

  if (loading) return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"/>)}
    </div>
  )

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Minha conta</div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-semibold text-[#065f46] hover:underline">
              Editar
            </button>
          )}
        </div>

        {profileMsg && (
          <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${profileMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {profileMsg.ok ? '✓' : '✕'} {profileMsg.text}
          </div>
        )}

        {!editing ? (
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"/>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#065f46] flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {user?.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-lg">{user?.name}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              {user?.phone && <div className="text-xs text-slate-400 mt-0.5">{user.phone}</div>}
              <div className="text-xs text-slate-400 mt-0.5">
                Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <button onClick={() => fileRef.current?.click()} className="relative group flex-shrink-0">
                {editAvatar ? (
                  <img src={editAvatar} alt="" className="w-14 h-14 rounded-2xl object-cover"/>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#065f46] flex items-center justify-center text-white text-2xl font-black">
                    {editName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile}/>
              <div className="text-xs text-slate-400">Clique na foto para alterar</div>
            </div>

            {/* Nome */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Nome</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/30"
                placeholder="Seu nome completo"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Telefone</label>
              <div className="flex gap-2">
                <div className="flex items-center border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-sm text-slate-600 font-semibold flex-shrink-0">
                  🇧🇷 +55
                </div>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/30"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveProfile} disabled={profileSaving}
                className="flex-1 py-2.5 rounded-xl bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50">
                {profileSaving ? 'Salvando…' : 'Salvar perfil'}
              </button>
              <button onClick={() => { setEditing(false); setProfileMsg(null) }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!editing && (
          <div className="grid grid-cols-2 gap-2 pt-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 mb-0.5">Sistema</div>
              <div className="font-bold text-slate-800 text-sm">AgroRate</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-500 mb-0.5">Integração</div>
              <div className="font-bold text-emerald-700 text-sm">AgroOS ativo</div>
            </div>
          </div>
        )}
      </div>

      {/* Ecossistema */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Conexão com o ecossistema</div>
        <div className="space-y-3">
          {[
            { name: 'AgroOS', desc: 'Sistema Operacional da Fazenda', href: 'https://agros-os.vercel.app', dot: 'bg-emerald-400' },
            { name: 'AgroCore', desc: 'Marketplace de Serviços Agrícolas', href: 'https://agrolink-opal.vercel.app', dot: 'bg-amber-400' },
          ].map(sys => (
            <div key={sys.name} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sys.dot}`}/>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{sys.name}</div>
                <div className="text-xs text-slate-500">{sys.desc}</div>
              </div>
              <a href={sys.href} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-[#065f46] hover:underline flex items-center gap-1">
                Acessar
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          O AgroRate usa o mesmo login e banco de dados do AgroOS. Seus dados de propriedade, receitas e custos alimentam seu score automaticamente.
        </p>
      </div>

      {/* Consentimentos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consentimentos</div>
          <span className="text-xs font-semibold text-slate-500">{activeCount}/{CONSENTS.length} ativos</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Escolha com quais parceiros seu score pode ser compartilhado para análise de crédito. Você pode revogar a qualquer momento.
        </p>

        <button onClick={toggleAll}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#065f46]/5 border border-[#065f46]/10 mb-3 hover:bg-[#065f46]/8 transition-colors">
          <span className="text-sm font-semibold text-[#065f46]">Autorizar todos os parceiros</span>
          <Toggle on={allActive}/>
        </button>

        <div className="space-y-2">
          {CONSENTS.map(c => (
            <div key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => toggleConsent(c.id)}>
              <Toggle on={consents[c.id]}/>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{c.label}</div>
                <div className="text-xs text-slate-500 truncate">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {consentMsg && (
          <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${consentMsg.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {consentMsg.ok ? '✓' : '✕'} {consentMsg.text}
          </div>
        )}

        <button onClick={handleSaveConsents} disabled={consentSaving}
          className="mt-3 w-full py-2.5 rounded-xl bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-50">
          {consentSaving ? 'Salvando…' : 'Salvar consentimentos'}
        </button>

        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
          <span className="text-base flex-shrink-0">🔒</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>LGPD:</strong> seus dados nunca são vendidos. O compartilhamento é feito exclusivamente para análise de crédito pelo parceiro selecionado.
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ações da conta</div>
        <div className="space-y-2">
          <a href="https://agros-os.vercel.app" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
            <span className="text-base">🖥️</span>
            Gerenciar dados da fazenda no AgroOS
          </a>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-100 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-300 pb-4">
        AgroRate v1.0 · Ecossistema AgroCore · AgroOS · AgroRate
      </p>
    </div>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`w-10 rounded-full transition-all relative flex-shrink-0 ${on ? 'bg-[#065f46]' : 'bg-slate-200'}`} style={{ height: 22 }}>
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${on ? 'left-5' : 'left-0.5'}`}/>
    </div>
  )
}
