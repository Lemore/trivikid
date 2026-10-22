"use client";

import { useEffect } from "react";

// Registers the offline service worker. Production only, so `npm run dev` is never
// served stale files by it.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // The app works without the service worker.
      });
  }, []);

  return null;
}
