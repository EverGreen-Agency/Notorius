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

export type PaymentProvider = 'pushinpay' | 'mercadopago';

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
  provider: PaymentProvider;
  providerPaymentId: string;
  amountCents: number;
  qrCode: string;
  qrCodeBase64?: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  expiresAt: string;
  paidAfterExpiration?: boolean;
  paidAt?: string;
  reconciliationAttemptCount?: number;
  nextReconciliationAt?: string;
  lastReconciledAt?: string;
  lastReconciliationErrorCode?: string;
  createdAt: string;
}

export type IntegrationRunTrigger = 'cron_payment_recovery' | 'mercadopago_webhook';
export type IntegrationRunStatus =
  | 'running'
  | 'succeeded'
  | 'partial_failure'
  | 'manual_review'
  | 'ignored';

export interface IntegrationRunRecord {
  id: string;
  trigger: IntegrationRunTrigger;
  status: IntegrationRunStatus;
  correlationHash?: string;
  counters: Record<string, number>;
  errorCodes: string[];
  startedAt: string;
  finishedAt?: string;
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

type DatabaseError = { message: string } | null;
type DatabaseRow = Record<string, unknown>;

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

function mapOrder(row: DatabaseRow): OrderRecord {
  return {
    id: String(row.id),
    publicToken: String(row.public_token),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    packageSlug: String(row.package_slug),
    packageSnapshot: row.package_snapshot as PackageConfig,
    postUrlOriginal: String(row.post_url_original),
    postUrlCanonical: String(row.post_url_canonical),
    contentType: row.content_type as OrderRecord['contentType'],
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    paymentStatus: row.payment_status as PaymentStatus,
    fulfillmentStatus: row.fulfillment_status as FulfillmentStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPayment(row: DatabaseRow): PaymentRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    provider: row.provider as PaymentProvider,
    providerPaymentId: String(row.provider_payment_id),
    amountCents: Number(row.amount_cents),
    qrCode: String(row.qr_code),
    qrCodeBase64: optionalString(row.qr_code_base64),
    status: row.status as PaymentRecord['status'],
    expiresAt: String(row.expires_at),
    paidAfterExpiration: Boolean(row.paid_after_expiration),
    paidAt: optionalString(row.paid_at),
    reconciliationAttemptCount: Number(row.reconciliation_attempt_count || 0),
    nextReconciliationAt: optionalString(row.next_reconciliation_at),
    lastReconciledAt: optionalString(row.last_reconciled_at),
    lastReconciliationErrorCode: optionalString(row.last_reconciliation_error_code),
    createdAt: String(row.created_at),
  };
}

function mapFulfillmentItem(row: DatabaseRow): FulfillmentItemRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    metric: row.metric as FulfillmentItemRecord['metric'],
    serviceId: row.service_id === null ? null : Number(row.service_id),
    quantity: Number(row.quantity),
    isGatekeeper: Boolean(row.is_gatekeeper),
    providerOrderId:
      row.provider_order_id === null || row.provider_order_id === undefined
        ? undefined
        : Number(row.provider_order_id),
    status: row.status as ItemStatus,
    attemptCount: Number(row.attempt_count),
    lastError: optionalString(row.last_error),
    nextRetryAt: optionalString(row.next_retry_at),
    submittedAt: optionalString(row.submitted_at),
    completedAt: optionalString(row.completed_at),
    createdAt: String(row.created_at),
  };
}

function mapEvent(row: DatabaseRow): OrderEventRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    type: String(row.type),
    message: String(row.message),
    metadata: (row.metadata as Record<string, unknown> | null) || undefined,
    createdAt: String(row.created_at),
  };
}

class ApplicationStore {
  private orders = new Map<string, OrderRecord>();
  private payments = new Map<string, PaymentRecord>();
  private fulfillmentItems = new Map<string, FulfillmentItemRecord>();
  private events: OrderEventRecord[] = [];
  private integrationRuns = new Map<string, IntegrationRunRecord>();
  private itemLocks = new Set<string>();
  private lastLowBalanceAlertAt: string | null = null;
  private lastBalanceAlertLevel: 'normal' | 'warning' | 'critical' = 'normal';

