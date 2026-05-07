import { createClient } from '@/lib/supabase/client'

// ─── Contexto da IA ───────────────────────────────────────────────────────────

export interface IAContext {
  userId: string
  plataforma: 'smartagros' | 'agrorate' | 'agrocore'
  secao: string
  dadosUsuario?: any
  dadosScore?: any
  contextoAdicional?: any
}

// ─── Prompts contextuais por seção ───────────────────────────────────────────────

const PROMPTS_CONTEXTUAIS: Record<string, (context: IAContext) => string> = {
  // AgroRate - Crédito
  'score': (ctx) => `Você é o especialista em crédito rural do AgroRate. Analise o score e dê recomendações.
    Dados do score: ${JSON.stringify(ctx.dadosScore)}.
    Foque em melhorar o score, entender os fatores (produção 60%, perfil 20%, docs 10%, comportamento 10%) e guiar para melhores condições de crédito.`,

  'credit': (ctx) => `Você é o consultor de crédito rural do AgroRate. Ajude a encontrar as melhores opções.
    Dados: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em simular crédito, comparar linhas, preparar documentação e otimizar aprovação.`,

  'documents': (ctx) => `Você é o assistente documental do AgroRate. Ajude com preparação de documentos.
    Dados: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em organizar documentos, verificar conformidade e preparar para análise bancária.`,

  'sharing': (ctx) => `Você é o consultor de compartilhamento do AgroRate. Ajude a compartilhar dados com bancos.
    Dados: ${JSON.stringify(ctx.dadosUsuario)}.
    Foque em preparar perfil, selecionar bancos, gerar links e gerenciar abordagens.`,

  'analytics': (ctx) => `Você é o analista de dados do AgroRate. Ajude a interpretar métricas e tendências.
    Dados: ${JSON.stringify(ctx.dadosScore)}.
    Foque em analisar evolução do score, identificar padrões e sugerir ações de melhoria.`,

  // Geral
  'dashboard': (ctx) => `Você é o assistente principal do AgroRate. Ajude com visão geral do perfil de crédito.
    Dados completos: ${JSON.stringify({ ...ctx.dadosUsuario, ...ctx.dadosScore })}.
    Ajude com visão geral, próximos passos e otimização do perfil para crédito.`,

  'help': (ctx) => `Você é o assistente de ajuda do AgroRate. Ajude o usuário a navegar na plataforma.
    Plataforma: AgroRate. Seção: ${ctx.seção}.
    Foque em explicar funcionalidades, resolver dúvidas e guiar para os recursos certos.`,
}

// ─── Gerar prompt contextualizado ─────────────────────────────────────────────

export function gerarPromptContextual(context: IAContext, mensagemUsuario: string): string {
  const promptBase = PROMPTS_CONTEXTUAIS[context.secao] || PROMPTS_CONTEXTUAIS['help']
  
  const promptContextual = promptBase(context) + `

Contexto adicional:
${JSON.stringify(context.contextoAdicional || {}, null, 2)}

Mensagem do usuário: "${mensagemUsuario}"

Responda de forma útil, prática e direta. Use linguagem de crédito rural quando apropriado. 
Seja proativo em sugerir próximos passos e melhores práticas.
Mantenha o tom de especialista mas acessível.`

  return promptContextual
}

// ─── Chamada à API Groq ───────────────────────────────────────────────────────

export async function chamarIA(mensagem: string, context: IAContext): Promise<string> {
  try {
    const promptCompleto = gerarPromptContextual(context, mensagem)
    
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: promptCompleto
          },
          {
            role: 'user', 
            content: mensagem
          }
        ],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error('Erro na chamada à API')
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.'
    
  } catch (error) {
    console.error('Erro ao chamar IA:', error)
    return 'Desculpe, estou com dificuldades técnicas. Tente novamente em alguns instantes.'
  }
}

// ─── Funções de ajuda específicas ───────────────────────────────────────────────

export const FUNCOES_AJUDA = {
  agrorate: {
    score: 'Como entender e melhorar seu score de crédito rural',
    credito: 'Como solicitar e aprovar crédito rural',
    documentos: 'Como preparar e organizar documentos bancários',
    simulacao: 'Como simular diferentes cenários de crédito',
    compartilhamento: 'Como compartilhar dados com bancos',
    verificacoes: 'Como fazer verificações bureau de crédito',
  }
}

// ─── Sugestões automáticas baseadas no contexto ───────────────────────────────────

export function gerarSugestoes(context: IAContext): string[] {
  const sugestoes: string[] = []

  if (context.plataforma === 'agrorate') {
    if (context.dadosScore?.score < 600) {
      sugestoes.push('Seu score precisa melhorar. Quer dicas personalizadas para aumentar?')
    }
    if (context.dadosScore?.dataCompleteness < 80) {
      sugestoes.push('Complete seus dados para melhorar seu score. Posso ajudar!')
    }
    if (context.dadosScore?.productionScore < 500) {
      sugestoes.push('Sua pontuação de produção está baixa. Vamos analisar como melhorar?')
    }
    if (context.dadosUsuario?.plan === 'starter') {
      sugestoes.push('Atualize para o plano Pro para acessar verificações QUOD e mais recursos.')
    }
  }

  return sugestoes
}
