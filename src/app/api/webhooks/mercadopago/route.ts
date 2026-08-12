import { NextResponse } from 'next/server';
import { validateMercadoPagoWebhook, getMercadoPagoPixStatus } from '@/lib/mercadopago';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let rawBody: unknown = {};

    try {
      rawBody = await request.json();
    } catch {
      // Body might be empty in IPN notifications with query params
      rawBody = {};
    }

    // Combine payload body with URL query parameters for full compatibility
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const combinedPayload = typeof rawBody === 'object' && rawBody !== null
      ? { ...(rawBody as Record<string, unknown>), ...queryParams }
      : queryParams;

    const validatedWebhook = validateMercadoPagoWebhook(combinedPayload);

    if (!validatedWebhook || !validatedWebhook.paymentId) {
      return NextResponse.json({ success: true, message: 'Notificação recebida sem ID de pagamento relevante.' });
    }

    // Zero-Trust Security Verification: Consult Mercado Pago API directly
    // This prevents Webhook Forgery & Payload Spoofing (OWASP A04:2021)
    const verifiedData = await getMercadoPagoPixStatus(validatedWebhook.paymentId);

    if (verifiedData.status === 'paid') {
      const result = await handleLateWebhookPayment(verifiedData.id, verifiedData.valueCents);
      return NextResponse.json({ success: result.success, message: result.message });
    }

    return NextResponse.json({ success: true, message: `Evento verificado com status: ${verifiedData.status}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Support Mercado Pago IPN validation check
  return POST(request);
}
