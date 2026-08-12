import { PackageConfig } from './packages-catalog';
import { supabase } from './supabase';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'refunded'
  | 'manual_review';

export type FulfillmentStatus =
  | 'pending'
  | 'validating_content_compatibility'
  | 'partially_submitted'
  | 'awaiting_customer_action'
  | 'in_progress'
  | 'completed'
  | 'partially_failed'
  | 'awaiting_review';

export type ItemStatus =
  | 'pending'
  | 'waiting_for_compatibility'
  | 'submitting'
  | 'submitted'
  | 'retry_scheduled'
  | 'blocked_incompatible_content'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'submission_unknown';

export interface OrderRecord {
  id: string;
  publicToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageSlug: string;
  packageSnapshot: PackageConfig;
  postUrlOriginal: string;
  postUrlCanonical: string;
  contentType: 'reel' | 'post';
  amountCents: number;
  currency: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: 'pushinpay' | 'mercadopago';
  providerPaymentId: string;
  amountCents: number;
  qrCode: string;
  qrCodeBase64?: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  expiresAt: string;
  paidAfterExpiration?: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface FulfillmentItemRecord {
  id: string;
  orderId: string;
  metric: 'views' | 'likes' | 'saves' | 'shares';
  serviceId: number | null;
  quantity: number;
  isGatekeeper: boolean;
  providerOrderId?: number;
  status: ItemStatus;
  attemptCount: number;
  lastError?: string;
  nextRetryAt?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface OrderEventRecord {
  id: string;
  orderId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Global in-memory data store with thread-safe atomic locks and optional Supabase persistence
class ApplicationStore {
  private orders: Map<string, OrderRecord> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private fulfillmentItems: Map<string, FulfillmentItemRecord> = new Map();
  private events: OrderEventRecord[] = [];
  private itemLocks: Set<string> = new Set();

  // Create Order
  public createOrder(order: OrderRecord): OrderRecord {
    this.orders.set(order.id, order);

    if (supabase) {
      supabase
        .from('orders')
        .insert({
          id: order.id,
          public_token: order.publicToken,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
          package_slug: order.packageSlug,
          package_snapshot: order.packageSnapshot,
          post_url_original: order.postUrlOriginal,
          post_url_canonical: order.postUrlCanonical,
          content_type: order.contentType,
          amount_cents: order.amountCents,
          currency: order.currency,
          payment_status: order.paymentStatus,
          fulfillment_status: order.fulfillmentStatus,
          created_at: order.createdAt,
          updated_at: order.updatedAt,
        })
        .then(({ error }) => {
          if (error) console.error('[SUPABASE INSERT ORDER ERROR]:', error.message);
        });
    }

    return order;
  }

  public getOrder(id: string): OrderRecord | undefined {
    return this.orders.get(id);
  }

  public getOrderByPublicToken(token: string): OrderRecord | undefined {
    return Array.from(this.orders.values()).find((o) => o.publicToken === token);
  }

  public updateOrder(id: string, updates: Partial<OrderRecord>): OrderRecord | undefined {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.orders.set(id, updated);

    if (supabase) {
      const dbUpdates: Record<string, unknown> = { updated_at: updated.updatedAt };
      if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.fulfillmentStatus) dbUpdates.fulfillment_status = updates.fulfillmentStatus;
      if (updates.postUrlCanonical) dbUpdates.post_url_canonical = updates.postUrlCanonical;

      supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[SUPABASE UPDATE ORDER ERROR]:', error.message);
        });
    }

    return updated;
  }

  public listOrders(): OrderRecord[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Payments
  public createPayment(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.id, payment);

    if (supabase) {
      supabase
        .from('payments')
        .insert({
          id: payment.id,
          order_id: payment.orderId,
          provider: payment.provider,
          provider_payment_id: payment.providerPaymentId,
          amount_cents: payment.amountCents,
          qr_code: payment.qrCode,
          qr_code_base64: payment.qrCodeBase64,
          status: payment.status,
          expires_at: payment.expiresAt,
          paid_after_expiration: payment.paidAfterExpiration,
          paid_at: payment.paidAt,
          created_at: payment.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('[SUPABASE INSERT PAYMENT ERROR]:', error.message);
        });
    }

    return payment;
  }

  public getPaymentByProviderId(providerPaymentId: string): PaymentRecord | undefined {
    return Array.from(this.payments.values()).find((p) => p.providerPaymentId === providerPaymentId);
  }

