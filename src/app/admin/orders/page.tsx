'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  DollarSign,
  Package,
} from 'lucide-react';
import { OrderRecord, FulfillmentItemRecord, PaymentRecord } from '@/lib/store';

interface DetailedAdminOrder {
  order: OrderRecord;
  payments: PaymentRecord[];
  items: FulfillmentItemRecord[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<DetailedAdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFulfillment, setFilterFulfillment] = useState<string>('all');

  const [adminKey, setAdminKey] = useState<string>('');

  const fetchAdminOrders = async () => {
    setIsLoading(true);
    try {
      const keyToUse = adminKey || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('key') || '' : '');
      const res = await fetch('/api/admin/orders', {
        headers: {
          'x-admin-key': keyToUse,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders();
  }, []);

  // Filter logic
  const filteredOrders = orders.filter(({ order }) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.publicToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.postUrlCanonical.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFulfillment =
      filterFulfillment === 'all' || order.fulfillmentStatus === filterFulfillment;

    return matchesSearch && matchesFulfillment;
  });

  // Calculate metrics
  const totalRevenueCents = orders
    .filter(({ order }) => order.paymentStatus === 'paid')
    .reduce((acc, { order }) => acc + order.amountCents, 0);

  const pendingPaymentsCount = orders.filter(({ order }) => order.paymentStatus === 'pending').length;
  const inProgressCount = orders.filter(({ order }) => order.fulfillmentStatus === 'in_progress').length;
  const awaitingCustomerCount = orders.filter(({ order }) => order.fulfillmentStatus === 'awaiting_customer_action').length;
  const failedCount = orders.filter(({ order }) => order.fulfillmentStatus === 'partially_failed' || order.fulfillmentStatus === 'awaiting_review').length;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--signal-primary)] text-[#080a0d] font-bold flex items-center justify-center text-sm">
                N
              </div>
              <h1 className="text-2xl font-black tracking-tight">Painel Operacional — Notorius Admin</h1>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Monitoramento de pagamentos Pix, Compatibility Gate e orquestração de fulfillment.
            </p>
          </div>

          <button
            onClick={fetchAdminOrders}
            className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-white hover:border-white/20 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>
        </div>

        {/* Dashboard Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-card p-4 rounded-xl space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[var(--signal-primary)]" />
              <span>Receita Aprovada</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              R$ {(totalRevenueCents / 100).toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pix Pendentes</span>
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">{pendingPaymentsCount}</div>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-[var(--signal-primary)]" />
              <span>Em Andamento</span>
            </div>
            <div className="text-2xl font-black text-[var(--signal-primary)] font-mono">{inProgressCount}</div>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Aguardando Reel</span>
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono">{awaitingCustomerCount}</div>
          </div>

          <div className="glass-card p-4 rounded-xl space-y-1">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Retidos / Falhas</span>
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">{failedCount}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="glass-panel p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, e-mail ou URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--signal-primary)]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-mono text-[var(--text-muted)] shrink-0">Filtro:</span>
            <select
              value={filterFulfillment}
              onChange={(e) => setFilterFulfillment(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-white focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="in_progress">Em Andamento</option>
              <option value="awaiting_customer_action">Aguardando Troca de Reel</option>
              <option value="partially_submitted">Fila de Retry</option>
              <option value="awaiting_review">Revisão Manual (Timeout)</option>
              <option value="partially_failed">Falha Parcial</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="glass-panel rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] font-mono text-[var(--text-muted)] uppercase">
                <tr>
                  <th className="p-4">Pedido / Cliente</th>
                  <th className="p-4">Pacote</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4">Fulfillment Status</th>
                  <th className="p-4">Itens Técnicos</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                      Nenhum pedido encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(({ order, payments, items }) => {
                    const lastPayment = payments[payments.length - 1];

                    return (
                      <tr key={order.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                        
                        {/* Customer */}
                        <td className="p-4">
                          <div className="font-bold text-white">{order.customerName}</div>
                          <div className="text-[11px] text-[var(--text-secondary)]">{order.customerEmail}</div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">{order.publicToken}</div>
                        </td>

                        {/* Package */}
                        <td className="p-4">
                          <div className="font-bold text-white">{order.packageSnapshot.name}</div>
                          <div className="text-[11px] font-mono text-[var(--signal-primary)]">
                            R$ {(order.amountCents / 100).toFixed(2).replace('.', ',')}
                          </div>
                        </td>

                        {/* Payment */}
                        <td className="p-4">
                          {order.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold font-mono text-[10px]">
                              <CheckCircle className="w-3 h-3" />
                              PAGO {lastPayment?.paidAfterExpiration && '(TARDIO)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px]">
                              <Clock className="w-3 h-3" />
                              PENDENTE
                            </span>
                          )}
                        </td>

                        {/* Fulfillment */}
                        <td className="p-4">
                          <div className="font-mono font-bold text-white uppercase text-[11px]">
                            {order.fulfillmentStatus}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                            {order.postUrlCanonical}
                          </div>
                        </td>

                        {/* Sub-items Status */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {items.map((item, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                  item.status === 'submitted' || item.status === 'completed'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : item.status === 'blocked_incompatible_content'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : item.status === 'retry_scheduled'
                                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                                }`}
                              >
                                {item.metric}: {item.status}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-right">
                          <Link
                            href={`/pedido/${order.publicToken}/pagamento`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[var(--signal-primary)] hover:underline text-xs font-semibold"
                          >
                            <span>Ver Tela</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
