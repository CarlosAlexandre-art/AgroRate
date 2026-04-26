import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarDossie } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser?.cpfEncrypted) {
      return NextResponse.json({ error: 'Verifique seu CPF primeiro na aba QUOD.' }, { status: 400 })
    }
    if (!dbUser.properties[0]) {
      return NextResponse.json({ error: 'Nenhuma propriedade cadastrada.' }, { status: 400 })
    }

    const cpf = decryptCpf(dbUser.cpfEncrypted)
    const dossie = await consultarDossie(cpf)

    const propertyId = dbUser.properties[0].id
    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        dossieVerifiedAt: new Date(),
        dossieData:       dossie.raw as object,
      },
      create: {
        propertyId,
        dossieVerifiedAt: new Date(),
        dossieData:       dossie.raw as object,
      },
    })

    return NextResponse.json({
      nome:           dossie.nome,
      dataNascimento: dossie.dataNascimento,
      totalEnderecos: Array.isArray(dossie.enderecos) ? dossie.enderecos.length : 0,
      totalTelefones: Array.isArray(dossie.telefones) ? dossie.telefones.length : 0,
      totalVeiculos:  Array.isArray(dossie.veiculos)  ? dossie.veiculos.length  : 0,
      totalImoveis:   Array.isArray(dossie.imoveis)   ? dossie.imoveis.length   : 0,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Dossiê erro:', msg)
    if (msg.includes('não configurado')) {
      return NextResponse.json({ error: 'API Dossiê não configurada. Aguarde ativação.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
