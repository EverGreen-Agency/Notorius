'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Star, ArrowRight, Info, Shield, Clock } from 'lucide-react';
import { INITIAL_PACKAGES } from '@/lib/packages-catalog';

export function PackageGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);

      if (!mobileCheck) {
        setProgress(0);
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const totalStickyDistance = rect.height - viewHeight;

      if (totalStickyDistance <= 0) return;

      const scrolledDistance = -rect.top;
      let p = scrolledDistance / totalStickyDistance;
      p = Math.max(0, Math.min(1, p));

      setProgress(p);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Card shift calculations for mobile track
  const activeStep = Math.min(3, Math.max(0, Math.round(progress * 3)));
  const cardWidth = 290; // width of card on mobile
  const gapWidth = 20;   // gap between cards
  const stepDist = cardWidth + gapWidth;
  const totalShift = (INITIAL_PACKAGES.length - 1) * stepDist;
  const currentTranslateX = -progress * totalShift;

  return (
    <section
      id="pacotes"
      ref={containerRef}
      className="relative h-[220vh] md:h-auto py-0 md:py-28 bg-[var(--navy-950)] border-y border-[var(--border-subtle)] md:border-y-0"
    >
      {/* Background Ambient Sapphire Light */}
      <div className="absolute inset-0 bg-radial from-[#0e3d83]/20 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Sticky Fullscreen Wrapper for Mobile / Static Container for Desktop */}
      <div className="sticky top-16 md:top-0 h-[calc(100vh-4rem)] md:h-auto flex flex-col justify-center items-center overflow-hidden md:overflow-visible py-3 md:py-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16 space-y-1.5 sm:space-y-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-4 sm:py-1 rounded-full bg-[#0a1326] border border-[#ddbc83]/40 text-[10px] sm:text-xs font-mono text-[#ddbc83] uppercase tracking-wider shadow-sm">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#ddbc83]" />
              <span>Escolha o Nível Ideal</span>
            </div>

            <h2 className="text-lg sm:text-4xl font-extrabold text-[#f7f4ec] tracking-tight">
              Pacotes de Presença para <span className="gold-foil-text font-serif">1 Publicação</span>
            </h2>

            <p className="hidden sm:block text-xs sm:text-base text-[#9bc2ff]/90 max-w-xl mx-auto">
              Cada pacote é aplicado a <strong className="text-[#f7f4ec] underline decoration-[#ddbc83]/50 decoration-2 underline-offset-4">uma única publicação pública</strong> do Instagram (Reel ou Post). Pagamento único via Pix.
            </p>

            {/* Mercado Pago Trust Seal */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#05070d]/80 border border-[#49b887]/40 text-xs font-semibold text-[#49b887] shadow-sm">
              <Shield className="w-4 h-4 text-[#49b887]" />
              <span>Garantia de Checkout Seguro via <strong className="text-white">Mercado Pago</strong></span>
            </div>

            {/* Mobile Progress Dots */}
            <div className="flex md:hidden items-center justify-center gap-1.5 pt-1.5 pb-1">
              {INITIAL_PACKAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    activeStep === i
                      ? 'w-5 bg-[#ddbc83]'
                      : 'w-1 bg-[#ddbc83]/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Horizontal Track Container */}
          <div className="w-full relative">
            <div
              className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch"
              style={
                isMobile
                  ? {
                      paddingLeft: 'calc(50vw - 140px)',
                      paddingRight: 'calc(50vw - 140px)',
                      transform: `translate3d(${currentTranslateX}px, 0, 0)`,
                      willChange: 'transform',
                    }
                  : undefined
              }
            >
              {INITIAL_PACKAGES.map((pkg, idx) => {
                const isImpulso = pkg.isFeatured;
                const isActiveOnMobile = isMobile && activeStep === idx;

                return (
                  <div
                    key={pkg.id}
                    className={`w-[280px] sm:w-[310px] md:w-auto shrink-0 rounded-2xl flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 relative ${
                      isImpulso
                        ? 'card-featured lg:-translate-y-3'
                        : 'card-solid'
                    } ${
                      isMobile
                        ? isActiveOnMobile
                          ? 'scale-100 z-20 border-[#ddbc83] shadow-[0_10px_25px_-5px_rgba(221,188,131,0.3)] opacity-100'
                          : 'scale-90 opacity-40'
                        : ''
                    }`}
                  >
                    {/* Featured Badge */}
                    {isImpulso && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#85673f] via-[#ddbc83] to-[#85673f] text-[#05070d] font-mono font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#ddbc83]/20 border border-[#f4e4c1]">
                        <Star className="w-3.5 h-3.5 fill-[#05070d] text-[#05070d]" />
                        <span>Mais Escolhido</span>
                      </div>
                    )}

                    <div>
                      {/* Title & Description */}
                      <div className="border-b border-[#ddbc83]/20 pb-2 mb-3 md:pb-4 md:mb-5">
                        <h3 className={`text-lg sm:text-xl font-bold mb-0.5 ${isImpulso ? 'gold-foil-text font-serif' : 'text-[#f7f4ec]'}`}>
                          {pkg.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-[#9bc2ff]/80 leading-relaxed min-h-[28px] md:min-h-[36px]">{pkg.description}</p>
                      </div>

                      {/* Price Display */}
                      <div className="mb-3 md:mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs text-[#ddbc83] font-mono">R$</span>
                          <span className="text-3xl sm:text-4xl font-black text-[#f7f4ec] font-mono tracking-tight">
                            {(pkg.priceCents / 100).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-[#49b887] font-mono font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#49b887]" /> Pagamento único via Pix
                        </span>
                      </div>

                      {/* Deliverables */}
                      <div className="space-y-1.5 mb-3 md:space-y-3 md:mb-8">
                        <div className="text-[10px] font-mono text-[#ddbc83]/90 uppercase tracking-wider mb-1 md:mb-2 font-semibold">
                          Entregáveis do Pacote:
                        </div>
                        {pkg.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center gap-2 text-xs text-[#f7f4ec]">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#ddbc83]/20 text-[#ddbc83] border border-[#ddbc83]/40 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                            </div>
                            <span className="font-semibold text-[11px] sm:text-xs">{item.displayLabel}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Action */}
                    <div className="pt-2 md:pt-4 border-t border-[#ddbc83]/20 space-y-2 md:space-y-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#9bc2ff]/90">
                          <Clock className="w-3 h-3 shrink-0 text-[#ddbc83]" />
                          <span>Início imediato · <strong>Resultado em 24h</strong></span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#616d7e]">
                          <Info className="w-3 h-3 shrink-0 text-[#ddbc83]" />
                          <span>Válido para 1 link do Instagram</span>
                        </div>
                      </div>

                      <Link
                        href={`/checkout?package=${pkg.slug}`}
                        className={`w-full py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 border ${
                          isImpulso
                            ? 'bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] text-white border-[#ddbc83]/60 hover:shadow-lg hover:shadow-[#2f7bff]/30'
                            : 'bg-[#0e1935] text-[#f7f4ec] hover:bg-[#1c66d1] border-[#ddbc83]/30 hover:border-[#ddbc83]'
                        }`}
                      >
                        <span>Escolher {pkg.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#f4e4c1]" />
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

