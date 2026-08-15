import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPackageBySlug, getOrderBumpById } from '@/lib/packages-catalog';
import { parseInstagramUrl } from '@/lib/url-parser';
import { store, OrderRecord, PaymentRecord } from '@/lib/store';
import { createMercadoPagoPix } from '@/lib/mercadopago';

const checkoutSchema = z.object({
  packageSlug: z.string().min(1, 'Selecione um pacote.'),
  postUrl: z.string().min(1, 'Insira a URL da publicação.'),
  orderBumpIds: z.array(z.string()).optional(),
  customer: z.object({
    name: z.string().min(2, 'Informe seu nome completo.'),
    email: z.string().email('E-mail inválido.'),
    phone: z.string().min(10, 'WhatsApp inválido.'),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsedData = checkoutSchema.parse(body);

    const pkg = getPackageBySlug(parsedData.packageSlug);
    if (!pkg) {
      return NextResponse.json({ error: 'Pacote selecionado inválido ou inativo.' }, { status: 400 });
    }

    const parsedUrl = parseInstagramUrl(parsedData.postUrl);
    if (!parsedUrl.isValid || !parsedUrl.canonicalUrl) {
      return NextResponse.json({ error: parsedUrl.errorMessage || 'URL do Instagram inválida.' }, { status: 400 });
    }

    // Calculate total amount with Order Bumps
    const bumpIds = parsedData.orderBumpIds || [];
    let bumpsTotalCents = 0;
    const selectedBumpsInfo = [];

    for (const bId of bumpIds) {
      const bump = getOrderBumpById(bId);
      if (bump) {
        bumpsTotalCents += bump.priceCents;
        selectedBumpsInfo.push(bump.name);
      }
    }

    const totalAmountCents = pkg.priceCents + bumpsTotalCents;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const publicToken = `ord_pub_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;

    const orderRecord: OrderRecord = {
      id: orderId,
      publicToken,
      customerName: parsedData.customer.name,
      customerEmail: parsedData.customer.email,
      customerPhone: parsedData.customer.phone,
      packageSlug: pkg.slug,
      packageSnapshot: pkg,
      postUrlOriginal: parsedData.postUrl,
      postUrlCanonical: parsedUrl.canonicalUrl,
      contentType: parsedUrl.contentType || 'reel',
      amountCents: totalAmountCents,
      currency: pkg.currency,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.createOrder(orderRecord);
    await store.addEvent(
      orderId,
      'order_created',
      `Pedido gerado para ${pkg.name} com ${selectedBumpsInfo.length} order bump(s). Total: R$ ${(totalAmountCents / 100).toFixed(2)}.`
    );

    // Host URL for webhook callback (prioritizes production environment variable NEXT_PUBLIC_SITE_URL)
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookEndpoint = new URL('/api/webhooks/mercadopago', origin);
    webhookEndpoint.searchParams.set('source_news', 'webhooks');
    const webhookUrl = webhookEndpoint.toString();

    // Generate Pix via Mercado Pago for total amount (15 min expiration)
    let pixResponse: Awaited<ReturnType<typeof createMercadoPagoPix>>;
    try {
      pixResponse = await createMercadoPagoPix({
        orderId,
        valueCents: totalAmountCents,
        webhookUrl,
        description: `Notorius - ${pkg.name}`,
        customer: {
          name: parsedData.customer.name,
          email: parsedData.customer.email,
          phone: parsedData.customer.phone,
        },
      });
    } catch (paymentError) {
      await store.updateOrder(orderId, { paymentStatus: 'failed' });
      await store.addEvent(
        orderId,
        'payment_creation_failed',
        paymentError instanceof Error ? paymentError.message : String(paymentError)
      );
      throw paymentError;
    }

    const paymentRecord: PaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      provider: 'mercadopago',
      providerPaymentId: pixResponse.id,
      amountCents: totalAmountCents,
      qrCode: pixResponse.qrCode,
      qrCodeBase64: pixResponse.qrCodeBase64,
      status: 'pending',
      expiresAt: pixResponse.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await store.createPayment(paymentRecord);
    await store.addEvent(
      orderId,
      'pix_generated',
      `Cobrança Pix de R$ ${(totalAmountCents / 100).toFixed(2)} gerada no Mercado Pago (#${pixResponse.id}).`
    );

    return NextResponse.json({
      success: true,
      orderToken: publicToken,
      paymentUrl: `/pedido/${publicToken}/pagamento`,
      amountCents: totalAmountCents,
      qrCode: pixResponse.qrCode,
      expiresAt: paymentRecord.expiresAt,
    });
  } catch (error: unknown) {
    console.error('[CHECKOUT API ERROR]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

