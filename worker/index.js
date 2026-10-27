/**
 * Toolbench — Workers entry point.
 *
 * Cloudflare Workers serving static assets do NOT read the Pages-style
 * `_headers` file, so the response headers are applied here instead. Keep this
 * in sync with what used to live in `_headers`.
 *
 * Everything else — 404 handling, asset resolution, ETags — is delegated to the
 * ASSETS binding, which is faster and better tested than a hand-rolled router.
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()'
};

// Statuses whose responses must not carry a body.
const BODYLESS = new Set([204, 205, 304]);

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const url = new URL(request.url);

    const headers = new Headers(response.headers);
    for (const name in SECURITY_HEADERS) {
      headers.set(name, SECURITY_HEADERS[name]);
    }

    const contentType = response.headers.get('content-type') || '';

    if (url.pathname.startsWith('/assets/')) {
      // Filenames here are stable, so a year is safe. Bump the query string or
      // rename the file when the contents change.
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (contentType.indexOf('text/html') !== -1) {
      // HTML must revalidate, otherwise a deploy stays invisible to visitors
      // whose edge node has the old copy.
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    if (BODYLESS.has(response.status)) {
      return new Response(null, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
};
