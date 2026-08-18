-- ================================================================
-- NOTORIUS SUPABASE DATABASE SCHEMA MIGRATION
-- Copie e cole este código no SQL Editor do seu painel do Supabase
-- ================================================================

-- 1. Tabela de Pedidos (orders)
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

-- 2. Tabela de Pagamentos Pix (payments)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela de Itens de Entrega (fulfillment_items)
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

-- 4. Tabela de Histórico de Eventos do Pedido (order_events)
CREATE TABLE IF NOT EXISTS public.order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Índices de Alta Performance para Consultas Rápidas
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_provider_payment
  ON public.payments(provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_pending_reconciliation
  ON public.payments(provider, created_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_order_id ON public.fulfillment_items(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_due_retry
  ON public.fulfillment_items(next_retry_at)
  WHERE status = 'retry_scheduled';
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

-- ================================================================
-- HABILITAR SEGURANÇA ROW LEVEL SECURITY (RLS) - BLOQUEIO DE ACESSO PÚBLICO
-- ================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Bloqueia leituras/escritas anônimas diretas no Supabase REST API (Segurança Zero-Trust)
-- Apenas o servidor Backend via Service Role Key tem permissão total de acesso.
REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.payments FROM anon, authenticated;
REVOKE ALL ON public.fulfillment_items FROM anon, authenticated;
REVOKE ALL ON public.order_events FROM anon, authenticated;
