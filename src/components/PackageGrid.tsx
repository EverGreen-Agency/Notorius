'use client';

import Link from 'next/link';
import { Check, Star, ArrowRight, Info, Shield, Clock } from 'lucide-react';
import { INITIAL_PACKAGES } from '@/lib/packages-catalog';

export function PackageGrid() {
  return (
    <section id="pacotes" className="py-20 md:py-28 relative">
      {/* Background Ambient Sapphire Light */}
      <div className="absolute inset-0 bg-radial from-[#0e3d83]/20 via-transparent to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#0a1326] border border-[#ddbc83]/40 text-xs font-mono text-[#ddbc83] uppercase tracking-wider shadow-sm">
            <Shield className="w-3.5 h-3.5 text-[#ddbc83]" />
            <span>Escolha o Nível Ideal</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#f7f4ec] tracking-tight">
            Pacotes de Presença para <span className="gold-foil-text font-serif">1 Publicação</span>
          </h2>

          <p className="text-sm sm:text-base text-[#9bc2ff]/90 max-w-xl mx-auto">
            Cada pacote é aplicado a <strong className="text-[#f7f4ec] underline decoration-[#ddbc83]/50 decoration-2 underline-offset-4">uma única publicação pública</strong> do Instagram (Reel ou Post). Pagamento único via Pix.
          </p>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {INITIAL_PACKAGES.map((pkg) => {
            const isImpulso = pkg.isFeatured;

            return (
              <div
                key={pkg.id}
                className={`rounded-2xl flex flex-col justify-between p-6 transition-all relative ${
                  isImpulso
                    ? 'card-featured lg:-translate-y-3 ring-1 ring-[#ddbc83]/50'
                    : 'card-solid'
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
                  <div className="border-b border-[#ddbc83]/20 pb-4 mb-5">
                    <h3 className={`text-xl font-bold mb-1 ${isImpulso ? 'gold-foil-text font-serif' : 'text-[#f7f4ec]'}`}>
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#9bc2ff]/80 leading-relaxed min-h-[36px]">{pkg.description}</p>
                  </div>

                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-[#ddbc83] font-mono">R$</span>
                      <span className="text-4xl font-black text-[#f7f4ec] font-mono tracking-tight">
                        {(pkg.priceCents / 100).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#49b887] font-mono font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#49b887]" /> Pagamento único via Pix
                    </span>
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-3 mb-8">
                    <div className="text-[10px] font-mono text-[#ddbc83]/90 uppercase tracking-wider mb-2 font-semibold">
                      Entregáveis do Pacote:
                    </div>
                    {pkg.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-[#f7f4ec]">
                        <div className="w-4 h-4 rounded-full bg-[#ddbc83]/20 text-[#ddbc83] border border-[#ddbc83]/40 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="font-semibold">{item.displayLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 border-t border-[#ddbc83]/20 space-y-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9bc2ff]/90">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-[#ddbc83]" />
                      <span>Início imediato · <strong>Resultado em até 24h</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#616d7e]">
                      <Info className="w-3.5 h-3.5 shrink-0 text-[#ddbc83]" />
                      <span>Válido para 1 link do Instagram</span>
                    </div>
                  </div>

                  <Link
                    href={`/checkout?package=${pkg.slug}`}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 border ${
                      isImpulso
                        ? 'bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] text-white border-[#ddbc83]/60 hover:shadow-lg hover:shadow-[#2f7bff]/30'
                        : 'bg-[#0e1935] text-[#f7f4ec] hover:bg-[#1c66d1] border-[#ddbc83]/30 hover:border-[#ddbc83]'
                    }`}
                  >
                    <span>Escolher {pkg.name}</span>
                    <ArrowRight className="w-4 h-4 text-[#f4e4c1]" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

