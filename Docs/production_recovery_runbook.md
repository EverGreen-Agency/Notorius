# Produção e recuperação de pagamentos

## 1. Banco de dados

Execute `Docs/supabase_reliability_migration.sql` uma vez no SQL Editor do Supabase antes do deploy.

## 2. Variáveis obrigatórias na Vercel

- `NEXT_PUBLIC_SITE_URL`: origem HTTPS pública, sem caminho adicional.
- `MERCADOPAGO_ACCESS_TOKEN`: token de produção.
- `MERCADOPAGO_WEBHOOK_SECRET`: assinatura secreta configurada em Webhooks.
- `NOTORIUS_API_KEY`: chave vigente da conta Notorious.
- `NOTORIUS_API_URL`: `https://notorius.pro/api/v2`.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_SECRET_KEY`: chave secreta do servidor; não use a chave pública como substituta.
- `ADMIN_SECRET_KEY`: segredo aleatório para rotas administrativas.
- `CRON_SECRET`: segredo aleatório com pelo menos 16 caracteres para chamadas agendadas.

Use Node.js 22 ou superior no ambiente de build e execução.

## 3. Reconciliação de pagamentos e retry de fulfillment

O arquivo `vercel.json` agenda automaticamente uma chamada GET para
`/api/cron/process-retries` a cada 5 minutos nos deploys de produção. A Vercel envia
`Authorization: Bearer <CRON_SECRET>` quando a variável `CRON_SECRET` está configurada
no projeto; não é necessário executar comandos por venda.

A mesma execução consulta no Mercado Pago até 20 cobranças pendentes com mais de um minuto,
recupera pagamentos cujos webhooks falharam e depois processa os retries de fulfillment. O fluxo é
idempotente: repetir a chamada não duplica pedidos no Notorious.

Os intervalos de retry de fulfillment previstos são 30 segundos, 2 minutos e 10 minutos. Planos
Vercel que não aceitem cron a cada 5 minutos exigem um agendador externo ou upgrade do plano; o
endpoint e a autenticação permanecem os mesmos.

## 4. Recuperar a venda existente

Após aplicar a migração e publicar a nova versão, confirme primeiro que a transação não criou
nenhum pedido no painel Notorious. Em seguida, envie uma única requisição:

```bash
curl -X POST "https://SEU_DOMINIO/api/admin/reconcile-payment" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: SEU_ADMIN_SECRET_KEY" \
  -d '{"paymentId":"172573160451"}'
```

A rota consulta o Mercado Pago diretamente, valida valor e status, confirma o pedido no
Supabase e inicia o fulfillment com travas de idempotência. Repetir a chamada não deve gerar
um segundo fulfillment.

## 5. Verificação

Confirme no Supabase:

- `payments.status = paid` e `paid_at` preenchido;
- `orders.payment_status = paid`;
- quatro linhas em `fulfillment_items`;
- eventos `payment_confirmed`, `fulfillment_items_created`, `gatekeeper_success` e
  `item_submitted`;
- `provider_order_id` preenchido em cada item enviado.
