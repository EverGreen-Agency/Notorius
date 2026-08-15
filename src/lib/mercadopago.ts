import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Mercado Pago Pix Integration Client (Checkout Transparente)
 * Official API: POST https://api.mercadopago.com/v1/payments
 */

export interface CreatePixRequest {
  orderId: string;
  valueCents: number;
  webhookUrl: string;
  description?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface CreatePixResponse {
  id: string;
  qrCode: string;
  qrCodeBase64?: string;
  status: string;
  expiresAt: string;
  rawResponse: Record<string, unknown>;
}

export interface MercadoPagoWebhookPayload {
  action: string;
  paymentId: string;
  raw: Record<string, unknown>;
}

export interface MercadoPagoSignatureValidation {
  valid: boolean;
  reason?: string;
}

function getAccessToken(): string {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

function isMockCredential(token: string): boolean {
  return !token || token === 'mock_token' || token.includes('xxxxxxxx');
}

function assertMockAllowed(service: string): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${service} não configurado em produção; operação simulada foi bloqueada.`);
  }
}

/**
 * Creates a Pix payment charge on Mercado Pago with 15-minute expiration time and Idempotency key.
 */
export async function createMercadoPagoPix(req: CreatePixRequest): Promise<CreatePixResponse> {
  const token = getAccessToken();
  const expiresAtIso = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes standard expiration

  // Fallback to dev mode simulation if Access Token is omitted, mock, or contains placeholder xxxxxxxx
  if (!token || token === 'mock_token' || token.includes('xxxxxxxx')) {
    assertMockAllowed('MERCADOPAGO_ACCESS_TOKEN');
    console.warn('[MERCADOPAGO] Token de acesso não configurado ou utilizando credencial de exemplo. Ativando resposta simulada (Dev Mode).');
    const mockId = `mp_pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const mockCopiaECola = `00020126580014br.gov.bcb.pix0136${mockId}520400005303986540419.905802BR5908Notorius6009SAO PAULO62070503***6304MP12`;

    return {
      id: mockId,
      qrCode: mockCopiaECola,
      status: 'pending',
      expiresAt: expiresAtIso,
      rawResponse: {
        id: mockId,
        transaction_amount: req.valueCents / 100,
        status: 'pending',
        is_mock: true,
      },
    };
  }

  // Separate Customer Full Name into First and Last Name
  const nameParts = (req.customer.name || 'Cliente Notorius').trim().split(' ');
  const firstName = nameParts[0] || 'Cliente';
  const lastName = nameParts.slice(1).join(' ') || 'Notorius';

  const idempotencyKey = `pix_mp_${req.orderId}`;
  const amountFloat = Number((req.valueCents / 100).toFixed(2));

  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      transaction_amount: amountFloat,
      description: req.description || 'Pedido Notorius',
      external_reference: req.orderId,
      payment_method_id: 'pix',
      notification_url: req.webhookUrl,
      date_of_expiration: expiresAtIso,
      payer: {
        email: req.customer.email,
        first_name: firstName,
        last_name: lastName,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MERCADOPAGO API ERROR] Status ${response.status}:`, errorText);
    throw new Error(`Erro na API do Mercado Pago (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const transactionData = data.point_of_interaction?.transaction_data;

  return {
    id: String(data.id),
    qrCode: transactionData?.qr_code || data.qr_code || '',
    qrCodeBase64: transactionData?.qr_code_base64 || data.qr_code_base64,
    status: String(data.status || 'pending').toLowerCase(),
    expiresAt: data.date_of_expiration || expiresAtIso,
    rawResponse: data,
  };
}

/**
 * Performs Zero-Trust payment status verification directly against Mercado Pago Server API.
 */
export async function getMercadoPagoPixStatus(paymentId: string): Promise<{
  id: string;
  status: string;
  valueCents: number;
  paidAt?: string;
  rawResponse: Record<string, unknown>;
}> {
  const token = getAccessToken();

  if (isMockCredential(token)) {
    assertMockAllowed('MERCADOPAGO_ACCESS_TOKEN');
    return {
      id: paymentId,
      status: 'paid',
      valueCents: Number(process.env.MERCADOPAGO_MOCK_AMOUNT_CENTS || 990),
      rawResponse: { id: paymentId, status: 'approved', is_mock: true },
    };
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mercado Pago status lookup error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawStatus = String(data.status || '').toLowerCase();
  
  // Normalize Mercado Pago statuses to system statuses ('approved' -> 'paid')
  let normalizedStatus = rawStatus;
  if (rawStatus === 'approved') {
    normalizedStatus = 'paid';
  } else if (rawStatus === 'cancelled' || rawStatus === 'rejected') {
    normalizedStatus = 'expired';
  } else if (rawStatus === 'in_process' || rawStatus === 'pending') {
    normalizedStatus = 'pending';
  }

  const amountFloat = Number(data.transaction_amount || 0);
  const valueCents = Math.round(amountFloat * 100);

  return {
    id: String(data.id || paymentId),
    status: normalizedStatus,
    valueCents,
    paidAt: data.date_approved || undefined,
    rawResponse: data,
  };
}

/** Validates Mercado Pago's x-signature HMAC template. */
export function validateMercadoPagoWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): MercadoPagoSignatureValidation {
  const secret = (process.env.MERCADOPAGO_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return process.env.NODE_ENV === 'production'
      ? { valid: false, reason: 'MERCADOPAGO_WEBHOOK_SECRET não configurado.' }
      : { valid: true, reason: 'Validação ignorada fora de produção.' };
  }
  if (!params.xSignature || !params.xRequestId) {
    return { valid: false, reason: 'Headers x-signature ou x-request-id ausentes.' };
  }

  const parts = Object.fromEntries(
    params.xSignature.split(',').map((part) => {
      const [key, ...valueParts] = part.trim().split('=');
      return [key, valueParts.join('=')];
    })
  );
  const timestamp = parts.ts;
  const receivedSignature = parts.v1;
  if (!timestamp || !receivedSignature || !/^[a-f0-9]{64}$/i.test(receivedSignature)) {
    return { valid: false, reason: 'Formato do header x-signature inválido.' };
  }

  const normalizedDataId = params.dataId.toLowerCase();
  const template = `id:${normalizedDataId};request-id:${params.xRequestId};ts:${timestamp};`;
  const expectedSignature = createHmac('sha256', secret).update(template).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(receivedSignature, 'hex');
  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
    ? { valid: true }
    : { valid: false, reason: 'Assinatura do webhook inválida.' };
}

/**
 * Validates and extracts the payment ID from a Mercado Pago Webhook / IPN payload.
 */
export function validateMercadoPagoWebhook(payload: unknown): MercadoPagoWebhookPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const p = payload as Record<string, unknown>;
  const data = p.data as Record<string, unknown> | undefined;

  const paymentId = (
    data?.id ||
    p['data.id'] ||
    p.data_id ||
    p.id ||
    p.payment_id
  ) as string | number | undefined;

  if (!paymentId) {
    return null;
  }

  const action = String(p.action || p.type || 'payment.updated');

  return {
    action,
    paymentId: String(paymentId),
    raw: p,
  };
}
