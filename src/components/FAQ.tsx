'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Link2,
  Eye,
  ShieldCheck,
  Layers,
  Clock,
  BarChart3,
  RefreshCw,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const faqs = [
    {
      id: 'link',
      icon: Link2,
      category: 'URL & Envio',
      q: 'Qual link devo enviar?',
      a: 'Você deve enviar a URL pública de uma publicação do Instagram (ex: instagram.com/reel/ABC123/ ou /p/ABC123/). Links de perfis e Stories não são aceitos.',
      badge: '1 Link por Compra',
    },
    {
      id: 'public',
      icon: Eye,
      category: 'Visibilidade',
      q: 'A publicação precisa estar pública?',
      a: 'Sim, absolutamente. A conta e a publicação devem estar públicas durante todo o período do processamento.',
      badge: 'Perfil Público',
    },
    {
      id: 'password',
      icon: ShieldCheck,
      category: 'Segurança',
      q: 'Preciso informar minha senha?',
      a: 'Nunca! Nós jamais solicitamos senha ou acesso à sua conta. O processo exige apenas o link público da publicação.',
      badge: '100% Sem Senha',
    },
    {
      id: 'quantity',
      icon: Layers,
      category: 'Pacotes',
      q: 'Cada pacote vale para quantas publicações?',
      a: 'Cada pacote comprado é válido exclusivamente para uma única publicação (1 link por compra).',
      badge: 'Por Publicação',
    },
    {
      id: 'time',
      icon: Clock,
      category: 'Entrega',
      q: 'Quando o processamento começa e qual o prazo?',
      a: 'Imediatamente após a confirmação do Pix! Os primeiros resultados entram em minutos e 100% da entrega é concluída em até 24 horas.',
      badge: 'Início Imediato',
    },
    {
      id: 'tracking',
      icon: BarChart3,
      category: 'Acompanhamento',
      q: 'Como acompanho o andamento do pedido?',
      a: 'Assim que o Pix é gerado, você recebe um link exclusivo de acompanhamento público onde pode ver o status consolidado em tempo real.',
      badge: 'Tracking em Tempo Real',
    },
    {
      id: 'incompatible',
      icon: RefreshCw,
      category: 'Compatibilidade',
      q: 'O que acontece se informar um link incompatível?',
      a: 'Se a publicação for incompatível com algum item do pacote, nosso sistema segura o processamento e permite que você insira o link correto sem custo adicional.',
      badge: 'Troca de Link Grátis',
    },
    {
      id: 'repurchase',
      icon: Sparkles,
      category: 'Recompra',
      q: 'Posso comprar novamente para outro post?',
      a: 'Sim! Você pode realizar quantas compras desejar, para a mesma publicação ou para publicações diferentes.',
      badge: 'Compras Ilimitadas',
    },
    {
      id: 'support',
      icon: MessageSquare,
      category: 'Suporte',
      q: 'Como falar com o suporte se precisar?',
      a: 'Disponibilizamos um canal direto de WhatsApp na tela de acompanhamento e no cabeçalho do site para atendimento humano rápido.',
      badge: 'Suporte Via WhatsApp',
    },
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : faqs.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < faqs.length - 1 ? prev + 1 : 0));
  };

  // Drag handlers for desktop mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    if (diff > 50) {
      handlePrev();
      setIsDragging(false);
      setDragStartX(null);
    } else if (diff < -50) {
      handleNext();
      setIsDragging(false);
      setDragStartX(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX === null) return;
    const diff = e.touches[0].clientX - dragStartX;
    if (diff > 40) {
      handlePrev();
      setIsDragging(false);
      setDragStartX(null);
    } else if (diff < -40) {
      handleNext();
      setIsDragging(false);
      setDragStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStartX(null);
  };

  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[var(--bg-dark)] border-t border-[var(--border-subtle)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--navy-900)] border border-[var(--gold-500)]/30 text-xs text-[var(--gold-300)] shadow-sm">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--gold-300)]" />
            <span className="font-mono uppercase tracking-wider font-semibold">Tire Suas Dúvidas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Perguntas <span className="gold-foil-text font-serif">Frequentes</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Deslize para ver as respostas completas de forma rápida.</p>
        </div>

        {/* 3D Deck Container */}
        <div
          className="relative min-h-[380px] sm:min-h-[400px] flex items-center justify-center select-none touch-pan-y"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrow Left */}
          <button
            onClick={handlePrev}
            aria-label="Pergunta anterior"
            className="absolute left-0 sm:left-4 z-30 w-11 h-11 rounded-full bg-[var(--navy-900)] border border-[var(--gold-500)]/40 text-[var(--gold-300)] flex items-center justify-center shadow-lg hover:border-[var(--gold-300)] hover:scale-110 active:scale-95 transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Cards Stack */}
          <div className="w-full max-w-lg relative h-[360px] sm:h-[380px] flex items-center justify-center">
            {faqs.map((faq, idx) => {
              const Icon = faq.icon;
              const offset = idx - activeIndex;
              const isCurrent = idx === activeIndex;

              if (Math.abs(offset) > 2) return null;

              let transformStyle = '';
              let opacity = 0;
              let zIndex = 0;

              if (isCurrent) {
                transformStyle = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
                opacity = 1;
                zIndex = 20;
              } else if (offset === 1) {
                transformStyle = 'translate3d(55%, 0, -100px) scale(0.88) rotateY(-12deg)';
                opacity = 0.5;
                zIndex = 10;
              } else if (offset === -1) {
                transformStyle = 'translate3d(-55%, 0, -100px) scale(0.88) rotateY(12deg)';
                opacity = 0.5;
                zIndex = 10;
              } else if (offset === 2) {
                transformStyle = 'translate3d(95%, 0, -200px) scale(0.75) rotateY(-20deg)';
                opacity = 0.2;
                zIndex = 5;
              } else if (offset === -2) {
                transformStyle = 'translate3d(-95%, 0, -200px) scale(0.75) rotateY(20deg)';
                opacity = 0.2;
                zIndex = 5;
              }

              return (
                <div
                  key={faq.id}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    transform: transformStyle,
                    opacity: opacity,
                    zIndex: zIndex,
                    perspective: '1000px',
                  }}
                  className={`absolute inset-0 m-auto w-full max-w-[340px] sm:max-w-[420px] h-[340px] sm:h-[360px] card-solid p-6 sm:p-7 rounded-3xl cursor-pointer transition-all duration-500 ease-out flex flex-col justify-between border ${isCurrent
                      ? 'border-[var(--gold-500)] bg-[var(--navy-900)] shadow-[0_20px_50px_-15px_rgba(221,188,131,0.25),0_0_35px_-5px_rgba(47,123,255,0.35)]'
                      : 'border-[var(--border-subtle)] bg-[var(--navy-950)] hover:opacity-75'
                    }`}
                >
                  {/* Card Header: Category & Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-inner ${isCurrent
                            ? 'bg-[var(--navy-950)] border-[var(--gold-300)] text-[var(--gold-300)]'
                            : 'bg-[var(--navy-900)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                          }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-mono text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                          {faq.category}
                        </span>
                      </div>

                      <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full border ${isCurrent
                          ? 'bg-[var(--gold-300)]/10 border-[var(--gold-300)]/40 text-[var(--gold-300)]'
                          : 'bg-white/5 border-white/10 text-[var(--text-muted)]'
                        }`}>
                        {faq.badge}
                      </span>
                    </div>

                    {/* Question Title */}
                    <h3 className={`text-base sm:text-lg font-bold leading-snug transition-colors duration-200 ${isCurrent ? 'text-white' : 'text-white/70'
                      }`}>
                      {faq.q}
                    </h3>
                  </div>

                  {/* Answer Text */}
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${isCurrent
                      ? 'bg-[var(--navy-950)]/90 border-[var(--border-subtle)] text-[var(--text-primary)]'
                      : 'bg-transparent border-transparent text-[var(--text-muted)]'
                    }`}>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>

                  {/* Card Footer Step Counter */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    <span>NOTORIUS FAQ</span>
                    <span className="text-[var(--gold-300)] font-bold">{idx + 1} / {faqs.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrow Right */}
          <button
            onClick={handleNext}
            aria-label="Próxima pergunta"
            className="absolute right-0 sm:right-4 z-30 w-11 h-11 rounded-full bg-[var(--navy-900)] border border-[var(--gold-500)]/40 text-[var(--gold-300)] flex items-center justify-center shadow-lg hover:border-[var(--gold-300)] hover:scale-110 active:scale-95 transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {faqs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Ir para a pergunta ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${activeIndex === idx
                  ? 'w-7 bg-[var(--gold-300)]'
                  : 'w-2 bg-[var(--border-subtle)] hover:bg-[var(--gold-500)]/50'
                }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
