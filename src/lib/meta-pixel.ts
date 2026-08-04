export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

declare global {
  interface Window {
    fbq?: (
      action: string,
      eventName: string,
      options?: Record<string, unknown>
    ) => void;
  }
}

// Track standard PageView
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', 'PageView');
  }
};

// Track standard event (e.g. InitiateCheckout, Purchase, Lead)
export const event = (
  name: string,
  options: Record<string, unknown> = {}
) => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('track', name, options);
  }
};

// Track custom event
export const customEvent = (
  name: string,
  options: Record<string, unknown> = {}
) => {
  if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
    window.fbq('trackCustom', name, options);
  }
};
