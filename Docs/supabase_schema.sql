-- ================================================================
-- NOTORIUS SUPABASE DATABASE SCHEMA
-- Para banco existente, aplique Docs/supabase_reliability_migration.sql.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  public_token TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  package_slug TEXT NOT NULL,
  package_snapshot JSONB NOT NULL,
  post_url_original TEXT NOT NULL,
  post_url_canonical TEXT NOT NULL,
  content_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pushinpay',
  provider_payment_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  qr_code TEXT NOT NULL,
  qr_code_base64 TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  paid_after_expiration BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  reconciliation_attempt_count INTEGER NOT NULL DEFAULT 0,
  next_reconciliation_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reconciled_at TIMESTAMPTZ,
  last_reconciliation_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fulfillment_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  service_id INTEGER,
  quantity INTEGER NOT NULL,
  is_gatekeeper BOOLEAN DEFAULT FALSE,
  provider_order_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INTEGER DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_runs (
  id TEXT PRIMARY KEY,
  trigger TEXT NOT NULL,
  status TEXT NOT NULL,
  correlation_hash TEXT,
  counters JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_payment
  ON public.payments(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_pending_reconciliation
  ON public.payments(provider, next_reconciliation_at, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payments_paid_recovery
  ON public.payments(provider, next_reconciliation_at, paid_at)
  WHERE status = 'paid';
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_order_id ON public.fulfillment_items(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_due_retry
  ON public.fulfillment_items(next_retry_at)
  WHERE status = 'retry_scheduled';
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_integration_runs_trigger_started
  ON public.integration_runs(trigger, started_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.payments FROM anon, authenticated;
REVOKE ALL ON public.fulfillment_items FROM anon, authenticated;
REVOKE ALL ON public.order_events FROM anon, authenticated;
REVOKE ALL ON public.integration_runs FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_pending_payments_for_reconciliation(
  p_provider TEXT,
  p_limit INTEGER,
  p_created_before TIMESTAMPTZ,
  p_lease_seconds INTEGER DEFAULT 240
)
RETURNS SETOF public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
  v_lease_seconds INTEGER := LEAST(GREATEST(COALESCE(p_lease_seconds, 240), 60), 900);
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT payment.id
    FROM public.payments AS payment
    WHERE payment.provider = p_provider
      AND payment.status = 'pending'
      AND payment.created_at <= p_created_before
      AND payment.next_reconciliation_at <= NOW()
    ORDER BY payment.next_reconciliation_at ASC, payment.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT v_limit
  )
  UPDATE public.payments AS payment
  SET reconciliation_attempt_count = payment.reconciliation_attempt_count + 1,
      last_reconciled_at = NOW(),
      next_reconciliation_at = NOW() + MAKE_INTERVAL(secs => v_lease_seconds),
      last_reconciliation_error_code = NULL
  FROM candidates
  WHERE payment.id = candidates.id
  RETURNING payment.*;
END;
$$;

DROP FUNCTION IF EXISTS public.list_paid_payment_recovery_candidates(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.claim_paid_payment_recovery_candidates(
  p_provider TEXT,
  p_limit INTEGER DEFAULT 10,
  p_lease_seconds INTEGER DEFAULT 900
)
RETURNS SETOF public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
  v_lease_seconds INTEGER := LEAST(GREATEST(COALESCE(p_lease_seconds, 900), 300), 1800);
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT payment.id
    FROM public.payments AS payment
    INNER JOIN public.orders AS purchase_order
      ON purchase_order.id = payment.order_id
    WHERE payment.provider = p_provider
      AND payment.status = 'paid'
      AND payment.next_reconciliation_at <= NOW()
      AND (
        purchase_order.payment_status <> 'paid'
        OR purchase_order.fulfillment_status = 'pending'
      )
    ORDER BY payment.next_reconciliation_at ASC,
      COALESCE(payment.paid_at, payment.created_at) ASC
    FOR UPDATE OF payment SKIP LOCKED
    LIMIT v_limit
  )
  UPDATE public.payments AS payment
  SET reconciliation_attempt_count = payment.reconciliation_attempt_count + 1,
      last_reconciled_at = NOW(),
      next_reconciliation_at = NOW() + MAKE_INTERVAL(secs => v_lease_seconds),
      last_reconciliation_error_code = NULL
  FROM candidates
  WHERE payment.id = candidates.id
  RETURNING payment.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_payments_for_reconciliation(TEXT, INTEGER, TIMESTAMPTZ, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_paid_payment_recovery_candidates(TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_payments_for_reconciliation(TEXT, INTEGER, TIMESTAMPTZ, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_paid_payment_recovery_candidates(TEXT, INTEGER, INTEGER)
  TO service_role;
