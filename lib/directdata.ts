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
  if (res.status === 408) throw new Error('Tempo esgotado — tente novamente')
  if (res.status === 503) throw new Error('API em manutenção — tente mais tarde')
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DirectData ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── CAFIR ─────────────────────────────────────────────────────────────────
// Endpoint: GET /api/CadastroImoveisRurais | Param: CIB
export type CafirResult = {
  cib: string; nomeImovel: string; area: string
  localizacao: string; cep: string; municipio: string; uf: string
  dataEmissao: string; situacao: string; cadeiaCIB: string
  codigoINCRA: string; dataConsulta: string; raw: unknown
}
export async function consultarCafir(cib: string): Promise<CafirResult> {
  const data = await get('/api/CadastroImoveisRurais', { CIB: cib.trim() })
  const r = data?.retorno ?? {}
  return {
    cib: r.cib || '', nomeImovel: r.nomeImovel || '',
    area: r.area || '', localizacao: r.localizacao || '',
    cep: r.cep || '', municipio: r.municipio || '', uf: r.uf || '',
    dataEmissao: r.dataEmissao || '', situacao: r.situacao || '',
    cadeiaCIB: r.cadeiaCIB || '', codigoINCRA: r.codigoINCRA || '',
    dataConsulta: r.dataConsulta || '', raw: data,
  }
}

// ─── CAR ────────────────────────────────────────────────────────────────────
// Endpoint: GET /api/CadastroAmbientalRural | Param: NumeroCAR
export type CarResult = {
  inscricaoCAR: string; situacaoCadastro: string; condicaoExterna: string
  area: string; municipio: string; uf: string
  dataInscricao: string; modulosFiscais: string
  latitude: string; longitude: string
  vegetacaoNativa: string; ruralConsolidada: string
  reservaLegalRecompor: string
  raw: unknown
}
export async function consultarCar(numeroCar: string): Promise<CarResult> {
  const data = await get('/api/CadastroAmbientalRural', { NumeroCAR: numeroCar.trim() })
  const r = data?.retorno ?? {}
  const imovel = r.dadosImovel ?? {}
  const cob    = r.coberturaSolo ?? {}
  const rl     = r.reservaLegal ?? {}
  return {
    inscricaoCAR:      r.inscricaoCAR         || '',
    situacaoCadastro:  r.situacaoCadastro      || '',
    condicaoExterna:   r.condicaoExterna       || '',
    area:              imovel.area             || '',
    municipio:         imovel.municipio        || '',
    uf:                imovel.uf               || '',
    dataInscricao:     imovel.dataInscricao    || '',
    modulosFiscais:    imovel.modulosFiscais   || '',
    latitude:          imovel.latitude         || '',
    longitude:         imovel.longitude        || '',
    vegetacaoNativa:   cob.vegetacaoNativa     || '',
    ruralConsolidada:  cob.ruralConsolidada    || '',
    reservaLegalRecompor: rl.recompor          || '',
    raw: data,
  }
}

