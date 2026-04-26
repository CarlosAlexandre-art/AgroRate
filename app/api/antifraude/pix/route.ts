import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consultarAntifraude } from '@/lib/directdata'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { documento, chave, tipo } = await request.json()
    if (!documento?.trim() || !chave?.trim()) {
      return NextResponse.json({ error: 'documento e chave são obrigatórios.' }, { status: 400 })
    }

    const result = await consultarAntifraude(documento, chave, tipo)

    return NextResponse.json({
      chavePix:                  result.chavePix,
      nomeEntidade:              result.nomeEntidade,
      tipo:                      result.tipo,
      status:                    result.status,
      probabilidadeTitularidade: result.probabilidadeTitularidade,
      riscoFraude:               result.riscoFraude,
      riscoLaranja:              result.riscoLaranja,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Antifraude PIX erro:', msg)
    return NextResponse.json({ error: msg }, { status: msg.includes('configurado') || msg.includes('inválido') ? 503 : 500 })
  }
}
