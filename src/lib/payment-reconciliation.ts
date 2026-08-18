import { createHash } from 'node:crypto';
import { handleLateWebhookPayment } from './fulfillment-orchestrator';
import {
  getMercadoPagoPixStatus,
  MercadoPagoStatusLookupError,
} from './mercadopago';
import { store, type PaymentRecord } from './store';

const RECONCILIATION_BATCH_SIZE = 10;
const RECOVERY_BATCH_SIZE = 10;
const MINIMUM_PAYMENT_AGE_MS = 60_000;
const RECONCILIATION_LEASE_SECONDS = 900;
const MAX_BACKOFF_MINUTES = 360;

export interface PaymentReconciliationResult {
  checked: number;
  recoveryScanned: number;
  recovered: number;
  paid: number;
  expired: number;
  stillPending: number;
  manualReview: number;
  failed: number;
  errors: Array<{ paymentHash: string; code: string; retryable: boolean }>;
}

class ReconciliationProcessingError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'ReconciliationProcessingError';
  }
}

function paymentHash(paymentId: string): string {
  return createHash('sha256').update(paymentId).digest('hex').slice(0, 16);
}

function errorDetails(error: unknown): { code: string; retryable: boolean } {
  if (error instanceof MercadoPagoStatusLookupError) {
    return { code: error.code, retryable: error.retryable };
  }
  if (error instanceof ReconciliationProcessingError) {
    return { code: error.code, retryable: true };
  }
  return { code: 'reconciliation_persistence_error', retryable: true };
}

function calculateNextReconciliationAt(attempt: number, technicalFailure: boolean): string {
  const safeAttempt = Math.max(1, attempt);
  const exponent = technicalFailure
    ? Math.min(safeAttempt - 1, 7)
    : Math.min(Math.floor((safeAttempt - 1) / 3), 7);
  const minutes = Math.min(5 * 2 ** exponent, MAX_BACKOFF_MINUTES);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

const TERMINAL_MANUAL_REVIEW_AT = '9999-12-31T23:59:59.999Z';

async function recordTechnicalFailure(
  result: PaymentReconciliationResult,
  candidate: PaymentRecord,
  error: unknown,
  stage: 'pending_lookup' | 'paid_recovery'
): Promise<void> {
  let details = errorDetails(error);
  const attempt = candidate.reconciliationAttemptCount || 1;
  const nextRetryAt = details.retryable
    ? calculateNextReconciliationAt(attempt, true)
    : TERMINAL_MANUAL_REVIEW_AT;

  try {
    const scheduled = await store.schedulePaymentReconciliationAsync(
      candidate,
      nextRetryAt,
      details.code
    );
    if (!scheduled) return;

    await store.addEvent(
      candidate.orderId,
      details.retryable
        ? 'payment_reconciliation_failed'
        : 'payment_reconciliation_manual_review',
      details.retryable
        ? 'Falha técnica durante a reconciliação automática do pagamento.'
        : 'Reconciliação interrompida por erro terminal e enviada para revisão manual.',
      {
        provider: candidate.provider,
        stage,
        code: details.code,
        retryable: details.retryable,
        attempt,
        nextRetryAt,
      }
    );
  } catch {
    details = { code: 'reconciliation_audit_error', retryable: true };
    const auditRetryAt = calculateNextReconciliationAt(attempt, true);
    try {
      await store.schedulePaymentReconciliationAsync(candidate, auditRetryAt, details.code);
    } catch {
      // The current run still reports the audit failure even if persistence remains unavailable.
    }
  }

  if (!details.retryable) {
    result.manualReview += 1;
    return;
  }

  result.failed += 1;
  result.errors.push({
    paymentHash: paymentHash(candidate.providerPaymentId),
    code: details.code,
    retryable: details.retryable,
  });
  console.error(
    `[PAYMENT RECONCILIATION ERROR] payment=${paymentHash(candidate.providerPaymentId)} code=${details.code}`
  );
}

/**
 * Recovers Mercado Pago state transitions whose webhook was missed or interrupted.
 * Claims, provider lookups and local transitions are idempotent across concurrent schedulers.
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

  // New pending sales get an independent budget before older interrupted paid transitions.
  const candidates = await store.claimPendingPaymentsForReconciliationAsync(
    'mercadopago',
    RECONCILIATION_BATCH_SIZE,
    new Date(Date.now() - MINIMUM_PAYMENT_AGE_MS),
    RECONCILIATION_LEASE_SECONDS
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
        if (processing.requiresManualReview) {
          result.manualReview += 1;
          continue;
        }
        if (!processing.success) {
          if (!processing.retryable) {
            result.manualReview += 1;
            continue;
          }
          throw new ReconciliationProcessingError(processing.code);
        }
        result.paid += 1;
        continue;
      }

      if (providerPayment.status === 'expired') {
        const expiredPayment = await store.tryMarkPaymentExpired(candidate);
        if (!expiredPayment) continue;

        try {
          const orderPayments = await store.getPaymentsByOrderIdAsync(candidate.orderId);
          const hasOtherActivePayment = orderPayments.some(
            (payment) =>
              payment.id !== candidate.id &&
              (payment.status === 'pending' || payment.status === 'paid')
          );
          const expiredOrder = hasOtherActivePayment
            ? undefined
            : await store.tryMarkOrderExpired(candidate.orderId);

          if (expiredOrder) {
            try {
              await store.addEvent(
                candidate.orderId,
                'payment_expired_reconciled',
                'Pagamento expirado durante a reconciliação automática.',
                { provider: candidate.provider, stage: 'pending_lookup' }
              );
            } catch {
              result.failed += 1;
              result.errors.push({
                paymentHash: paymentHash(candidate.providerPaymentId),
                code: 'reconciliation_audit_error',
                retryable: true,
              });
              console.error(
                `[PAYMENT RECONCILIATION ERROR] payment=${paymentHash(candidate.providerPaymentId)} code=reconciliation_audit_error`
              );
            }
          }
        } catch {
          result.failed += 1;
          result.errors.push({
            paymentHash: paymentHash(candidate.providerPaymentId),
            code: 'reconciliation_persistence_error',
            retryable: true,
          });
          console.error(
            `[PAYMENT RECONCILIATION ERROR] payment=${paymentHash(candidate.providerPaymentId)} code=reconciliation_persistence_error`
          );
        }
        result.expired += 1;
        continue;
      }

      const nextRetryAt = calculateNextReconciliationAt(
        candidate.reconciliationAttemptCount || 1,
        false
      );
      const scheduled = await store.schedulePaymentReconciliationAsync(candidate, nextRetryAt);
      if (scheduled) result.stillPending += 1;
    } catch (error) {
      await recordTechnicalFailure(result, candidate, error, 'pending_lookup');
    }
  }

  const paidCandidates = await store.claimPaidPaymentsForRecoveryAsync(
    'mercadopago',
    RECOVERY_BATCH_SIZE,
    RECONCILIATION_LEASE_SECONDS
  );
  for (const candidate of paidCandidates) {
    result.recoveryScanned += 1;
    try {
      const processing = await handleLateWebhookPayment(
        'mercadopago',
        candidate.providerPaymentId,
        candidate.amountCents,
        candidate.paidAt
      );
      if (processing.requiresManualReview) {
        result.manualReview += 1;
        continue;
      }
      if (!processing.success) {
        if (!processing.retryable) {
          result.manualReview += 1;
          continue;
        }
        throw new ReconciliationProcessingError(processing.code);
      }
      result.recovered += 1;
    } catch (error) {
      await recordTechnicalFailure(result, candidate, error, 'paid_recovery');
    }
  }

  return result;
}