  private assertPersistenceAvailable(): void {
    if (!supabase && process.env.NODE_ENV === 'production') {
      throw new Error(
        'Supabase não está configurado no servidor. Operações de pedido foram bloqueadas para evitar perda de dados.'
      );
    }
  }

  private assertDatabaseSuccess(context: string, error: DatabaseError): void {
    if (error) throw new Error(`${context}: ${error.message}`);
  }

  public getLastBalanceAlertState() {
    return { lastAlertAt: this.lastLowBalanceAlertAt, lastLevel: this.lastBalanceAlertLevel };
  }

  public updateBalanceAlertState(level: 'normal' | 'warning' | 'critical') {
    this.lastBalanceAlertLevel = level;
    this.lastLowBalanceAlertAt = new Date().toISOString();
  }

  public async createOrder(order: OrderRecord): Promise<OrderRecord> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { error } = await supabase.from('orders').insert({
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
      });
      this.assertDatabaseSuccess('Falha ao persistir o pedido', error);
    }
    this.orders.set(order.id, order);
    return order;
  }

  public async updateOrder(
    id: string,
    updates: Partial<OrderRecord>
  ): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    const existing = await this.getOrderAsync(id);
    if (!existing) return undefined;
    const updated: OrderRecord = { ...existing, ...updates, updatedAt: new Date().toISOString() };

    if (supabase) {
      const dbUpdates: Record<string, unknown> = { updated_at: updated.updatedAt };
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.fulfillmentStatus !== undefined) {
        dbUpdates.fulfillment_status = updates.fulfillmentStatus;
      }
      if (updates.postUrlCanonical !== undefined) {
        dbUpdates.post_url_canonical = updates.postUrlCanonical;
      }
      const { error } = await supabase.from('orders').update(dbUpdates).eq('id', id);
      this.assertDatabaseSuccess('Falha ao atualizar o pedido', error);
    }
    this.orders.set(id, updated);
    return updated;
  }

  /** Atomically moves a newly-paid order out of pending fulfillment. */
  public async tryClaimOrderFulfillment(orderId: string): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    const updatedAt = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({
          fulfillment_status: 'validating_content_compatibility',
          updated_at: updatedAt,
        })
        .eq('id', orderId)
        .eq('payment_status', 'paid')
        .eq('fulfillment_status', 'pending')
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao reservar o fulfillment do pedido', error);
      if (!data) return undefined;
      const claimed = mapOrder(data as DatabaseRow);
      this.orders.set(claimed.id, claimed);
      return claimed;
    }

    const existing = this.orders.get(orderId);
    if (
      !existing ||
      existing.paymentStatus !== 'paid' ||
      existing.fulfillmentStatus !== 'pending'
    ) return undefined;
    const claimed: OrderRecord = {
      ...existing,
      fulfillmentStatus: 'validating_content_compatibility',
      updatedAt,
    };
    this.orders.set(orderId, claimed);
    return claimed;
  }

  /** Marks an unpaid order as paid exactly once across concurrent webhook invocations. */
  public async tryMarkOrderPaid(orderId: string): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    const updatedAt = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', updated_at: updatedAt })
        .eq('id', orderId)
        .in('payment_status', ['pending', 'expired', 'failed'])
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao confirmar pagamento do pedido', error);
      if (!data) return undefined;
      const updated = mapOrder(data as DatabaseRow);
      this.orders.set(updated.id, updated);
      return updated;
    }

    const existing = this.orders.get(orderId);
    if (!existing || !['pending', 'expired', 'failed'].includes(existing.paymentStatus)) {
      return undefined;
    }
    const updated: OrderRecord = { ...existing, paymentStatus: 'paid', updatedAt };
    this.orders.set(updated.id, updated);
    return updated;
  }

  public async listOrdersAsync(): Promise<OrderRecord[]> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      this.assertDatabaseSuccess('Falha ao listar pedidos', error);
      const records = (data || []).map((row) => mapOrder(row as DatabaseRow));
      records.forEach((record) => this.orders.set(record.id, record));
      return records;
    }
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async createPayment(payment: PaymentRecord): Promise<PaymentRecord> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { error } = await supabase.from('payments').insert({
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
        reconciliation_attempt_count: payment.reconciliationAttemptCount || 0,
        next_reconciliation_at: payment.nextReconciliationAt || payment.createdAt,
        last_reconciled_at: payment.lastReconciledAt,
        last_reconciliation_error_code: payment.lastReconciliationErrorCode,
        created_at: payment.createdAt,
      });
      this.assertDatabaseSuccess('Falha ao persistir o pagamento', error);
    }
    this.payments.set(payment.id, payment);
    return payment;
  }

  public async updatePayment(
    id: string,
    updates: Partial<PaymentRecord>
  ): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    const existing = await this.getPaymentByIdAsync(id);
    if (!existing) return undefined;
    const updated: PaymentRecord = { ...existing, ...updates };
    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;
      if (updates.paidAfterExpiration !== undefined) {
        dbUpdates.paid_after_expiration = updates.paidAfterExpiration;
      }
      if (updates.reconciliationAttemptCount !== undefined) {
        dbUpdates.reconciliation_attempt_count = updates.reconciliationAttemptCount;
      }
      if ('nextReconciliationAt' in updates) {
        dbUpdates.next_reconciliation_at = updates.nextReconciliationAt ?? null;
      }
      if ('lastReconciledAt' in updates) {
        dbUpdates.last_reconciled_at = updates.lastReconciledAt ?? null;
      }
      if ('lastReconciliationErrorCode' in updates) {
        dbUpdates.last_reconciliation_error_code = updates.lastReconciliationErrorCode ?? null;
      }
      const { error } = await supabase.from('payments').update(dbUpdates).eq('id', id);
      this.assertDatabaseSuccess('Falha ao atualizar o pagamento', error);
    }
    this.payments.set(id, updated);
    return updated;
  }

  /** Atomically claims eligible pending payments so concurrent schedulers never share a batch. */
  public async claimPendingPaymentsForReconciliationAsync(
    provider: PaymentProvider,
    limit = 10,
    createdBefore = new Date(Date.now() - 60_000),
    leaseSeconds = 240
  ): Promise<PaymentRecord[]> {
    this.assertPersistenceAvailable();
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeLeaseSeconds = Math.max(60, Math.min(leaseSeconds, 900));
    const now = new Date();

    if (supabase) {
      const { data, error } = await supabase.rpc(
        'claim_pending_payments_for_reconciliation',
        {
          p_provider: provider,
          p_limit: safeLimit,
          p_created_before: createdBefore.toISOString(),
          p_lease_seconds: safeLeaseSeconds,
        }
      );
      this.assertDatabaseSuccess('Falha ao reservar pagamentos para reconciliação', error);
      const records: PaymentRecord[] = ((data || []) as DatabaseRow[]).map(
        (row: DatabaseRow) => mapPayment(row)
      );
      records.forEach((record: PaymentRecord) => this.payments.set(record.id, record));
      return records;
    }

    const leaseUntil = new Date(now.getTime() + safeLeaseSeconds * 1_000).toISOString();
    return Array.from(this.payments.values())
      .filter(
        (payment) =>
          payment.provider === provider &&
          payment.status === 'pending' &&
          new Date(payment.createdAt).getTime() <= createdBefore.getTime() &&
          new Date(payment.nextReconciliationAt || payment.createdAt).getTime() <= now.getTime()
      )
      .sort((a, b) => {
        const dueDifference =
          new Date(a.nextReconciliationAt || a.createdAt).getTime() -
          new Date(b.nextReconciliationAt || b.createdAt).getTime();
        return dueDifference || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, safeLimit)
      .map((payment) => {
        const claimed: PaymentRecord = {
          ...payment,
          reconciliationAttemptCount: (payment.reconciliationAttemptCount || 0) + 1,
          lastReconciledAt: now.toISOString(),
          nextReconciliationAt: leaseUntil,
          lastReconciliationErrorCode: undefined,
        };
        this.payments.set(claimed.id, claimed);
        return claimed;
      });
  }

  public async schedulePaymentReconciliationAsync(
    payment: PaymentRecord,
    nextReconciliationAt: string,
    errorCode?: string
  ): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    const expectedAttemptCount = payment.reconciliationAttemptCount || 0;
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .update({
          next_reconciliation_at: nextReconciliationAt,
          last_reconciliation_error_code: errorCode || null,
        })
        .eq('id', payment.id)
        .eq('status', payment.status)
        .eq('reconciliation_attempt_count', expectedAttemptCount)
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao reagendar reconciliação do pagamento', error);
      if (!data) return undefined;
      const updated = mapPayment(data as DatabaseRow);
      this.payments.set(updated.id, updated);
      return updated;
    }

    const existing = this.payments.get(payment.id);
    if (
      !existing ||
      existing.status !== payment.status ||
      (existing.reconciliationAttemptCount || 0) !== expectedAttemptCount
    ) return undefined;
    const updated: PaymentRecord = {
      ...existing,
      nextReconciliationAt,
      lastReconciliationErrorCode: errorCode,
    };
    this.payments.set(updated.id, updated);
    return updated;
  }

  /** Atomically claims paid rows whose order transition/fulfillment is still incomplete. */
  public async claimPaidPaymentsForRecoveryAsync(
    provider: PaymentProvider,
    limit = 10,
    leaseSeconds = 900
  ): Promise<PaymentRecord[]> {
    this.assertPersistenceAvailable();
    const safeLimit = Math.max(1, Math.min(limit, 100));
    const safeLeaseSeconds = Math.max(300, Math.min(leaseSeconds, 1_800));
    const now = new Date();

    if (supabase) {
      const { data, error } = await supabase.rpc('claim_paid_payment_recovery_candidates', {
        p_provider: provider,
        p_limit: safeLimit,
        p_lease_seconds: safeLeaseSeconds,
      });
      this.assertDatabaseSuccess('Falha ao reservar pagamentos pagos para recuperação', error);
      const records: PaymentRecord[] = ((data || []) as DatabaseRow[]).map(
        (row: DatabaseRow) => mapPayment(row)
      );
      records.forEach((record: PaymentRecord) => this.payments.set(record.id, record));
      return records;
    }

    const leaseUntil = new Date(now.getTime() + safeLeaseSeconds * 1_000).toISOString();
    return Array.from(this.payments.values())
      .filter((payment) => {
        if (
          payment.provider !== provider ||
          payment.status !== 'paid' ||
          new Date(payment.nextReconciliationAt || payment.createdAt).getTime() > now.getTime()
        ) return false;
        const order = this.orders.get(payment.orderId);
        return Boolean(
          order && (order.paymentStatus !== 'paid' || order.fulfillmentStatus === 'pending')
        );
      })
      .sort((a, b) => {
        const dueDifference =
          new Date(a.nextReconciliationAt || a.createdAt).getTime() -
          new Date(b.nextReconciliationAt || b.createdAt).getTime();
        return dueDifference ||
          new Date(a.paidAt || a.createdAt).getTime() -
            new Date(b.paidAt || b.createdAt).getTime();
      })
      .slice(0, safeLimit)
      .map((payment) => {
        const claimed: PaymentRecord = {
          ...payment,
          reconciliationAttemptCount: (payment.reconciliationAttemptCount || 0) + 1,
          lastReconciledAt: now.toISOString(),
          nextReconciliationAt: leaseUntil,
          lastReconciliationErrorCode: undefined,
        };
        this.payments.set(claimed.id, claimed);
        return claimed;
      });
  }

  /** Atomically expires the exact claimed payment attempt while it is still pending. */
  public async tryMarkPaymentExpired(payment: PaymentRecord): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    const expectedAttemptCount = payment.reconciliationAttemptCount || 0;
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'expired' })
        .eq('id', payment.id)
        .eq('status', 'pending')
        .eq('reconciliation_attempt_count', expectedAttemptCount)
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao expirar pagamento', error);
      if (!data) return undefined;
      const updated = mapPayment(data as DatabaseRow);
      this.payments.set(updated.id, updated);
      return updated;
    }

    const existing = this.payments.get(payment.id);
    if (
      !existing ||
      existing.status !== 'pending' ||
      (existing.reconciliationAttemptCount || 0) !== expectedAttemptCount
    ) return undefined;
    const updated: PaymentRecord = { ...existing, status: 'expired' };
    this.payments.set(updated.id, updated);
    return updated;
  }

  /** Atomically expires an order only while no payment has promoted it. */
  public async tryMarkOrderExpired(orderId: string): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    const updatedAt = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: 'expired', updated_at: updatedAt })
        .eq('id', orderId)
        .eq('payment_status', 'pending')
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao expirar pedido', error);
      if (!data) return undefined;
      const updated = mapOrder(data as DatabaseRow);
      this.orders.set(updated.id, updated);
      return updated;
    }

    const existing = this.orders.get(orderId);
    if (!existing || existing.paymentStatus !== 'pending') return undefined;
    const updated: OrderRecord = { ...existing, paymentStatus: 'expired', updatedAt };
    this.orders.set(updated.id, updated);
    return updated;
  }

  /** Marks one provider payment as paid exactly once. */
  public async tryMarkPaymentPaid(
    payment: PaymentRecord,
    paidAt: string
  ): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const expiredAttempt = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_after_expiration: true,
          paid_at: paidAt,
        })
        .eq('id', payment.id)
        .eq('status', 'expired')
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess(
        'Falha ao confirmar pagamento expirado do provedor',
        expiredAttempt.error
      );
      if (expiredAttempt.data) {
        const updated = mapPayment(expiredAttempt.data as DatabaseRow);
        this.payments.set(updated.id, updated);
        return updated;
      }

      const pendingAttempt = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_after_expiration: false,
          paid_at: paidAt,
        })
        .eq('id', payment.id)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();
      this.assertDatabaseSuccess(
        'Falha ao confirmar pagamento pendente do provedor',
        pendingAttempt.error
      );
      if (!pendingAttempt.data) return undefined;
      const updated = mapPayment(pendingAttempt.data as DatabaseRow);
      this.payments.set(updated.id, updated);
      return updated;
    }

    const existing = this.payments.get(payment.id);
    if (!existing || !['pending', 'expired'].includes(existing.status)) return undefined;
    const updated: PaymentRecord = {
      ...existing,
      status: 'paid',
      paidAfterExpiration: existing.status === 'expired',
      paidAt,
    };
    this.payments.set(updated.id, updated);
    return updated;
  }

  public async createFulfillmentItem(
    item: FulfillmentItemRecord
  ): Promise<FulfillmentItemRecord> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { error } = await supabase.from('fulfillment_items').upsert({
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
      }, { onConflict: 'id', ignoreDuplicates: true });
      this.assertDatabaseSuccess('Falha ao persistir item de fulfillment', error);
    }
    this.fulfillmentItems.set(item.id, item);
    return item;
  }

  public async updateFulfillmentItem(
    id: string,
    updates: Partial<FulfillmentItemRecord>
  ): Promise<FulfillmentItemRecord | undefined> {
    this.assertPersistenceAvailable();
    const existing = await this.getFulfillmentItemAsync(id);
    if (!existing) return undefined;
    const updated: FulfillmentItemRecord = { ...existing, ...updates };
    if (supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.attemptCount !== undefined) dbUpdates.attempt_count = updates.attemptCount;
      if (updates.providerOrderId !== undefined) dbUpdates.provider_order_id = updates.providerOrderId;
      if ('lastError' in updates) dbUpdates.last_error = updates.lastError ?? null;
      if ('nextRetryAt' in updates) dbUpdates.next_retry_at = updates.nextRetryAt ?? null;
      if ('submittedAt' in updates) dbUpdates.submitted_at = updates.submittedAt ?? null;
      if ('completedAt' in updates) dbUpdates.completed_at = updates.completedAt ?? null;
      const { error } = await supabase.from('fulfillment_items').update(dbUpdates).eq('id', id);
      this.assertDatabaseSuccess('Falha ao atualizar item de fulfillment', error);
    }
    this.fulfillmentItems.set(id, updated);
    return updated;
  }

  /** Claims one item using its current status as a distributed compare-and-set lock. */
  public async tryClaimFulfillmentItem(
    item: FulfillmentItemRecord,
    now = new Date()
  ): Promise<FulfillmentItemRecord | undefined> {
    this.assertPersistenceAvailable();
    if (
      item.status === 'retry_scheduled' &&
      (!item.nextRetryAt || new Date(item.nextRetryAt).getTime() > now.getTime())
    ) return undefined;

    const attemptCount = item.attemptCount + 1;
    if (supabase) {
      let query = supabase
        .from('fulfillment_items')
        .update({ status: 'submitting', attempt_count: attemptCount })
        .eq('id', item.id)
        .eq('status', item.status);
      if (item.status === 'retry_scheduled') {
        query = query.lte('next_retry_at', now.toISOString());
      }
      const { data, error } = await query.select('*').maybeSingle();
      this.assertDatabaseSuccess('Falha ao reservar item de fulfillment', error);
      if (!data) return undefined;
      const claimed = mapFulfillmentItem(data as DatabaseRow);
      this.fulfillmentItems.set(claimed.id, claimed);
      return claimed;
    }

    const current = this.fulfillmentItems.get(item.id);
    if (!current || current.status !== item.status) return undefined;
    const claimed: FulfillmentItemRecord = {
      ...current,
      status: 'submitting',
      attemptCount,
    };
    this.fulfillmentItems.set(claimed.id, claimed);
    return claimed;
  }

  public acquireLock(key: string): boolean {
    if (this.itemLocks.has(key)) return false;
    this.itemLocks.add(key);
    return true;
  }

  public releaseLock(key: string): void {
    this.itemLocks.delete(key);
  }

  public async createIntegrationRun(run: IntegrationRunRecord): Promise<void> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { error } = await supabase.from('integration_runs').insert({
        id: run.id,
        trigger: run.trigger,
        status: run.status,
        correlation_hash: run.correlationHash,
        counters: run.counters,
        error_codes: run.errorCodes,
        started_at: run.startedAt,
        finished_at: run.finishedAt,
      });
      this.assertDatabaseSuccess('Falha ao iniciar auditoria da integração', error);
    }
    this.integrationRuns.set(run.id, run);
  }

  public async finishIntegrationRun(
    id: string,
    status: IntegrationRunStatus,
    counters: Record<string, number>,
    errorCodes: string[],
    finishedAt = new Date().toISOString()
  ): Promise<void> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('integration_runs')
        .update({
          status,
          counters,
          error_codes: errorCodes,
          finished_at: finishedAt,
        })
        .eq('id', id)
        .select('id')
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao concluir auditoria da integração', error);
      if (!data) {
        throw new Error('Execução de auditoria da integração não encontrada');
      }
    }
    const existing = this.integrationRuns.get(id);
    if (!supabase && !existing) {
      throw new Error('Execução de auditoria da integração não encontrada');
    }
    if (existing) {
      this.integrationRuns.set(id, {
        ...existing,
        status,
        counters,
        errorCodes,
        finishedAt,
      });
    }
  }

  public async addEvent(
    orderId: string,
    type: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<OrderEventRecord> {
    this.assertPersistenceAvailable();
    const event: OrderEventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      orderId,
      type,
      message,
      metadata,
      createdAt: new Date().toISOString(),
    };
    if (supabase) {
      const { error } = await supabase.from('order_events').insert({
        id: event.id,
        order_id: event.orderId,
        type: event.type,
        message: event.message,
        metadata: event.metadata,
        created_at: event.createdAt,
      });
      this.assertDatabaseSuccess('Falha ao persistir evento do pedido', error);
    }
    this.events.push(event);
    return event;
  }

  public async getOrderAsync(id: string): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      this.assertDatabaseSuccess('Falha ao consultar o pedido', error);
      if (!data) return undefined;
      const record = mapOrder(data as DatabaseRow);
      this.orders.set(record.id, record);
      return record;
    }
    return this.orders.get(id);
  }

  public async getOrderByPublicTokenAsync(token: string): Promise<OrderRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('public_token', token)
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao consultar o pedido público', error);
      if (!data) return undefined;
      const record = mapOrder(data as DatabaseRow);
      this.orders.set(record.id, record);
      return record;
    }
    return Array.from(this.orders.values()).find((order) => order.publicToken === token);
  }

  public async getPaymentByIdAsync(id: string): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao consultar o pagamento', error);
      if (!data) return undefined;
      const record = mapPayment(data as DatabaseRow);
      this.payments.set(record.id, record);
      return record;
    }
    return this.payments.get(id);
  }

  public async getPaymentByProviderIdAsync(
    providerPaymentId: string,
    provider?: PaymentProvider
  ): Promise<PaymentRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      let query = supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', providerPaymentId);
      if (provider) query = query.eq('provider', provider);
      const { data, error } = await query.maybeSingle();
      this.assertDatabaseSuccess('Falha ao localizar o pagamento do provedor', error);
      if (!data) return undefined;
      const record = mapPayment(data as DatabaseRow);
      this.payments.set(record.id, record);
      return record;
    }
    return Array.from(this.payments.values()).find(
      (payment) =>
        payment.providerPaymentId === providerPaymentId &&
        (!provider || payment.provider === provider)
    );
  }

  public async getPaymentsByOrderIdAsync(orderId: string): Promise<PaymentRecord[]> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      this.assertDatabaseSuccess('Falha ao listar pagamentos do pedido', error);
      const records: PaymentRecord[] = ((data || []) as DatabaseRow[]).map(
        (row: DatabaseRow) => mapPayment(row)
      );
      records.forEach((record: PaymentRecord) => this.payments.set(record.id, record));
      return records;
    }
    return Array.from(this.payments.values()).filter((payment) => payment.orderId === orderId);
  }

  public async getFulfillmentItemAsync(
    id: string
  ): Promise<FulfillmentItemRecord | undefined> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('fulfillment_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      this.assertDatabaseSuccess('Falha ao consultar item de fulfillment', error);
      if (!data) return undefined;
      const record = mapFulfillmentItem(data as DatabaseRow);
      this.fulfillmentItems.set(record.id, record);
      return record;
    }
    return this.fulfillmentItems.get(id);
  }

  public async getFulfillmentItemsByOrderIdAsync(
    orderId: string
  ): Promise<FulfillmentItemRecord[]> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('fulfillment_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      this.assertDatabaseSuccess('Falha ao listar itens de fulfillment', error);
      const records = (data || []).map((row) => mapFulfillmentItem(row as DatabaseRow));
      records.forEach((record) => this.fulfillmentItems.set(record.id, record));
      return records;
    }
    return Array.from(this.fulfillmentItems.values()).filter((item) => item.orderId === orderId);
  }

  public async listOrderIdsWithDueRetriesAsync(now = new Date()): Promise<string[]> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('fulfillment_items')
        .select('order_id')
        .eq('status', 'retry_scheduled')
        .lte('next_retry_at', now.toISOString())
        .limit(100);
      this.assertDatabaseSuccess('Falha ao consultar retries pendentes', error);
      return Array.from(new Set((data || []).map((row) => String(row.order_id))));
    }
    return Array.from(
      new Set(
        Array.from(this.fulfillmentItems.values())
          .filter(
            (item) =>
              item.status === 'retry_scheduled' &&
              item.nextRetryAt &&
              new Date(item.nextRetryAt).getTime() <= now.getTime()
          )
          .map((item) => item.orderId)
      )
    );
  }

  public async getEventsByOrderIdAsync(orderId: string): Promise<OrderEventRecord[]> {
    this.assertPersistenceAvailable();
    if (supabase) {
      const { data, error } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      this.assertDatabaseSuccess('Falha ao listar eventos do pedido', error);
      return (data || []).map((row) => mapEvent(row as DatabaseRow));
    }
    return this.events
      .filter((event) => event.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const store = new ApplicationStore();
