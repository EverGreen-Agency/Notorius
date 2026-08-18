import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  validateMercadoPagoWebhook,
  validateMercadoPagoWebhookSignature,
  getMercadoPagoPixStatus,
  MercadoPagoStatusLookupError,
} from '@/lib/mercadopago';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';
import { store, type IntegrationRunStatus } from '@/lib/store';

export const runtime = 'nodejs';

function correlationHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function webhookErrorCode(error: unknown): string {
  return error instanceof MercadoPagoStatusLookupError
    ? error.code
    : 'webhook_processing_failed';
}

async function finishWebhookRun(
  runId: string,
  status: IntegrationRunStatus,
  counters: Record<string, number>,
  errorCodes: string[]
): Promise<void> {
  await store.finishIntegrationRun(runId, status, counters, errorCodes);
}

export async function POST(request: Request) {
  let integrationRunId: string | undefined;

  try {
    const url = new URL(request.url);
    let rawBody: unknown = {};
    try {
      rawBody = await request.json();
    } catch {
      rawBody = {};
    }

    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    const combinedPayload =
      typeof rawBody === 'object' && rawBody !== null
        ? { ...(rawBody as Record<string, unknown>), ...queryParams }
        : queryParams;
    const webhook = validateMercadoPagoWebhook(combinedPayload);

    if (!webhook) {
      return NextResponse.json({ success: true, message: 'Notificação sem pagamento ignorada.' });
    }

    const signedDataId =
      url.searchParams.get('data.id') ||
      url.searchParams.get('data_id') ||
      webhook.paymentId;
    const signature = validateMercadoPagoWebhookSignature({
      xSignature: request.headers.get('x-signature'),
      xRequestId: request.headers.get('x-request-id'),
      dataId: signedDataId,
    });
    if (!signature.valid) {
      console.warn('[MERCADOPAGO WEBHOOK SIGNATURE REJECTED]:', signature.reason);
      return NextResponse.json(
        { success: false, error: 'Assinatura do webhook inválida.' },
        { status: 401 }
      );
    }

    const candidateRunId = `irun_${randomUUID()}`;
    await store.createIntegrationRun({
      id: candidateRunId,
      trigger: 'mercadopago_webhook',
      status: 'running',
      correlationHash: correlationHash(webhook.paymentId),
      counters: {},
      errorCodes: [],
      startedAt: new Date().toISOString(),
    });
    integrationRunId = candidateRunId;

    const verifiedPayment = await getMercadoPagoPixStatus(webhook.paymentId);
    if (verifiedPayment.status !== 'paid') {
      await finishWebhookRun(integrationRunId, 'ignored', { verified: 1, paid: 0 }, []);
      return NextResponse.json({
        success: true,
        message: `Pagamento verificado com status ${verifiedPayment.status}.`,
      });
    }

    const result = await handleLateWebhookPayment(
      'mercadopago',
      verifiedPayment.id,
      verifiedPayment.valueCents,
      verifiedPayment.paidAt
    );
    const status: IntegrationRunStatus = result.requiresManualReview
      ? 'manual_review'
      : result.success
        ? 'succeeded'
        : 'partial_failure';
    await finishWebhookRun(
      integrationRunId,
      status,
      {
        verified: 1,
        paid: 1,
        processed: result.success ? 1 : 0,
        manualReview: result.requiresManualReview ? 1 : 0,
      },
      result.success && !result.requiresManualReview ? [] : [result.code]
    );
    return NextResponse.json(result, { status: result.retryable ? 503 : 200 });
  } catch (error: unknown) {
    const code = webhookErrorCode(error);
    console.error('[MERCADOPAGO WEBHOOK ERROR]:', code);
    if (integrationRunId) {
      try {
        await finishWebhookRun(integrationRunId, 'partial_failure', {}, [code]);
      } catch {
        console.error('[MERCADOPAGO WEBHOOK AUDIT ERROR]: integration_audit_failed');
      }
    }
    return NextResponse.json(
      { success: false, error: 'Falha técnica ao processar webhook.', code },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
