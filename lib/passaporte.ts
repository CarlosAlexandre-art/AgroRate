import QRCode from 'qrcode'

export type PassaporteAnimal = {
  id: string
  sisbovNumero?: string | null
  brincoNumero?: string | null
  nome?: string | null
  especie: string
  raca?: string | null
  sexo: string
  dataNascimento?: Date | null
  pesoEntrada: number
  pesoAtual: number
  origemFazenda?: string | null
  origemUF?: string | null
  propriedade: string
  proprietario: string
  saudes: {
    tipo: string
    descricao: string
    produto?: string | null
    data: Date
  }[]
  movimentos: {
    tipo: string
    origem?: string | null
    destino?: string | null
    pesoNaData?: number | null
    data: Date
  }[]
  lote?: {
    nome: string
    objetivo: string
    dataEntrada: Date
  } | null
  geradoEm: Date
}

export async function gerarQRCodeDataURL(passaporte: PassaporteAnimal): Promise<string> {
  const payload = {
    id: passaporte.id,
    sisbov: passaporte.sisbovNumero,
    brinco: passaporte.brincoNumero,
    especie: passaporte.especie,
    raca: passaporte.raca,
    sexo: passaporte.sexo,
    propriedade: passaporte.propriedade,
    geradoEm: passaporte.geradoEm.toISOString(),
  }
  return QRCode.toDataURL(JSON.stringify(payload), {
    errorCorrectionLevel: 'M',
    width: 256,
    margin: 2,
    color: { dark: '#1e293b', light: '#ffffff' },
  })
}

export async function gerarQRCodeBuffer(passaporte: PassaporteAnimal): Promise<Buffer> {
  const payload = JSON.stringify({
    id: passaporte.id,
    sisbov: passaporte.sisbovNumero,
    brinco: passaporte.brincoNumero,
    especie: passaporte.especie,
    propriedade: passaporte.propriedade,
    geradoEm: passaporte.geradoEm.toISOString(),
  })
  return QRCode.toBuffer(payload, {
    errorCorrectionLevel: 'M',
    width: 256,
    margin: 2,
  })
}

export function formatarPassaporteTexto(p: PassaporteAnimal): string {
  const linhas: string[] = [
    `PASSAPORTE DIGITAL ANIMAL`,
    `Gerado em: ${p.geradoEm.toLocaleDateString('pt-BR')}`,
    ``,
    `IDENTIFICAÇÃO`,
    `Espécie: ${p.especie}`,
    p.raca ? `Raça: ${p.raca}` : '',
    `Sexo: ${p.sexo === 'MACHO' ? 'Macho' : 'Fêmea'}`,
    p.nome ? `Nome: ${p.nome}` : '',
    p.sisbovNumero ? `SISBOV: ${p.sisbovNumero}` : '',
    p.brincoNumero ? `Brinco: ${p.brincoNumero}` : '',
    p.dataNascimento ? `Nascimento: ${new Date(p.dataNascimento).toLocaleDateString('pt-BR')}` : '',
    ``,
    `PESOS`,
    `Entrada: ${p.pesoEntrada} kg`,
    `Atual: ${p.pesoAtual} kg`,
    `Ganho: ${(p.pesoAtual - p.pesoEntrada).toFixed(1)} kg`,
    ``,
    `ORIGEM`,
    p.origemFazenda ? `Fazenda: ${p.origemFazenda}` : '',
    p.origemUF ? `UF: ${p.origemUF}` : '',
    ``,
    `PROPRIEDADE ATUAL`,
    `Fazenda: ${p.propriedade}`,
    `Proprietário: ${p.proprietario}`,
    p.lote ? `Lote: ${p.lote.nome} (${p.lote.objetivo})` : '',
    ``,
    `HISTÓRICO SANITÁRIO (${p.saudes.length} registros)`,
    ...p.saudes.map(s =>
      `${new Date(s.data).toLocaleDateString('pt-BR')} — ${s.tipo}: ${s.descricao}${s.produto ? ` (${s.produto})` : ''}`
    ),
    ``,
    `MOVIMENTAÇÕES (${p.movimentos.length} registros)`,
    ...p.movimentos.map(m =>
      `${new Date(m.data).toLocaleDateString('pt-BR')} — ${m.tipo}${m.origem ? ` | De: ${m.origem}` : ''}${m.destino ? ` | Para: ${m.destino}` : ''}`
    ),
  ]
  return linhas.filter(l => l !== '').join('\n')
}
