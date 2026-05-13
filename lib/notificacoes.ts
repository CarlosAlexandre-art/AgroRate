// @ts-expect-error web-push não tem @types — instalar via `npm i -D @types/web-push` se necessário
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

webpush.setVapidDetails(
  'mailto:suporte@agrorate.com.br',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

// ─── Tipos de notificação ───────────────────────────────────────────────────────

export interface NotificationData {
  userId: string
  tipo: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PROMOTION' | 'REMINDER'
  titulo: string
  mensagem: string
  dadosAdicionais?: any
  canal: 'PUSH' | 'EMAIL' | 'AMBOS'
  agendarPara?: Date
}

// ─── Criar notificação ─────────────────────────────────────────────────────────

export async function criarNotificacao(data: NotificationData) {
  try {
    // Salvar no banco se tiver tabela de notificações
    // const notificacao = await prisma.notificacaoAgroRate.create({
    //   data: {
    //     userId: data.userId,
    //     tipo: data.tipo,
    //     titulo: data.titulo,
    //     mensagem: data.mensagem,
    //     dadosAdicionais: data.dadosAdicionais ? JSON.stringify(data.dadosAdicionais) : null,
    //     canal: data.canal,
    //     agendarPara: data.agendarPara,
    //     status: data.agendarPara ? 'AGENDADA' : 'PENDENTE',
    //     createdAt: new Date()
    //   }
    // })

    console.log('📬 Notificação AgroRate criada:', data)

    // Enviar imediatamente se não for agendada
    if (!data.agendarPara || data.agendarPara <= new Date()) {
      await enviarNotificacao(data)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao criar notificação AgroRate:', error)
    return { success: false, error }
  }
}

// ─── Enviar notificação ───────────────────────────────────────────────────────

export async function enviarNotificacao(data: NotificationData) {
  try {
    // Buscar usuário e assinaturas push
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { pushSubscriptions: true }
    })

    if (!user) {
      console.error('Usuário não encontrado:', data.userId)
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Enviar Push Notification
    if (data.canal === 'PUSH' || data.canal === 'AMBOS') {
      await enviarPushNotification(data, user.pushSubscriptions)
    }

    // Enviar Email
    if (data.canal === 'EMAIL' || data.canal === 'AMBOS') {
      await enviarEmailNotification(data, user.email)
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar notificação AgroRate:', error)
    return { success: false, error }
  }
}

// ─── Push Notification ───────────────────────────────────────────────────────

async function enviarPushNotification(data: NotificationData, subscriptions: any[]) {
  if (subscriptions.length === 0) return

  const payload = JSON.stringify({
    titulo: data.titulo,
    corpo: data.mensagem,
    url: '/dashboard',
    ...data.dadosAdicionais
  })

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err: { statusCode?: number }) => {
        // Remove subscriptions inválidas (410 = expirada)
        if (err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        }
      })
    )
  )
}

// ─── Email Notification ─────────────────────────────────────────────────────

async function enviarEmailNotification(data: NotificationData, userEmail: string) {
  try {
    const emailHtml = gerarEmailTemplate(data)
    
    const resend = getResend()
    await resend.emails.send({
      from: 'AgroRate <notificacoes@agrorate.com>',
      to: userEmail,
      subject: data.titulo,
      html: emailHtml
    })

    console.log('📧 Email AgroRate enviado para:', userEmail)
  } catch (error) {
    console.error('Erro ao enviar email AgroRate:', error)
  }
}

// ─── Template de Email ─────────────────────────────────────────────────────

