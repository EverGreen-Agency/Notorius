'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Info,
  AlertCircle,
  Sparkles,
  Zap,
  Clock,
  Lock,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { INITIAL_PACKAGES, ORDER_BUMPS, PackageConfig, getPackageBySlug } from '@/lib/packages-catalog';
import { parseInstagramUrl, ParsedInstagramUrl } from '@/lib/url-parser';
import { BrandLockup } from '@/components/brand/BrandLockup';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const packageSlug = searchParams.get('package') || 'impulso';
  const initialPkg = useMemo(() => {
    return getPackageBySlug(packageSlug) || INITIAL_PACKAGES[1];
  }, [packageSlug]);

  const [selectedPkgOverride, setSelectedPkgOverride] = useState<PackageConfig | null>(null);
  const selectedPkg = selectedPkgOverride || initialPkg;
  const setSelectedPkg = (pkg: PackageConfig) => setSelectedPkgOverride(pkg);

  // Selected Order Bumps (Unchecked by default per business requirement)
  const [selectedBumpIds, setSelectedBumpIds] = useState<string[]>([]);

  const [postUrl, setPostUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scarcity countdown timer (15 mins)
  const [timeLeftSec, setTimeLeftSec] = useState(14 * 60 + 59);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Real-time URL validation state
  const urlValidation: ParsedInstagramUrl = useMemo(() => {
    if (!postUrl.trim()) return { isValid: false, originalUrl: '' };
    return parseInstagramUrl(postUrl);
  }, [postUrl]);

  // Compute Order Bumps Sum
  const orderBumpsTotalCents = useMemo(() => {
    return selectedBumpIds.reduce((sum, bId) => {
      const bump = ORDER_BUMPS.find((b) => b.id === bId);
      return sum + (bump ? bump.priceCents : 0);
    }, 0);
  }, [selectedBumpIds]);

  // Total Checkout Amount in Cents
  const totalAmountCents = useMemo(() => {
    return selectedPkg.priceCents + orderBumpsTotalCents;
  }, [selectedPkg, orderBumpsTotalCents]);

  const toggleBump = (bumpId: string) => {
    setSelectedBumpIds((prev) =>
      prev.includes(bumpId) ? prev.filter((id) => id !== bumpId) : [...prev, bumpId]
    );
  };

  const handleUpgradeToImpulso = () => {
    const impulso = getPackageBySlug('impulso');
    if (impulso) {
      setSelectedPkg(impulso);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!urlValidation.isValid) {
      setErrorMessage(urlValidation.errorMessage || 'Insira uma URL válida do Instagram.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('Você precisa aceitar os termos de entrega para continuar.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageSlug: selectedPkg.slug,
          postUrl: urlValidation.canonicalUrl || postUrl,
          orderBumpIds: selectedBumpIds,
          customer: { name, email, phone },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao processar o checkout.');
      }

      router.push(data.paymentUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--navy-950)] py-6 md:py-12 text-white font-sans selection:bg-[#2f7bff] selection:text-white relative overflow-hidden">
      
      {/* Decorative Sapphire/Gold Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--sapphire-action)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[var(--gold-500)]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
        
        {/* Top Header Navigation & Brand */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]">
          <Link
            href="/#pacotes"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-secondary)] hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--gold-300)] group-hover:-translate-x-1 transition-transform" />
            <span>Voltar aos Pacotes</span>
          </Link>

          <BrandLockup variant="dark" size="md" />
        </div>

        {/* High-Converting Scarcity Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--gold-500)]/15 via-[var(--gold-500)]/25 to-[var(--gold-500)]/15 border border-[var(--gold-500)]/40 text-[var(--gold-300)] text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_10px_30px_-10px_rgba(221,188,131,0.2)]">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4.5 h-4.5 text-[var(--gold-300)] fill-[var(--gold-300)] shrink-0 animate-pulse" />
            <span>
              <strong className="text-white font-bold">Reserva de Oferta Ativa:</strong> As condições e taxas deste pacote foram reservadas para seu link.
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-[var(--gold-300)] bg-[var(--navy-950)]/90 px-3.5 py-1.5 rounded-xl border border-[var(--gold-500)]/40 shrink-0 self-end sm:self-auto shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[var(--gold-300)]" />
            <span>{formatTimer(timeLeftSec)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: High-Contrast Dark Metallic Form Card */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card-solid p-6 sm:p-8 rounded-3xl border border-[var(--gold-500)]/30 bg-[var(--navy-900)] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] space-y-6">
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <span>Finalizar Pedido</span>
                  <Lock className="w-5 h-5 text-emerald-400 inline" />
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-1">
                  Insira o link da publicação do Instagram para liberarmos a fila de processamento via Pix.
                </p>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-start gap-3 shadow-lg">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Special Upgrade Offer Banner if Start package is selected */}
              {selectedPkg.slug === 'start' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[var(--navy-950)] via-[var(--navy-900)] to-[var(--navy-950)] text-white border border-[var(--gold-500)]/60 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--gold-300)] text-[var(--navy-950)] text-[10px] font-black uppercase font-mono tracking-wider">
                      RECOMENDADO +55% ECONOMIA
                    </span>
                    <TrendingUp className="w-4 h-4 text-[var(--gold-300)]" />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <strong className="text-[var(--gold-300)] font-bold block text-sm sm:text-base">
                      Fazer Upgrade para o Pacote Impulso (+ R$ 10,00)?
                    </strong>
                    <span className="text-[var(--text-secondary)]">
                      Leve <strong className="text-white">25.000 visualizações</strong> (+17.000 extras) + <strong className="text-white">300 curtidas</strong> para um impacto 3x maior na publicação.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpgradeToImpulso}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--gold-300)] hover:bg-[var(--gold-500)] text-[var(--navy-950)] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-[var(--navy-950)]" />
                    <span>Quero o Pacote Impulso por R$ 19,90</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Package Selection Switcher */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider mb-2.5">
                    1. Pacote Selecionado
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {INITIAL_PACKAGES.map((p) => {
                      const isSelected = selectedPkg.id === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setSelectedPkg(p)}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                            isSelected
                              ? 'bg-[var(--navy-950)] border-[var(--gold-500)] text-white shadow-[0_0_20px_rgba(221,188,131,0.25)] scale-[1.02]'
                              : 'bg-[var(--navy-950)]/60 border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--gold-500)]/40 hover:text-white'
                          }`}
                        >
                          {p.isFeatured && (
                            <span className="absolute -top-2.5 left-2 px-2 py-0.2 bg-[var(--gold-300)] text-[var(--navy-950)] text-[9px] font-black uppercase rounded-full font-mono">
                              Top
                            </span>
                          )}
                          <div className="text-xs font-extrabold">{p.name}</div>
                          <div
                            className={`text-xs font-mono font-black mt-1 ${
                              isSelected ? 'text-[var(--gold-300)]' : 'text-[var(--sapphire-action)]'
                            }`}
                          >
                            R$ {(p.priceCents / 100).toFixed(2).replace('.', ',')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instagram URL Input Section */}
                <div>
                  <label className="block text-xs font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider mb-2">
                    2. Link Público da Publicação do Instagram <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.instagram.com/reel/ABC123/ ou /p/ABC123/"
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[var(--navy-950)] border border-[var(--border-subtle)] text-white font-mono text-sm focus:outline-none focus:border-[var(--gold-300)] focus:ring-2 focus:ring-[var(--gold-500)]/20 transition-all placeholder:text-[var(--text-muted)] font-semibold shadow-inner"
                  />

                  {/* Real-Time URL Validation Feedback */}
                  {postUrl.trim() !== '' && (
                    <div className="mt-2.5 text-xs">
                      {urlValidation.isValid ? (
                        <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 font-medium flex items-center justify-between shadow-md">
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                            <span className="font-mono text-xs font-extrabold text-emerald-300">
                              URL Validada ({urlValidation.contentType?.toUpperCase()})
                            </span>
                          </div>
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">
                            {urlValidation.shortcode}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                          {urlValidation.errorMessage}
                        </div>
                      )}
                    </div>
                  )}

                  {urlValidation.isValid && urlValidation.contentType === 'post' && (
                    <div className="mt-2 p-3 rounded-xl bg-[var(--navy-950)] border border-[var(--gold-500)]/30 text-[var(--gold-300)] text-xs font-medium flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0 text-[var(--gold-300)]" />
                      <span>Post estático `/p/` validado. Os entregáveis serão direcionados para esta publicação.</span>
                    </div>
                  )}
                </div>

                {/* Customer Contact Details */}
                <div className="space-y-4">
                  <label className="block text-xs font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider">
                    3. Dados para Confirmação do Pedido
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                        Seu Nome Completo <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Ana Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--navy-950)] border border-[var(--border-subtle)] text-white text-sm font-semibold focus:outline-none focus:border-[var(--gold-300)] shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                        WhatsApp com DDD <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--navy-950)] border border-[var(--border-subtle)] text-white text-sm font-semibold focus:outline-none focus:border-[var(--gold-300)] font-mono shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      E-mail para Acompanhamento <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seuemail@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--navy-950)] border border-[var(--border-subtle)] text-white text-sm font-semibold focus:outline-none focus:border-[var(--gold-300)] shadow-inner"
                    />
                  </div>
                </div>

                {/* ORDER BUMPS SECTION */}
                <div className="pt-2 space-y-3">
                  <label className="block text-xs font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-[var(--gold-300)]" />
                    <span>4. Ofertas Complementares (Order Bumps Opcionais)</span>
                  </label>

                  <div className="space-y-3">
                    {ORDER_BUMPS.map((bump) => {
                      const isChecked = selectedBumpIds.includes(bump.id);
                      return (
                        <div
                          key={bump.id}
                          onClick={() => toggleBump(bump.id)}
                          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[var(--gold-500)]/10 border-[var(--gold-500)] text-white shadow-md'
                              : 'bg-[var(--navy-950)] border-[var(--border-subtle)] hover:border-[var(--gold-500)]/40 text-[var(--text-secondary)]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by container onClick
                              className="mt-1 w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--gold-300)] focus:ring-0 cursor-pointer accent-[var(--gold-300)] shrink-0"
                            />
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                                    {bump.name}
                                  </span>
                                  {bump.badge && (
                                    <span className="px-2 py-0.5 rounded-md bg-[var(--gold-300)] text-[var(--navy-950)] text-[10px] font-black uppercase font-mono shrink-0">
                                      {bump.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="self-start sm:self-auto text-xs font-mono font-black text-[var(--gold-300)] bg-[var(--navy-950)] px-2.5 py-1 rounded-lg border border-[var(--gold-500)]/30 shrink-0">
                                  + R$ {(bump.priceCents / 100).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                {bump.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Terms Consent Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--gold-300)] focus:ring-0 cursor-pointer accent-[var(--gold-300)]"
                  />
                  <label htmlFor="terms" className="text-xs text-[var(--text-secondary)] font-medium leading-tight cursor-pointer">
                    Declaro que a publicação está pública no Instagram e concordo com os termos de entrega única para 1 link.
                  </label>
                </div>

                {/* High-Impact Imperial Sapphire Real CTA Button */}
                <button
                  type="submit"
                  disabled={isLoading || !urlValidation.isValid}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] hover:from-[#2f7bff] hover:to-[#1c66d1] text-white font-extrabold text-base sm:text-lg transition-all shadow-[0_10px_35px_-5px_rgba(47,123,255,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 border border-[var(--gold-300)]/40"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--gold-300)]" />
                      <span>Gerando Código Pix...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-[var(--gold-300)] fill-[var(--gold-300)]" />
                      <span>Gerar Pix de R$ {(totalAmountCents / 100).toFixed(2).replace('.', ',')}</span>
                    </>
                  )}
                </button>

                <div className="p-3.5 rounded-xl bg-[var(--navy-950)] border border-[var(--sapphire-glow)]/40 text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--sapphire-soft)] font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Pagamento 100% Seguro via Mercado Pago</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-tight max-w-sm mx-auto">
                    Seus dados são protegidos por criptografia SSL de 256 bits. Confirmação e liberação automática em tempo real.
                  </p>
                </div>
              </form>

            </div>
          </div>

          {/* Right Column: Order Summary (Dark Metallic Card) */}
          <div className="lg:col-span-5">
            <div className="card-solid p-6 sm:p-7 rounded-3xl border border-[var(--gold-500)]/40 bg-[var(--navy-900)] shadow-[0_20px_50px_-15px_rgba(221,188,131,0.15)] space-y-6 sticky top-24">
              
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <span className="text-xs font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider">
                  Resumo do Pedido
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-[11px] font-black text-emerald-400 uppercase font-mono flex items-center gap-1.5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Pix Instantâneo
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Pacote {selectedPkg.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">
                  {selectedPkg.description}
                </p>
              </div>

              {/* Package Entregables Breakdown */}
              <div className="space-y-3 bg-[var(--navy-950)] p-4 rounded-2xl border border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono font-bold text-[var(--gold-300)] uppercase tracking-wider">
                  Entregáveis inclusos para 1 link:
                </div>
                {selectedPkg.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs sm:text-sm font-semibold text-white">
                    <span className="text-[var(--text-secondary)]">{item.displayLabel}</span>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  </div>
                ))}
              </div>

              {/* Selected Order Bumps in Summary */}
              {selectedBumpIds.length > 0 && (
                <div className="space-y-2 bg-[var(--gold-500)]/10 p-3.5 rounded-2xl border border-[var(--gold-500)]/30 text-xs">
                  <div className="font-mono font-bold text-[var(--gold-300)] uppercase text-[10px]">Adicionais selecionados:</div>
                  {selectedBumpIds.map((bId) => {
                    const bump = ORDER_BUMPS.find((b) => b.id === bId);
                    if (!bump) return null;
                    return (
                      <div key={bId} className="flex items-center justify-between text-white font-medium">
                        <span className="text-[var(--gold-300)]">{bump.name}</span>
                        <span className="font-mono font-bold text-[var(--gold-300)]">
                          + R$ {(bump.priceCents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total Price Display */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Valor Total Pix</span>
                <div className="text-right">
                  <div className="text-3xl font-black text-[var(--gold-300)] font-mono tracking-tight">
                    R$ {(totalAmountCents / 100).toFixed(2).replace('.', ',')}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">Sem taxas adicionais de serviço</div>
                </div>
              </div>

              {/* Security & Processing Guarantee */}
              <div className="p-4 rounded-2xl bg-[var(--navy-950)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-[var(--gold-300)]" />
                  <span>Garantia de Entrega Notorius</span>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed text-[11px]">
                  Sem necessidade de senha do Instagram. Entrega iniciada automaticamente após a confirmação do pagamento Pix.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--navy-950)] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--gold-300)]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
