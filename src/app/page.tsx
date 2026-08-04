import { SiteHeader } from '@/components/SiteHeader';
import { Hero } from '@/components/Hero';
import { TrustStrip } from '@/components/TrustStrip';
import { PackageGrid } from '@/components/PackageGrid';
import { SocialProof } from '@/components/SocialProof';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQ } from '@/components/FAQ';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata = {
  title: 'Notorius — Aumente a Presença do seu Reel ou Post no Instagram',
  description: 'Pacotes automatizados de visualizações e interações para Reels e publicações do Instagram. Pagamento único via Pix, sem senha e 100% automático.',
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://notorios.com.br/#organization',
        name: 'Notorius',
        url: 'https://notorios.com.br',
        logo: 'https://notorios.com.br/logo.svg',
        sameAs: ['https://www.instagram.com/notorius.ai/'],
        description: 'Plataforma automatizada de impulsionamento e presença digital para Instagram.',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://notorios.com.br/#website',
        url: 'https://notorios.com.br',
        name: 'Notorius',
        publisher: { '@id': 'https://notorios.com.br/#organization' },
        inLanguage: 'pt-BR',
      },
      {
        '@type': 'Product',
        '@id': 'https://notorios.com.br/#product',
        name: 'Pacotes de Presença & Engajamento Instagram - Notorius',
        description: 'Pacotes automatizados de visualizações e interações para Reels e publicações do Instagram. Pagamento único via Pix, sem senha e 100% automático.',
        brand: { '@id': 'https://notorios.com.br/#organization' },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'BRL',
          lowPrice: '9.90',
          highPrice: '99.90',
          offerCount: '4',
          offers: [
            {
              '@type': 'Offer',
              name: 'Pacote Start',
              price: '9.90',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: 'https://notorios.com.br/checkout?package=start',
            },
            {
              '@type': 'Offer',
              name: 'Pacote Impulso',
              price: '19.90',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: 'https://notorios.com.br/checkout?package=impulso',
            },
            {
              '@type': 'Offer',
              name: 'Pacote Autoridade',
              price: '49.90',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: 'https://notorios.com.br/checkout?package=autoridade',
            },
            {
              '@type': 'Offer',
              name: 'Pacote Domínio',
              price: '99.90',
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: 'https://notorios.com.br/checkout?package=dominio',
            },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://notorios.com.br/#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Qual link devo enviar?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Você deve enviar a URL pública de uma publicação do Instagram (ex: instagram.com/reel/ABC123/). Links de perfis e Stories não são aceitos.',
            },
          },
          {
            '@type': 'Question',
            name: 'Preciso informar minha senha?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Nunca! Nós jamais solicitamos senha ou acesso à sua conta. O processo exige apenas o link público da publicação.',
            },
          },
          {
            '@type': 'Question',
            name: 'Quando o processamento começa e qual o prazo?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Imediatamente após a confirmação do Pix! Os primeiros resultados entram em minutos e 100% da entrega é concluída em até 24 horas.',
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <Hero />
      <TrustStrip />
      <PackageGrid />
      <SocialProof />
      <HowItWorks />
      <FAQ />
      <SiteFooter />
    </main>
  );
}
