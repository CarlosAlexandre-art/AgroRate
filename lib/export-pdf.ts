import jsPDF from 'jspdf'

// ─── Exportador PDF para AgroRate ─────────────────────────────────────────────────

export class AgroRatePDFExporter {
  private doc: jsPDF
  private currentY: number = 20
  private pageHeight: number = 280
  private margin: number = 15

  constructor() {
    this.doc = new jsPDF()
    this.setupDocument()
  }

  private setupDocument() {
    this.doc.setFontSize(12)
    this.doc.setTextColor(51, 51, 51)
  }

  // Adicionar subtítulo
  addSubtitle(subtitle: string) {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(100, 100, 100)
    this.doc.text(subtitle, this.margin, this.currentY)
    this.currentY += 8
  }

  // Adicionar título com branding AgroRate
  addTitle(title: string, fontSize: number = 18) {
    if (this.currentY > this.pageHeight - 40) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(128, 0, 128) // Roxo AgroRate
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += fontSize / 2 + 10
  }

  // Adicionar texto
  addText(text: string, fontSize: number = 11) {
    if (this.currentY > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }

    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(51, 51, 51)
    
    const lines = this.doc.splitTextToSize(text, 180)
    lines.forEach((line: string) => {
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += fontSize / 2 + 2
    })
    this.currentY += 5
  }

  // Adicionar gauge visual do score
  addScoreGauge(score: number, categoria: string) {
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage()
      this.currentY = 20
    }

    // Placeholder do gauge
    this.doc.setFillColor(240, 240, 240)
    this.doc.rect(this.margin, this.currentY, 180, 60, 'F')
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(24)
    this.doc.setTextColor(128, 0, 128)
    this.doc.text(score.toString(), this.margin + 90, this.currentY + 25)
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(12)
    this.doc.text(categoria, this.margin + 90, this.currentY + 45)
    
