# Produção e recuperação automática de pagamentos

## 1. Ordem obrigatória do rollout

1. Execute **uma única vez** `Docs/supabase_reliability_migration.sql` no SQL Editor do Supabase.
2. Publique a aplicação na Vercel.
3. Confirme as variáveis da Vercel e do GitHub descritas abaixo.
4. Execute `workflow_dispatch` uma vez e confirme o resumo sanitizado do job.

A migração deve vir antes do deploy porque cria a fila transacional, as funções RPC e a auditoria usadas pela nova versão. Ela é estrutural: não é necessário executar SQL nem cadastrar manualmente cada venda.

## 2. Variáveis obrigatórias na Vercel

- `NEXT_PUBLIC_SITE_URL`: origem HTTPS pública, sem caminho adicional.
- `MERCADOPAGO_ACCESS_TOKEN`: token de produção.
- `MERCADOPAGO_WEBHOOK_SECRET`: assinatura secreta configurada em Webhooks.
- `NOTORIUS_API_KEY`: chave vigente da conta Notorious.
- `NOTORIUS_API_URL`: `https://notorius.pro/api/v2`.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta do servidor; não use chave pública.
- `ADMIN_SECRET_KEY`: segredo aleatório para rotas administrativas.
- `CRON_SECRET`: segredo aleatório com pelo menos 16 caracteres.

Use Node.js 22 ou superior no build e na execução.

## 3. Agendamento em produção

O webhook do Mercado Pago é o caminho principal e processa vendas em tempo real. Como o plano Vercel Hobby aceita apenas cron diário, `vercel.json` chama `/api/cron/process-retries` diariamente às 03:00 UTC como fallback adicional.

Para recuperar webhooks perdidos sem esperar o dia seguinte, `.github/workflows/payment-recovery.yml` chama o mesmo endpoint a cada 5 minutos. Configure em **GitHub > Settings > Secrets and variables > Actions**:

- secret `CRON_SECRET`: exatamente o mesmo valor configurado na Vercel;
- variável `PRODUCTION_URL`: origem HTTPS pública sem barra final; o padrão é `https://notorios.com.br`.

O GitHub pode atrasar execuções agendadas sob carga. Isso não causa perda: a fila fica persistida no Supabase, e a próxima execução reserva os pagamentos elegíveis.

## 4. Semântica da recuperação

A rota exige `Authorization: Bearer <CRON_SECRET>` e executa quatro etapas:

1. reserva atomicamente até 10 pagamentos Mercado Pago `pending` com `FOR UPDATE SKIP LOCKED`;
2. consulta o status no Mercado Pago, aplica transições idempotentes e agenda backoff quando necessário;
3. em um orçamento separado, reserva até 10 pagamentos já `paid` cuja transição de pedido/fulfillment ficou incompleta;
4. processa retries vencidos da API Notorious.

As duas filas de pagamento usam lease persistente e incrementam `reconciliation_attempt_count` no claim. O reagendamento usa `status` e esse contador como fencing: um worker atrasado não sobrescreve o resultado de uma tentativa mais nova. Pagamentos ainda pendentes e falhas técnicas retentáveis recebem nova data de elegibilidade com backoff; falhas da fila `paid` seguem o mesmo mecanismo. Erros terminais do provedor são estacionados fora da fila ativa, persistidos com código sanitizado e contabilizados em `manualReview`, sem retry infinito. Execuções concorrentes do GitHub, Vercel ou chamadas operacionais não reservam a mesma cobrança, e as cobranças novas têm orçamento independente das recuperações antigas.

Contrato HTTP:

- `200`: nenhuma falha técnica; `manualReview` pode ser maior que zero e gera warning;
- `500`: falha global, falha técnica em qualquer pagamento, retry de fulfillment com erro ou falha da auditoria;
- `401/503`: autenticação inválida ou `CRON_SECRET` ausente na aplicação.

O workflow faz uma única chamada por execução para que um HTTP 500 não seja mascarado por outro worker durante o lease; a agenda seguinte cuida de nova tentativa. Ele valida HTTP, estrutura e tipos do JSON antes de aceitar sucesso e exibe somente contadores e códigos sanitizados; nunca imprime payloads, IDs de pagamento, dados pessoais ou secrets.

## 5. Observabilidade

Cada chamada válida do cron e cada webhook Mercado Pago autenticado com pagamento reconhecido gera uma linha em `integration_runs` com:

- trigger e status;
- horários de início/fim;
- contadores allow-listed;
- códigos de erro sanitizados;
- hash SHA-256 de correlação no webhook, sem armazenar o ID do provedor.

Falhas técnicas por pedido geram `payment_reconciliation_failed` em `order_events`; erros terminais geram `payment_reconciliation_manual_review`. Ambos persistem somente provider, etapa, código, retryability, tentativa e próxima execução. O body do Mercado Pago, headers, tokens, dados pessoais e stack traces não são persistidos.

Se o próprio Supabase estiver indisponível, a auditoria não pode ser gravada nele; nesse caso a rota retorna erro e o GitHub Actions fica vermelho, preservando o sinal externo.

## 6. Verificação após o deploy

No primeiro `workflow_dispatch`, confirme:

- o job mostra `success: true` ou falha explicitamente com códigos sanitizados;
- `integration_runs` contém o trigger `cron_payment_recovery` finalizado;
- pagamentos aprovados passam para `payments.status = paid` e recebem `paid_at`;
- pedidos correspondentes passam para `orders.payment_status = paid`;
- `fulfillment_items` são criados e `provider_order_id` é preenchido após envio;
- eventos esperados incluem `payment_confirmed`, `fulfillment_items_created`, `gatekeeper_success` e `item_submitted`.

Se `manualReview > 0`, investigue a divergência indicada no pedido. Não force `paid`: a automação sempre confirma status e valor diretamente no Mercado Pago antes da transição.
