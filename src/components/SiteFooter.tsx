import { BrandLockup } from '@/components/brand/BrandLockup';
import { Shield } from 'lucide-react';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--ink-950)] border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLockup variant="dark" size="md" />

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--slate-400)]">
            <div className="flex items-center gap-1.5 text-[var(--ivory-100)]">
              <Shield className="w-4 h-4 text-[var(--gold-300)]" />
              <span>Pagamentos processados via Pushin Pay</span>
            </div>

            <a 
              href="https://www.instagram.com/notorius.ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[var(--gold-300)] transition-colors text-[var(--ivory-100)] font-medium"
            >
              <svg 
                className="w-4 h-4 text-[#e1306c]" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>@notorius.ai</span>
            </a>

            <a href="#pacotes" className="hover:text-white transition-colors">
              Pacotes
            </a>
          </div>
        </div>

        {/* Bottom Row: Copyright & Subtitle */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {currentYear} Notorius. Todos os direitos reservados.</p>
          <p className="text-[11px]">
            Presença & Desempenho Digital · 100% Automático & Seguro
          </p>
        </div>

      </div>
    </footer>
  );
}
