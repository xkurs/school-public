/* Fresh online pages, verified offline snapshots, and automatic page refresh. */
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
  const panel = document.getElementById?.("site-updates");
  let registration;
  let checking = false;
  let lastCheck = 0;
  let controller = navigator.serviceWorker.controller;
  let reloading = false;
  const watched = new WeakSet();
  function updateInProgress() {
    return Boolean(
      (registration?.installing && registration.installing.state !== "redundant") ||
      registration?.waiting || registration?.active?.state === "activating"
    );
  }
  function showState() {
    if (panel) panel.hidden = !updateInProgress();
  }
  function watch(worker) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener("statechange", () => {
      if (worker.state !== "redundant") activateWaiting();
      showState();
    });
  }
  function activateWaiting() {
    // Retry activation if a browser leaves a verified installer waiting after
    // a previous failed attempt. The worker checks readiness before accepting.
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  }
  async function update(force = false) {
    if (!registration || checking) return;
    // Registration already checks on page load. Avoid overlapping that install
    // with another update, especially when several tabs regain connectivity.
    if (updateInProgress()) {
      activateWaiting();
      showState();
      return;
    }
    if (!force && Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    if (navigator.onLine === false) { showState(); return; }
    checking = true;
    try {
      await registration.update();
      watch(registration.installing);
      activateWaiting();
      showState();
    } catch {
      showState();
    } finally {
      checking = false;
    }
  }
  navigator.serviceWorker.addEventListener?.("controllerchange", () => {
    const next = navigator.serviceWorker.controller;
    // Initial installation can claim the page without making its document stale.
    const replaced = controller && next && controller !== next;
    controller = next;
    if (replaced && !reloading) {
      reloading = true;
      location.reload();
    } else {
      showState();
    }
  });
  navigator.serviceWorker.register(new URL("sw.js", root).href, {
    scope: root.href, updateViaCache: "none"
  }).then(result => {
    registration = result;
    watch(result.installing);
    watch(result.waiting);
    watch(result.active);
    activateWaiting();
    result.addEventListener?.("updatefound", () => {
      watch(result.installing);
      showState();
    });
    showState();
    lastCheck = Date.now();
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => update(true));
      window.addEventListener("offline", () => showState());
      window.addEventListener("pageshow", () => update());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") update();
      });
      setInterval(() => {
        if (document.visibilityState === "visible") update();
      }, 5 * 60 * 1000);
    }
  }).catch(() => {
    showState();
  });
})();
