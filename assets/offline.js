/* Automatic offline snapshots; no controls, prompts, or page reloads. */
(() => {
  "use strict";
  const script = document.currentScript;
  if (!script || !script.src || !("serviceWorker" in navigator)) return;
  const page = new URL(location.href);
  const loopback = page.hostname === "localhost" || page.hostname.endsWith(".localhost") ||
    page.hostname === "[::1]" || /^127(?:\.\d{1,3}){3}$/.test(page.hostname);
  if (page.protocol !== "https:" && !(page.protocol === "http:" && loopback)) return;
  const root = new URL("../", script.src);
  if (root.origin !== page.origin) return;
  navigator.serviceWorker.register(new URL("sw.js", root).href, {
    scope: root.href, updateViaCache: "none"
  }).catch(() => {
    // Offline visits and failed updates retain the previous complete snapshot.
  });
})();