// ─── CAF PJ ─────────────────────────────────────────────────────────────────
// Endpoint: GET /api/CAFCadastroNacionalAgriculturaPJ | Param: CNPJ
export type CafPjResult = {
  cnpj: string; razaoSocial: string; numeroCaf: string
  situacao: string; dataInscricao: string; dataValidade: string
  municipio: string; uf: string; representanteLegal: string
  tipoPessoaJuridica: string
  raw: unknown
}
export async function consultarCafPj(cnpj: string): Promise<CafPjResult> {
  const data = await get('/api/CAFCadastroNacionalAgriculturaPJ', { CNPJ: cnpj.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  return {
    cnpj:               r.cnpj               || '',
    razaoSocial:        r.razaoSocial        || '',
    numeroCaf:          r.numeroCaf          || '',
    situacao:           r.situacao           || '',
    dataInscricao:      r.dataInscricao      || '',
    dataValidade:       r.dataValidade       || '',
    municipio:          r.municipio          || '',
    uf:                 r.uf                 || '',
    representanteLegal: r.representanteLegal || '',
    tipoPessoaJuridica: r.tipoPessoaJuridica || '',
    raw: data,
  }
}

// ─── DAP PF ─────────────────────────────────────────────────────────────────
// Endpoint: GET /api/DAPPessoaFisica | Param: CPF
export type DapPfResult = {
  numeroDAP: string; dataEmissao: string; dataValidade: string
  municipio: string; uf: string; enquadramento: string
  tipoDAP: string; nomeTitular: string
  imovelNome: string; imovelArea: string
  rendaTotal: string
  raw: unknown
}
export async function consultarDapPf(cpf: string): Promise<DapPfResult> {
  const data = await get('/api/DAPPessoaFisica', { CPF: cpf.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  const titular = r.titulares?.[0] ?? {}
  const imovel  = r.imovel ?? {}
  const renda   = r.renda ?? {}
  return {
    numeroDAP:    r.numeroDAP     || '',
    dataEmissao:  r.dataEmissao   || '',
    dataValidade: r.dataValidade  || '',
    municipio:    r.municipio     || '',
    uf:           r.uf            || '',
    enquadramento: r.enquadramento || '',
    tipoDAP:      r.tipoDAP       || '',
    nomeTitular:  titular.nome    || '',
    imovelNome:   imovel.nome     || '',
    imovelArea:   imovel.area     || '',
    rendaTotal:   renda.valorTotal || '',
    raw: data,
  }
}

// ─── DAP PJ ─────────────────────────────────────────────────────────────────
// Endpoint: GET /api/DAPPessoaJuridica | Param: CNPJ
export type DapPjResult = {
  numeroDAP: string; dataEmissao: string; dataValidade: string
  cnpj: string; razaoSocial: string; municipio: string; uf: string
  nomeRepresentanteLegal: string
  raw: unknown
}
export async function consultarDapPj(cnpj: string): Promise<DapPjResult> {
  const data = await get('/api/DAPPessoaJuridica', { CNPJ: cnpj.replace(/\D/g, '') })
  const r = data?.retorno ?? {}
  return {
    numeroDAP:              r.numeroDAP             || '',
    dataEmissao:            r.dataEmissao           || '',
    dataValidade:           r.dataValidade          || '',
    cnpj:                   r.cnpj                  || '',
    razaoSocial:            r.razaoSocial           || '',
    municipio:              r.municipio             || '',
    uf:                     r.uf                    || '',
    nomeRepresentanteLegal: r.nomeRepresentanteLegal || '',
    raw: data,
  }
}

// ─── Dossiê QUOD Completo ───────────────────────────────────────────────────
// Endpoint: GET /api/DossieCreditoCompleto | Param: CPF ou CNPJ (apenas um)
export type DossieResult = {
  tipo: 'PF' | 'PJ'
  nome: string; situacaoCadastral: string
  scorePf: number; scorePj: number
  pendencias: number
  protestos: number; acoesJudiciais: number; chequesSemFundo: number
  raw: unknown
}
export async function consultarDossie(cpf: string, cnpj?: string): Promise<DossieResult> {
  const useCnpj = !!cnpj && !cpf
  const params: Record<string, string> = useCnpj
    ? { CNPJ: cnpj!.replace(/\D/g, '') }
    : { CPF: cpf.replace(/\D/g, '') }
  const data = await get('/api/DossieCreditoCompleto', params)
  const r = data?.retorno ?? {}

  const tipo: 'PF' | 'PJ' = useCnpj ? 'PJ' : 'PF'
  const pf  = r.entidadeFisica   ?? {}
  const pj  = r.entidadeJuridica ?? {}

  if (tipo === 'PJ') {
    const cad  = pj.dadosCadastrais ?? {}
    const pend = pj.pendenciaFinanceira ?? {}
    return {
      tipo, nome: cad.razaoSocial || '',
      situacaoCadastral: cad.situacaoCadastral || '',
      scorePf:  pj.scoreEntidades?.entidadeFisica?.score  ?? 0,
      scorePj:  pj.scoreEntidades?.entidadeJuridica?.score ?? 0,
      pendencias:      pend.totalPendencia     ?? 0,
      protestos:       pend.protestos?.length  ?? 0,
      acoesJudiciais:  pend.acoesJudiciais?.length ?? 0,
      chequesSemFundo: pend.chequesSemFundo?.length ?? 0,
      raw: data,
    }
  }

  const cad  = pf.dadosCadastrais ?? {}
  const pend = pf.pendenciaFinanceira ?? {}
  return {
    tipo, nome: cad.nome || '',
    situacaoCadastral: cad.status || '',
    scorePf:  pf.scoreEntidade?.entidadeFisica?.score  ?? 0,
    scorePj:  pf.scoreEntidade?.entidadeJuridica?.score ?? 0,
    pendencias:      pend.totalPendencia     ?? 0,
    protestos:       pend.protestos?.length  ?? 0,
    acoesJudiciais:  pend.acoesJudiciais?.length ?? 0,
    chequesSemFundo: pend.chequesSemFundo?.length ?? 0,
    raw: data,
  }
}

// ─── Antifraude PIX ─────────────────────────────────────────────────────────
// Endpoint: GET /api/AntifraudePix | Params: DOCUMENTO + CHAVE + TIPO
export type AntifrauePixResult = {
  chavePix: string; documento: string; nomeEntidade: string
  tipo: string; status: string
  probabilidadeTitularidade: string
  riscoFraude: string; riscoLaranja: string
  raw: unknown
}
export async function consultarAntifraude(
  documento: string, chave: string, tipo?: string
): Promise<AntifrauePixResult> {
  const params: Record<string, string> = {
    DOCUMENTO: documento.replace(/\D/g, ''),
    CHAVE: chave.trim(),
  }
  if (tipo) params.TIPO = tipo
  const data = await get('/api/AntifraudePix', params)
  const r = data?.retorno ?? {}
  return {
    chavePix:                  r.chavePix                  || '',
    documento:                 r.documento                 || '',
    nomeEntidade:              r.nomeEntidade              || '',
    tipo:                      r.tipo                      || '',
    status:                    r.status                    || '',
    probabilidadeTitularidade: r.probabilidadeTitularidade || '',
    riscoFraude:               r.riscoFraude               || '',
    riscoLaranja:              r.riscoLaranja              || '',
    raw: data,
  }
}
