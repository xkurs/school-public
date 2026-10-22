(() => {
  "use strict";

  const collection = document.getElementById("daily-quotes");
  const figure = document.getElementById("daily-quote");
  if (!collection || !figure) return;
  const disclosure = figure.querySelector("[data-quote-disclosure]");
  if (disclosure) {
    disclosure.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") disclosure.open = true;
    });
    disclosure.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") disclosure.open = false;
    });
    disclosure.addEventListener("keydown", (event) => {
      if (event.key === "Escape") disclosure.open = false;
    });
    document.addEventListener("pointerdown", (event) => {
      if (!disclosure.contains(event.target)) disclosure.open = false;
    });
  }

  try {
    const quotes = JSON.parse(collection.textContent);
    if (!Array.isArray(quotes) || quotes.length === 0) return;
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Moscow", year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", hourCycle: "h23"
    });
    let shownDay;

    function update() {
      const parts = Object.fromEntries(
        formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
      );
      const day = Math.floor(Date.UTC(Number(parts.year), Number(parts.month) - 1,
        Number(parts.day)) / 86400000) - (Number(parts.hour) < 15 ? 1 : 0);
      if (day === shownDay) return;
      if (disclosure) disclosure.open = false;
      const quote = quotes[((day % quotes.length) + quotes.length) % quotes.length];
      figure.querySelector("[data-quote-latin]").textContent = quote.latin;
      figure.querySelector("[data-quote-translation]").textContent = quote.translation;
      const source = figure.querySelector("[data-quote-source]");
      source.textContent = quote.author || quote.source;
      source.href = quote.source_url;
      source.title = quote.source;
      shownDay = day;
    }

    update();
    // An open tab changes within a minute of 15:00 Moscow time, and on return.
    setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
  } catch {
    // The HTML already contains a readable quote if scripts/data are unavailable.
  }
})();
