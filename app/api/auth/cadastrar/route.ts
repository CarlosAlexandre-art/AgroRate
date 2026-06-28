import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmailConfirmation } from '@/lib/email'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const { allowed } = rateLimit(`cadastro:${ip}`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 })
  }

  let body: { name?: unknown; email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { name, email, password } = body

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres.' }, { status: 400 })
  }

  const cleanName = name.trim()
  const cleanEmail = email.toLowerCase().trim()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agrorate.app'

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email: cleanEmail,
    password,
    options: {
      data: { name: cleanName },
      redirectTo: `${APP_URL}/auth/callback`,
    },
  })

  if (error) {
    const msg = (error.message ?? '').toLowerCase()
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exist')) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Tente fazer login.' },
        { status: 409 }
      )
    }
    console.error('[cadastrar] Supabase error:', error.message)
    return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
  }

  const confirmationUrl = data?.properties?.action_link
  if (!confirmationUrl) {
    return NextResponse.json({ error: 'Erro interno ao gerar link. Tente novamente.' }, { status: 500 })
  }

  try {
    await sendEmailConfirmation(cleanName, cleanEmail, confirmationUrl)
  } catch (emailError) {
    console.error('[cadastrar] Falha ao enviar e-mail de confirmação:', emailError)
  }

  return NextResponse.json({ status: 'email_sent' })
}
