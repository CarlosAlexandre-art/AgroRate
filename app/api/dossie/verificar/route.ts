import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarDossie } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess, canForce } from '@/lib/plan-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'enterprise')) {
      return NextResponse.json({ error: 'Plano Enterprise necessário para consulta Dossiê.' }, { status: 403 })
    }

    const { force } = await request.json().catch(() => ({ force: false }))

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })
    if (!dbUser?.cpfEncrypted && !dbUser?.cnpjEncrypted) {
      return NextResponse.json({ error: 'Verifique CPF ou CNPJ primeiro na aba QUOD.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const forceReal = force && canForce(plan)
    const cached = dbUser.properties[0].agroRate
    if (!forceReal && cached && isValid(cached.dossieValidUntil)) {
      return NextResponse.json({
        tipo: cached.dossieData ? (cached.dossieData as Record<string, unknown>).tipo : null,
        cached: true, validUntil: cached.dossieValidUntil,
      })
    }

    const cpf  = dbUser.cpfEncrypted  ? decryptCpf(dbUser.cpfEncrypted)  : ''
    const cnpj = dbUser.cnpjEncrypted ? decryptCpf(dbUser.cnpjEncrypted) : undefined

    const dossie = await consultarDossie(cpf, cnpj)
    const propertyId = dbUser.properties[0].id
    const until = validUntil('dossie')

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        dossieVerifiedAt: new Date(), dossieValidUntil: until,
        dossieData: dossie.raw as object,
      },
      create: {
        propertyId,
        dossieVerifiedAt: new Date(), dossieValidUntil: until,
        dossieData: dossie.raw as object,
      },
    })

    return NextResponse.json({
      tipo:            dossie.tipo,
      nome:            dossie.nome,
      situacao:        dossie.situacaoCadastral,
      scorePf:         dossie.scorePf,
      pendencias:      dossie.pendencias,
      protestos:       dossie.protestos,
      acoesJudiciais:  dossie.acoesJudiciais,
      chequesSemFundo: dossie.chequesSemFundo,
      cached: false, validUntil: until,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Dossiê erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'Documento não encontrado.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
