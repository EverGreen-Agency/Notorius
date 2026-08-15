import { NextResponse } from 'next/server';
import { processDueFulfillmentRetries } from '@/lib/fulfillment-orchestrator';
import { authorizeCronRequest } from '@/lib/internal-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = authorizeCronRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
  }

  try {
    const result = await processDueFulfillmentRetries();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[FULFILLMENT RETRY CRON ERROR]:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
