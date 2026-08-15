export interface InternalAuthResult {
  authorized: boolean;
  status: number;
  message: string;
}

function safeSecret(value: string | undefined): string {
  return (value || '').trim();
}

export function authorizeAdminRequest(request: Request): InternalAuthResult {
  const secret = safeSecret(process.env.ADMIN_SECRET_KEY);
  if (!secret) {
    return {
      authorized: false,
      status: 503,
      message: 'ADMIN_SECRET_KEY não configurada no servidor.',
    };
  }

  const url = new URL(request.url);
  const provided = request.headers.get('x-admin-key') || url.searchParams.get('key') || '';
  return provided === secret
    ? { authorized: true, status: 200, message: 'Autorizado.' }
    : { authorized: false, status: 401, message: 'Chave administrativa inválida.' };
}

export function authorizeCronRequest(request: Request): InternalAuthResult {
  const secret = safeSecret(process.env.CRON_SECRET);
  if (!secret) {
    return {
      authorized: false,
      status: 503,
      message: 'CRON_SECRET não configurado no servidor.',
    };
  }

  return request.headers.get('authorization') === `Bearer ${secret}`
    ? { authorized: true, status: 200, message: 'Autorizado.' }
    : { authorized: false, status: 401, message: 'Autorização do cron inválida.' };
}
