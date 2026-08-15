import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { authorizeAdminRequest } from '@/lib/internal-auth';

export async function GET(request: Request) {
  const auth = authorizeAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message },
      { status: auth.status }
    );
  }

  const orders = await store.listOrdersAsync();
  const detailedOrders = await Promise.all(
    orders.map(async (order) => ({
      order,
      payments: await store.getPaymentsByOrderIdAsync(order.id),
      items: await store.getFulfillmentItemsByOrderIdAsync(order.id),
    }))
  );

  return NextResponse.json({ orders: detailedOrders });
}
