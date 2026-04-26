import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCar } from '@/lib/directdata'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { numeroCar } = await request.json()
    if (!numeroCar?.trim()) {
      return NextResponse.json({ error: 'Informe o Número CAR do imóvel.' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser?.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const car = await consultarCar(numeroCar.trim())
    const propertyId = dbUser.properties[0].id

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        carVerifiedAt: new Date(),
        carNumero:     car.inscricaoCAR,
        carSituacao:   car.situacaoCadastro,
        carAreaTotal:  car.area,
        carData:       car.raw as object,
      },
      create: {
        propertyId,
        carVerifiedAt: new Date(),
        carNumero:     car.inscricaoCAR,
        carSituacao:   car.situacaoCadastro,
        carAreaTotal:  car.area,
        carData:       car.raw as object,
      },
    })

    return NextResponse.json({
      inscricaoCAR:         car.inscricaoCAR,
      situacaoCadastro:     car.situacaoCadastro,
      condicaoExterna:      car.condicaoExterna,
      area:                 car.area,
      municipio:            car.municipio,
      uf:                   car.uf,
      dataInscricao:        car.dataInscricao,
      modulosFiscais:       car.modulosFiscais,
      vegetacaoNativa:      car.vegetacaoNativa,
      reservaLegalRecompor: car.reservaLegalRecompor,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAR erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'Número CAR não encontrado.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
