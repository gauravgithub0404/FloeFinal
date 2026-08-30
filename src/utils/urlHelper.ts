/**
 * URL Helper for Multi-Device and Public Remote Computer Testing
 */

export const PUBLIC_DEV_HOST = 'https://ais-dev-3fkllpjzu3ngyansx5au3u-459630089354.asia-southeast1.run.app';
export const PUBLIC_SHARED_HOST = 'https://ais-pre-3fkllpjzu3ngyansx5au3u-459630089354.asia-southeast1.run.app';

/**
 * Check if a host is local only (localhost / 127.0.0.1)
 */
export function isLocalhost(urlOrHost?: string): boolean {
  if (!urlOrHost && typeof window !== 'undefined') {
    urlOrHost = window.location.hostname;
  }
  if (!urlOrHost) return false;
  return urlOrHost.includes('localhost') || urlOrHost.includes('127.0.0.1') || urlOrHost.includes('0.0.0.0');
}

/**
 * Get the current active origin (Always guarantees a live, reachable URL)
 */
export function getCurrentOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }
  return PUBLIC_DEV_HOST;
}

/**
 * Get the Public Shareable Testbed URL (Accessible from any computer, tablet, or phone)
 * Dynamically resolves to the current active host (ais-dev or custom domain)
 */
export function getPublicTestbedUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = encodeURIComponent((domain || 'app').toLowerCase());
  
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin.startsWith('http')) {
    const basePath = window.location.pathname || '/';
    return `${window.location.origin}${basePath}?testbed=${sanitizedDomain}`;
  }

  // Authoritative fallback to active Cloud Run development server
  return `${PUBLIC_DEV_HOST}/?testbed=${sanitizedDomain}`;
}

/**
 * Get Localhost URL (Only works on the current local machine)
 */
export function getLocalTestbedUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = encodeURIComponent((domain || 'app').toLowerCase());
  if (typeof window !== 'undefined' && window.location?.origin) {
    const basePath = window.location.pathname || '/';
    return `${window.location.origin}${basePath}?testbed=${sanitizedDomain}`;
  }
  return `http://localhost:3000/?testbed=${sanitizedDomain}`;
}

/**
 * Get Render Cloud Service URL (Deployed on Render.com)
 */
export function getRenderCloudUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = (domain || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
  return `https://floe-${sanitizedDomain}.onrender.com`;
}

