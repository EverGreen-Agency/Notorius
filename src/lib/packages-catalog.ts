export interface PackageItemConfig {
  metric: 'views' | 'likes' | 'saves' | 'shares';
  serviceId: number | null; // null if pending setup in DB/admin (e.g. TOP)
  quantity: number;
  displayLabel: string;
  isGatekeeper?: boolean; // Views act as the compatibility gatekeeper
}

export interface PackageConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  items: PackageItemConfig[];
}

export const INITIAL_PACKAGES: PackageConfig[] = [
  {
    id: 'pkg_start',
    slug: 'start',
    name: 'Start',
    description: 'Para testar e dar o primeiro impulso na sua publicação.',
    priceCents: 990,
    currency: 'BRL',
    isFeatured: false,
    isActive: true,
    displayOrder: 1,
    items: [
      { metric: 'views', serviceId: 22, quantity: 8000, displayLabel: '8.000 visualizações', isGatekeeper: true },
      { metric: 'likes', serviceId: 21, quantity: 100, displayLabel: '100 curtidas' },
      { metric: 'saves', serviceId: 20, quantity: 100, displayLabel: '100 salvamentos' },
      { metric: 'shares', serviceId: 19, quantity: 100, displayLabel: '100 compartilhamentos' },
    ],
  },
  {
    id: 'pkg_impulso',
    slug: 'impulso',
    name: 'Impulso',
    description: 'Recomendado para Reels, collabs e posts estratégicos que precisam de presença forte.',
    priceCents: 1990,
    currency: 'BRL',
    isFeatured: true,
    isActive: true,
    displayOrder: 2,
    items: [
      { metric: 'views', serviceId: 27, quantity: 25000, displayLabel: '25.000 visualizações', isGatekeeper: true },
      { metric: 'likes', serviceId: 28, quantity: 300, displayLabel: '300 curtidas' },
      { metric: 'saves', serviceId: 29, quantity: 200, displayLabel: '200 salvamentos' },
      { metric: 'shares', serviceId: 30, quantity: 200, displayLabel: '200 compartilhamentos' },
    ],
  },
  {
    id: 'pkg_pro',
    slug: 'pro',
    name: 'Pro',
    description: 'Para lançamentos, campanhas de marcas e conteúdos de alto impacto.',
    priceCents: 4990,
    currency: 'BRL',
    isFeatured: false,
    isActive: true,
    displayOrder: 3,
    items: [
      { metric: 'views', serviceId: 35, quantity: 80000, displayLabel: '80.000 visualizações', isGatekeeper: true },
      { metric: 'likes', serviceId: 36, quantity: 900, displayLabel: '900 curtidas' },
      { metric: 'saves', serviceId: 37, quantity: 400, displayLabel: '400 salvamentos' },
      { metric: 'shares', serviceId: 38, quantity: 500, displayLabel: '500 compartilhamentos' },
    ],
  },
  {
    id: 'pkg_top',
    slug: 'top',
    name: 'Top',
    description: 'Âncora de valor máximo para presença maciça e máxima alcance.',
    priceCents: 9990,
    currency: 'BRL',
    isFeatured: false,
    isActive: true,
    displayOrder: 4,
    items: [
      { metric: 'views', serviceId: 45, quantity: 250000, displayLabel: '250.000 visualizações', isGatekeeper: true },
      { metric: 'likes', serviceId: 46, quantity: 2500, displayLabel: '2.500 curtidas' },
      { metric: 'saves', serviceId: 47, quantity: 1000, displayLabel: '1.000 salvamentos' },
      { metric: 'shares', serviceId: 48, quantity: 1000, displayLabel: '1.000 compartilhamentos' },
    ],
  },
];

export function getPackageBySlug(slug: string): PackageConfig | undefined {
  return INITIAL_PACKAGES.find((p) => p.slug.toLowerCase() === slug.toLowerCase() && p.isActive);
}

export interface OrderBumpConfig {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  badge?: string;
}

export const ORDER_BUMPS: OrderBumpConfig[] = [
  {
    id: 'bump_warranty_30d',
    name: 'Garantia Estendida de Proteção (30 Dias)',
    description: 'Monitoramento e reposição sem custo em caso de flutuações naturais de métricas nos próximos 30 dias.',
    priceCents: 790,
    badge: 'MAIS POPULAR',
  },
  {
    id: 'bump_vip_support',
    name: 'Atendimento Prioritário via WhatsApp',
    description: 'Acompanhamento dedicado com agente humano no WhatsApp para tirar dúvidas da publicação.',
    priceCents: 490,
    badge: 'DEDICADO',
  },
];

export function getOrderBumpById(id: string): OrderBumpConfig | undefined {
  return ORDER_BUMPS.find((b) => b.id === id);
}

