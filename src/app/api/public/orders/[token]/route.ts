import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { updateOrderUrlAndRestartGate, handleLateWebhookPayment } from '@/lib/fulfillment-orchestrator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const order = await store.getOrderByPublicTokenAsync(token);

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }

  const payments = await store.getPaymentsByOrderIdAsync(order.id);
  const currentPayment = payments[payments.length - 1];
  const items = await store.getFulfillmentItemsByOrderIdAsync(order.id);
  const events = await store.getEventsByOrderIdAsync(order.id);

  // Return strictly sanitized data (no API keys, provider internal IDs, or raw cost rates)
  return NextResponse.json({
    publicToken: order.publicToken,
    packageName: order.packageSnapshot.name,
    amountCents: order.amountCents,
    postUrlCanonical: order.postUrlCanonical,
    contentType: order.contentType,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
    payment: currentPayment
      ? {
          qrCode: currentPayment.qrCode,
          qrCodeBase64: currentPayment.qrCodeBase64,
          status: currentPayment.status,
          expiresAt: currentPayment.expiresAt,
          paidAfterExpiration: currentPayment.paidAfterExpiration,
        }
      : null,
    items: items.map((i) => ({
      metric: i.metric,
      quantity: i.quantity,
      status: i.status,
      isGatekeeper: i.isGatekeeper,
    })),
    timeline: events.map((e) => ({
      type: e.type,
      message: e.message,
      createdAt: e.createdAt,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const order = await store.getOrderByPublicTokenAsync(token);

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const newUrl = body.newUrl;

    if (!newUrl || typeof newUrl !== 'string') {
      return NextResponse.json({ error: 'Insira a nova URL da publicação.' }, { status: 400 });
    }

    const result = await updateOrderUrlAndRestartGate(order.id, newUrl);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Dev Simulation Endpoint: Simulates Pix payment confirmation for easy testing
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Rota não encontrada.' }, { status: 404 });
  }

  const { token } = await params;
  const order = await store.getOrderByPublicTokenAsync(token);

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  }

  const payments = await store.getPaymentsByOrderIdAsync(order.id);
  const currentPayment = payments[payments.length - 1];

  if (!currentPayment) {
    return NextResponse.json({ error: 'Nenhum Pix gerado para este pedido.' }, { status: 400 });
  }

  const result = await handleLateWebhookPayment(
    currentPayment.provider,
    currentPayment.providerPaymentId,
    order.amountCents
  );
  return NextResponse.json(result);
}
