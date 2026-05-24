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

async function extrairTextoPDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default
  const result = await pdfParse(buffer)
  return result.text
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
      const texto = await extrairTextoPDF(buffer)
      if (!texto?.trim()) {
        return NextResponse.json({ error: 'Não foi possível extrair texto do PDF' }, { status: 422 })
      }
      resultadoIA = await groq([
        { role: 'user', content: `${PROMPT_CREDITO}\n\nTexto do documento:\n${texto.slice(0, 10000)}` },
      ], 2048)
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
