import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { consultarDapPf } from '@/lib/directdata'
import { decryptCpf } from '@/lib/quod'

export async function POST() {
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
    const dap = await consultarDapPf(cpf)
    const propertyId = dbUser.properties[0].id

    await prisma.agroRate.upsert({
      where: { propertyId },
      update: {
        dapVerifiedAt: new Date(),
        dapNumero:     dap.numeroDAP,
        dapSituacao:   dap.tipoDAP,
        dapData:       dap.raw as object,
      },
      create: {
        propertyId,
        dapVerifiedAt: new Date(),
        dapNumero:     dap.numeroDAP,
        dapSituacao:   dap.tipoDAP,
        dapData:       dap.raw as object,
      },
    })

    return NextResponse.json({
      numeroDAP:    dap.numeroDAP,
      dataEmissao:  dap.dataEmissao,
      dataValidade: dap.dataValidade,
      municipio:    dap.municipio,
      uf:           dap.uf,
      enquadramento: dap.enquadramento,
      tipoDAP:      dap.tipoDAP,
      nomeTitular:  dap.nomeTitular,
      imovelNome:   dap.imovelNome,
      imovelArea:   dap.imovelArea,
      rendaTotal:   dap.rendaTotal,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('DAP PF erro:', msg)
    if (msg.includes('não encontrado')) return NextResponse.json({ error: 'CPF não encontrado no DAP.' }, { status: 404 })
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
