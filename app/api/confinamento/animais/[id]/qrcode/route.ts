import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { gerarQRCodeBuffer, type PassaporteAnimal } from '@/lib/passaporte'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const animal = await prisma.animal.findUnique({
      where: { id },
      include: { property: { include: { user: true } } },
    })
    if (!animal) return NextResponse.json({ error: 'Animal não encontrado' }, { status: 404 })

    const passaporte: PassaporteAnimal = {
      id: animal.id,
      sisbovNumero: animal.sisbovNumero,
      brincoNumero: animal.brincoNumero,
      nome: animal.nome,
      especie: animal.especie,
      raca: animal.raca,
      sexo: animal.sexo,
      dataNascimento: animal.dataNascimento,
      pesoEntrada: Number(animal.pesoEntrada),
      pesoAtual: Number(animal.pesoAtual),
      origemFazenda: animal.origemFazenda,
      origemUF: animal.origemUF,
      propriedade: animal.property.name,
      proprietario: animal.property.user.name,
      saudes: [],
      movimentos: [],
      lote: null,
      geradoEm: new Date(),
    }

    const buffer = await gerarQRCodeBuffer(passaporte)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${animal.sisbovNumero || animal.id}.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('GET /api/confinamento/animais/[id]/qrcode:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
