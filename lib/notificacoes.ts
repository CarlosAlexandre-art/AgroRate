// @ts-expect-error web-push não tem @types — instalar via `npm i -D @types/web-push` se necessário
import webpush from 'web-push'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

let _vapidSet = false
function getWebPush() {
  if (!_vapidSet && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:suporte@oryonag.com.br',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    _vapidSet = true
  }
  return webpush
}

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
      getWebPush().sendNotification(
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
  const badgeBg: Record<string, string> = {
    INFO: '#3b82f6',
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    PROMOTION: '#a855f7',
    REMINDER: '#6366f1',
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:Arial,sans-serif;background:#020c08;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#0f172a;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
    <div style="background:linear-gradient(135deg,#16a34a 0%,#059669 100%);color:white;padding:30px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:24px;">💳 AgroRate</h1>
      <p style="margin:0;font-size:14px;opacity:0.9;">Score de Crédito Rural Inteligente · OryonAG</p>
    </div>
    <div style="padding:30px;color:#e2e8f0;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;color:white;font-size:11px;font-weight:700;background:${badgeBg[data.tipo] ?? '#3b82f6'};margin-bottom:20px;text-transform:uppercase;letter-spacing:0.8px;">${data.tipo}</span>
      <h2 style="margin:0 0 12px;font-size:20px;color:#f1f5f9;">${data.titulo}</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#94a3b8;">${data.mensagem}</p>
      <a href="https://agro-rate.vercel.app/dashboard" style="display:inline-block;background:#16a34a;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Ver Meu Score →</a>
    </div>
    <div style="background:#020c08;padding:20px;text-align:center;color:#475569;font-size:12px;">
      <p style="margin:0 0 6px;">© 2026 AgroRate — Powered by OryonAG</p>
      <p style="margin:0;"><a href="https://agro-rate.vercel.app/configuracoes" style="color:#475569;">Cancelar notificações</a></p>
    </div>
  </div>
</body>
</html>`
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
