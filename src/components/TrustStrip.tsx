import { Lock, Zap, Headphones, CheckCircle, Clock } from 'lucide-react';

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
      desc: 'Confirmação automática em segundos via Pushin Pay com disparo imediato.',
    },
    {
      icon: Headphones,
      title: 'Atendimento Dedicado',
      desc: 'Suporte humano disponível caso você precise de auxílio no acompanhamento.',
    },
  ];

  return (
    <section className="py-8 bg-[var(--navy-950)] border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-[var(--navy-900)] transition-colors">
                <div className="p-2.5 rounded-xl bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-[var(--gold-300)] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-0.5">{item.title}</h3>
                  <p className="text-xs text-[var(--slate-400)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
