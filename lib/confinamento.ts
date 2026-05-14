// Cálculos de desempenho para o módulo de Confinamento Inteligente

export type DadosDiarios = {
  data: Date
  pesoMedio?: number | null  // kg
  consumoRacao: number       // kg total do lote
  mortalidade: number
}

export type ResumoLote = {
  cabecasEntrada: number
  pesoMedioEntrada: number  // kg
  custoEntrada: number      // R$
  metaGMD: number           // kg/dia
  dataEntrada: Date
  diarios: DadosDiarios[]
}

// Ganho Médio Diário em kg/dia — média ponderada dos registros com pesagem
export function calcGMD(lote: ResumoLote): number {
  const comPeso = lote.diarios.filter(d => d.pesoMedio != null)
  if (comPeso.length < 2) {
    // Com apenas 1 pesagem, calcula em relação ao peso de entrada
    if (comPeso.length === 1) {
      const dias = Math.max(1, diasEntre(lote.dataEntrada, comPeso[0].data))
      return +((comPeso[0].pesoMedio! - lote.pesoMedioEntrada) / dias).toFixed(3)
    }
    return 0
  }
  const ultimo = comPeso[comPeso.length - 1]
  const primeiro = comPeso[0]
  const dias = Math.max(1, diasEntre(primeiro.data, ultimo.data))
  return +((ultimo.pesoMedio! - primeiro.pesoMedio!) / dias).toFixed(3)
}

// Peso médio atual estimado
export function calcPesoAtual(lote: ResumoLote): number {
  const comPeso = lote.diarios.filter(d => d.pesoMedio != null)
  if (comPeso.length === 0) return lote.pesoMedioEntrada
  return comPeso[comPeso.length - 1].pesoMedio!
}

// Cabeças atuais (descontando mortalidade)
export function calcCabecasAtuais(lote: ResumoLote): number {
  const mortes = lote.diarios.reduce((s, d) => s + d.mortalidade, 0)
  return Math.max(0, lote.cabecasEntrada - mortes)
}

// Custo por arroba produzida — R$/@ = custo total / arrobas produzidas
// 1 arroba = 15 kg de carcaça; rendimento de carcaça padrão = 52%
export function calcCustoPorArroba(lote: ResumoLote, custoRacaoKg: number = 1.8): number {
  const cabecas = calcCabecasAtuais(lote)
  if (cabecas === 0) return 0

  const pesoAtual = calcPesoAtual(lote)
  const ganhoTotal = Math.max(0, pesoAtual - lote.pesoMedioEntrada)  // kg/cabeça
  const totalRacaoKg = lote.diarios.reduce((s, d) => s + d.consumoRacao, 0)

  const custoRacao = totalRacaoKg * custoRacaoKg
  const custoTotal = lote.custoEntrada + custoRacao

  const arrobasProduzidas = (ganhoTotal * cabecas * 0.52) / 15
  if (arrobasProduzidas <= 0) return 0
  return +(custoTotal / arrobasProduzidas).toFixed(2)
}

// Eficiência Alimentar — kg de peso ganho por kg de ração consumida
export function calcEficienciaAlimentar(lote: ResumoLote): number {
  const totalRacao = lote.diarios.reduce((s, d) => s + d.consumoRacao, 0)
  if (totalRacao === 0) return 0
  const cabecas = calcCabecasAtuais(lote)
  const ganhoTotal = Math.max(0, calcPesoAtual(lote) - lote.pesoMedioEntrada) * cabecas
  return +(ganhoTotal / totalRacao).toFixed(3)
}

// Previsão de data de abate dado um peso alvo (ex: 480 kg para nelore)
export function calcPrevisaoAbate(lote: ResumoLote, pesoAlvoKg: number = 480): Date | null {
  const gmd = calcGMD(lote)
  if (gmd <= 0) return null
  const pesoAtual = calcPesoAtual(lote)
  const diasRestantes = Math.ceil((pesoAlvoKg - pesoAtual) / gmd)
  if (diasRestantes <= 0) return new Date()
  const previsao = new Date()
  previsao.setDate(previsao.getDate() + diasRestantes)
  return previsao
}

// Margem estimada do lote em R$
// precoArroba: preço de mercado da arroba (@) em R$
export function calcMargemEstimada(
  lote: ResumoLote,
  precoArroba: number = 320,
  custoRacaoKg: number = 1.8,
  pesoAlvoKg: number = 480
): number {
  const cabecas = calcCabecasAtuais(lote)
  if (cabecas === 0) return 0

  const totalRacaoKg = lote.diarios.reduce((s, d) => s + d.consumoRacao, 0)
  const custoRacao = totalRacaoKg * custoRacaoKg
  const custoTotal = lote.custoEntrada + custoRacao

  // Receita estimada: arrobas por cabeça × preço × cabeças
  const arrobasPorCabeca = (pesoAlvoKg * 0.52) / 15
  const receitaTotal = arrobasPorCabeca * precoArroba * cabecas

  return +(receitaTotal - custoTotal).toFixed(2)
}

// Score de performance do lote (0–100) para comparação entre lotes
export function calcScoreLote(lote: ResumoLote): number {
  const gmd = calcGMD(lote)
  const ea = calcEficienciaAlimentar(lote)
  const cabecas = calcCabecasAtuais(lote)
  const mortalidadeRate = 1 - cabecas / Math.max(1, lote.cabecasEntrada)

  const gmdScore = Math.min(100, (gmd / lote.metaGMD) * 50)
  const eaScore = Math.min(100, ea * 150)  // EA típica ~0.15–0.20, 0.20 = bom
  const mortalidadePenalty = mortalidadeRate * 100 * 2

  return Math.max(0, Math.round(gmdScore * 0.5 + eaScore * 0.35 - mortalidadePenalty * 0.15))
}

function diasEntre(a: Date, b: Date): number {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
}

export function formatArroba(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
