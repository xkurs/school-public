/* Personal calendar: all data and links travel with the page, including file: URLs. */
(function () {
  'use strict';
  const source = document.getElementById('calendar-data');
  if (!source) return;
  const data = JSON.parse(source.textContent);
  const grid = document.getElementById('calendar-grid');
  const heading = document.getElementById('calendar-heading');
  const previous = document.getElementById('calendar-prev');
  const next = document.getElementById('calendar-next');
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const pad = number => String(number).padStart(2, '0');
  const validMonth = month => /^\d{4}-(0[1-9]|1[0-2])$/.test(month) && Number(month.slice(0, 4)) > 0;
  const moscowDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  };
  const hashMonth = () => validMonth(location.hash.slice(1)) ? location.hash.slice(1) : null;
  let followsToday = !hashMonth() && !data.initialMonth;
  let displayed = hashMonth() || data.initialMonth || moscowDate().slice(0, 7);
  let lastToday = '';

  function render() {
    const today = moscowDate();
    lastToday = today;
    if (followsToday) displayed = today.slice(0, 7);
    const [year, month] = displayed.split('-').map(Number);
    // setUTCFullYear also handles years 0001–0099 without Date's 1900 offset.
    const first = new Date(0);
    first.setUTCFullYear(year, month - 1, 1);
    const last = new Date(0);
    last.setUTCFullYear(year, month, 0);
    const leading = (first.getUTCDay() + 6) % 7;
    const count = last.getUTCDate();
    grid.replaceChildren();
    for (let position = 0; position < Math.ceil((leading + count) / 7) * 7; position++) {
      const cell = document.createElement('li');
      const day = position - leading + 1;
      if (day < 1 || day > count) {
        cell.className = 'calendar-padding';
        cell.setAttribute('aria-hidden', 'true');
      } else {
        const date = `${displayed}-${pad(day)}`;
        cell.className = 'calendar-day';
        cell.dataset.date = date;
        const time = document.createElement('time');
        time.dateTime = date;
        time.textContent = day;
        let content = time;
        if (data.days[date]) {
          const link = document.createElement('a');
          link.href = data.days[date].url;
          link.setAttribute('aria-label', data.days[date].title);
          link.append(time);
          content = link;
        }
        if (date === today) {
          cell.classList.add('calendar-today');
          content.setAttribute('aria-current', 'date');
        }
        cell.append(content);
      }
      grid.append(cell);
    }
    heading.textContent = `${monthNames[month - 1]} ${year}`;
    previous.disabled = displayed === '0001-01';
    next.disabled = displayed === '9999-12';
    document.getElementById('calendar-empty').textContent = Object.keys(data.days)
      .some(date => date.startsWith(displayed + '-')) ? '' : 'Личных записей за месяц нет.';
  }

  function show(month) {
    if (!validMonth(month)) return;
    followsToday = false;
    displayed = month;
    // The hash keeps arbitrary empty months usable offline and on file: pages.
    location.hash = month;
    render();
  }
  function step(offset) {
    const [year, month] = displayed.split('-').map(Number);
    const index = year * 12 + month - 1 + offset;
    show(`${String(Math.floor(index / 12)).padStart(4, '0')}-${pad(index % 12 + 1)}`);
  }
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  document.getElementById('calendar-today').addEventListener('click', () => show(moscowDate().slice(0, 7)));
  window.addEventListener('hashchange', () => {
    const month = hashMonth();
    followsToday = !month && !data.initialMonth;
    displayed = month || data.initialMonth || moscowDate().slice(0, 7);
    render();
  });
  const refresh = () => { if (moscowDate() !== lastToday) render(); };
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.setInterval(refresh, 60000);
  render();
  document.getElementById('calendar-controls').hidden = false;
  document.getElementById('calendar-static-nav').hidden = true;
})();
