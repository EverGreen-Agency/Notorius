'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Clock,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  MessageCircle,
  PlayCircle,
  CheckCircle2,
} from 'lucide-react';
import { BrandLockup } from '@/components/brand/BrandLockup';

interface PublicOrderData {
  publicToken: string;
  packageName: string;
  amountCents: number;
  postUrlCanonical: string;
  contentType: 'reel' | 'post';
  paymentStatus: 'pending' | 'paid' | 'expired' | 'failed' | 'manual_review';
  fulfillmentStatus: string;
  payment?: {
    qrCode: string;
    qrCodeBase64?: string;
    status: string;
    expiresAt: string;
    paidAfterExpiration?: boolean;
  };
  items: Array<{
    metric: string;
    quantity: number;
    status: string;
    isGatekeeper: boolean;
  }>;
  timeline: Array<{
    type: string;
    message: string;
    createdAt: string;
  }>;
}

export default function OrderPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [orderData, setOrderData] = useState<PublicOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newReelUrl, setNewReelUrl] = useState('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Poll for status update every 3 seconds
  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/public/orders/${token}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOrderData(data);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  const handleCopyPix = () => {
    if (!orderData?.payment?.qrCode) return;
    navigator.clipboard.writeText(orderData.payment.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUpdateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelUrl.trim()) return;

    setIsUpdatingUrl(true);
    setUpdateMessage(null);

    try {
      const res = await fetch(`/api/public/orders/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUrl: newReelUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar a URL.');
      }

      setUpdateMessage('URL atualizada com sucesso! O processamento foi reiniciado.');
      setNewReelUrl('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUpdateMessage(msg);
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulatingPayment(true);
    try {
      await fetch(`/api/public/orders/${token}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--navy-950)] flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--sapphire-action)] mb-4" />
        <p className="text-sm font-mono text-[var(--slate-400)]">Carregando dados do pedido...</p>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[var(--navy-950)] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        <p className="text-xs text-[var(--slate-400)] mt-1 mb-6">Verifique se o token informado está correto.</p>
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-[var(--sapphire-action)] text-white font-bold text-xs">
          Voltar para a Página Inicial
        </Link>
      </div>
    );
  }

  const isPaid = orderData.paymentStatus === 'paid';
  const isExpired = orderData.paymentStatus === 'expired' || orderData.paymentStatus === 'failed';
  const isAwaitingUrl = orderData.fulfillmentStatus === 'awaiting_customer_action';

  return (
    <div className="min-h-screen bg-[var(--navy-950)] py-8 md:py-12 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
          <BrandLockup variant="dark" size="sm" />

          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[var(--slate-400)] hover:text-white"
          >
            <MessageCircle className="w-4 h-4 text-[var(--sapphire-soft)]" />
            <span>Suporte</span>
          </a>
        </div>

        <div className="space-y-8">
          
          {/* Main Status Header Card */}
          <div className="glass-panel-navy p-6 sm:p-8 rounded-3xl text-center space-y-4">
            
            {isPaid ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-[var(--success)] text-[var(--success)] flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">Pagamento Confirmado!</h1>
                <p className="text-sm text-[var(--slate-400)] max-w-md mx-auto">
                  Seu Pix foi aprovado e o pacote <strong className="text-white">{orderData.packageName}</strong> está sendo orquestrado.
                </p>
                {orderData.payment?.paidAfterExpiration && (
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    ✓ Resgatado e processado automaticamente (paid_after_expiration)
                  </span>
                )}
              </div>
            ) : isExpired ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-black text-rose-300">Cobrança Pix Expirada</h1>
                <p className="text-xs text-[var(--slate-400)] max-w-md mx-auto">
                  O tempo limite de 15 minutos para pagamento do pacote <strong className="text-white">{orderData.packageName}</strong> expirou.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--navy-900)] border border-[var(--gold-500)]/40 text-[var(--gold-300)] flex items-center justify-center mx-auto">
                  <QrCode className="w-7 h-7 animate-pulse" />
                </div>
                <h1 className="text-2xl font-black">Aguardando Pagamento Pix</h1>
                <p className="text-xs text-[var(--slate-400)] max-w-md mx-auto">
                  Pague através do seu app bancário para liberar a entrega do pacote <strong className="text-white">{orderData.packageName}</strong> (R$ {(orderData.amountCents / 100).toFixed(2).replace('.', ',')}).
                </p>
              </div>
            )}

            {/* Dev Mode Payment Simulation Trigger */}
            {!isPaid && !isExpired && (
              <div className="pt-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={isSimulatingPayment}
                  className="px-4 py-2 rounded-xl bg-[var(--sapphire-glow)] border border-[var(--sapphire-action)] text-[var(--sapphire-soft)] text-xs font-mono hover:bg-[var(--sapphire-action)] hover:text-white transition-all flex items-center justify-center gap-1.5 mx-auto max-w-full text-center leading-snug"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{isSimulatingPayment ? 'Simulando...' : 'Simular Pagamento Pix (Dev Mode)'}</span>
                </button>
              </div>
            )}

          </div>

          {/* Section A: Pix Copia e Cola OR Expired Action Card */}
          {!isPaid && isExpired && (
            <div className="glass-panel-navy p-5 sm:p-8 rounded-3xl space-y-6 border-2 border-rose-500/40 bg-rose-500/5 text-center">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">Deseja realizar este pedido?</h2>
                <p className="text-xs text-[var(--slate-400)] max-w-md mx-auto leading-relaxed">
                  Esta cobrança Pix não é mais válida. Para dar continuidade, inicie um novo pedido no checkout.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--sapphire-action)] text-white font-extrabold text-sm hover:bg-[var(--sapphire-600)] transition-all shadow-lg shadow-[var(--sapphire-glow)]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Fazer um Novo Pedido</span>
                </Link>
              </div>
            </div>
          )}

          {!isPaid && !isExpired && orderData.payment && (
            <div className="glass-panel-navy p-4 sm:p-8 rounded-3xl space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-white/10 text-center sm:text-left">
                <div>
                  <h2 className="text-base font-bold text-white">Código Pix Copia e Cola</h2>
                  <p className="text-xs text-[var(--slate-400)]">Copie o código abaixo e utilize na opção Pix do seu aplicativo de banco.</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-xs text-[var(--gold-300)] font-mono shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Válido por 15 minutos</span>
                </div>
              </div>

              {/* Visual QR Code Image */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-[var(--navy-950)] border border-white/10 space-y-3 text-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-3 rounded-2xl flex items-center justify-center border-4 border-[var(--gold-500)]/40 shadow-2xl shrink-0">
                  <img
                    src={
                      orderData.payment.qrCodeBase64
                        ? (orderData.payment.qrCodeBase64.startsWith('data:')
                            ? orderData.payment.qrCodeBase64
                            : `data:image/png;base64,${orderData.payment.qrCodeBase64}`)
                        : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderData.payment.qrCode)}`
                    }
                    alt="QR Code Pix Mercado Pago"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-[var(--slate-400)] font-medium">
                  Escaneie o QR Code com o aplicativo do seu banco ou copie a chave abaixo:
                </p>
              </div>

              {/* Copy Box */}
              <div className="space-y-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--navy-950)] border border-white/10 font-mono text-xs text-[var(--slate-400)] break-all max-h-24 overflow-y-auto">
                  {orderData.payment.qrCode}
                </div>

                <button
                  onClick={handleCopyPix}
                  className="w-full py-4 rounded-xl bg-[var(--sapphire-action)] text-white font-extrabold text-sm hover:bg-[var(--sapphire-600)] transition-all shadow-lg shadow-[var(--sapphire-glow)] flex items-center justify-center gap-2 active:scale-98"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Código Pix Copiado com Sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mercado Pago Security Trust Badge */}
              <div className="p-3 rounded-2xl bg-[var(--navy-950)] border border-[var(--gold-500)]/30 flex items-center justify-center gap-2 text-center shadow-inner">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-[var(--slate-300)] font-medium">
                  Pagamento 100% Seguro e Processado via <strong className="text-white font-bold">Mercado Pago</strong>
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-[var(--slate-400)] pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--sapphire-soft)]" />
                <span>Verificando pagamento automaticamente a cada 3 segundos...</span>
              </div>

            </div>
          )}

          {/* Section B: Self-Service URL Swap Interface */}
          {isAwaitingUrl && (
            <div className="glass-panel-navy p-6 sm:p-8 rounded-3xl border-2 border-amber-500/50 bg-amber-500/5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-amber-300">Precisamos ajustar o link da publicação</h2>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    O formato informado não é compatível com o serviço de visualizações do pacote. Envie o link de um <strong>Reel público</strong> (`https://www.instagram.com/reel/...`) para continuarmos seu pedido, sem realizar um novo pagamento.
                  </p>
                </div>
              </div>

              {updateMessage && (
                <div className="p-3.5 rounded-xl bg-[var(--navy-950)] border border-amber-500/30 text-xs text-amber-200">
                  {updateMessage}
                </div>
              )}

              <form onSubmit={handleUpdateUrl} className="space-y-3">
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/reel/ABC123/"
                  value={newReelUrl}
                  onChange={(e) => setNewReelUrl(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-[var(--navy-950)] border border-amber-500/40 text-white text-sm focus:outline-none focus:border-[var(--sapphire-action)] font-mono"
                />
                <button
                  type="submit"
                  disabled={isUpdatingUrl}
                  className="w-full py-3.5 rounded-xl bg-[var(--sapphire-action)] text-white font-bold text-sm hover:bg-[var(--sapphire-600)] transition-all flex items-center justify-center gap-2"
                >
                  {isUpdatingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Atualizando e Reiniciando...</span>
                    </>
                  ) : (
                    <span>Reenviar Link do Reel</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Section C: Public Timeline */}
          <div className="glass-panel-navy p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--gold-300)]" />
              <span>Acompanhamento da Entrega</span>
            </h2>

            {/* Metrics Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {orderData.items.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--navy-950)] border border-white/10 text-center space-y-1">
                  <div className="text-[10px] font-mono text-[var(--slate-400)] uppercase">{item.metric}</div>
                  <div className="text-xs font-bold text-white font-mono">{item.quantity.toLocaleString()}</div>
                  <div className="text-[10px] font-mono text-[var(--sapphire-soft)]">
                    {item.status === 'submitted' || item.status === 'completed'
                      ? '✓ Entregando'
                      : item.status === 'waiting_for_compatibility'
                      ? 'Em fila'
                      : item.status === 'blocked_incompatible_content'
                      ? 'Aguardando Reel'
                      : 'Em andamento'}
                  </div>
                </div>
              ))}
            </div>

            {/* Canonical Post URL */}
            <div className="p-3.5 rounded-2xl bg-[var(--navy-950)] border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[var(--slate-400)] font-mono">Link:</span>
                <span className="font-mono text-white truncate">{orderData.postUrlCanonical}</span>
              </div>
              <a
                href={orderData.postUrlCanonical}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--sapphire-soft)] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Ver</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Timeline Events */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-mono text-[var(--slate-400)] uppercase tracking-wider">Timeline do Pedido:</div>
              <div className="space-y-3 border-l-2 border-[var(--sapphire-action)]/30 pl-4 ml-2">
                {orderData.timeline.map((evt, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[var(--sapphire-action)]" />
                    <div className="text-xs font-medium text-white">{evt.message}</div>
                    <div className="text-[10px] text-[var(--slate-400)] font-mono">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
