import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCafir } from '@/lib/directdata'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess, canForce } from '@/lib/plan-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'enterprise')) {
      return NextResponse.json({ error: 'Plano Enterprise necessário para consulta CAFIR.' }, { status: 403 })
    }

    const { cib, force } = await request.json()
    if (!cib?.trim()) {
      return NextResponse.json({ error: 'Informe o CIB do imóvel (código INCRA).' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })
    if (!dbUser?.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const forceReal = force && canForce(plan)
    const cached = dbUser.properties[0].agroRate
    if (!forceReal && cached && isValid(cached.cafirValidUntil)) {
      return NextResponse.json({
        cib: cached.cafirNumero, area: cached.cafirArea,
        situacao: cached.cafirSituacao, cached: true,
        validUntil: cached.cafirValidUntil,
      })
    }

    const cafir = await consultarCafir(cib.trim())
    const propertyId = dbUser.properties[0].id
    const until = validUntil('cafir')

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        cafirVerifiedAt: new Date(), cafirValidUntil: until,
        cafirNumero: cafir.cib, cafirArea: cafir.area,
        cafirSituacao: cafir.situacao, cafirData: cafir.raw as object,
      },
      create: {
        propertyId,
        cafirVerifiedAt: new Date(), cafirValidUntil: until,
        cafirNumero: cafir.cib, cafirArea: cafir.area,
        cafirSituacao: cafir.situacao, cafirData: cafir.raw as object,
      },
    })

    return NextResponse.json({
      cib: cafir.cib, nomeImovel: cafir.nomeImovel,
      area: cafir.area, localizacao: cafir.localizacao,
      municipio: cafir.municipio, uf: cafir.uf,
      dataEmissao: cafir.dataEmissao, situacao: cafir.situacao,
      codigoINCRA: cafir.codigoINCRA, cached: false, validUntil: until,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAFIR erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'CIB não encontrado na base INCRA.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
