import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCafPj } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess } from '@/lib/plan-guard'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'enterprise')) {
      return NextResponse.json({ error: 'Plano Enterprise necessário para consulta CAF.' }, { status: 403 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })
    if (!dbUser?.cnpjEncrypted) {
      return NextResponse.json({ error: 'Nenhum CNPJ verificado. Faça a consulta QUOD com CNPJ primeiro.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cached = dbUser.properties[0].agroRate
    if (cached && isValid(cached.cafValidUntil)) {
      return NextResponse.json({
        numeroCaf: cached.cafNumero, situacao: cached.cafSituacao,
        cached: true, validUntil: cached.cafValidUntil,
      })
    }

    const cnpj = decryptCpf(dbUser.cnpjEncrypted)
    const caf = await consultarCafPj(cnpj)
    const propertyId = dbUser.properties[0].id
    const until = validUntil('caf')

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        cafVerifiedAt: new Date(), cafValidUntil: until,
        cafNumero: caf.numeroCaf, cafSituacao: caf.situacao,
        cafData: caf.raw as object,
      },
      create: {
        propertyId,
        cafVerifiedAt: new Date(), cafValidUntil: until,
        cafNumero: caf.numeroCaf, cafSituacao: caf.situacao,
        cafData: caf.raw as object,
      },
    })

    return NextResponse.json({
      cnpj: caf.cnpj, razaoSocial: caf.razaoSocial,
      numeroCaf: caf.numeroCaf, situacao: caf.situacao,
      dataInscricao: caf.dataInscricao, dataValidade: caf.dataValidade,
      municipio: caf.municipio, uf: caf.uf,
      representanteLegal: caf.representanteLegal,
      cached: false, validUntil: until,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAF PJ erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'CNPJ não encontrado no CAF.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
