'use client';

import { useEffect, useRef, useState } from 'react';
import { MousePointerClick, Link as LinkIcon, QrCode, LineChart } from 'lucide-react';

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
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

  const steps = [
    {
      num: '01',
      icon: MousePointerClick,
      title: 'Escolha o Pacote',
      desc: 'Selecione o nível de presença ideal para o objetivo do seu Reel ou publicação.',
    },
    {
      num: '02',
      icon: LinkIcon,
      title: 'Cole o Link',
      desc: 'Informe o link público do Instagram. Não pedimos senha nem dados da conta.',
    },
    {
      num: '03',
      icon: QrCode,
      title: 'Pague via Pix',
      desc: 'Copie o código Pix e pague pelo app do seu banco. Confirmação em segundos.',
    },
    {
      num: '04',
      icon: LineChart,
      title: 'Acompanhe a Entrega',
      desc: 'Receba um link exclusivo para acompanhar o processamento em tempo real.',
    },
  ];

  // Active step calculation based on progress
  const activeStep = Math.min(3, Math.max(0, Math.round(progress * 3)));

  // Calculate line fill percentage (0 to 1) for segment 0, 1, 2 smoothly
  const getLineFill = (lineIdx: number) => {
    const start = lineIdx / 3;
    const end = (lineIdx + 1) / 3;
    if (progress <= start) return 0;
    if (progress >= end) return 1;
    return (progress - start) / (end - start);
  };

  // Card dimensions for horizontal shift calculation
  const cardWidth = 310; // width of each card in px
  const gapWidth = 90;   // line connector width in px
  const stepDist = cardWidth + gapWidth;
  const totalShift = (steps.length - 1) * stepDist;
  const currentTranslateX = -progress * totalShift;

  return (
    <section
      ref={containerRef}
      className="relative h-[220vh] bg-[var(--navy-950)] border-y border-[var(--border-subtle)]"
    >
      {/* Micro-animations CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes icon-click {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(0.85); }
          50% { transform: scale(1.15); }
          85% { transform: scale(0.95); }
        }
        @keyframes icon-link {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-10deg) scale(1.08); }
          75% { transform: rotate(10deg) scale(1.08); }
        }
        @keyframes icon-scan {
          0%, 100% { transform: translateY(0); opacity: 0.1; }
          50% { transform: translateY(16px); opacity: 1; }
        }
        @keyframes icon-chart {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.1); }
        }

        .animate-icon-click {
          animation: icon-click 0.6s cubic-bezier(0.25, 0.8, 0.25, 1) infinite;
        }
        .animate-icon-link {
          animation: icon-link 1.2s ease-in-out infinite;
        }
        .animate-icon-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: #49b887;
          box-shadow: 0 0 6px #49b887, 0 0 10px #49b887;
          z-index: 10;
          animation: icon-scan 1.5s ease-in-out infinite;
        }
        .animate-icon-chart {
          animation: icon-chart 1.2s ease-in-out infinite;
        }
      `}} />

      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 h-screen flex flex-col justify-center items-center py-8 overflow-hidden">

        {/* Header */}
        <div className="text-center max-w-4xl mx-auto px-4 space-y-1.5 shrink-0 mb-10 sm:mb-28">
          <div className="text-xs font-mono text-[var(--gold-300)] uppercase tracking-wider font-semibold">
            Simplicidade Total
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Da escolha ao acompanhamento, <span className="gold-foil-text font-serif">sem complicação</span>.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Sem formulários extensos, sem filas e sem senhas.</p>
        </div>

        {/* Horizontal Track Container */}
        <div className="w-full relative">
          <div
            className="flex items-center"
            style={{
              paddingLeft: 'calc(50vw - 155px)',
              paddingRight: 'calc(50vw - 155px)',
              transform: `translate3d(${currentTranslateX}px, 0, 0)`,
              willChange: 'transform',
            }}
          >
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              const isPast = activeStep > idx;

              let animationClass = '';
              if (isActive) {
                if (idx === 0) animationClass = 'animate-icon-click';
                if (idx === 1) animationClass = 'animate-icon-link';
                if (idx === 3) animationClass = 'animate-icon-chart';
              }

              return (
                <div key={idx} className="flex items-center shrink-0">

                  {/* Step Card */}
                  <div
                    onClick={() => setActiveStep(idx)}
                    className={`w-[270px] sm:w-[310px] shrink-0 card-solid p-5 rounded-2xl relative transition-all duration-300 cursor-pointer ${isActive
                      ? 'border-[var(--gold-500)] shadow-[0_15px_35px_-10px_rgba(221,188,131,0.3),0_0_25px_-5px_rgba(47,123,255,0.4)] bg-[var(--navy-900)] scale-105 z-20'
                      : isPast
                        ? 'border-[var(--sapphire-action)]/50 bg-[var(--navy-900)]/80 opacity-90 scale-95'
                        : 'opacity-40 border-[var(--border-subtle)] bg-[var(--navy-950)] scale-90'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all duration-300 shadow-inner ${isActive
                        ? 'bg-[var(--navy-950)] border-[var(--gold-300)] text-[var(--gold-300)] scale-110 shadow-[0_0_15px_rgba(221,188,131,0.4)]'
                        : isPast
                          ? 'bg-[var(--navy-950)] border-[var(--sapphire-action)] text-[var(--sapphire-action)]'
                          : 'bg-[var(--navy-900)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}>
                        <div className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
                          <Icon className={`w-5 h-5 ${animationClass}`} />
                          {isActive && idx === 2 && <div className="animate-icon-scan top-0" />}
                        </div>
                      </div>

                      <span className={`text-2xl sm:text-3xl font-black font-mono transition-colors duration-300 ${isActive
                        ? 'text-[var(--gold-300)]'
                        : isPast
                          ? 'text-[var(--sapphire-action)]'
                          : 'text-[#ddbc83]/10'
                        }`}>
                        {step.num}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <h3 className={`text-base sm:text-lg font-bold transition-colors duration-300 ${isActive ? 'text-white font-bold' : 'text-[var(--text-muted)]'
                        }`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${isActive ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]/80'
                        }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* SVG Connecting Line between cards */}
                  {idx < 3 && (
                    <div className="w-[60px] sm:w-[80px] shrink-0 h-[2px] relative mx-1.5">
                      <svg className="w-full h-full" preserveAspectRatio="none">
                        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="var(--border-subtle)" strokeWidth="2" />
                        <line
                          x1="0" y1="0.5" x2="100%" y2="0.5"
                          stroke="var(--sapphire-action)"
                          strokeWidth="2"
                          strokeDasharray="100%"
                          strokeDashoffset={`${100 - getLineFill(idx) * 100}%`}
                          className="transition-all duration-75 ease-out"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
