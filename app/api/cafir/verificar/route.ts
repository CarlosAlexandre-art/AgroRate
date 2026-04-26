import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCafir } from '@/lib/directdata'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { cib } = await request.json()
    if (!cib?.trim()) {
      return NextResponse.json({ error: 'Informe o CIB do imóvel (código INCRA).' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser?.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cafir = await consultarCafir(cib.trim())

    const propertyId = dbUser.properties[0].id
    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        cafirVerifiedAt: new Date(),
        cafirNumero:     cafir.cib,
        cafirArea:       cafir.area,
        cafirSituacao:   cafir.situacao,
        cafirData:       cafir.raw as object,
      },
      create: {
        propertyId,
        cafirVerifiedAt: new Date(),
        cafirNumero:     cafir.cib,
        cafirArea:       cafir.area,
        cafirSituacao:   cafir.situacao,
        cafirData:       cafir.raw as object,
      },
    })

    return NextResponse.json({
      cib:         cafir.cib,
      nomeImovel:  cafir.nomeImovel,
      area:        cafir.area,
      localizacao: cafir.localizacao,
      municipio:   cafir.municipio,
      uf:          cafir.uf,
      dataEmissao: cafir.dataEmissao,
      situacao:    cafir.situacao,
      codigoINCRA: cafir.codigoINCRA,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAFIR erro:', msg)
    if (msg.includes('não configurado') || msg.includes('inválido')) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    if (msg.includes('não encontrado') || msg.includes('404')) {
      return NextResponse.json({ error: 'CIB não encontrado na base INCRA.' }, { status: 404 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
