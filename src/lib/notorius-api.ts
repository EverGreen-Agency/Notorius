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
  if (
    msg.includes('socket timeout') ||
    msg.includes('econnaborted') ||
    msg.includes('etimedout') ||
    msg.includes('timeout') ||
    msg.includes('aborted')
  ) {
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

function getNotoriusConfig(): { apiKey: string; apiUrl: string; isMock: boolean } {
  const apiKey = (process.env.NOTORIUS_API_KEY || '').trim();
  const apiUrl = (process.env.NOTORIUS_API_URL || 'https://notorius.pro/api/v2')
    .trim()
    .replace(/\/$/, '');
  const isMock = !apiKey || apiKey === 'mock_key';

  if (process.env.NODE_ENV === 'production') {
    if (isMock) {
      throw new Error('NOTORIUS_API_KEY não configurada; resposta simulada bloqueada em produção.');
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(apiUrl);
    } catch {
      throw new Error('NOTORIUS_API_URL possui formato inválido.');
    }
    if (parsedUrl.protocol !== 'https:' || !parsedUrl.pathname.endsWith('/api/v2')) {
      throw new Error('NOTORIUS_API_URL deve ser uma URL HTTPS terminada em /api/v2.');
    }
  }

  return { apiKey, apiUrl, isMock };
}

export async function addNotoriusOrder(req: AddOrderRequest): Promise<AddOrderResponse> {
  let config: ReturnType<typeof getNotoriusConfig>;
  try {
    config = getNotoriusConfig();
  } catch (error) {
    return {
      status: 'error',
      errorType: 'definitive',
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  if (config.isMock) {
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
  params.append('key', config.apiKey);
  params.append('action', 'add');
  params.append('service', req.serviceId.toString());
  params.append('link', req.link);
  params.append('quantity', req.quantity.toString());

  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15_000),
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

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    return {
      status: 'error',
      errorType: 'ambiguous',
      errorMessage: 'A API Notorious respondeu sem JSON válido após receber o pedido.',
    };
  }

  if (data.error) {
    const errorMessage = String(data.error);
    const classified = classifyNotoriusError(response.status, errorMessage);
    return {
      status: 'error',
      errorType: classified,
      errorMessage,
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

export interface GetBalanceResult {
  success: boolean;
  balanceUSD?: number;
  currency?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export async function getNotoriusBalance(): Promise<GetBalanceResult> {
  let config: ReturnType<typeof getNotoriusConfig>;
  try {
    config = getNotoriusConfig();
  } catch (error) {
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  if (config.isMock) {
    return {
      success: true,
      balanceUSD: 25.50,
      currency: 'USD',
      rawResponse: { balance: '25.50', currency: 'USD', is_mock: true },
    };
  }

  const params = new URLSearchParams();
  params.append('key', config.apiKey);
  params.append('action', 'balance');

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        errorMessage: `HTTP ${response.status}: ${text}`,
      };
    }

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        errorMessage: data.error,
        rawResponse: data,
      };
    }

    if (data.balance !== undefined) {
      const parsedBalance = parseFloat(String(data.balance));
      return {
        success: true,
        balanceUSD: isNaN(parsedBalance) ? 0 : parsedBalance,
        currency: data.currency || 'USD',
        rawResponse: data,
      };
    }

    return {
      success: false,
      errorMessage: 'Campo balance ausente no retorno da API Notorius.',
      rawResponse: data,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      errorMessage: `Falha na conexão com a API Notorius: ${errorMsg}`,
    };
  }
}

