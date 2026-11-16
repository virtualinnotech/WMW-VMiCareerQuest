// Router for the modern Cloudflare Workers + static assets model.
//
// This project was originally built as a classic Cloudflare Pages project
// (functions/ directory, file-based routing, `wrangler pages deploy`).
// Cloudflare's dashboard now provisions everything as a plain Worker, and
// `wrangler pages deploy` can't target that -- so this is a thin router
// that reuses the exact same handler files unchanged (they're plain
// `onRequestGet(context)` / `onRequestPost(context)` functions) and falls
// through to the static asset binding for everything else.
import * as sectors from '../functions/api/sectors.js';
import * as claim from '../functions/api/claim.js';
import * as lookup from '../functions/api/lookup.js';
import * as ship from '../functions/api/ship.js';
import * as manifest from '../functions/api/manifest.js';
import * as fillDemo from '../functions/api/admin/fill-demo.js';
import * as listBooths from '../functions/api/admin/list-booths.js';
import * as resetSlot from '../functions/api/admin/reset-slot.js';
import * as updateSlot from '../functions/api/admin/update-slot.js';
import * as setCapacity from '../functions/api/admin/set-capacity.js';
import * as boothLock from '../functions/api/admin/booth-lock.js';
import * as boothEditing from '../functions/api/booth-editing.js';
import * as boothFile from '../functions/api/admin/booth-file.js';
import * as library from '../functions/api/admin/library.js';
import * as optimizedBooth from '../functions/api/admin/optimized-booth.js';
import * as optimizedUndo from '../functions/api/admin/optimized-undo.js';
import * as demoSlot from '../functions/api/admin/demo-slot.js';
import * as checkBooths from '../functions/api/admin/check-booths.js';
import * as diagnostics from '../functions/api/diagnostics.js';
import * as journeyStart from '../functions/api/journey/start.js';
import * as journeyLoad from '../functions/api/journey/load.js';
import * as journeySave from '../functions/api/journey/save.js';
import * as adminJourneys from '../functions/api/admin/journeys.js';
import * as booths from '../functions/booths/[[path]].js';
import computerOnly from '../../desktop141/device.js';

const ROUTES = [
  { method: 'GET', path: '/api/sectors', handler: sectors.onRequestGet },
  { method: 'POST', path: '/api/claim', handler: claim.onRequestPost },
  { method: 'GET', path: '/api/lookup', handler: lookup.onRequestGet },
  { method: 'POST', path: '/api/ship', handler: ship.onRequestPost },
  { method: 'GET', path: '/api/manifest', handler: manifest.onRequestGet },
  { method: 'POST', path: '/api/admin/fill-demo', handler: fillDemo.onRequestPost },
  { method: 'GET', path: '/api/admin/list-booths', handler: listBooths.onRequestGet },
  { method: 'POST', path: '/api/admin/reset-slot', handler: resetSlot.onRequestPost },
  { method: 'POST', path: '/api/admin/update-slot', handler: updateSlot.onRequestPost },
  { method: 'POST', path: '/api/admin/set-capacity', handler: setCapacity.onRequestPost },
  { method: 'GET', path: '/api/booth-editing', handler: boothEditing.onRequestGet },
  { method: 'GET', path: '/api/admin/booth-lock', handler: boothLock.onRequestGet },
  { method: 'POST', path: '/api/admin/booth-lock', handler: boothLock.onRequestPost },
  { method: 'GET', path: '/api/admin/booth-file', handler: boothFile.onRequestGet },
  { method: 'GET', path: '/api/admin/library', handler: library.onRequestGet },
  { method: 'POST', path: '/api/admin/library', handler: library.onRequestPost },
  { method: 'POST', path: '/api/admin/optimized-booth', handler: optimizedBooth.onRequestPost },
  { method: 'POST', path: '/api/admin/optimized-undo', handler: optimizedUndo.onRequestPost },
  { method: 'POST', path: '/api/admin/demo-slot', handler: demoSlot.onRequestPost },
  { method: 'GET', path: '/api/admin/check-booths', handler: checkBooths.onRequestGet },
  { method: 'GET', path: '/api/diagnostics', handler: diagnostics.onRequestGet },
  { method: 'POST', path: '/api/diagnostics', handler: diagnostics.onRequestPost },
  { method: 'POST', path: '/api/journey/start', handler: journeyStart.onRequestPost },
  { method: 'GET', path: '/api/journey', handler: journeyLoad.onRequestGet },
  { method: 'POST', path: '/api/journey/save', handler: journeySave.onRequestPost },
  { method: 'GET', path: '/api/admin/journeys', handler: adminJourneys.onRequestGet },
  { method: 'POST', path: '/api/admin/journeys/delete', handler: adminJourneys.onRequestPost },
];

