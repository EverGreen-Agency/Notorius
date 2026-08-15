import { NextResponse } from 'next/server';
import {
  validateMercadoPagoWebhook,
  validateMercadoPagoWebhookSignature,
  getMercadoPagoPixStatus,
} from '@/lib/mercadopago';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

export const runtime = 'nodejs';

export async function POST(request: Request) {
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

    const verifiedPayment = await getMercadoPagoPixStatus(webhook.paymentId);
    if (verifiedPayment.status !== 'paid') {
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
    return NextResponse.json(result, { status: result.retryable ? 503 : 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[MERCADOPAGO WEBHOOK ERROR]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
