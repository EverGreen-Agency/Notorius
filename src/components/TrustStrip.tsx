import { Lock, Zap, Headphones, CheckCircle, Clock, Shield } from 'lucide-react';

export function TrustStrip() {
  const trustPoints = [
    {
      icon: Clock,
      title: 'Resultado em até 24h',
      desc: 'Início automático via Pix com conclusão total dos entregáveis em até 24 horas.',
    },
    {
      icon: Lock,
      title: '100% Sem Senha',
      desc: 'Sua conta totalmente protegida. Exigimos apenas o link público da publicação.',
    },
    {
      icon: Zap,
      title: 'Pix Instantâneo',
      desc: 'Confirmação automática em segundos via Mercado Pago com disparo imediato.',
    },
    {
      icon: Headphones,
      title: 'Atendimento Dedicado',
      desc: 'Suporte humano disponível caso você precise de auxílio no acompanhamento.',
    },
  ];

  return (
    <section className="py-10 md:py-16 bg-[#030509] border-y-2 border-[#ddbc83]/40 relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      {/* Ambient Radial Golden & Sapphire Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ddbc83]/12 via-[#0d2654]/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Mobile Proof Badges Strip (Transferred from Hero for Mobile Cleanliness) */}
        <div className="grid md:hidden grid-cols-3 gap-2.5 mb-8 text-left">
          <div className="bg-[#0a1326]/95 p-3 rounded-xl border border-[#ddbc83]/35 shadow-lg flex flex-col items-start min-w-0">
            <div className="text-sm font-black gold-foil-text font-mono tracking-tight truncate w-full">+15.000</div>
            <div className="text-[10px] text-[#9bc2ff]/90 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3 h-3 text-[#ddbc83] shrink-0" />
              <span>Entregues</span>
            </div>
          </div>

          <div className="bg-[#0a1326]/95 p-3 rounded-xl border border-[#ddbc83]/35 shadow-lg flex flex-col items-start min-w-0">
            <div className="text-sm font-black gold-foil-text font-mono tracking-tight truncate w-full">100%</div>
            <div className="text-[10px] text-[#9bc2ff]/90 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
              <Lock className="w-3 h-3 text-[#ddbc83] shrink-0" />
              <span>Sem senha</span>
            </div>
          </div>

          <div className="bg-[#0a1326]/95 p-3 rounded-xl border border-[#ddbc83]/35 shadow-lg flex flex-col items-start min-w-0">
            <div className="text-sm font-black gold-foil-text font-mono tracking-tight truncate w-full">Imediato</div>
            <div className="text-[10px] text-[#9bc2ff]/90 font-medium mt-0.5 flex items-center gap-1 whitespace-nowrap">
              <Shield className="w-3 h-3 text-[#49b887] shrink-0" />
              <span>Via Pix</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4.5 rounded-2xl bg-[#0a1326]/95 border border-[#ddbc83]/35 shadow-xl hover:border-[#ddbc83] hover:shadow-[0_10px_30px_-5px_rgba(221,188,131,0.25)] transition-all duration-300 group"
              >
                <div className="p-3 rounded-xl bg-[#05070d] border border-[#ddbc83] text-[#ddbc83] shrink-0 shadow-[0_0_15px_rgba(221,188,131,0.3)] group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#f7f4ec] mb-1 group-hover:text-[#ddbc83] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#9bc2ff]/90 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