// The two links given out: /student (the fair) and /vendor (the booth
// builder). They serve the same pages as /venue.html and /design.html, which
// keep working for links already shared and for the pages' own redirects.
const PAGE_ALIASES = { '/student': '/venue.html', '/vendor': '/design.html' };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, waitUntil: ctx.waitUntil.bind(ctx) };

    // Accept /Student, /vendor/ and so on, but serve only the exact short
    // path: the pages load their assets by relative path, which a trailing
    // slash would break.
    const alias = url.pathname.replace(/\/+$/, '').toLowerCase();
    if (PAGE_ALIASES[alias] && url.pathname !== alias) {
      return Response.redirect(new URL(alias + url.search, request.url).toString(), 301);
    }
    const page = PAGE_ALIASES[url.pathname] || url.pathname;

    if (['/', '/venue.html', '/design.html'].includes(page) && computerOnly.isHandheld({
      userAgent: request.headers.get('user-agent') || '',
      userAgentData: { mobile: request.headers.get('sec-ch-ua-mobile') === '?1' },
    })) {
      return new Response(null, {status: 302, headers: {
        location: new URL('/computer-required.html', request.url).href,
        'cache-control': 'private, no-store', vary: 'User-Agent, Sec-CH-UA-Mobile',
      }});
    }

    // "/" used to serve a leftover mock claim page from before the real
    // studio (design.html) existed -- it posted plain JSON to /api/ship,
    // which has expected a real multipart GLB upload for a long time, so
    // it was just a broken dead end. There is no third link: employers get
    // /design.html directly, students get /venue.html directly. Anyone who
    // lands on the bare domain is far more likely to be a student, so send
    // them straight into the fair.
    if (url.pathname === '/') {
      return Response.redirect(new URL('/student', request.url).toString(), 302);
    }

    // design.html is a ~62MB single-file export of the booth studio --
    // Cloudflare's static asset serving (both the old Pages product and
    // the current Workers+assets model) caps individual files at 25MB, so
    // it can't be a static asset. R2 has no such limit, so it's uploaded
    // there at build/deploy time (see sync:design-page:*) and streamed out
    // here instead.
    if (page === '/design.html') {
      const object = await env.BOOTHS.get('static/design.html');
      if (!object) return new Response('design.html not uploaded to R2 yet.', { status: 404 });
      const headers = new Headers();
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'public, max-age=300');
      return new Response(object.body, { headers });
    }

    // venue.html (the student "walk the fair" link) is the same ~47MB venue
    // renderer the studio's own "Walk venue" tab embeds. Same 25MB
    // static-asset limit problem as design.html, same R2 fix. Anywhere but
    // inside the studio -- opened directly, or embedded in a school or event
    // website -- its own script switches into student mode: it hides the
    // employer/QA controls and fetches /api/manifest itself to place every
    // shipped booth.
    if (page === '/venue.html') {
      const object = await env.BOOTHS.get('static/venue.html');
      if (!object) return new Response('venue.html not uploaded to R2 yet.', { status: 404 });
      const headers = new Headers();
      headers.set('content-type', 'text/html; charset=utf-8');
      headers.set('cache-control', 'public, max-age=300');
      return new Response(object.body, { headers });
    }

    if (url.pathname.startsWith('/booths/')) {
      const segments = url.pathname.slice('/booths/'.length).split('/');
      return booths.onRequestGet({ ...context, params: { path: segments } });
    }

    const route = ROUTES.find((r) => r.method === request.method && r.path === url.pathname);
    if (route) return route.handler(context);

    const asset = await env.ASSETS.fetch(request);
    if (asset.status === 404 && request.method === 'GET') return (await largeAsset(url, context)) || asset;
    return asset;
  },
};

// Game files over Cloudflare's 25 MB static-asset limit (the city model, the
// MRI doctor) are listed in public/.assetsignore, uploaded to R2 under
// static/ by scripts/upload-large-assets.cjs, and served from there. They are
// edge-cached like booth files, so a class full of students hits the cache.
async function largeAsset(url, context) {
  const key = 'static' + url.pathname;
  if (!/^static\/[\w./-]+\.(glb|gz)$/.test(key) || key.includes('..')) return null;
  const cache = caches.default;
  const cacheKey = new Request(url.toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const object = await context.env.BOOTHS.get(key);
  if (!object) return null;
  const headers = new Headers();
  headers.set('content-type', key.endsWith('.gz') ? 'application/gzip' : 'model/gltf-binary');
  headers.set('cache-control', 'public, max-age=86400');
  headers.set('etag', object.httpEtag);
  const response = new Response(object.body, { headers });
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
