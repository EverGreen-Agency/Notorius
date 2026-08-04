import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
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
