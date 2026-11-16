/* Fresh online pages, verified offline snapshots, and explicit update controls. */
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
  const status = document.getElementById?.("site-update-status");
  const reload = document.getElementById?.("site-update-reload");
  let registration;
  let checking = false;
  let lastCheck = 0;
  let changed = false;
  let statusEpoch = 0;
  let version = "";
  const watched = new WeakSet();
  function show(message = "", updating = false, offerReload = false) {
    if (panel) panel.hidden = !message && !offerReload;
    if (status) {
      status.textContent = message;
      status.hidden = !message;
      status.className = updating ? "is-updating" : "";
    }
    if (reload) {
      reload.hidden = !offerReload;
    }
  }
  function ask(worker) {
    return new Promise(resolve => {
      if (!worker || typeof MessageChannel === "undefined") return resolve(null);
      const channel = new MessageChannel();
      const finish = value => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(value);
      };
      const timer = setTimeout(() => finish(null), 2500);
      channel.port1.onmessage = event => finish(event.data);
      try { worker.postMessage({ type: "GET_STATUS" }, [channel.port2]); }
      catch { finish(null); }
    });
  }
  async function showState() {
    const epoch = ++statusEpoch;
    if (registration?.installing && registration.installing.state !== "redundant") {
      show("Идёт обновление", true);
      return;
    }
    if (registration?.waiting) {
      show("", false, true);
      return;
    }
    if (changed) { show("", false, true); return; }
    const state = await ask(registration?.active || navigator.serviceWorker.controller);
    if (epoch !== statusEpoch) return;
    if (state?.ready && /^[a-f0-9]{64}$/.test(state.version)) version = state.version.slice(0, 12);
    show(version ? "Версия " + version : "");
  }
  function watch(worker) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener("statechange", () => {
      if (worker.state === "redundant") {
        showState();
      } else {
        activateWaiting();
        showState();
      }
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
    if ((registration.installing && registration.installing.state !== "redundant") || registration.waiting) {
      activateWaiting();
      await showState();
      return;
    }
    if (!force && Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    if (navigator.onLine === false) { await showState(); return; }
    checking = true;
    try {
      await registration.update();
      watch(registration.installing);
      activateWaiting();
      await showState();
    } catch {
      await showState();
    } finally {
      checking = false;
    }
  }
  reload?.addEventListener("click", () => {
    activateWaiting();
    location.reload();
  });
  navigator.serviceWorker.addEventListener?.("controllerchange", () => {
    changed = true;
    showState(); // Never interrupt a lesson by reloading automatically.
  });
  navigator.serviceWorker.register(new URL("sw.js", root).href, {
    scope: root.href, updateViaCache: "none"
  }).then(result => {
    registration = result;
    watch(result.installing);
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
