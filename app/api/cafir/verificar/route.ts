import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCafir } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })
    if (!dbUser?.cpfEncrypted) {
      return NextResponse.json({ error: 'Verifique seu CPF primeiro na aba QUOD.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cpf = decryptCpf(dbUser.cpfEncrypted)
    const cafir = await consultarCafir(cpf)

    const propertyId = dbUser.properties[0].id
    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        cafirVerifiedAt: new Date(),
        cafirNumero:     cafir.numero,
        cafirArea:       cafir.area,
        cafirSituacao:   cafir.situacao,
        cafirData:       cafir.raw as object,
      },
      create: {
        propertyId,
        cafirVerifiedAt: new Date(),
        cafirNumero:     cafir.numero,
        cafirArea:       cafir.area,
        cafirSituacao:   cafir.situacao,
        cafirData:       cafir.raw as object,
      },
    })

    return NextResponse.json({
      numero:   cafir.numero,
      area:     cafir.area,
      situacao: cafir.situacao,
      municipio: cafir.municipio,
      uf:       cafir.uf,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAFIR erro:', msg)
    if (msg.includes('não configurado')) {
      return NextResponse.json({ error: 'API CAFIR não configurada. Aguarde ativação.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
