/**
 * Notorius SMM API Client Adapter
 * API Endpoint: POST https://notorius.pro/api/v2 (application/x-www-form-urlencoded)
 */

export interface AddOrderRequest {
  serviceId: number;
  link: string;
  quantity: number;
}

export interface AddOrderSuccessResult {
  status: 'success';
  providerOrderId: number;
  rawResponse: Record<string, unknown>;
}

export type ErrorType = 'transient' | 'definitive' | 'ambiguous';

export interface AddOrderErrorResult {
  status: 'error';
  errorType: ErrorType;
  errorMessage: string;
  rawResponse?: Record<string, unknown>;
}

export type AddOrderResponse = AddOrderSuccessResult | AddOrderErrorResult;

export interface BatchStatusResult {
  [orderId: string]: {
    charge?: string;
    start_count?: string;
    status?: string;
    remains?: string;
    currency?: string;
    error?: string;
  };
}

export function classifyNotoriusError(statusCode: number, errorMessage: string): ErrorType {
  const msg = errorMessage.toLowerCase();

  // Ambiguous timeouts or network disconnects
  if (msg.includes('socket timeout') || msg.includes('econnaborted') || msg.includes('etimedout')) {
    return 'ambiguous';
  }

  // Transient HTTP statuses or rate limits
  if (
    statusCode === 429 ||
    statusCode >= 500 ||
    msg.includes('too many requests') ||
    msg.includes('server busy') ||
    msg.includes('service temporarily unavailable') ||
    msg.includes('maintenance')
  ) {
    return 'transient';
  }

  // Definitive / Operational errors
  if (
    statusCode === 400 ||
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 404 ||
    msg.includes('invalid service') ||
    msg.includes('invalid link') ||
    msg.includes('invalid_post_type_for_service') ||
    msg.includes('not enough balance') ||
    msg.includes('quantity') ||
    msg.includes('disabled')
  ) {
    return 'definitive';
  }

  // Default to transient for unclassified 5xx-like errors, or definitive for 4xx
  return statusCode >= 500 ? 'transient' : 'definitive';
}

export async function addNotoriusOrder(req: AddOrderRequest): Promise<AddOrderResponse> {
  const apiKey = process.env.NOTORIUS_API_KEY;

  // Mock implementation if API key is not configured in dev
  if (!apiKey || apiKey === 'mock_key') {
    // Simulate rare error for testing: if serviceId is 999, simulate transient error
    if (req.serviceId === 999) {
      return {
        status: 'error',
        errorType: 'transient',
        errorMessage: 'Simulated 503 Provider Maintenance',
      };
    }

    const mockOrderId = Math.floor(100000 + Math.random() * 900000);
    return {
      status: 'success',
      providerOrderId: mockOrderId,
      rawResponse: { order: mockOrderId, is_mock: true },
    };
  }

  const params = new URLSearchParams();
  params.append('key', apiKey);
  params.append('action', 'add');
  params.append('service', req.serviceId.toString());
  params.append('link', req.link);
  params.append('quantity', req.quantity.toString());

  let response: Response;
  try {
    response = await fetch('https://notorius.pro/api/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const classified = classifyNotoriusError(0, errorMsg);
    return {
      status: 'error',
      errorType: classified,
      errorMessage: `Network error: ${errorMsg}`,
    };
  }

  if (!response.ok) {
    const text = await response.text();
    const classified = classifyNotoriusError(response.status, text);
    return {
      status: 'error',
      errorType: classified,
      errorMessage: `Notorius API HTTP ${response.status}: ${text}`,
    };
  }

  const data = await response.json();

  if (data.error) {
    const classified = classifyNotoriusError(response.status, data.error);
    return {
      status: 'error',
      errorType: classified,
      errorMessage: data.error,
      rawResponse: data,
    };
  }

  if (data.order) {
    return {
      status: 'success',
      providerOrderId: Number(data.order),
      rawResponse: data,
    };
  }

  return {
    status: 'error',
    errorType: 'definitive',
    errorMessage: 'Formato de resposta inesperado da API Notorius.',
    rawResponse: data,
  };
}
