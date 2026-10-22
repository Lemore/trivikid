// Trivikid service worker: caches the app shell so the installed app opens offline.
// Pages are network-first (always fresh when online), hashed static files are cache-first,
// and /api/* is never intercepted or cached.

// Bump only when this file's caching logic changes; activation then clears the old caches.
const CACHE_VERSION = "v1";
const PAGES_CACHE = `trivikid-pages-${CACHE_VERSION}`;
const ASSETS_CACHE = `trivikid-assets-${CACHE_VERSION}`;

const PAGES = ["/", "/trivia", "/about"];
const EXTRA_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/favicon.ico",
];

// Saved copies were fetched by this worker, so their request headers differ from the browser's
// (e.g. the optimized image varies on Accept). Match by URL only.
const MATCH = { ignoreVary: true };

const OFFLINE_HTML =
  '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1"><title>טריוויקיד</title></head>' +
  '<body style="font-family:sans-serif;background:#FBF1E2;color:#2B2B2E;text-align:center;padding:48px 16px">' +
  "<p>אין חיבור לאינטרנט. התחברו ונסו שוב</p></body></html>";

// Larger optimized-image widths are only used by very wide screens; skip them to keep the cache small.
const MAX_IMAGE_WIDTH = 1200;

// Same-origin script, style, font and image URLs a page's HTML refers to
// (including the escaped copies inside the inline React data, hence no backslashes).
function extractAssetUrls(html) {
  const urls = new Set();
  const decoded = html.replace(/&amp;/g, "&");
  for (const match of decoded.matchAll(/\/_next\/(?:static\/[^"'\s,)\\]+|image\?[^"'\s,\\]+)/g)) {
    const url = match[0];
    const width = Number(new URL(url, self.location.origin).searchParams.get("w"));
    if (url.startsWith("/_next/image") && width > MAX_IMAGE_WIDTH) continue;
    urls.add(url);
  }
  return urls;
}

// Font files a stylesheet refers to, resolved against the stylesheet's own URL.
function extractCssUrls(css, cssUrl) {
  const urls = new Set();
  for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)/g)) {
    const url = new URL(match[1], new URL(cssUrl, self.location.origin));
    if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
      urls.add(url.pathname);
    }
  }
  return urls;
}

async function precache() {
  const pagesCache = await caches.open(PAGES_CACHE);
  const assetsCache = await caches.open(ASSETS_CACHE);
  const assets = new Set(EXTRA_ASSETS);

  for (const page of PAGES) {
    try {
      const response = await fetch(page, { cache: "no-store" });
      if (!response.ok) continue;
      await pagesCache.put(page, response.clone());
      for (const url of extractAssetUrls(await response.text())) assets.add(url);
    } catch {
      // One unreachable page must not block installation.
    }
  }

  for (const url of [...assets]) {
    if (!url.endsWith(".css")) continue;
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      for (const font of extractCssUrls(await response.clone().text(), url)) assets.add(font);
      await assetsCache.put(url, response);
    } catch {
      // Ignore a single failed file.
    }
  }

  await Promise.all(
    [...assets].map(async (url) => {
      if (await assetsCache.match(url, MATCH)) return;
      try {
        const response = await fetch(url);
        if (response.ok) await assetsCache.put(url, response);
      } catch {
        // Ignore a single failed file.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith("trivikid-") && name !== PAGES_CACHE && name !== ASSETS_CACHE,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Network-first: fresh page when online, the cached copy when offline.
async function networkFirstPage(request, path) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(path, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(path, MATCH)) ||
      (await cache.match("/", MATCH)) ||
      new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    );
  }
}

// Cache-first: for files whose content never changes under the same URL.
async function cacheFirst(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request, MATCH);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

function isCacheFirstAsset(path) {
  return (
    path.startsWith("/_next/static/") ||
    path.startsWith("/_next/image") ||
    path.startsWith("/icons/") ||
    path === "/manifest.webmanifest" ||
    path === "/favicon.ico" ||
    path.startsWith("/apple-icon")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Questions must always come from the server.
  if (url.pathname.startsWith("/api/")) return;
  // In-app navigation data (React Server Components): left to the network; when it fails
  // the Next.js router falls back to a full page load, which is handled below.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request, url.pathname));
    return;
  }

  if (isCacheFirstAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
