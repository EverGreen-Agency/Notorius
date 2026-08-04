'use client';

import Image from 'next/image';
import { ArrowRight, CheckCircle2, Zap, Shield, Clock, Lock } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-4 pb-2 md:pt-8 md:pb-20 overflow-hidden">
      {/* Background Hero Image Layer (Z-0) - Physically Shifted Upward */}
      <div className="absolute -top-10 md:-top-20 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0">
        <Image
          src="/bannerHeri.webp"
          alt="Notorius Hero Background"
          fill
          priority
          className="object-cover object-[center_55%] opacity-75 md:opacity-90 filter brightness-105 contrast-105"
        />
        {/* Subtle Dark Gradient Mask for Left-Side Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070d]/90 via-[#05070d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05070d]/40 via-transparent to-[#05070d]" />
      </div>

      {/* Hero Content (Z-10) - Compact Left Column */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-[#9bc2ff]/90 leading-relaxed font-normal drop-shadow max-w-lg">
            Escolha o pacote ideal para seu Reel ou post, cole a URL da publicação e pague via Pix. Sem pedir senha e com acompanhamento do pedido.
          </p>

          {/* Call to Action Buttons & Guarantee */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 pt-1">
            <a
              href="#pacotes"
              className="w-full sm:w-auto min-h-[44px] px-7 py-3 rounded-xl bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] text-white font-bold text-sm hover:shadow-xl hover:shadow-[#2f7bff]/35 hover:scale-[1.02] active:scale-[0.98] transition-all border border-[#ddbc83]/40 flex items-center justify-center gap-2 group"
            >
              <span>Escolher Meu Pacote</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#f4e4c1]" />
            </a>

            <div className="flex items-center gap-2 text-xs text-[#9bc2ff]/90 py-1.5 font-medium bg-[#05070d]/60 px-3 rounded-lg border border-white/5 backdrop-blur-sm">
              <CheckCircle2 className="w-4 h-4 text-[#49b887]" />
              <span>A partir de R$ 9,90</span>
            </div>
          </div>

          {/* Proof Badges Strip */}
          <div className="pt-4 border-t border-[#ddbc83]/20 grid grid-cols-3 gap-3 max-w-lg text-left">
            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start">
              <div className="text-lg sm:text-xl font-black gold-foil-text font-mono">+15.000</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#ddbc83]" />
                <span>Entregues</span>
              </div>
            </div>

            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start">
              <div className="text-lg sm:text-xl font-black gold-foil-text font-mono">100%</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#ddbc83]" />
                <span>Sem senha</span>
              </div>
            </div>

            <div className="bg-[#0a1326]/85 p-3 rounded-xl border border-[#ddbc83]/30 shadow-md backdrop-blur-md flex flex-col items-start">
              <div className="text-lg sm:text-xl font-black gold-foil-text font-mono">Imediato</div>
              <div className="text-[11px] text-[#9bc2ff]/80 font-medium mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#49b887]" />
                <span>Via Pix</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
