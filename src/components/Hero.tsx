'use client';

import Image from 'next/image';
import { ArrowRight, CheckCircle2, Zap, Shield, Clock, Lock } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-20 md:pt-16 md:pb-28 overflow-hidden min-h-[480px] sm:min-h-0 flex flex-col justify-center">
      {/* Background Hero Image Layer (Z-0) - Physically Shifted Upward */}
      <div className="absolute -top-10 md:-top-20 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0">
        {/* Mobile Banner (Vertical Aspect Ratio 4:5 - 100% Vivid & Unobstructed) */}
        <div className="block md:hidden absolute inset-0">
          <Image
            src="/banner_hero_mobile.webp"
            alt="Notorius Hero Background Mobile"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover object-center opacity-100 filter brightness-105 contrast-105"
          />
        </div>

        {/* Desktop Banner (Horizontal Aspect Ratio 16:9 optimized) */}
        <div className="hidden md:block absolute inset-0">
          <Image
            src="/banner_hero.webp"
            alt="Notorius Hero Background Desktop"
            fill
            priority
            quality={95}
            sizes="100vw"
            className="object-cover object-[center_55%] opacity-90 filter brightness-105 contrast-105"
          />
        </div>

        {/* Refined Light Filter Overlay (Keeps Banner Visual Content Vivid & Text Crisp) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/65 via-[#05070d]/35 to-[#05070d]" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#05070d]/90 via-[#05070d]/60 to-transparent" />
      </div>

      {/* Hero Content (Z-10) - Pure & Clean Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col justify-between min-h-[460px] md:min-h-0">
        <div className="max-w-xl space-y-4 text-left">

          {/* Eyebrow Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a1326]/90 border border-[#ddbc83]/40 text-xs font-semibold text-[#f4e4c1] shadow-md backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#ddbc83]" />
            <span>Impulso Automático via Pix · Entrega em 24h</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#f7f4ec] leading-[1.15] drop-shadow-md">
            Dê mais presença à publicação que <span className="gold-foil-text">realmente importa</span>.
          </h1>

          {/* Subheadline (Hidden on mobile for ultra-compact layout) */}
          <p className="hidden sm:block text-sm sm:text-base text-[#9bc2ff]/90 leading-relaxed font-normal drop-shadow max-w-lg">
            Escolha o pacote ideal para seu Reel ou post, cole a URL da publicação e pague via Pix. Sem pedir senha e com acompanhamento do pedido.
          </p>
        </div>

        {/* Call to Action Button Anchored at Section Bottom on Mobile */}
        <div className="pt-6 mt-auto sm:mt-0 max-w-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3">
            <a
              href="#pacotes"
              className="w-full sm:w-auto min-h-[46px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] text-white font-bold text-sm sm:text-base hover:shadow-xl hover:shadow-[#2f7bff]/35 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#ddbc83]/40 flex items-center justify-center gap-2 group shadow-lg"
            >
              <span>Escolher Meu Pacote</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#f4e4c1]" />
            </a>
          </div>

          {/* Proof Badges Strip (Desktop Only - Transferred to TrustStrip on Mobile) */}
          <div className="hidden md:grid pt-4 border-t border-[#ddbc83]/20 grid-cols-3 gap-3 max-w-lg text-left">
            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start min-w-0">
              <div className="text-xl font-black gold-foil-text font-mono tracking-tight truncate w-full">+15.000</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 text-[#ddbc83] shrink-0" />
                <span>Entregues</span>
              </div>
            </div>

            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start min-w-0">
              <div className="text-xl font-black gold-foil-text font-mono tracking-tight truncate w-full">100%</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
                <Lock className="w-3 h-3 text-[#ddbc83] shrink-0" />
                <span>Sem senha</span>
              </div>
            </div>

            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start min-w-0">
              <div className="text-xl font-black gold-foil-text font-mono tracking-tight truncate w-full">Imediato</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
                <Shield className="w-3 h-3 text-[#49b887] shrink-0" />
                <span>Via Pix</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
