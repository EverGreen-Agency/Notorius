/**
 * Utility module for Instagram URL Parsing & Normalization.
 * Supports /p/{shortcode} and /reel/{shortcode}.
 */

export interface ParsedInstagramUrl {
  isValid: boolean;
  originalUrl: string;
  canonicalUrl?: string;
  shortcode?: string;
  contentType?: 'reel' | 'post';
  errorMessage?: string;
}

export function parseInstagramUrl(inputUrl: string): ParsedInstagramUrl {
  const originalUrl = inputUrl.trim();

  if (!originalUrl) {
    return {
      isValid: false,
      originalUrl,
      errorMessage: 'Por favor, insira a URL da publicação do Instagram.',
    };
  }

  // Ensure protocol prefix for URL constructor
  let normalizedInput = originalUrl;
  if (!/^https?:\/\//i.test(normalizedInput)) {
    normalizedInput = `https://${normalizedInput}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalizedInput);
  } catch {
    return {
      isValid: false,
      originalUrl,
      errorMessage: 'URL inválida. Verifique o formato inserido.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const validHostnames = ['instagram.com', 'www.instagram.com', 'm.instagram.com'];
  if (!validHostnames.includes(hostname)) {
    return {
      isValid: false,
      originalUrl,
      errorMessage: 'A URL deve ser do domínio oficial do Instagram (instagram.com).',
    };
  }

  const pathname = parsed.pathname;
  // Match /reel/{shortcode}, /p/{shortcode} or /post/{shortcode}
  const match = pathname.match(/^\/(p|reel|post)\/([A-Za-z0-9_-]+)\/?/);

  if (!match) {
    if (pathname.includes('/stories/')) {
      return {
        isValid: false,
        originalUrl,
        errorMessage: 'Links de Stories não são aceitos. Envie o link de uma publicação estática ou Reel.',
      };
    }

    return {
      isValid: false,
      originalUrl,
      errorMessage: 'Link inválido. Exemplo correto: https://www.instagram.com/reel/ABC123/',
    };
  }

  const [, rawType, shortcode] = match;
  const contentType = rawType === 'reel' ? 'reel' : 'post';
  const pathPrefix = rawType === 'reel' ? 'reel' : 'p';
  const canonicalUrl = `https://www.instagram.com/${pathPrefix}/${shortcode}/`;

  return {
    isValid: true,
    originalUrl,
    canonicalUrl,
    shortcode,
    contentType,
  };
}