  public getPaymentsByOrderId(orderId: string): PaymentRecord[] {
    return Array.from(this.payments.values()).filter((p) => p.orderId === orderId);
  }

  public updatePayment(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.payments.set(id, updated);

    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.paidAt) dbUpdates.paid_at = updates.paidAt;
      if (updates.paidAfterExpiration !== undefined) dbUpdates.paid_after_expiration = updates.paidAfterExpiration;

      supabase
        .from('payments')
        .update(dbUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[SUPABASE UPDATE PAYMENT ERROR]:', error.message);
        });
    }

    return updated;
  }

  // Fulfillment Items
  public createFulfillmentItem(item: FulfillmentItemRecord): FulfillmentItemRecord {
    this.fulfillmentItems.set(item.id, item);

    if (supabase) {
      supabase
        .from('fulfillment_items')
        .insert({
          id: item.id,
          order_id: item.orderId,
          metric: item.metric,
          service_id: item.serviceId,
          quantity: item.quantity,
          is_gatekeeper: item.isGatekeeper,
          provider_order_id: item.providerOrderId,
          status: item.status,
          attempt_count: item.attemptCount,
          last_error: item.lastError,
          next_retry_at: item.nextRetryAt,
          submitted_at: item.submittedAt,
          completed_at: item.completedAt,
          created_at: item.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('[SUPABASE INSERT FULFILLMENT ITEM ERROR]:', error.message);
        });
    }

    return item;
  }

  public getFulfillmentItemsByOrderId(orderId: string): FulfillmentItemRecord[] {
    return Array.from(this.fulfillmentItems.values()).filter((i) => i.orderId === orderId);
  }

  public getFulfillmentItem(id: string): FulfillmentItemRecord | undefined {
    return this.fulfillmentItems.get(id);
  }

  public updateFulfillmentItem(
    id: string,
    updates: Partial<FulfillmentItemRecord>
  ): FulfillmentItemRecord | undefined {
    const existing = this.fulfillmentItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.fulfillmentItems.set(id, updated);

    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.attemptCount !== undefined) dbUpdates.attempt_count = updates.attemptCount;
      if (updates.providerOrderId !== undefined) dbUpdates.provider_order_id = updates.providerOrderId;
      if (updates.lastError !== undefined) dbUpdates.last_error = updates.lastError;
      if (updates.nextRetryAt !== undefined) dbUpdates.next_retry_at = updates.nextRetryAt;
      if (updates.submittedAt !== undefined) dbUpdates.submitted_at = updates.submittedAt;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

      supabase
        .from('fulfillment_items')
        .update(dbUpdates)
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[SUPABASE UPDATE FULFILLMENT ITEM ERROR]:', error.message);
        });
    }

    return updated;
  }

  // Locks for Atomic Concurrency Protection
  public acquireLock(key: string): boolean {
    if (this.itemLocks.has(key)) return false;
    this.itemLocks.add(key);
    return true;
  }

  public releaseLock(key: string): void {
    this.itemLocks.delete(key);
  }

  // Order Events
  public addEvent(orderId: string, type: string, message: string, metadata?: Record<string, unknown>): OrderEventRecord {
    const ev: OrderEventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      type,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.events.push(ev);

    if (supabase) {
      supabase
        .from('order_events')
        .insert({
          id: ev.id,
          order_id: ev.orderId,
          type: ev.type,
          message: ev.message,
          metadata: ev.metadata,
          created_at: ev.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('[SUPABASE INSERT EVENT ERROR]:', error.message);
        });
    }

    return ev;
  }

  public async getOrderAsync(id: string): Promise<OrderRecord | undefined> {
    const mem = this.orders.get(id);
    if (mem) return mem;

    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const orderRecord: OrderRecord = {
          id: data.id,
          publicToken: data.public_token,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          packageSlug: data.package_slug,
          packageSnapshot: data.package_snapshot,
          postUrlOriginal: data.post_url_original,
          postUrlCanonical: data.post_url_canonical,
          contentType: data.content_type,
          amountCents: data.amount_cents,
          currency: data.currency,
          paymentStatus: data.payment_status,
          fulfillmentStatus: data.fulfillment_status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.orders.set(orderRecord.id, orderRecord);
        return orderRecord;
      }
    }
    return undefined;
  }

  public async getOrderByPublicTokenAsync(token: string): Promise<OrderRecord | undefined> {
    const memoryOrder = Array.from(this.orders.values()).find((o) => o.publicToken === token);
    if (memoryOrder) return memoryOrder;

    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').eq('public_token', token).maybeSingle();
      if (!error && data) {
        const orderRecord: OrderRecord = {
          id: data.id,
          publicToken: data.public_token,
          customerName: data.customer_name,
          customerEmail: data.customer_email,
          customerPhone: data.customer_phone,
          packageSlug: data.package_slug,
          packageSnapshot: data.package_snapshot,
          postUrlOriginal: data.post_url_original,
          postUrlCanonical: data.post_url_canonical,
          contentType: data.content_type,
          amountCents: data.amount_cents,
          currency: data.currency,
          paymentStatus: data.payment_status,
          fulfillmentStatus: data.fulfillment_status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        this.orders.set(orderRecord.id, orderRecord);
        return orderRecord;
      }
    }
    return undefined;
  }

  public async getPaymentsByOrderIdAsync(orderId: string): Promise<PaymentRecord[]> {
    const memoryPayments = Array.from(this.payments.values()).filter((p) => p.orderId === orderId);
    if (memoryPayments.length > 0) return memoryPayments;

    if (supabase) {
      const { data, error } = await supabase.from('payments').select('*').eq('order_id', orderId);
      if (!error && data && data.length > 0) {
        const records: PaymentRecord[] = data.map((p) => ({
          id: p.id,
          orderId: p.order_id,
          provider: p.provider,
          providerPaymentId: p.provider_payment_id,
          amountCents: p.amount_cents,
          qrCode: p.qr_code,
          qrCodeBase64: p.qr_code_base64,
          status: p.status,
          expiresAt: p.expires_at,
          paidAfterExpiration: p.paid_after_expiration,
          paidAt: p.paid_at,
          createdAt: p.created_at,
        }));
        records.forEach((r) => this.payments.set(r.id, r));
        return records;
      }
    }
    return memoryPayments;
  }

  public async getPaymentByProviderIdAsync(providerPaymentId: string): Promise<PaymentRecord | undefined> {
    const mem = Array.from(this.payments.values()).find((p) => p.providerPaymentId === providerPaymentId);
    if (mem) return mem;

    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', providerPaymentId)
        .maybeSingle();

      if (!error && data) {
        const record: PaymentRecord = {
          id: data.id,
          orderId: data.order_id,
          provider: data.provider,
          providerPaymentId: data.provider_payment_id,
          amountCents: data.amount_cents,
          qrCode: data.qr_code,
          qrCodeBase64: data.qr_code_base64,
          status: data.status,
          expiresAt: data.expires_at,
          paidAfterExpiration: data.paid_after_expiration,
          paidAt: data.paid_at,
          createdAt: data.created_at,
        };
        this.payments.set(record.id, record);
        return record;
      }
    }
    return undefined;
  }

  public async getFulfillmentItemsByOrderIdAsync(orderId: string): Promise<FulfillmentItemRecord[]> {
    const mem = Array.from(this.fulfillmentItems.values()).filter((i) => i.orderId === orderId);
    if (mem.length > 0) return mem;

    if (supabase) {
      const { data, error } = await supabase.from('fulfillment_items').select('*').eq('order_id', orderId);
      if (!error && data && data.length > 0) {
        const records: FulfillmentItemRecord[] = data.map((i) => ({
          id: i.id,
          orderId: i.order_id,
          metric: i.metric,
          serviceId: i.service_id,
          quantity: i.quantity,
          isGatekeeper: i.is_gatekeeper,
          providerOrderId: i.provider_order_id,
          status: i.status,
          attemptCount: i.attempt_count,
          lastError: i.last_error,
          nextRetryAt: i.next_retry_at,
          submittedAt: i.submitted_at,
          completedAt: i.completed_at,
          createdAt: i.created_at,
        }));
        records.forEach((r) => this.fulfillmentItems.set(r.id, r));
        return records;
      }
    }
    return mem;
  }

  public async getEventsByOrderIdAsync(orderId: string): Promise<OrderEventRecord[]> {
    const mem = this.events.filter((e) => e.orderId === orderId);
    if (mem.length > 0) return mem;

    if (supabase) {
      const { data, error } = await supabase.from('order_events').select('*').eq('order_id', orderId);
      if (!error && data && data.length > 0) {
        const records: OrderEventRecord[] = data.map((e) => ({
          id: e.id,
          orderId: e.order_id,
          type: e.type,
          message: e.message,
          metadata: e.metadata,
          createdAt: e.created_at,
        }));
        return records.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    }
    return mem;
  }
}

// Global Singleton Instance
export const store = new ApplicationStore();

