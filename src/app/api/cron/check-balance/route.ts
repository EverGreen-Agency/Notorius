import { NextResponse } from 'next/server';
import { checkAndAlertNotoriusBalance } from '@/lib/fulfillment-orchestrator';
import { authorizeCronRequest } from '@/lib/internal-auth';

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
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
