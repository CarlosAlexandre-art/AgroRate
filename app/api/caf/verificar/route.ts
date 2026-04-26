import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarCaf } from '@/lib/directdata'
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
    const caf = await consultarCaf(cpf)

    const propertyId = dbUser.properties[0].id
    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        cafVerifiedAt: new Date(),
        cafNumero:     caf.numero,
        cafSituacao:   caf.situacao,
        cafData:       caf.raw as object,
      },
      create: {
        propertyId,
        cafVerifiedAt: new Date(),
        cafNumero:     caf.numero,
        cafSituacao:   caf.situacao,
        cafData:       caf.raw as object,
      },
    })

    return NextResponse.json({
      numero:     caf.numero,
      situacao:   caf.situacao,
      validade:   caf.validade,
      modalidade: caf.modalidade,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('CAF erro:', msg)
    if (msg.includes('não configurado')) {
      return NextResponse.json({ error: 'API CAF não configurada. Aguarde ativação.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
