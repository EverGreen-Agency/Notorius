import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('x-admin-key') || searchParams.get('key');
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'notorius_admin_2026';

  if (authHeader !== adminSecret) {
    return NextResponse.json(
      { error: 'Acesso negado. Chave administrativa inválida ou ausente.' },
      { status: 401 }
    );
  }

  const orders = store.listOrders();
  const detailedOrders = orders.map((order) => {
    const payments = store.getPaymentsByOrderId(order.id);
    const items = store.getFulfillmentItemsByOrderId(order.id);
    return {
      order,
      payments,
      items,
    };
  });

  return NextResponse.json({ orders: detailedOrders });
}
