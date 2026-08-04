import { NextResponse } from 'next/server';
import { validatePushinPayWebhook, getPushinPayPixStatus } from '@/lib/pushinpay';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validatedPayload = validatePushinPayWebhook(rawBody);

    if (!validatedPayload) {
      return NextResponse.json({ error: 'Payload de webhook inválido.' }, { status: 400 });
    }

    // Zero-Trust Security Verification: Consult Pushin Pay server API directly
    // This prevents Webhook Forgery & Payload Spoofing (OWASP A04:2021)
    const verifiedData = await getPushinPayPixStatus(validatedPayload.id);

    if (verifiedData.status === 'paid' || verifiedData.status === 'approved') {
      const result = await handleLateWebhookPayment(verifiedData.id, verifiedData.valueCents);
      return NextResponse.json({ success: result.success, message: result.message });
    }

    return NextResponse.json({ success: true, message: 'Evento de webhook verificado.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
