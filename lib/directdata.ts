const BASE = 'https://apiv3.directd.com.br'

function getToken() {
  const t = process.env.DIRECTDATA_TOKEN || ''
  if (!t) throw new Error('DIRECTDATA_TOKEN não configurado')
  return t
}

async function get(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams({ ...params, Token: getToken() }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`)
  if (res.status === 401) throw new Error('Token Direct Data inválido ou não configurado')
  if (res.status === 403) throw new Error('Saldo insuficiente na conta Direct Data')
  if (res.status === 404) throw new Error('Registro não encontrado')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DirectData ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── CAFIR — Cadastro de Imóveis Rurais ────────────────────────────────────
// Parâmetro: CIB (Código do Imóvel no INCRA), ex: "123.456.789.789-1"
// Endpoint:  GET /api/CadastroImoveisRurais
export type CafirResult = {
  cib: string
  nomeImovel: string
  area: string
  localizacao: string
  cep: string
  municipio: string
  uf: string
  dataEmissao: string
  situacao: string
  cadeiaCIB: string
  codigoINCRA: string
  dataConsulta: string
  raw: unknown
}

export async function consultarCafir(cib: string): Promise<CafirResult> {
  const data = await get('/api/CadastroImoveisRurais', { CIB: cib.trim() })
  const r = data?.retorno ?? {}
  return {
    cib:          r.cib          || '',
    nomeImovel:   r.nomeImovel   || '',
    area:         r.area         || '',
    localizacao:  r.localizacao  || '',
    cep:          r.cep          || '',
    municipio:    r.municipio    || '',
    uf:           r.uf           || '',
    dataEmissao:  r.dataEmissao  || '',
    situacao:     r.situacao     || '',
    cadeiaCIB:    r.cadeiaCIB    || '',
    codigoINCRA:  r.codigoINCRA  || '',
    dataConsulta: r.dataConsulta || '',
    raw:          data,
  }
}

// ─── Placeholders para próximas APIs (serão preenchidos com a doc oficial) ──

export type CarResult = {
  numero: string; situacao: string; areaTotal: string
  municipio: string; uf: string; raw: unknown
}

export async function consultarCar(cpf: string): Promise<CarResult> {
  const data = await get('/api/Car', { CPF: cpf.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  return {
    numero: r.numeroCar || r.numero || '', situacao: r.situacao || '',
    areaTotal: r.areaTotal || '', municipio: r.municipio || '', uf: r.uf || '', raw: data,
  }
}

export type CafResult = {
  numero: string; situacao: string; validade: string; modalidade: string; raw: unknown
}

export async function consultarCaf(cpf: string): Promise<CafResult> {
  const data = await get('/api/Caf', { CPF: cpf.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  return {
    numero: r.numeroCaf || r.numero || '', situacao: r.situacao || '',
    validade: r.validade || '', modalidade: r.modalidade || '', raw: data,
  }
}

export type DossieResult = {
  nome: string; dataNascimento: string
  enderecos: unknown[]; telefones: unknown[]; veiculos: unknown[]; imoveis: unknown[]
  raw: unknown
}

export async function consultarDossie(cpf: string): Promise<DossieResult> {
  const data = await get('/api/Dossie', { CPF: cpf.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  return {
    nome: r.nome || '', dataNascimento: r.dataNascimento || '',
    enderecos: r.enderecos || [], telefones: r.telefones || [],
    veiculos: r.veiculos || [], imoveis: r.imoveis || [], raw: data,
  }
}
