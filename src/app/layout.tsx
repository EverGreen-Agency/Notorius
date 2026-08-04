import type { Metadata } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import './globals.css';
import { MetaPixel } from '@/components/analytics/MetaPixel';

const fontDisplay = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

const fontSans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://notorius.ai'),
  title: 'Notorius — Presença Digital que se Percebe',
  description: 'Pacotes automatizados de visualizações e interações para Reels e publicações do Instagram. Pagamento único via Pix, sem senha e 100% automático.',
  keywords: [
    'notorius',
    'engajamento instagram',
    'visualizacoes reels',
    'curtidas instagram',
    'impulsionar post instagram',
    'pushin pay',
    'presenca digital',
  ],
  alternates: {
    canonical: 'https://notorius.ai',
  },
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Notorius — Presença Digital que se Percebe',
    description: 'Pacotes automatizados de visualizações e interações para Reels e publicações do Instagram. Pagamento único via Pix, sem senha e 100% automático.',
    url: 'https://notorius.ai',
    siteName: 'Notorius',
    images: [
      {
        url: '/banner_hero.webp',
        width: 1200,
        height: 630,
        alt: 'Notorius Presença & Desempenho Digital',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notorius — Presença Digital que se Percebe',
    description: 'Pacotes automatizados de visualizações e interações para Reels e publicações do Instagram. Pagamento único via Pix, sem senha e 100% automático.',
    images: ['/banner_hero.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--ink-950)] text-[var(--ivory-50)]">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
