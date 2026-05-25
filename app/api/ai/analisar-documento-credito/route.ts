import { NextRequest, NextResponse } from 'next/server'
import { inflateSync, inflateRawSync } from 'zlib'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { groq } from '@/lib/groq'

export const maxDuration = 60

const GROQ_VISION_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

async function analisarImagem(base64: string, mimeType: string, prompt: string): Promise<string> {
  const res = await fetch(GROQ_VISION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.2,
    }),
  })
  if (!res.ok) throw new Error(`Vision API error: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

// Decodifica hex string PDF: suporta UTF-16BE (CIDFont moderno) e byte único (legado)
function hexToText(hex: string): string {
  if (hex.length >= 4 && hex.length % 4 === 0) {
    let r = ''
    for (let i = 0; i < hex.length; i += 4) {
      const c = parseInt(hex.slice(i, i + 4), 16)
      if (c >= 0x20 && c < 0xFFFE) r += String.fromCodePoint(c)
    }
    if (r.replace(/\s/g, '').length > 0) return r
  }
  let r = ''
  for (let i = 0; i < hex.length; i += 2) {
    const c = parseInt(hex.slice(i, i + 2), 16)
    if (c >= 0x20 && c < 0xFF) r += String.fromCharCode(c)
  }
  return r
}

// Extrai texto de blocos BT/ET: parenthesized strings E hex strings (bancos/governo BR)
function extrairDoBlocos(content: string, texts: string[]) {
  const btEt = /BT[\s\S]*?ET/g
  let block: RegExpExecArray | null
  while ((block = btEt.exec(content)) !== null) {
    const seg = block[0]
    let m: RegExpExecArray | null

    // (text) Tj
    const tj = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g
    while ((m = tj.exec(seg)) !== null) texts.push(m[1])

    // <HEX> Tj  — UTF-16BE ou byte único (PDFs modernos com CIDFont)
    const tjHex = /<([0-9A-Fa-f]{2,})>\s*Tj/g
    while ((m = tjHex.exec(seg)) !== null) {
      const t = hexToText(m[1])
      if (t.trim()) texts.push(t)
    }

    // [...] TJ
    const tjArr = /\[([^\]]*)\]\s*TJ/g
    while ((m = tjArr.exec(seg)) !== null) {
      const inner = m[1]
      let p: RegExpExecArray | null
      const paren = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g
      while ((p = paren.exec(inner)) !== null) texts.push(p[1])
      const hexP = /<([0-9A-Fa-f]{2,})>/g
      while ((p = hexP.exec(inner)) !== null) {
        const t = hexToText(p[1])
        if (t.trim()) texts.push(t)
      }
    }
  }
}

// Extrai o maior JPEG embutido no PDF (PDFs escaneados com filtro DCTDecode)
function extrairJpegDoPDF(buffer: Buffer): Buffer | null {
  const SOI = Buffer.from([0xFF, 0xD8, 0xFF])
  let pos = 0
  let best: Buffer | null = null

  while (pos < buffer.length - 3) {
    const start = buffer.indexOf(SOI, pos)
    if (start === -1) break

    // Busca o EOI correspondente a este SOI (scan forward até achar 0xFF 0xD9)
    for (let i = start + 500; i < buffer.length - 1; i++) {
      if (buffer[i] === 0xFF && buffer[i + 1] === 0xD9) {
        const candidate = buffer.slice(start, i + 2)
        if (!best || candidate.length > best.length) best = candidate
        break
      }
    }
    pos = start + 1
  }

  return best && best.length > 5_000 ? best : null
}

// Extrator PDF puro — zero dependências externas, funciona em qualquer serverless
function extrairTextoPDF(buffer: Buffer): string {
  const texts: string[] = []

  // Pass 1: streams sem compressão (PDFs legados)
  extrairDoBlocos(buffer.toString('latin1'), texts)

  // Pass 2: FlateDecode via Buffer.indexOf (mais confiável que regex em dados binários)
  const STREAM_LF   = Buffer.from('stream\n')
  const STREAM_CRLF = Buffer.from('stream\r\n')
  const ENDSTREAM   = Buffer.from('\nendstream')

  let pos = 0
  while (pos < buffer.length) {
    const i1 = buffer.indexOf(STREAM_CRLF, pos)
    const i2 = buffer.indexOf(STREAM_LF,   pos)

    let streamStart = -1
    if      (i1 === -1 && i2 === -1) break
    else if (i1 === -1)              streamStart = i2 + STREAM_LF.length
    else if (i2 === -1)              streamStart = i1 + STREAM_CRLF.length
    else if (i1 <= i2)               streamStart = i1 + STREAM_CRLF.length
    else                             streamStart = i2 + STREAM_LF.length

    const endIdx = buffer.indexOf(ENDSTREAM, streamStart)
    if (endIdx === -1) break

    const streamBuf = buffer.slice(streamStart, endIdx)
    pos = endIdx + ENDSTREAM.length

    if (streamBuf.length < 10) continue

    // Tenta zlib inflate (header zlib) e raw inflate (deflate sem header)
    for (const decompress of [inflateSync, inflateRawSync]) {
      try {
        extrairDoBlocos(decompress(streamBuf).toString('latin1'), texts)
        break
      } catch { }
    }
  }

  return texts
    .map(t =>
      t.replace(/\\n/g, '\n')
       .replace(/\\r/g, '')
       .replace(/\\t/g, ' ')
       .replace(/\\\(/g, '(')
       .replace(/\\\)/g, ')')
       .replace(/\\\\/g, '\\')
       .replace(/[\x00-\x08\x0E-\x1F\x7F\x80-\x9F]/g, '') // remove control chars, preserva Latin-1 e Unicode
    )
    .filter(t => t.trim().length > 1)
    .join(' ')
    .replace(/\s{3,}/g, '  ')
    .trim()
    .slice(0, 12000)
}

const PROMPT_CREDITO = `Você é um analista de crédito rural sênior com 20 anos de experiência em cooperativas e bancos agrícolas brasileiros (Banco do Brasil, Sicoob, Sicredi, Bradesco Rural).

Analise este documento financeiro e extraia todas as informações relevantes para análise de crédito rural.

Responda APENAS com JSON válido, sem markdown, sem explicação:
{
  "tipoDocumento": "Extrato Bancário / Declaração IR / Contrato / DAP / Nota Fiscal / Certidão / CPR / Outros",
  "resumo": "resumo executivo do documento em 2-3 frases para o analista de crédito",
  "dadosIdentificacao": {
    "nomeRazaoSocial": null,
    "cpfCnpj": null,
    "dataDocumento": null,
    "periodoReferencia": null,
    "instituicaoEmissora": null
  },
  "dadosFinanceiros": {
    "receitaBruta": null,
    "despesaTotal": null,
    "saldoMedio": null,
    "patrimonioDeclardo": null,
    "dividas": null,
    "limiteCreditoExistente": null,
    "valorSolicitado": null
  },
  "indicadoresCredito": {
    "capacidadePagamento": "estimativa de capacidade de pagamento mensal em R$",
    "comprometimentoRenda": "percentual estimado da renda comprometida",
    "pontosPositivos": ["fatores favoráveis à concessão"],
    "pontosAtencao": ["fatores de risco ou que merecem verificação adicional"]
  },
  "informacoesAgricolas": {
    "culturas": null,
    "areaHectares": null,
    "producaoToneladas": null,
    "municipioEstado": null
  },
  "recomendacaoAnalista": "aprovado_sem_restricao / aprovado_com_garantia / analise_adicional / alto_risco",
  "justificativa": "justificativa da recomendação em 2-3 frases",
  "documentosFaltantes": ["lista de documentos complementares recomendados"],
  "confianca": "alta/media/baixa"
}`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    // Rate limit: 20 chamadas IA por hora por usuário
    const { allowed } = rateLimit(`ai:${user.id}`, 20, 3600_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Limite de chamadas IA atingido. Tente novamente em 1 hora.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('documento') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

    const mimeType = file.type
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 15 MB.' }, { status: 400 })
    }

    let resultadoIA: string

    if (mimeType === 'application/pdf') {
      const texto = extrairTextoPDF(buffer)
      if (texto?.trim()) {
        resultadoIA = await groq([
          { role: 'user', content: `${PROMPT_CREDITO}\n\nTexto do documento:\n${texto.slice(0, 10000)}` },
        ], 2048)
      } else {
        // Fallback: PDF escaneado — extrai JPEG embutido e analisa via Vision
        const jpeg = extrairJpegDoPDF(buffer)
        if (jpeg) {
          resultadoIA = await analisarImagem(jpeg.toString('base64'), 'image/jpeg', PROMPT_CREDITO)
        } else {
          return NextResponse.json({
            error: 'Não foi possível extrair o conteúdo do PDF. Tente converter para imagem (JPG/PNG) e envie novamente.',
          }, { status: 422 })
        }
      }
    } else if (mimeType.startsWith('image/')) {
      const base64 = buffer.toString('base64')
      resultadoIA = await analisarImagem(base64, mimeType, PROMPT_CREDITO)
    } else {
      return NextResponse.json({ error: 'Formato não suportado. Use PDF ou imagem.' }, { status: 400 })
    }

    let dados: Record<string, unknown>
    try {
      const clean = resultadoIA.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      dados = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar os dados do documento' })
    }

    return NextResponse.json({ ok: true, nomeArquivo: file.name, dados })
  } catch (e: any) {
    console.error('[AnalisarDocumentoCredito Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}
