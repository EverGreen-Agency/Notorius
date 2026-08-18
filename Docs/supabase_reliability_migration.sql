-- Execute uma vez no SQL Editor do Supabase antes do deploy desta versão.
-- Garante idempotência por provedor e acelera o worker de retries.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_payment
  ON public.payments(provider, provider_payment_id);

CREATE INDEX IF NOT EXISTS idx_fulfillment_items_due_retry
  ON public.fulfillment_items(next_retry_at)
  WHERE status = 'retry_scheduled';

CREATE INDEX IF NOT EXISTS idx_payments_pending_reconciliation
  ON public.payments(provider, created_at)
  WHERE status = 'pending';

COMMIT;
