import { handleLateWebhookPayment } from './fulfillment-orchestrator';
import { getMercadoPagoPixStatus } from './mercadopago';
import { store } from './store';

const RECONCILIATION_BATCH_SIZE = 20;
const RECOVERY_LOOKBACK_SIZE = 100;
const MINIMUM_PAYMENT_AGE_MS = 60_000;

export interface PaymentReconciliationResult {
  checked: number;
  recoveryScanned: number;
  recovered: number;
  paid: number;
  expired: number;
  stillPending: number;
  manualReview: number;
  failed: number;
  errors: Array<{ paymentId: string; message: string }>;
}

function recordError(
  result: PaymentReconciliationResult,
  paymentId: string,
  error: unknown
): void {
  const message = error instanceof Error ? error.message : String(error);
  result.failed += 1;
  result.errors.push({ paymentId, message });
  console.error(`[PAYMENT RECONCILIATION ERROR] Mercado Pago #${paymentId}:`, message);
}

/**
 * Recovers Mercado Pago state transitions whose webhook was missed or interrupted.
 * Provider lookups and local transitions are idempotent, so this is safe to run repeatedly.
 */
export async function reconcilePendingMercadoPagoPayments(): Promise<PaymentReconciliationResult> {
  const result: PaymentReconciliationResult = {
    checked: 0,
    recoveryScanned: 0,
    recovered: 0,
    paid: 0,
    expired: 0,
    stillPending: 0,
    manualReview: 0,
    failed: 0,
    errors: [],
  };

  // Resume interrupted transitions where the payment was persisted as paid before the order
  // or fulfillment finished. This closes the crash window after tryMarkPaymentPaid().
  const paidCandidates = await store.listPaidPaymentsForRecoveryAsync(
    'mercadopago',
    RECOVERY_LOOKBACK_SIZE
  );
  for (const candidate of paidCandidates) {
    result.recoveryScanned += 1;
    try {
      const order = await store.getOrderAsync(candidate.orderId);
      if (
        !order ||
        (order.paymentStatus === 'paid' && order.fulfillmentStatus !== 'pending')
      ) {
        continue;
      }

      const processing = await handleLateWebhookPayment(
        'mercadopago',
        candidate.providerPaymentId,
        candidate.amountCents,
        candidate.paidAt
      );
      if (!processing.success) {
        throw new Error(processing.message);
      }
      result.recovered += 1;
    } catch (error) {
      recordError(result, candidate.providerPaymentId, error);
    }
  }

  const candidates = await store.listPendingPaymentsForReconciliationAsync(
    'mercadopago',
    RECONCILIATION_BATCH_SIZE,
    new Date(Date.now() - MINIMUM_PAYMENT_AGE_MS)
  );

  for (const candidate of candidates) {
    result.checked += 1;
    try {
      const providerPayment = await getMercadoPagoPixStatus(candidate.providerPaymentId);

      if (providerPayment.status === 'paid') {
        const processing = await handleLateWebhookPayment(
          'mercadopago',
          providerPayment.id,
          providerPayment.valueCents,
          providerPayment.paidAt
        );
        if (!processing.success) {
          if (!processing.retryable) {
            result.manualReview += 1;
            continue;
          }
          throw new Error(processing.message);
        }
        result.paid += 1;
        continue;
      }

      if (providerPayment.status === 'expired') {
        const orderPayments = await store.getPaymentsByOrderIdAsync(candidate.orderId);
        const hasOtherActivePayment = orderPayments.some(
          (payment) =>
            payment.id !== candidate.id &&
            (payment.status === 'pending' || payment.status === 'paid')
        );
        const expiredOrder = hasOtherActivePayment
          ? undefined
          : await store.tryMarkOrderExpired(candidate.orderId);
        const expiredPayment = await store.tryMarkPaymentExpired(candidate.id);

        if (expiredPayment) {
          if (expiredOrder) {
            await store.addEvent(
              candidate.orderId,
              'payment_expired_reconciled',
              `Cobrança Mercado Pago #${candidate.providerPaymentId} expirada durante reconciliação automática.`
            );
          }
          result.expired += 1;
        } else {
          result.stillPending += 1;
        }
        continue;
      }

      result.stillPending += 1;
    } catch (error) {
      recordError(result, candidate.providerPaymentId, error);
    }
  }

  return result;
}
