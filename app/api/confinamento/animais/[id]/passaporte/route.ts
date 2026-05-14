import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { PassaporteAnimal } from '@/lib/passaporte'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params

    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        property: { include: { user: true } },
        lote: { select: { nome: true, objetivo: true, dataEntrada: true } },
        saudes: { orderBy: { data: 'asc' } },
        movimentos: { orderBy: { data: 'asc' } },
      },
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
      saudes: animal.saudes.map(s => ({
        tipo: s.tipo,
        descricao: s.descricao,
        produto: s.produto,
        data: s.data,
      })),
      movimentos: animal.movimentos.map(m => ({
        tipo: m.tipo,
        origem: m.origem,
        destino: m.destino,
        pesoNaData: m.pesoNaData != null ? Number(m.pesoNaData) : null,
        data: m.data,
      })),
      lote: animal.lote ? {
        nome: animal.lote.nome,
        objetivo: animal.lote.objetivo,
        dataEntrada: animal.lote.dataEntrada,
      } : null,
      geradoEm: new Date(),
    }

    return NextResponse.json(passaporte)
  } catch (error) {
    console.error('GET /api/confinamento/animais/[id]/passaporte:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
