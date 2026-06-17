## O que muda

<!-- Descreva o que foi implementado ou corrigido. Uma frase clara. -->

## Por que muda

<!-- Contexto: qual problema resolve? qual feature entrega? -->

## Checklist

### Segurança e dados financeiros
- [ ] Nenhuma chave de API exposta no código ou via `NEXT_PUBLIC_`
- [ ] CPF/CNPJ e score de crédito não retornados em listagens desnecessárias
- [ ] Consentimento do usuário verificado antes de compartilhar dados com parceiros financeiros
- [ ] Rotas públicas novas têm rate limiting (`lib/rate-limit.ts`)

### Banco de dados (se tocou no schema Prisma)
- [ ] ATENÇÃO: banco compartilhado com SmartAgroOS — migration impacta os dois sistemas
- [ ] Novos campos são opcionais ou têm default
- [ ] Dados financeiros com retenção de 5 anos considerados (não podem ser excluídos mesmo após pedido LGPD)
- [ ] Migration revisada e aprovada

### Integrações externas (Quod, CAF, ClickSign)
- [ ] Respostas das APIs externas tratadas com try/catch
- [ ] Dados de bureau de crédito não logados no console
- [ ] Contratos ClickSign não retornam tokens/links em endpoints públicos

### Geral
- [ ] `npm run build` passou sem erros
- [ ] Nenhum `console.log` de debug no código final
- [ ] Commit segue o padrão: `feat:`, `fix:`, `refactor:`, `chore:` em português

## Tipo de mudança

- [ ] Feature nova
- [ ] Correção de bug
- [ ] Refatoração
- [ ] Segurança / compliance
- [ ] Infraestrutura / config
