import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — AgroRate',
  description: 'Como o AgroRate coleta, usa e protege seus dados, em conformidade com a LGPD.',
}

const SECOES = [
  {
    titulo: '1. Quem somos',
    texto: 'O AgroRate é a plataforma de score de crédito rural desenvolvida pela OryonAG. Atuamos como operador de dados pessoais conforme a LGPD. Contato: privacidade@oryonag.com.br',
  },
  {
    titulo: '2. Dados que coletamos',
    itens: [
      'Nome, e-mail e CPF/CNPJ (cadastro, autenticação e análise de crédito)',
      'Dados de produção rural (culturas, área, histórico)',
      'Dados financeiros (certidões, histórico de crédito — com seu consentimento)',
      'Documentos enviados para análise (notas fiscais, registros de propriedade)',
      'Dados de uso da plataforma (logs de acesso para segurança)',
      'Dados de geolocalização da propriedade (coordenadas do imóvel rural)',
    ],
  },
  {
    titulo: '3. Como usamos seus dados',
    itens: [
      'Cálculo do score de crédito rural (AgroRate Score)',
      'Análise de risco e elegibilidade para crédito',
      'Geração de relatórios e diagnósticos financeiros',
      'Prevenção a fraudes e verificação de identidade',
      'Cumprimento de obrigações regulatórias (Banco Central, CVM)',
    ],
  },
  {
    titulo: '4. Base legal (LGPD)',
    itens: [
      'Execução de contrato: análise de crédito e serviços solicitados',
      'Consentimento: acesso a dados de bureau de crédito e certidões',
      'Legítimo interesse: prevenção a fraudes, segurança da plataforma',
      'Cumprimento de obrigação legal: regulações do setor financeiro',
      'Proteção ao crédito: conforme Art. 7º, X da LGPD',
    ],
  },
  {
    titulo: '5. Compartilhamento',
    texto: 'Compartilhamos dados estritamente com: (a) parceiros financeiros para análise de crédito, com seu consentimento expresso; (b) fornecedores de infraestrutura (Supabase, Vercel) sob contratos de confidencialidade; (c) órgãos reguladores quando exigido por lei. Não vendemos dados.',
  },
  {
    titulo: '6. Retenção',
    texto: 'Dados de análise de crédito são mantidos por até 5 anos conforme regulação do Banco Central. Após solicitação de exclusão de conta, removemos dados não sujeitos a retenção regulatória em até 30 dias.',
  },
  {
    titulo: '7. Seus direitos (LGPD — Art. 18)',
    itens: [
      'Acesso e cópia dos seus dados',
      'Correção de dados incorretos',
      'Exclusão de dados desnecessários ou tratados sem base legal',
      'Portabilidade para outro fornecedor de serviço',
      'Informação sobre compartilhamento com terceiros',
      'Revogação do consentimento (pode impactar o serviço)',
      'Oposição ao tratamento baseado em legítimo interesse',
    ],
  },
  {
    titulo: '8. Cookies',
    texto: 'Usamos cookies essenciais para autenticação (HttpOnly, Secure, SameSite=Lax via Supabase Auth) e cookies de preferência. Não utilizamos cookies de rastreamento publicitário.',
  },
  {
    titulo: '9. Segurança',
    texto: 'Implementamos criptografia TLS em trânsito, autenticação segura via Supabase, controle de acesso granular, monitoramento de atividades anômalas e logs de auditoria. Em caso de incidente de segurança, notificamos a ANPD e os afetados em até 72 horas.',
  },
  {
    titulo: '10. Contato, DPO e exclusão de dados',
    texto: 'Encarregado de Proteção de Dados (DPO): privacidade@oryonag.com.br. Para exercer seus direitos ou solicitar exclusão de conta, envie e-mail com o assunto "LGPD — AgroRate". Respondemos em até 15 dias úteis.',
  },
]

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#f1f5f9', padding: '48px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 32 }}>
          ← Voltar
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1 }}>Política de Privacidade</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>AgroRate · Última atualização: junho de 2026</p>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 40, marginTop: 20, padding: '16px 20px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12 }}>
          Esta política cobre o tratamento de dados pessoais e financeiros pelo AgroRate, em conformidade com a{' '}
          <strong style={{ color: '#fbbf24' }}>LGPD (Lei nº 13.709/2018)</strong> e regulações do setor financeiro brasileiro.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {SECOES.map(s => (
            <section key={s.titulo}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{s.titulo}</h2>
              {s.texto && <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>{s.texto}</p>}
              {s.itens && (
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.itens.map(item => (
                    <li key={item} style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: '20px 24px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14 }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            Para solicitar <strong style={{ color: '#fbbf24' }}>exclusão de conta e dados</strong>, envie um e-mail para{' '}
            <a href="mailto:privacidade@oryonag.com.br" style={{ color: '#fbbf24' }}>privacidade@oryonag.com.br</a>{' '}
            com o assunto "Exclusão de Dados — AgroRate". Processamos em até 30 dias, respeitando obrigações regulatórias de retenção.
          </p>
        </div>

        <p style={{ fontSize: 12, color: '#475569', marginTop: 32, textAlign: 'center' }}>
          AgroRate · OryonAG · privacidade@oryonag.com.br
        </p>
      </div>
    </div>
  )
}
