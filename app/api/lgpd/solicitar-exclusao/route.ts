import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { allowed } = rateLimit(`lgpd-exclusao:${ip}`, 3, 24 * 60 * 60_000)
    if (!allowed) return NextResponse.json({ error: 'Limite de solicitações atingido. Tente novamente amanhã.' }, { status: 429 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { motivo } = await req.json()

    await resend.emails.send({
      from: 'AgroRate <noreply@oryonag.com.br>',
      to: 'privacidade@oryonag.com.br',
      subject: `[LGPD] Solicitação de Exclusão de Dados — AgroRate`,
      html: `
        <h2>Solicitação de Exclusão de Dados (LGPD)</h2>
        <p><strong>Usuário:</strong> ${user.email}</p>
        <p><strong>ID Supabase:</strong> ${user.id}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Motivo:</strong> ${motivo || 'Não informado'}</p>
        <hr/>
        <p>Atenção: dados financeiros podem ter retenção regulatória de até 5 anos.</p>
        <p>Prazo para atendimento: 30 dias corridos.</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
  }
}
