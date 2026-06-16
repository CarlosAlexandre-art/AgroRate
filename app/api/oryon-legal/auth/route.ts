import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { senha } = await req.json()
  const correta = process.env.ADVOGADA_SENHA ?? 'oryon2026'
  if (senha === correta) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
}
