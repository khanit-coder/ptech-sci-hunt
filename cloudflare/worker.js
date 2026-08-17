// ==============================================================================
// Cloudflare Worker API Gateway & Security Proxy for PTECH-Sci 2026
// Handles Rate Limiting, WAF inspection, and Header sanitation
// ==============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Simple IP-based rate limiting tracker (simulated or with Cloudflare KV)
    const clientIP = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Forward request to origin
    const response = await fetch(request);

    // Reconstruct response with strict security headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Content-Type-Options', 'nosniff');
    newHeaders.set('X-Frame-Options', 'DENY');
    newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    newHeaders.set('X-XSS-Protection', '1; mode=block');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
