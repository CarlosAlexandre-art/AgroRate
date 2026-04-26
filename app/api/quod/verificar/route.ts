import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarQuod, encryptCpf, hashCpf, maskCpf } from '@/lib/quod'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess, canForce } from '@/lib/plan-guard'

function encryptDoc(v: string) { return encryptCpf(v) }
function hashDoc(v: string)    { return hashCpf(v) }
function maskCnpj(cnpj: string) {
  const c = cnpj.replace(/\D/g, '')
  return `**.${c.slice(2, 5)}.${c.slice(5, 8)}/**-**`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'pro')) {
      return NextResponse.json({ error: 'Plano Pro ou superior necessário para consulta QUOD.' }, { status: 403 })
    }

    const { cpf, cnpj, force } = await request.json()
    const forceReal = force && canForce(plan)
    const cpfDigits  = cpf  ? cpf.replace(/\D/g, '')  : ''
    const cnpjDigits = cnpj ? cnpj.replace(/\D/g, '') : ''

    if (!cpfDigits && !cnpjDigits) {
      return NextResponse.json({ error: 'Informe CPF ou CNPJ' }, { status: 400 })
    }
    if (cpfDigits && cpfDigits.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }
    if (cnpjDigits && cnpjDigits.length !== 14) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
    }

    if (!forceReal) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: user.id },
        include: { properties: { take: 1, include: { agroRate: true } } },
      })
      const cached = dbUser?.properties[0]?.agroRate
      if (cached && isValid(cached.quodValidUntil)) {
        return NextResponse.json({
          score:      cached.quodScore,
          faixa:      cached.quodFaixa,
          capacidade: cached.quodCapacidade,
          tipo:       cached.quodTipo,
          cached:     true,
          validUntil: cached.quodValidUntil,
        })
      }
    }

    const quod = await consultarQuod(cpfDigits, cnpjDigits || undefined)

    const docUpdate: Record<string, string> = {}
    if (cpfDigits) {
      docUpdate.cpfEncrypted = encryptDoc(cpfDigits)
      docUpdate.cpfHash      = hashDoc(cpfDigits)
      docUpdate.cpfMasked    = maskCpf(cpfDigits)
    }
    if (cnpjDigits) {
      docUpdate.cnpjEncrypted = encryptDoc(cnpjDigits)
      docUpdate.cnpjHash      = hashDoc(cnpjDigits)
      docUpdate.cnpjMasked    = maskCnpj(cnpjDigits)
    }
    await prisma.user.update({ where: { supabaseId: user.id }, data: docUpdate })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })

    if (dbUser?.properties[0]) {
      const propertyId = dbUser.properties[0].id
      const until = validUntil('quod')
      await prisma.agroRate.upsert({
        where: { propertyId },
        update: {
          quodScore: quod.score, quodFaixa: quod.faixaScore,
          quodCapacidade: quod.capacidadePagamento,
          quodVerifiedAt: new Date(), quodValidUntil: until,
          quodTipo: quod.tipo,
        },
        create: {
          propertyId,
          quodScore: quod.score, quodFaixa: quod.faixaScore,
          quodCapacidade: quod.capacidadePagamento,
          quodVerifiedAt: new Date(), quodValidUntil: until,
          quodTipo: quod.tipo,
        },
      })
    }

    const docMasked = quod.tipo === 'PJ' && cnpjDigits ? maskCnpj(cnpjDigits) : maskCpf(cpfDigits)

    return NextResponse.json({
      score:      quod.score,
      faixa:      quod.faixaScore,
      capacidade: quod.capacidadePagamento,
      tipo:       quod.tipo,
      docMasked,
      cached:     false,
      validUntil: validUntil('quod'),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('QUOD erro:', msg)
    if (msg.includes('401') || msg.includes('Token')) {
      return NextResponse.json({ error: 'Token Direct Data não configurado. Aguarde ativação.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
