import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const ADVOGADA_EMAIL = process.env.ORYON_LEGAL_EMAIL ?? 'alexandre@oryonag.com.br'
const RESEND_KEY = process.env.RESEND_API_KEY

type Resposta = { pergunta: string; resposta: string }

function campo(label: string, value: string) {
  return `<div style="padding:10px 0;border-bottom:1px solid #e5e7eb">
    <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:3px">${label}</div>
    <div style="font-size:15px;font-weight:600;color:#111827">${value}</div>
  </div>`
}

export async function POST(req: NextRequest) {
  try {
    const { respostas, dadosUsuario } = await req.json() as {
      respostas: Resposta[]
      dadosUsuario?: { nome?: string; email?: string; telefone?: string; cidade?: string; estado?: string }
    }

    const resumoRespostas = respostas.map((r, i) => `P${i + 1}: ${r.pergunta}\nR: ${r.resposta}`).join('\n\n')

    const system = `Você é um especialista em direito rural e patrimonial brasileiro.
Analise as respostas do questionário jurídico de um produtor rural e gere um diagnóstico estruturado em JSON.
IMPORTANTE: Responda SOMENTE com JSON válido, sem texto antes ou depois.
Formato obrigatório:
{
  "score": número de 0 a 100 (quanto menor, mais crítico o risco),
  "nivel": "CRITICO" | "ALTO" | "MODERADO" | "BAIXO",
  "vulnerabilidades": [{ "tipo": "🔴" | "🟡" | "🟢", "descricao": "string curta" }],
  "recomendacao": "string com a principal recomendação",
  "prioridade": "URGENTE" | "ALTA" | "MEDIA" | "BAIXA",
  "resumo_advogada": "parágrafo curto explicando o caso para a advogada"
}`

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Produtor rural brasileiro respondeu o questionário:\n\n${resumoRespostas}\n\nGere o diagnóstico.` },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content ?? ''

    let diagnostico: Record<string, unknown>
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      diagnostico = JSON.parse(match?.[0] ?? raw)
    } catch {
      diagnostico = {
        score: 45, nivel: 'ALTO',
        vulnerabilidades: [{ tipo: '🔴', descricao: 'Pendências identificadas — análise detalhada necessária' }],
        recomendacao: 'Consultoria jurídica especializada recomendada',
        prioridade: 'ALTA',
        resumo_advogada: 'Cliente com possíveis pendências jurídicas identificadas.',
      }
    }

    // Normalizar telefone (somente dígitos) para busca confiável
    const telefoneLimpo = (dadosUsuario?.telefone ?? '').replace(/\D/g, '')

    // Salvar lead no banco
    let leadId: string | null = null
    try {
      const lead = await prisma.oryonLegalLead.create({
        data: {
          nome: dadosUsuario?.nome ?? 'Anônimo',
          telefone: telefoneLimpo,
          email: dadosUsuario?.email,
          cidade: dadosUsuario?.cidade,
          estado: dadosUsuario?.estado,
          origem: 'agrorate',
          score: diagnostico.score as number,
          nivel: diagnostico.nivel as string,
          vulnerabilidades: JSON.stringify(diagnostico.vulnerabilidades),
          recomendacao: diagnostico.recomendacao as string,
          prioridade: diagnostico.prioridade as string,
          resumo: diagnostico.resumo_advogada as string,
          respostas: JSON.stringify(respostas),
        },
      })
      leadId = lead.id
    } catch (e) {
      console.error('Lead save error:', e)
    }

    // Email para a advogada
    if (RESEND_KEY) {
      const vulnHtml = (diagnostico.vulnerabilidades as Array<{ tipo: string; descricao: string }>)
        ?.map((v) => `<div style="padding:8px 0;font-size:14px;color:#374151">${v.tipo} ${v.descricao}</div>`)
        .join('') ?? ''

      const scoreVal = diagnostico.score as number
      const scoreColor = scoreVal < 40 ? '#ef4444' : scoreVal < 65 ? '#f59e0b' : '#22c55e'

      const html = `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:16px">
        <div style="background:#92400e;color:white;padding:24px 20px;border-radius:12px 12px 0 0">
          <h2 style="margin:0;font-size:18px">⚖️ Diagnóstico Jurídico — Lead Qualificado</h2>
          <p style="margin:6px 0 0;opacity:0.7;font-size:12px">ORYON Legal · AgroRate</p>
        </div>
        <div style="background:#f9fafb;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
          ${campo('Nome', dadosUsuario.nome)}
          ${campo('WhatsApp', `<a href="https://wa.me/55${telefoneLimpo}" style="color:#ca8a04">${dadosUsuario.telefone ?? telefoneLimpo}</a>`)}
          ${campo('E-mail', dadosUsuario.email ?? '—')}
          ${campo('Cidade/Estado', `${dadosUsuario.cidade ?? '—'}${dadosUsuario.estado ? ' / ' + dadosUsuario.estado : ''}`)}
          <div style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:3px">Score Jurídico</div>
            <div style="font-size:22px;font-weight:900;color:${scoreColor}">${scoreVal}/100 — ${diagnostico.nivel}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">Prioridade: ${diagnostico.prioridade}</div>
          </div>
          <div style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:8px">Vulnerabilidades</div>
            ${vulnHtml}
          </div>
          <div style="padding:12px 0;border-bottom:1px solid #e5e7eb">
            <div style="font-size:11px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:6px">Resumo do caso</div>
            <div style="font-size:14px;color:#374151;line-height:1.6">${diagnostico.resumo_advogada}</div>
          </div>
          <div style="margin-top:16px;display:flex;gap:8px;flex-direction:column">
            <a href="https://wa.me/55${telefoneLimpo}?text=Olá%20${encodeURIComponent(dadosUsuario.nome)}%2C%20sou%20especialista%20da%20ORYON%20Legal.%20Analisei%20seu%20diagnóstico%20e%20gostaria%20de%20conversar%20sobre%20como%20podemos%20ajudar."
               style="display:block;text-align:center;background:#25d366;color:white;padding:14px;border-radius:10px;text-decoration:none;font-weight:800">
              💬 Entrar em contato via WhatsApp
            </a>
            <a href="https://agrorate.app/oryon-legal/advogada"
               style="display:block;text-align:center;background:#92400e;color:white;padding:12px;border-radius:10px;text-decoration:none;font-weight:700">
              📅 Abrir painel e agendar reunião
            </a>
          </div>
        </div>
      </div>`

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'ORYON Legal <noreply@oryonag.com.br>',
          to: ADVOGADA_EMAIL,
          subject: `⚖️ Diagnóstico — ${dadosUsuario?.nome ?? 'Anônimo'} · Score ${scoreVal}/100`,
          html,
        }),
      })
      const resendBody = await resendRes.json()
      if (!resendRes.ok) {
        console.error('Resend error:', JSON.stringify(resendBody))
      } else {
        console.log('Resend ok — id:', resendBody.id, '— to:', ADVOGADA_EMAIL)
      }
    }

    return NextResponse.json({ ok: true, diagnostico, leadId })
  } catch (err) {
    console.error('diagnostico error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
