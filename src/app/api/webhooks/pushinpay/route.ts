import { NextResponse } from 'next/server';
import { validatePushinPayWebhook } from '@/lib/pushinpay';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validatedPayload = validatePushinPayWebhook(rawBody);

    if (!validatedPayload) {
      return NextResponse.json({ error: 'Payload de webhook inválido.' }, { status: 400 });
    }

    if (validatedPayload.status === 'paid' || validatedPayload.status === 'approved') {
      const result = await handleLateWebhookPayment(validatedPayload.id, validatedPayload.value);
      return NextResponse.json({ success: result.success, message: result.message });
    }

    return NextResponse.json({ success: true, message: 'Evento recebido.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
