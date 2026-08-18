import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { processDueFulfillmentRetries } from '@/lib/fulfillment-orchestrator';
import {
  reconcilePendingMercadoPagoPayments,
  type PaymentReconciliationResult,
} from '@/lib/payment-reconciliation';
import { authorizeCronRequest } from '@/lib/internal-auth';
import { store, type IntegrationRunStatus } from '@/lib/store';

export const runtime = 'nodejs';

type CronComponent = 'integration_audit' | 'payment_reconciliation' | 'fulfillment_retries';
type CronError = { component: CronComponent; code: string; count?: number };

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  }

  const errors: CronError[] = [];
  const runId = `irun_${randomUUID()}`;
  let auditStarted = false;
  let paymentReconciliation:
    | PaymentReconciliationResult
    | { success: false; code: string };
  let fulfillmentRetries:
    | { queued: number; processed: number }
    | { success: false; code: string };

  try {
    await store.createIntegrationRun({
      id: runId,
      trigger: 'cron_payment_recovery',
      status: 'running',
      counters: {},
      errorCodes: [],
      startedAt: new Date().toISOString(),
    });
    auditStarted = true;
  } catch {
    errors.push({ component: 'integration_audit', code: 'audit_start_failed' });
    console.error('[PAYMENT RECOVERY CRON ERROR]: audit_start_failed');
  }

  try {
    paymentReconciliation = await reconcilePendingMercadoPagoPayments();
    if (paymentReconciliation.failed > 0) {
      errors.push({
        component: 'payment_reconciliation',
        code: 'payment_items_failed',
        count: paymentReconciliation.failed,
      });
    }
  } catch {
    errors.push({
      component: 'payment_reconciliation',
      code: 'payment_reconciliation_failed',
    });
    paymentReconciliation = {
      success: false,
      code: 'payment_reconciliation_failed',
    };
    console.error('[PAYMENT RECONCILIATION CRON ERROR]: payment_reconciliation_failed');
  }

  try {
    const result = await processDueFulfillmentRetries();
    fulfillmentRetries = { queued: result.orderIds.length, processed: result.processed };
  } catch {
    errors.push({ component: 'fulfillment_retries', code: 'fulfillment_retries_failed' });
    fulfillmentRetries = { success: false, code: 'fulfillment_retries_failed' };
    console.error('[FULFILLMENT RETRY CRON ERROR]: fulfillment_retries_failed');
  }

  const paymentCounters: Record<string, number> = {};
  let manualReviewCount = 0;
  if ('checked' in paymentReconciliation) {
    manualReviewCount = paymentReconciliation.manualReview;
    Object.assign(paymentCounters, {
      paymentsChecked: paymentReconciliation.checked,
      recoveryScanned: paymentReconciliation.recoveryScanned,
      recovered: paymentReconciliation.recovered,
      paid: paymentReconciliation.paid,
      expired: paymentReconciliation.expired,
      stillPending: paymentReconciliation.stillPending,
      manualReview: paymentReconciliation.manualReview,
      paymentFailures: paymentReconciliation.failed,
    });
  }

  const fulfillmentCounters: Record<string, number> = {};
  if ('processed' in fulfillmentRetries) {
    Object.assign(fulfillmentCounters, {
      fulfillmentQueued: fulfillmentRetries.queued,
      fulfillmentProcessed: fulfillmentRetries.processed,
    });
  }

  if (auditStarted) {
    const status: IntegrationRunStatus =
      errors.length > 0
        ? 'partial_failure'
        : manualReviewCount > 0
          ? 'manual_review'
          : 'succeeded';
    try {
      await store.finishIntegrationRun(
        runId,
        status,
        { ...paymentCounters, ...fulfillmentCounters },
        errors.map((error) => error.code)
      );
    } catch {
      errors.push({ component: 'integration_audit', code: 'audit_finish_failed' });
      console.error('[PAYMENT RECOVERY CRON ERROR]: audit_finish_failed');
    }
  }

  return NextResponse.json(
    {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      paymentReconciliation,
      fulfillmentRetries,
      errors,
    },
    { status: errors.length === 0 ? 200 : 500 }
  );
}
