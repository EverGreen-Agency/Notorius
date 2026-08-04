import { PackageConfig } from './packages-catalog';

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
  provider: 'pushinpay';
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

// Global in-memory data store with thread-safe atomic locks per item/order
class ApplicationStore {
  private orders: Map<string, OrderRecord> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private fulfillmentItems: Map<string, FulfillmentItemRecord> = new Map();
  private events: OrderEventRecord[] = [];
  private itemLocks: Set<string> = new Set();

  // Create Order
  public createOrder(order: OrderRecord): OrderRecord {
    this.orders.set(order.id, order);
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
    return updated;
  }

  // Fulfillment Items
  public createFulfillmentItem(item: FulfillmentItemRecord): FulfillmentItemRecord {
    this.fulfillmentItems.set(item.id, item);
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
    return ev;
  }

  public getEventsByOrderId(orderId: string): OrderEventRecord[] {
    return this.events
      .filter((e) => e.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

// Global Singleton Instance
export const store = new ApplicationStore();
