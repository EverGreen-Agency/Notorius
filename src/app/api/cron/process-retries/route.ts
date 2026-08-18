import { NextResponse } from 'next/server';
import { processDueFulfillmentRetries } from '@/lib/fulfillment-orchestrator';
import { reconcilePendingMercadoPagoPayments } from '@/lib/payment-reconciliation';
import { authorizeCronRequest } from '@/lib/internal-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  }

  const errors: string[] = [];
  let paymentReconciliation: unknown;
  let fulfillmentRetries: unknown;

  try {
    paymentReconciliation = await reconcilePendingMercadoPagoPayments();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`payment_reconciliation: ${message}`);
    paymentReconciliation = { success: false, error: message };
    console.error('[PAYMENT RECONCILIATION CRON ERROR]:', message);
  }

  try {
    fulfillmentRetries = await processDueFulfillmentRetries();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`fulfillment_retries: ${message}`);
    fulfillmentRetries = { success: false, error: message };
    console.error('[FULFILLMENT RETRY CRON ERROR]:', message);
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
