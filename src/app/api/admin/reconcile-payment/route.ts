import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeAdminRequest } from '@/lib/internal-auth';
import { getMercadoPagoPixStatus } from '@/lib/mercadopago';
import { handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

const reconciliationSchema = z.object({
  paymentId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const auth = authorizeAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  }

  try {
    const { paymentId } = reconciliationSchema.parse(await request.json());
    const payment = await getMercadoPagoPixStatus(paymentId);
    if (payment.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: `Pagamento está com status ${payment.status}.` },
        { status: 409 }
      );
    }

    const result = await handleLateWebhookPayment(
      'mercadopago',
      payment.id,
      payment.valueCents,
      payment.paidAt
    );
    return NextResponse.json(result, { status: result.retryable ? 503 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'paymentId inválido.' }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[PAYMENT RECONCILIATION ERROR]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
