/**
 * The content security policy. `connect-src 'self'` is the enforcement of "no network calls": the page
 * cannot talk to any other server, whatever code runs in it. Inline scripts and styles are allowed
 * because Next.js and the theme script need them.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** Headers for hosts that read a `_headers` file (Netlify, Cloudflare Pages). A static export cannot set them itself. */
export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": `${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};
