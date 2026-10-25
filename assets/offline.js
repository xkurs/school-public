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
  const check = document.getElementById?.("site-update-check");
  const reload = document.getElementById?.("site-update-reload");
  const savedPage = Boolean(document.querySelector?.('meta[name="school-offline"]'));
  let registration;
  let checking = false;
  let lastCheck = 0;
  let changed = false;
  let statusEpoch = 0;
  const watched = new WeakSet();
  function say(message) {
    if (status) status.textContent = message;
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
  async function showState(prefix = "") {
    const epoch = ++statusEpoch;
    if (registration?.installing) {
      say("Сохраняем обновление для чтения без интернета. Предыдущая копия остаётся доступной.");
      return;
    }
    if (registration?.waiting) {
      if (reload) reload.hidden = false;
      say("Обновление загружено и ожидает включения. Нажмите «Обновить страницу». Пока используется прежняя офлайн-копия.");
      return;
    }
    const state = await ask(registration?.active);
    if (epoch !== statusEpoch) return;
    const saved = state?.ready && /^[a-f0-9]{64}$/.test(state.version)
      ? "Офлайн-копия готова · версия " + state.version.slice(0, 12) + "."
      : "Готовность офлайн-копии пока не подтверждена.";
    const network = navigator.onLine === false || savedPage
      ? "Открыта сохранённая страница; она может быть устаревшей. Для свежих материалов нужны связь и обновление страницы. " : "";
    say(network + prefix + saved + (changed ? " Доступна новая копия — обновите страницу, когда удобно." : ""));
  }
  function watch(worker) {
    if (!worker || watched.has(worker)) return;
    watched.add(worker);
    worker.addEventListener("statechange", () => {
      if (worker.state === "redundant") {
        ++statusEpoch;
        say("Не удалось сохранить обновление. Прежняя копия сохранена; повторите проверку при устойчивой связи.");
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
  async function update(manual = false) {
    if (!registration || checking) return;
    // Registration already checks on page load. Avoid overlapping that install
    // with another update, especially when several tabs regain connectivity.
    if (registration.installing || registration.waiting) {
      activateWaiting();
      await showState();
      return;
    }
    if (!manual && Date.now() - lastCheck < 60000) return;
    lastCheck = Date.now();
    if (navigator.onLine === false) { await showState(); return; }
    checking = true;
    if (check) check.disabled = true;
    ++statusEpoch;
    say("Проверяем обновления…");
    try {
      await registration.update();
      watch(registration.installing);
      activateWaiting();
      if (manual && reload) reload.hidden = false;
      await showState(manual ? "Проверка выполнена. " : "");
    } catch {
      ++statusEpoch;
      say("Не удалось проверить обновления. Сохранённая копия может быть устаревшей; повторите проверку при устойчивой связи.");
    } finally {
      checking = false;
      if (check) check.disabled = false;
    }
  }
  check?.addEventListener("click", () => update(true));
  reload?.addEventListener("click", () => {
    activateWaiting();
    location.reload();
  });
  navigator.serviceWorker.addEventListener?.("controllerchange", () => {
    changed = true;
    if (reload) reload.hidden = false;
    showState(); // Never interrupt a lesson by reloading automatically.
  });
  navigator.serviceWorker.register(new URL("sw.js", root).href, {
    scope: root.href, updateViaCache: "none"
  }).then(result => {
    registration = result;
    if (panel) panel.hidden = false;
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
    if (panel) panel.hidden = false;
    say("Не удалось проверить офлайн-копию. Для актуальных материалов нужна связь с сайтом.");
  });
})();
