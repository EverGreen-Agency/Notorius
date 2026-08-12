import { NextResponse } from 'next/server';
import { checkAndAlertNotoriusBalance } from '@/lib/fulfillment-orchestrator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('x-admin-key') || searchParams.get('key');
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'notorius_admin_2026';

  if (authHeader !== adminSecret) {
    return NextResponse.json(
      { error: 'Acesso negado. Chave de autorização inválida ou ausente.' },
      { status: 401 }
    );
  }

  try {
    const result = await checkAndAlertNotoriusBalance();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[CRON CHECK BALANCE ERROR]:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
