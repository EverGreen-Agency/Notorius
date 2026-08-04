/**
 * Pushin Pay Pix Integration Client
 * Documented API: POST https://api.pushinpay.com.br/api/pix/cashIn
 */

export interface CreatePixRequest {
  valueCents: number;
  webhookUrl: string;
}

export interface CreatePixResponse {
  id: string;
  qrCode: string;
  qrCodeBase64?: string;
  status: string;
  expiresAt?: string;
  rawResponse: Record<string, unknown>;
}

export interface PushinPayWebhookPayload {
  id: string;
  value: number; // in cents
  status: string; // e.g. "paid", "expired", "failed"
  created_at?: string;
  paid_at?: string;
  signature?: string;
  [key: string]: unknown;
}

export async function createPushinPayPix(req: CreatePixRequest): Promise<CreatePixResponse> {
  const token = process.env.PUSHINPAY_TOKEN;
  
  // Simulated / Fallback behavior in dev environment if token is missing
  if (!token || token === 'mock_token') {
    const mockId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins
    const mockCopiaECola = `00020126580014br.gov.bcb.pix0136${mockId}520400005303986540419.905802BR5908Notorius6009SAO PAULO62070503***6304A1B2`;

    return {
      id: mockId,
      qrCode: mockCopiaECola,
      status: 'pending',
      expiresAt,
      rawResponse: {
        id: mockId,
        value: req.valueCents,
        webhook_url: req.webhookUrl,
        status: 'pending',
        is_mock: true,
      },
    };
  }

  const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: req.valueCents,
      webhook_url: req.webhookUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pushin Pay API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    id: data.id || data.payment_id || data.transaction_id,
    qrCode: data.qr_code || data.pix_copia_e_cola || data.emv,
    qrCodeBase64: data.qr_code_base64 || data.image_base64,
    status: data.status || 'pending',
    expiresAt: data.expires_at || data.expiration_date,
    rawResponse: data,
  };
}

export function validatePushinPayWebhook(payload: unknown): PushinPayWebhookPayload | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const p = payload as Record<string, unknown>;
  const id = (p.id || p.provider_payment_id || p.transaction_id) as string;
  const value = Number(p.value || p.value_cents || p.amount || 0);
  const status = String(p.status || p.payment_status || '').toLowerCase();

  if (!id || !status) {
    return null;
  }

  return {
    id,
    value,
    status,
    created_at: p.created_at as string | undefined,
    paid_at: p.paid_at as string | undefined,
    raw: p,
  };
}
