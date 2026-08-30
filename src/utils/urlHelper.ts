/**
 * URL Helper for Public Multi-Device and Remote Computer Testing
 */

export const PUBLIC_SHARED_HOST = 'https://ais-pre-3fkllpjzu3ngyansx5au3u-459630089354.asia-southeast1.run.app';
export const PUBLIC_DEV_HOST = 'https://ais-dev-3fkllpjzu3ngyansx5au3u-459630089354.asia-southeast1.run.app';

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
 * Get the current active origin
 */
export function getCurrentOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    // If running on localhost inside container, return window.location.origin
    return window.location.origin;
  }
  return PUBLIC_SHARED_HOST;
}

/**
 * Get the Public Shareable Testbed URL (Accessible from ANY computer or phone worldwide)
 */
export function getPublicTestbedUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = encodeURIComponent((domain || 'app').toLowerCase());
  
  // If we are already on a public Cloud Run or HTTPS domain, use current origin
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (!isLocalhost(host)) {
      return `${window.location.origin}${window.location.pathname}?testbed=${sanitizedDomain}`;
    }
  }

  // Fallback to authoritative public shared Cloud Run URL
  return `${PUBLIC_SHARED_HOST}/?testbed=${sanitizedDomain}`;
}

/**
 * Get Localhost URL (Only works on the current machine)
 */
export function getLocalTestbedUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = encodeURIComponent((domain || 'app').toLowerCase());
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${window.location.pathname}?testbed=${sanitizedDomain}`;
  }
  return `http://localhost:3000/?testbed=${sanitizedDomain}`;
}

/**
 * Get Render Cloud Service URL
 */
export function getRenderCloudUrl(domain: string = 'leave-management'): string {
  const sanitizedDomain = (domain || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30);
  return `https://${sanitizedDomain}-test.onrender.com`;
}
