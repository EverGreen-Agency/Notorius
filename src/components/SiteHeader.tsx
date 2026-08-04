'use client';

import { BrandLockup } from '@/components/brand/BrandLockup';
import { ShieldCheck, Zap, Sparkles } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        <BrandLockup variant="dark" size="lg" />

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Advantage Pill 1: Urgency */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-xs text-[var(--gold-300)]">
            <Zap className="w-3.5 h-3.5 text-[var(--gold-300)]" />
            <span className="font-semibold">Início Imediato em Minutos</span>
          </div>

          {/* Advantage Pill 2: Trust & Privacy */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--navy-900)] border border-emerald-500/30 text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">100% Anônimo & Sem Senha</span>
          </div>

          {/* Call To Action Button */}
          <a
            href="#pacotes"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1c66d1] via-[#2f7bff] to-[#1c66d1] text-white font-extrabold text-sm hover:shadow-lg hover:shadow-[#2f7bff]/40 transition-all border border-[#ddbc83]/40 active:scale-95 flex items-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-[var(--gold-300)] group-hover:rotate-12 transition-transform" />
            <span>Garantir Pacote</span>
          </a>
        </div>
      </div>
    </header>
  );
}
