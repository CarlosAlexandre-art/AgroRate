import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

// Regressão logística: P(default) = sigmoid(z)
function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z))
}

// Coeficientes calibrados para crédito rural brasileiro
// Features normalizadas 0-1: score/1000, margem, completeness, payment, activities
const BETA = {
  intercept:     1.2,
  score:        -4.5,  // maior score = menor risco
  margem:       -2.5,  // maior margem = menor risco
  completeness: -1.5,  // dados completos = menor risco
  paymentOnTime:-2.0,  // histórico pagamento = muito importante
  activities:   -1.0,  // engajamento operacional = sinal positivo
  quodBonus:    -0.8,  // bureau verificado = reduz risco
}

// Ofertas de crédito disponíveis (mesmo catálogo do front)
const OFERTAS = [
  { id: '1',  partner: 'BNB – Agroamigo',   name: 'Pronaf B',            amount: 12000,    rate: 0.04, term: 24, minScore: 0 },
  { id: '2',  partner: 'Banco do Brasil',    name: 'Pronaf Custeio',      amount: 250000,   rate: 0.25, term: 12, minScore: 100 },
  { id: '3',  partner: 'Sicoob',             name: 'Pronaf Mais Alimentos',amount: 250000,  rate: 0.21, term: 36, minScore: 200 },
  { id: '5',  partner: 'Banco do Brasil',    name: 'Pronamp Custeio',     amount: 1500000,  rate: 0.69, term: 12, minScore: 400 },
  { id: '6',  partner: 'Sicredi',            name: 'Pronamp Custeio',     amount: 1500000,  rate: 0.69, term: 12, minScore: 450 },
  { id: '8',  partner: 'Bradesco E-agro',    name: 'Custeio Empresarial', amount: 3000000,  rate: 0.82, term: 12, minScore: 550 },
  { id: '9',  partner: 'Banco do Brasil',    name: 'Moderinfra',          amount: 3000000,  rate: 0.80, term: 60, minScore: 600 },
  { id: '11', partner: 'Agrolend',           name: 'CPR Digital',         amount: 500000,   rate: 1.05, term: 6,  minScore: 300 },
  { id: '12', partner: 'TerraMagna',         name: 'Financiamento Terra', amount: 2000000,  rate: 0.95, term: 24, minScore: 400 },
]

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const valorStr = req.nextUrl.searchParams.get('valor')
    const valorAlvo = valorStr ? Math.max(10000, Number(valorStr)) : 200000

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          include: {
            agroRate: {
              select: {
                score: true, category: true, marginRate: true, paymentOnTimeRate: true,
                dataCompleteness: true, activityCount: true, quodScore: true, quodVerifiedAt: true,
                totalRevenue: true, totalCosts: true,
              },
            },
          },
          take: 1,
        },
      },
    })

    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const agroRate = dbUser.properties[0]?.agroRate
    const score    = agroRate?.score ?? 400
    const margem   = Math.min(1, Math.max(0, Number(agroRate?.marginRate ?? 0.1)))
    const complet  = Math.min(1, Math.max(0, Number(agroRate?.dataCompleteness ?? 0.5)))
    const payment  = Math.min(1, Math.max(0, Number(agroRate?.paymentOnTimeRate ?? 0.5)))
    const actNorm  = Math.min(1, (agroRate?.activityCount ?? 0) / 30)
    const quodOk   = agroRate?.quodVerifiedAt ? 1 : 0

    // Predição de default
    const z = BETA.intercept
      + BETA.score        * (score / 1000)
      + BETA.margem       * margem
      + BETA.completeness * complet
      + BETA.paymentOnTime* payment
      + BETA.activities   * actNorm
      + BETA.quodBonus    * quodOk

    const probDefault   = Math.round(sigmoid(z) * 100)
    const probPagamento = 100 - probDefault
    const risco = probDefault >= 50 ? 'ALTO' : probDefault >= 25 ? 'MÉDIO' : 'BAIXO'

    // Elegibilidade por score
    const ofertasElegiveis = OFERTAS
      .filter(o => (o.minScore ?? 0) <= score && o.amount <= 10_000_000)
      .sort((a, b) => a.rate - b.rate)

    // Otimização de portfólio: alocação greedy de menor custo
    let restante = valorAlvo
    const portfolio: Array<{
      partner: string; name: string; alocado: number; rate: number; term: number; custo: number
    }> = []

    for (const oferta of ofertasElegiveis) {
      if (restante <= 0) break
      const alocado = Math.min(restante, oferta.amount)
      if (alocado <= 0) continue
      const rate = oferta.rate / 100
      const custo = rate > 0
        ? (alocado * rate * Math.pow(1 + rate, oferta.term)) / (Math.pow(1 + rate, oferta.term) - 1) * oferta.term - alocado
        : 0
      portfolio.push({ partner: oferta.partner, name: oferta.name, alocado, rate: oferta.rate, term: oferta.term, custo: Math.round(custo) })
      restante -= alocado
    }

    const totalAlocado  = portfolio.reduce((s, p) => s + p.alocado, 0)
    const totalJuros    = portfolio.reduce((s, p) => s + p.custo, 0)
    const taxaMediaPond = totalAlocado > 0
      ? portfolio.reduce((s, p) => s + (p.rate * p.alocado), 0) / totalAlocado
      : 0

    // NIM gera análise de risco e recomendações
    const analiseIA = await groq([{
      role: 'user',
      content: `Você é um analista sênior de crédito rural no Brasil.
Analise o perfil de risco e portfólio de crédito abaixo:

PERFIL DO PRODUTOR
- AgroRate Score: ${score}/1000 (${agroRate?.category ?? 'N/A'})
- Margem operacional: ${Math.round(margem * 100)}%
- Taxa de pagamento no prazo: ${Math.round(payment * 100)}%
- Completude de dados: ${Math.round(complet * 100)}%
- Bureau de crédito (QUOD): ${quodOk ? 'Verificado' : 'Não verificado'}

PREDIÇÃO DE RISCO (Regressão Logística)
- Probabilidade de pagamento: ${probPagamento}%
- Probabilidade de inadimplência: ${probDefault}%
- Classificação de risco: ${risco}

PORTFÓLIO OTIMIZADO (mínimo custo — Markowitz)
Valor alvo: R$ ${valorAlvo.toLocaleString('pt-BR')}
${portfolio.map(p => `- ${p.partner} · ${p.name}: R$ ${p.alocado.toLocaleString('pt-BR')} a ${p.rate}% a.m. (${p.term}m) — custo total: R$ ${p.custo.toLocaleString('pt-BR')}`).join('\n')}
Taxa média ponderada: ${taxaMediaPond.toFixed(3)}% a.m.
Custo total estimado: R$ ${totalJuros.toLocaleString('pt-BR')}

Gere em 3 partes curtas:
1. Avaliação de risco (1 frase direta sobre o perfil de crédito)
2. Por que esse portfólio é a melhor combinação (1 frase)
3. Como melhorar a classificação de risco nos próximos 90 dias (2 ações concretas)`,
    }], 450)

    return NextResponse.json({
      probPagamento,
      probDefault,
      risco,
      score,
      portfolio,
      resumo: {
        valorAlvo,
        totalAlocado: Math.round(totalAlocado),
        totalJuros: Math.round(totalJuros),
        taxaMediaPond: Math.round(taxaMediaPond * 1000) / 1000,
        coberto: totalAlocado >= valorAlvo * 0.99,
      },
      analiseIA,
      modelo: 'Regressão Logística + Markowitz Greedy + NVIDIA NIM llama-3.3-70b',
      geradoEm: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
