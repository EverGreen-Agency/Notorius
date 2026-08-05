'use client';

import React from 'react';
import Image from 'next/image';
import { MessageSquare, CheckCircle, ShieldCheck } from 'lucide-react';

export function SocialProof() {
  const whatsappProofs = [
    {
      src: '/whatsapp/3.svg',
      label: 'Entrega Imediata',
      package: 'Pacote Start',
      badge: '100% Entregue',
    },
    {
      src: '/whatsapp/1.svg',
      label: 'Visualizações no Reel',
      package: 'Pacote Impulso',
      badge: 'Verificado',
    },
    {
      src: '/whatsapp/2.svg',
      label: 'Cliente Recorrente',
      package: 'Pacote Start',
      badge: 'Recompra',
    },
    {
      src: '/whatsapp/6.svg',
      label: 'Atendimento Rápido',
      package: 'Pacote Pro',
      badge: 'Sem Fricção',
    },
    {
      src: '/whatsapp/4.svg',
      label: 'Fulfillment Aprovado',
      package: 'Fulfillment Pix',
      badge: 'Seguro',
    },
    {
      src: '/whatsapp/5.svg',
      label: 'Recompra Confirmada',
      package: 'Pacote Top',
      badge: 'Presença',
    },
  ];

  // Duplicate catalog for infinite seamless carousel loop
  const duplicatedProofs = [...whatsappProofs, ...whatsappProofs];

  return (
    <section className="py-20 bg-[#0a1326] border-y border-[#ddbc83]/20 relative overflow-hidden">
      {/* Background Ambient Sapphire Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial from-[#1c66d1]/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05070d] border border-[#ddbc83]/40 text-xs text-[#ddbc83] font-mono shadow-sm">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Resultados Reais no WhatsApp</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#f7f4ec] tracking-tight">
            Quem compra, <span className="gold-foil-text font-serif">aprova</span> e compra novamente
          </h2>
          <p className="text-sm sm:text-base text-[#9bc2ff]/90 max-w-2xl mx-auto">
            Prints reais de atendimentos, confirmações de Pix e rebuys de clientes que utilizam a Notorius.
          </p>
        </div>
      </div>

      {/* Infinite Horizontal Carousel Ticker */}
      <div className="relative w-full overflow-hidden py-4 select-none">

        {/* Left & Right Elegant Edge Fading Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#0a1326] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#0a1326] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex gap-6 px-4">
          {duplicatedProofs.map((item, idx) => (
            <div
              key={idx}
              className="w-[240px] sm:w-[270px] shrink-0 card-solid p-3 rounded-2xl border border-[#ddbc83]/25 bg-[#05070d] shadow-lg group hover:border-[#ddbc83]/60 hover:scale-[1.02] transition-all flex flex-col justify-between"
            >
              {/* Header Badge */}
              <div className="text-[11px] font-semibold text-[#f7f4ec] px-1 py-1 flex items-center justify-between border-b border-[#ddbc83]/15 mb-2 shrink-0">
                <span className="flex items-center gap-1 text-[#49b887] truncate">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-[8px] font-mono text-[#ddbc83] bg-[#ddbc83]/10 px-1.5 py-0.5 rounded border border-[#ddbc83]/30 font-bold shrink-0">
                  {item.badge}
                </span>
              </div>

              {/* Chat Screenshot Image Wrapper */}
              <div className="relative rounded-xl overflow-hidden border border-[#ddbc83]/15 aspect-[9/16] bg-[#05070d]">
                <Image
                  src={item.src}
                  alt={`Screenshot WhatsApp - ${item.label}`}
                  fill
                  sizes="270px"
                  className="object-cover object-top"
                />
              </div>

              {/* Footer Package detail */}
              <div className="flex items-center justify-between text-[10px] text-[#616d7e] px-1 pt-2.5 mt-2 border-t border-[#ddbc83]/15 font-mono shrink-0">
                <div className="flex items-center gap-1 text-[#9bc2ff]/80 font-medium truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#49b887] shrink-0" />
                  <span className="truncate">{item.package}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
