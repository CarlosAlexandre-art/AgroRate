import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function getPropertyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { take: 1 } },
  })
  return user?.properties[0]?.id ?? null
}

async function getPropertyOwner(userId: string) {
  return prisma.user.findUnique({
    where: { supabaseId: userId },
    select: { name: true, properties: { take: 1, select: { id: true, name: true } } },
  })
}

const ROLE_LABEL: Record<string, string> = {
  VISUALIZADOR: 'Visualizador',
  CONTADOR: 'Contador',
  COLABORADOR: 'Colaborador',
}

const ROLE_PERMS: Record<string, string[]> = {
  VISUALIZADOR: ['Score AgroRate', 'Lista de documentos', 'Relatórios básicos'],
  CONTADOR: ['Score AgroRate completo', 'Certidões (CAR, CAFIR, DAP)', 'Fluxo de caixa', 'Documentos fiscais com download', 'Upload de arquivos'],
  COLABORADOR: ['Tudo do Contador', 'Edição de dados financeiros', 'Upload de arquivos'],
}

async function enviarEmailConvite(params: {
  toEmail: string
  toNome?: string
  ownerName: string
  propertyName: string
  role: string
  inviteToken: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY não configurado' }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const link = `https://agrorate.app/acesso/${params.inviteToken}`
    const roleLabel = ROLE_LABEL[params.role] ?? params.role
    const perms = (ROLE_PERMS[params.role] ?? []).map(p => `<li style="margin:6px 0;color:#94a3b8;">${p}</li>`).join('')

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'AgroRate <onboarding@resend.dev>',
      to: params.toEmail,
      subject: `${params.ownerName} convidou você para acessar o AgroRate`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#020c08;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;border:1px solid #1e293b;">
    <div style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);padding:32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-.02em;">AgroRate</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;">Score de Crédito Rural</div>
    </div>
    <div style="padding:32px;color:#e2e8f0;">
      <p style="margin:0 0 20px;font-size:16px;color:#f1f5f9;">
        Olá${params.toNome ? `, <strong>${params.toNome}</strong>` : ''}!
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#94a3b8;line-height:1.6;">
        <strong style="color:#f1f5f9;">${params.ownerName}</strong> convidou você para acessar os dados da propriedade
        <strong style="color:#f1f5f9;">${params.propertyName}</strong> no AgroRate como <strong style="color:#34d399;">${roleLabel}</strong>.
      </p>
      <div style="background:#0a1628;border-radius:12px;padding:20px;margin:24px 0;border:1px solid #1e293b;">
        <div style="font-size:11px;font-weight:700;color:#475569;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;">Você terá acesso a</div>
        <ul style="margin:0;padding-left:20px;">${perms}</ul>
      </div>
      <a href="${link}"
        style="display:block;background:#16a34a;color:white;padding:16px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;text-align:center;margin:24px 0;">
        Aceitar Convite →
      </a>
      <p style="margin:0;font-size:12px;color:#475569;text-align:center;">
        Ou copie o link: <span style="color:#34d399;">${link}</span>
      </p>
    </div>
    <div style="background:#020c08;padding:16px;text-align:center;color:#334155;font-size:11px;">
      © 2026 AgroRate · OryonAG · <a href="https://agrorate.app" style="color:#334155;">agrorate.app</a>
    </div>
  </div>
</body>
</html>`,
    })
    return { ok: true }
  } catch (e: any) {
    console.error('[compartilhamento] erro ao enviar email:', e)
    return { ok: false, error: e?.message ?? String(e) }
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const propertyId = await getPropertyId(session.user.id)
    if (!propertyId) return NextResponse.json({ shares: [] })

    const shares = await prisma.propertyShare.findMany({
      where: { propertyId },
      orderBy: { invitedAt: 'desc' },
    })
    return NextResponse.json({ shares })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const owner = await getPropertyOwner(session.user.id)
    const propertyId = owner?.properties[0]?.id ?? null
    if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const share = await prisma.propertyShare.upsert({
      where: { propertyId_email: { propertyId, email: body.email } },
      update: { role: body.role ?? 'VISUALIZADOR', status: 'PENDING', invitedAt: new Date() },
      create: {
        propertyId,
        email: body.email,
        nome: body.nome,
        role: body.role ?? 'VISUALIZADOR',
        invitedAt: new Date(),
      },
    })

    const emailResult = await enviarEmailConvite({
      toEmail: body.email,
      toNome: body.nome,
      ownerName: owner?.name ?? 'Produtor',
      propertyName: owner?.properties[0]?.name ?? 'Propriedade',
      role: body.role ?? 'VISUALIZADOR',
      inviteToken: share.inviteToken,
    })

    return NextResponse.json({ share, emailEnviado: emailResult.ok, emailErro: emailResult.error }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const propertyId = await getPropertyId(session.user.id)
    if (!propertyId) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.propertyShare.deleteMany({ where: { id, propertyId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