function gerarEmailTemplate(data: NotificationData): string {
  const cores = {
    INFO: 'bg-blue-500',
    SUCCESS: 'bg-green-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    PROMOTION: 'bg-purple-500',
    REMINDER: 'bg-indigo-500'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #020c08; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1a2e1a 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .header { background: linear-gradient(135deg, #16a34a 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; color: #e2e8f0; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        .footer { background: #020c08; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .cta { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 AgroRate</h1>
          <p>Score de Crédito Rural Inteligente</p>
        </div>
        <div class="content">
          <div class="badge ${cores[data.tipo]}">${data.tipo}</div>
          <h2>${data.titulo}</h2>
          <p>${data.mensagem}</p>
          ${data.dadosAdicionais ? `<p style="background: #1a2e1a; padding: 15px; border-radius: 8px; margin-top: 20px;">${JSON.stringify(data.dadosAdicionais, null, 2)}</p>` : ''}
          <a href="https://agro-rate.vercel.app/dashboard" class="cta">Ver Meu Score</a>
        </div>
        <div class="footer">
          <p>© 2026 AgroRate - Powered by OryonAG</p>
          <p>Se você não deseja receber estes emails, <a href="https://agro-rate.vercel.app/configuracoes">clique aqui</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Notificações Automáticas AgroRate ───────────────────────────────────────────

export class NotificacoesAgroRate {
  static async scoreMelhorou(userId: string, scoreAnterior: number, scoreNovo: number, categoria: string) {
    await criarNotificacao({
      userId,
      tipo: 'SUCCESS',
      titulo: '📈 Seu AgroRate Melhorou!',
      mensagem: `Parabéns! Seu score aumentou de ${scoreAnterior} para ${scoreNovo} pontos. Nova categoria: ${categoria}`,
      canal: 'AMBOS',
      dadosAdicionais: { scoreAnterior, scoreNovo, categoria }
    })
  }

  static async scorePiorou(userId: string, scoreAnterior: number, scoreNovo: number, categoria: string) {
    await criarNotificacao({
      userId,
      tipo: 'WARNING',
      titulo: '📉 Seu AgroRate Alterado',
      mensagem: `Seu score mudou de ${scoreAnterior} para ${scoreNovo} pontos. Categoria atual: ${categoria}`,
      canal: 'AMBOS',
      dadosAdicionais: { scoreAnterior, scoreNovo, categoria }
    })
  }

  static async documentoAprovado(userId: string, tipoDocumento: string) {
    await criarNotificacao({
      userId,
      tipo: 'SUCCESS',
      titulo: '✅ Documento Aprovado',
      mensagem: `Seu documento "${tipoDocumento}" foi aprovado e já está impactando seu score.`,
      canal: 'AMBOS',
      dadosAdicionais: { tipoDocumento }
    })
  }

  static async novaOportunidadeCredito(userId: string, banco: string, valor: number, taxa: number) {
    await criarNotificacao({
      userId,
      tipo: 'PROMOTION',
      titulo: '💰 Nova Oportunidade de Crédito',
      mensagem: `${banco} está oferecendo R$ ${valor.toLocaleString('pt-BR')} com taxa de ${taxa}% ao mês.`,
      canal: 'AMBOS',
      dadosAdicionais: { banco, valor, taxa }
    })
  }

  static async lembreteCompletudeDados(userId: string, completude: number) {
    await criarNotificacao({
      userId,
      tipo: 'REMINDER',
      titulo: '📋 Complete Seus Dados',
      mensagem: `Seu perfil está ${completude}% completo. Adicione mais documentos para melhorar seu score.`,
      canal: 'AMBOS',
      dadosAdicionais: { completude }
    })
  }

  static async promocaoUpgradePro(userId: string) {
    await criarNotificacao({
      userId,
      tipo: 'PROMOTION',
      titulo: '🚀 Desbloqueie Verificações QUOD',
      mensagem: 'Atualize para o plano Pro e acesse verificações bureau de crédito + IA personalizada.',
      canal: 'AMBOS',
      dadosAdicionais: { plano: 'pro', beneficio: 'QUOD + IA' }
    })
  }

  static async boasVindasAgroRate(userId: string, nome: string) {
    await criarNotificacao({
      userId,
      tipo: 'INFO',
      titulo: '👋 Bem-vindo ao AgroRate!',
      mensagem: `Olá, ${nome}! Vamos construir seu score de crédito rural juntos.`,
      canal: 'AMBOS',
      dadosAdicionais: { nome, plataforma: 'agrorate' }
    })
  }

  static async relatorioSemanal(userId: string, scoreAtual: number, mudanca: number) {
    const tendencia = mudanca > 0 ? '📈 subindo' : mudanca < 0 ? '📉 caindo' : '➡️ estável'
    
    await criarNotificacao({
      userId,
      tipo: 'INFO',
      titulo: '📊 Relatório Semanal AgroRate',
      mensagem: `Seu score está ${tendencia}: ${scoreAtual} pontos (${mudanca > 0 ? '+' : ''}${mudanca} esta semana).`,
      canal: 'EMAIL', // Relatórios semanais só por email para não sobrecarregar
      dadosAdicionais: { scoreAtual, mudanca, tendencia }
    })
  }

  static async notificacaoGeral(userId: string, titulo: string, mensagem: string, tipo: 'INFO' | 'PROMOTION' | 'REMINDER' = 'INFO') {
    await criarNotificacao({
      userId,
      tipo,
      titulo,
      mensagem,
      canal: 'AMBOS',
    })
  }
}

// ─── Agendador de Notificações ───────────────────────────────────────────────

export async function processarNotificacoesAgendadas() {
  try {
    console.log('📬 Notificações AgroRate agendadas processadas')
  } catch (error) {
    console.error('Erro ao processar notificações AgroRate agendadas:', error)
  }
}