    this.currentY += 70
  }

  // Adicionar tabela
  addTable(headers: string[], rows: string[][]) {
    if (this.currentY > this.pageHeight - 60) {
      this.doc.addPage()
      this.currentY = 20
    }

    const cellWidth = 180 / headers.length
    const cellHeight = 8

    // Cabeçalho
    this.doc.setFont('helvetica', 'bold')
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFillColor(128, 0, 128) // Roxo AgroRate
    
    headers.forEach((header, index) => {
      this.doc.rect(this.margin + index * cellWidth, this.currentY, cellWidth, cellHeight, 'F')
      this.doc.text(header, this.margin + index * cellWidth + 2, this.currentY + 5)
    })
    
    this.currentY += cellHeight

    // Linhas
    this.doc.setFont('helvetica', 'normal')
    this.doc.setTextColor(51, 51, 51)
    
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(245, 245, 245)
      } else {
        this.doc.setFillColor(255, 255, 255)
      }
      
      row.forEach((cell, cellIndex) => {
        this.doc.rect(this.margin + cellIndex * cellWidth, this.currentY, cellWidth, cellHeight, 'F')
        this.doc.text(cell, this.margin + cellIndex * cellWidth + 2, this.currentY + 5)
      })
      
      this.currentY += cellHeight
    })
    
    this.currentY += 10
  }

  // Exportar relatório de score completo
  static async exportarScoreCompleto(data: {
    usuario: any
    score: any
    historico: any[]
    simulacoes: any[]
  }) {
    const exporter = new AgroRatePDFExporter()
    
    exporter.addTitle('Relatório Completo AgroRate')
    exporter.addSubtitle(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`)
    
    // Score atual
    exporter.addTitle('Score Atual', 14)
    exporter.addScoreGauge(data.score.score, data.score.category)
    
    // Composição do score
    exporter.addTitle('Composição do Score', 14)
    exporter.addText('Seu score é composto por 4 dimensões principais:')
    exporter.addTable(
      ['Dimensão', 'Pontuação', 'Peso'],
      [
        ['Produção', data.score.productionScore.toString(), '60%'],
        ['Perfil', data.score.operationalScore.toString(), '20%'],
        ['Documentos', 'Calculado', '10%'],
        ['Comportamento', data.score.behaviorScore.toString(), '10%']
      ]
    )
    
    // Métricas financeiras
    exporter.addTitle('Métricas Financeiras', 14)
    exporter.addTable(
      ['Métrica', 'Valor'],
      [
        ['Receita Total', `R$ ${data.score.totalRevenue.toLocaleString('pt-BR')}`],
        ['Margem', `${(data.score.marginRate * 100).toFixed(1)}%`],
        ['Atividades Registradas', data.score.activityCount.toString()],
        ['Completude de Dados', `${data.score.dataCompleteness}%`]
      ]
    )
    
    // Histórico de evolução
    if (data.historico.length > 0) {
      exporter.addTitle('Histórico de Evolução', 14)
      const historicoTable = [['Data', 'Score', 'Categoria', 'Mudança']]
      
      data.historico.slice(0, 10).forEach((item, index) => {
        const mudanca = index > 0 ? data.historico[index - 1].score - item.score : 0
        historicoTable.push([
          new Date(item.createdAt).toLocaleDateString('pt-BR'),
          item.score.toString(),
          item.category,
          mudanca > 0 ? `+${mudanca}` : mudanca.toString()
        ])
      })
      
      exporter.addTable(historicoTable[0], historicoTable.slice(1))
    }
    
    // Simulações de crédito
    if (data.simulacoes.length > 0) {
      exporter.addTitle('Simulações de Crédito Recentes', 14)
      const simulacoesTable = [['Data', 'Banco', 'Valor', 'Taxa', 'Status']]
      
      data.simulacoes.slice(0, 10).forEach(simulacao => {
        simulacoesTable.push([
          new Date(simulacao.createdAt).toLocaleDateString('pt-BR'),
          simulacao.banco,
          `R$ ${simulacao.valor.toLocaleString('pt-BR')}`,
          `${simulacao.taxa}%`,
          simulacao.status
        ])
      })
      
      exporter.addTable(simulacoesTable[0], simulacoesTable.slice(1))
    }
    
    // Recomendações
    exporter.addTitle('Recomendações para Melhoria', 14)
    const recomendacoes = []
    
    if (data.score.productionScore < 600) {
      recomendacoes.push('• Registre mais receitas de culturas para aumentar sua pontuação de produção')
    }
    if (data.score.efficiencyScore < 600) {
      recomendacoes.push('• Reduza custos ou aumente receita para melhorar sua eficiência')
    }
    if (data.score.behaviorScore < 600) {
      recomendacoes.push('• Mantenha consistência no lançamento de custos para melhorar o comportamento')
    }
    if (data.score.dataCompleteness < 80) {
      recomendacoes.push('• Complete seu perfil com mais documentos e informações da propriedade')
    }
    
    recomendacoes.forEach(rec => exporter.addText(rec))
    
    return exporter.doc.output('blob')
  }

  // Exportar relatório de simulações
  static async exportarSimulacoes(data: {
    usuario: any
    simulacoes: any[]
    score: any
  }) {
    const exporter = new AgroRatePDFExporter()
    
    exporter.addTitle('Relatório de Simulações de Crédito')
    exporter.addSubtitle(`Baseado no score atual: ${data.score.score} pontos (${data.score.category})`)
    
    // Resumo das simulações
    const totalSimulacoes = data.simulacoes.length
    const valorTotal = data.simulacoes.reduce((sum, s) => sum + s.valor, 0)
    const taxaMedia = data.simulacoes.reduce((sum, s) => sum + s.taxa, 0) / totalSimulacoes
    
    exporter.addText('Resumo das Simulações')
    exporter.addTable(
      ['Métrica', 'Valor'],
      [
        ['Total de Simulações', totalSimulacoes.toString()],
        ['Valor Total Disponível', `R$ ${valorTotal.toLocaleString('pt-BR')}`],
        ['Taxa Média', `${taxaMedia.toFixed(2)}% ao mês`],
        ['Score Base', `${data.score.score} pontos`]
      ]
    )
    
    // Detalhes das simulações
    exporter.addTitle('Oportunidades Disponíveis', 14)
    const simulacoesTable = [['Banco', 'Valor', 'Taxa', 'Prazo', 'Score Mínimo', 'Status']]
    
    data.simulacoes.forEach(simulacao => {
      const status = data.score.score >= simulacao.scoreMinimo ? '✓ Disponível' : `✗ Requer ${simulacao.scoreMinimo}`
      
      simulacoesTable.push([
        simulacao.banco,
        `R$ ${simulacao.valor.toLocaleString('pt-BR')}`,
        `${simulacao.taxa}%`,
        `${simulacao.prazo} meses`,
        simulacao.scoreMinimo.toString(),
        status
      ])
    })
    
    exporter.addTable(simulacoesTable[0], simulacoesTable.slice(1))
    
    // Análise comparativa
    exporter.addTitle('Análise Comparativa', 14)
    exporter.addText('Comparando seu score com os requisitos mínimos:')
    
    const comparacaoTable = [['Banco', 'Seu Score', 'Requerido', 'Diferença']]
    
    data.simulacoes.forEach(simulacao => {
      const diferenca = data.score.score - simulacao.scoreMinimo
      
      comparacaoTable.push([
        simulacao.banco,
        data.score.score.toString(),
        simulacao.scoreMinimo.toString(),
        `${diferenca > 0 ? '+' : ''}${diferenca}`
      ])
    })
    
    exporter.addTable(comparacaoTable[0], comparacaoTable.slice(1))
    
    return exporter.doc.output('blob')
  }
}

// ─── Função utilitária para download ─────────────────────────────────────────────

export function downloadAgroRatePDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
