import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCar } from '@/lib/directdata'
import { isValid, validUntil } from '@/lib/verification-cache'
import { getUserPlan, hasAccess, canForce } from '@/lib/plan-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const plan = await getUserPlan(user.id)
    if (!hasAccess(plan, 'enterprise')) {
      return NextResponse.json({ error: 'Plano Enterprise necessário para consulta CAR.' }, { status: 403 })
    }

    const { numeroCar, force } = await request.json()
    if (!numeroCar?.trim()) {
      return NextResponse.json({ error: 'Informe o Número CAR do imóvel.' }, { status: 400 })
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
    if (!forceReal && cached && isValid(cached.carValidUntil)) {
      return NextResponse.json({
        inscricaoCAR: cached.carNumero, situacaoCadastro: cached.carSituacao,
        area: cached.carAreaTotal, cached: true, validUntil: cached.carValidUntil,
      })
    }

    const car = await consultarCar(numeroCar.trim())
    const propertyId = dbUser.properties[0].id
    const until = validUntil('car')

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        carVerifiedAt: new Date(), carValidUntil: until,
        carNumero: car.inscricaoCAR, carSituacao: car.situacaoCadastro,
        carAreaTotal: car.area, carData: car.raw as object,
      },
      create: {
        propertyId,
        carVerifiedAt: new Date(), carValidUntil: until,
        carNumero: car.inscricaoCAR, carSituacao: car.situacaoCadastro,
        carAreaTotal: car.area, carData: car.raw as object,
      },
    })

    return NextResponse.json({
      inscricaoCAR: car.inscricaoCAR, situacaoCadastro: car.situacaoCadastro,
      condicaoExterna: car.condicaoExterna, area: car.area,
      municipio: car.municipio, uf: car.uf, dataInscricao: car.dataInscricao,
      modulosFiscais: car.modulosFiscais, vegetacaoNativa: car.vegetacaoNativa,
      reservaLegalRecompor: car.reservaLegalRecompor, cached: false, validUntil: until,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAR erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'Número CAR não encontrado.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
