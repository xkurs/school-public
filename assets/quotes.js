(() => {
  "use strict";

  const figure = document.getElementById("daily-quote");
  if (!figure) return;
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
    const quotes = [
      {
        "latin": "Sapere aude.",
        "translation": "Решись быть мудрым.",
        "author": "Гораций",
        "source": "Послания, I.2.40 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/horace/epist1.shtml"
      },
      {
        "latin": "Homines dum docent discunt.",
        "translation": "Обучая других, люди учатся сами.",
        "author": "Сенека",
        "source": "Нравственные письма к Луцилию, 7.8 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/sen/seneca.ep1.shtml"
      },
      {
        "latin": "Felix qui potuit rerum cognoscere causas.",
        "translation": "Счастлив тот, кто сумел познать причины вещей.",
        "author": "Вергилий",
        "source": "Георгики, II.490 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/vergil/geo2.shtml"
      },
      {
        "latin": "Nihil in studiis parvum est.",
        "translation": "В учении нет мелочей.",
        "author": "Квинтилиан",
        "source": "Об образовании оратора, X.3.31 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/quintilian/quintilian.institutio10.shtml"
      },
      {
        "latin": "Inprimisque hominis est propria veri inquisitio atque investigatio.",
        "translation": "Человеку особенно свойственны поиск и исследование истины.",
        "author": "Цицерон",
        "source": "Об обязанностях, I.13",
        "source_url": "https://www.thelatinlibrary.com/cicero/off1.shtml"
      },
      {
        "latin": "Tamdiu discendum est quamdiu nescias.",
        "translation": "Нужно учиться, пока чего-то не знаешь.",
        "author": "Сенека",
        "source": "Нравственные письма к Луцилию, 76.3 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/sen/seneca.ep9.shtml"
      },
      {
        "latin": "Dimidium facti, qui coepit, habet.",
        "translation": "Кто начал, тот уже сделал половину дела.",
        "author": "Гораций",
        "source": "Послания, I.2.40 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/horace/epist1.shtml"
      },
      {
        "latin": "Nullum esse librum tam malum ut non aliqua parte prodesset.",
        "translation": "Нет такой плохой книги, в которой не нашлось бы чего-нибудь полезного.",
        "author": "Плиний Старший, в передаче Плиния Младшего",
        "source": "Плиний Младший. Письма, III.5.10 (фрагмент косвенной речи)",
        "source_url": "https://www.thelatinlibrary.com/pliny.ep3.html"
      },
      {
        "latin": "Longum iter est per praecepta, breve et efficax per exempla.",
        "translation": "Путь через наставления долог, через примеры — краток и действенен.",
        "author": "Сенека",
        "source": "Нравственные письма к Луцилию, 6.5 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/sen/seneca.ep1.shtml"
      },
      {
        "latin": "Ipsa denique utilissima est exercitationi difficultas.",
        "translation": "Сама трудность чрезвычайно полезна для упражнения.",
        "author": "Квинтилиан",
        "source": "Об образовании оратора, X.5.7",
        "source_url": "https://www.thelatinlibrary.com/quintilian/quintilian.institutio10.shtml"
      },
      {
        "latin": "Nullam rem e nihilo gigni divinitus umquam.",
        "translation": "Ничто никогда не возникает из ничего по воле богов.",
        "author": "Лукреций",
        "source": "О природе вещей, I.150 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/lucretius/lucretius1.shtml"
      },
      {
        "latin": "In hoc aliquid gaudeo discere, ut doceam.",
        "translation": "Я радуюсь, узнавая что-то, чтобы научить других.",
        "author": "Сенека",
        "source": "Нравственные письма к Луцилию, 6.4 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/sen/seneca.ep1.shtml"
      },
      {
        "latin": "Omnes enim trahimur et ducimur ad cognitionis et scientiae cupiditatem.",
        "translation": "Всех нас влечёт стремление к познанию и знанию.",
        "author": "Цицерон",
        "source": "Об обязанностях, I.18 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/cicero/off1.shtml"
      },
      {
        "latin": "Est quadam prodire tenus, si non datur ultra.",
        "translation": "Можно продвинуться хотя бы немного, если дальше пока не дано.",
        "author": "Гораций",
        "source": "Послания, I.1.32",
        "source_url": "https://www.thelatinlibrary.com/horace/epist1.shtml"
      },
      {
        "latin": "Non est quod timeas ne operam perdideris, si tibi didicisti.",
        "translation": "Не бойся, что потрудился зря, если учился для себя.",
        "author": "Сенека",
        "source": "Нравственные письма к Луцилию, 7.9 (фрагмент)",
        "source_url": "https://www.thelatinlibrary.com/sen/seneca.ep1.shtml"
      }
    ];
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
    figure.hidden = false;
    // An open tab changes within a minute of 15:00 Moscow time, and on return.
    setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("pageshow", update);
  } catch {
    // If quote formatting is unavailable, the update controls still work.
  }
})();
