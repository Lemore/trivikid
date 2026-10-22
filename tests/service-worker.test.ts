// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { beforeEach, describe, expect, test, vi } from "vitest";

const ORIGIN = "http://localhost:3000";
const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

// Turns a Request or string into the path used as the fake cache key.
function keyOf(input: Request | string) {
  return new URL(typeof input === "string" ? input : input.url, ORIGIN).href.replace(ORIGIN, "");
}

// A minimal in-memory CacheStorage.
function createCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      put: async (input: Request | string, response: Response) => {
        store.set(keyOf(input), response);
      },
      match: async (input: Request | string) => store.get(keyOf(input))?.clone(),
    };
  };
  return {
    stores,
    api: {
      open,
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    },
  };
}

type Listener = (event: unknown) => void;

function loadWorker(fetchImpl: (input: Request | string) => Promise<Response>) {
  const listeners = new Map<string, Listener>();
  const cachesFake = createCaches();
  const fetchMock = vi.fn((input: Request | string) =>
    fetchImpl(typeof input === "string" ? new URL(input, ORIGIN).href : input),
  );
  const self = {
    location: new URL(ORIGIN),
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  vm.runInNewContext(source, {
    self,
    caches: cachesFake.api,
    fetch: fetchMock,
    URL,
    Response,
    Set,
    Promise,
  });
  return { listeners, caches: cachesFake, fetchMock, self };
}

// Dispatches a fetch event; returns the response, or null when the worker did not intercept.
async function dispatchFetch(
  listeners: Map<string, Listener>,
  request: Request,
  mode: "navigate" | "no-cors" = "no-cors",
) {
  let responded = null as Promise<Response> | null;
  const event = {
    request: { method: request.method, url: request.url, headers: request.headers, mode },
    respondWith: (p: Promise<Response>) => {
      responded = p;
    },
  };
  listeners.get("fetch")!(event);
  return responded ? await responded : null;
}

async function runLifecycle(listeners: Map<string, Listener>, type: "install" | "activate") {
  let done: Promise<unknown> = Promise.resolve();
  listeners.get(type)!({ waitUntil: (p: Promise<unknown>) => (done = p) });
  await done;
}

const html = (body: string) =>
  new Response(body, { headers: { "Content-Type": "text/html" } });

describe("service worker", () => {
  let offline: boolean;

  beforeEach(() => {
    offline = false;
  });

  test("never intercepts /api requests (GET or POST)", async () => {
    const { listeners, caches, fetchMock } = loadWorker(async () => new Response("{}"));
    const post = new Request(`${ORIGIN}/api/question`, { method: "POST", body: "{}" });
    const get = new Request(`${ORIGIN}/api/question`);
    expect(await dispatchFetch(listeners, post)).toBeNull();
    expect(await dispatchFetch(listeners, get)).toBeNull();
    expect(await dispatchFetch(listeners, get, "navigate")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    for (const store of caches.stores.values()) {
      expect([...store.keys()].some((k) => k.startsWith("/api/"))).toBe(false);
    }
  });

  test("does not intercept in-app navigation data (RSC) requests", async () => {
    const { listeners } = loadWorker(async () => new Response(""));
    const rsc = new Request(`${ORIGIN}/about?_rsc=abc`, { headers: { RSC: "1" } });
    expect(await dispatchFetch(listeners, rsc)).toBeNull();
  });

  test("navigations are network-first and fall back to the cached page offline", async () => {
    const { listeners } = loadWorker(async () => {
      if (offline) throw new TypeError("Failed to fetch");
      return html("<p>about v2</p>");
    });
    const request = new Request(`${ORIGIN}/about`);

    const online = await dispatchFetch(listeners, request, "navigate");
    expect(await online!.text()).toBe("<p>about v2</p>");

    offline = true;
    const cached = await dispatchFetch(listeners, request, "navigate");
    expect(await cached!.text()).toBe("<p>about v2</p>");
  });

  test("an uncached page offline falls back to the Hebrew offline message", async () => {
    const { listeners } = loadWorker(async () => {
      throw new TypeError("Failed to fetch");
    });
    const response = await dispatchFetch(listeners, new Request(`${ORIGIN}/trivia`), "navigate");
    expect(await response!.text()).toContain("אין חיבור לאינטרנט");
  });

  test("static files are served from the cache without the network", async () => {
    const { listeners, fetchMock } = loadWorker(async () => new Response("chunk"));
    const request = new Request(`${ORIGIN}/_next/static/chunks/app.js`);
    await dispatchFetch(listeners, request);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const second = await dispatchFetch(listeners, request);
    expect(await second!.text()).toBe("chunk");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("install precaches the pages and the files their HTML and CSS refer to", async () => {
    const page = `<link rel="stylesheet" href="/_next/static/css/app.css">
      <script src="/_next/static/chunks/main.js"></script>
      <script>self.__next_f.push([1,":HL[\\"/_next/static/media/preload.woff2\\",\\"font\\"]"])</script>
      <img srcset="/_next/image?url=%2Fimages%2Fhome.png&amp;w=640&amp;q=75 1x, /_next/image?url=%2Fimages%2Fhome.png&amp;w=1080&amp;q=75 2x, /_next/image?url=%2Fimages%2Fhome.png&amp;w=3840&amp;q=75 3x">`;
    const { listeners, caches, self } = loadWorker(async (input) => {
      const path = keyOf(input);
      if (path.endsWith(".css")) return new Response("@font-face{src:url(../media/rubik.woff2)}");
      if (["/", "/trivia", "/about"].includes(path)) return html(page);
      return new Response("file");
    });

    await runLifecycle(listeners, "install");

    const pages = [...caches.stores.get("trivikid-pages-v1")!.keys()];
    expect(pages.sort()).toEqual(["/", "/about", "/trivia"]);
    const assets = [...caches.stores.get("trivikid-assets-v1")!.keys()];
    expect(assets).toEqual(
      expect.arrayContaining([
        "/_next/static/css/app.css",
        "/_next/static/chunks/main.js",
        "/_next/static/media/rubik.woff2",
        "/_next/image?url=%2Fimages%2Fhome.png&w=640&q=75",
        "/_next/image?url=%2Fimages%2Fhome.png&w=1080&q=75",
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/_next/static/media/preload.woff2",
      ]),
    );
    // No escaped-quote leftovers and no oversized image widths.
    expect(assets.some((url) => url.includes("\\") || url.endsWith("/"))).toBe(false);
    expect(assets.some((url) => url.includes("w=3840"))).toBe(false);
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  test("activate deletes old trivikid caches and keeps the current ones", async () => {
    const { listeners, caches } = loadWorker(async () => new Response(""));
    for (const name of ["trivikid-pages-v0", "trivikid-assets-v0", "trivikid-pages-v1", "other"]) {
      await caches.api.open(name);
    }
    await runLifecycle(listeners, "activate");
    expect([...caches.stores.keys()].sort()).toEqual(["other", "trivikid-pages-v1"]);
  });
});
