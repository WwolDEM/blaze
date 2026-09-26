(function () {
  'use strict';

  const D = window.BLAZE_DATA || { products: [], glossary: [], packItems: [], routes: {}, seasons: {} };

  /* =========================================================
     ПРАВИЛА КОНСТРУКТОРА
     Все тексты и условия — здесь. Меняйте смело, разметка соберётся сама.
     ========================================================= */

  const RULES = {
    steps: [
      {
        id: 'place',
        question: 'куда идём?',
        options: [
          { value: 'mountains', label: 'горы' },
          { value: 'forest', label: 'лес' },
          { value: 'water', label: 'вода' },
          { value: 'steppe', label: 'степь' },
        ],
      },
      {
        id: 'season',
        question: 'когда?',
        options: [
          { value: 'summer', label: 'лето' },
          { value: 'shoulder', label: 'межсезонье' },
          { value: 'winter', label: 'зима' },
        ],
      },
      {
        id: 'duration',
        question: 'сколько?',
        options: [
          { value: 'day', label: 'без ночёвки' },
          { value: 'weekend', label: 'выходные' },
          { value: 'week', label: 'неделя' },
          { value: 'long', label: 'дольше' },
        ],
      },
      {
        id: 'experience',
        question: 'ваш опыт?',
        options: [
          { value: 'first', label: 'первый раз' },
          { value: 'some', label: 'бывал(а)' },
          { value: 'pro', label: 'опытный' },
        ],
      },
      {
        id: 'stay',
        question: 'где ночуете?',
        options: [
          { value: 'tent', label: 'палатка' },
          { value: 'hut', label: 'домик' },
          { value: 'none', label: 'без ночёвки' },
        ],
        // Если поход без ночёвки — вопрос про ночлег пропускаем
        skipIf: (answers) => answers.duration === 'day',
      },
    ],

    // Предвыбор из адреса страницы: index.html?route=gory&season=zima#builder
    urlParams: {
      route: { step: 'place', values: D.routes },
      season: { step: 'season', values: D.seasons },
    },

    // Три слоя одежды
    layers: [
      {
        id: 'base',
        title: 'базовый слой',
        bySeason: {
          summer: ['лёгкая синтетическая футболка', 'лонгслив'],
          shoulder: ['термобельё'],
          winter: ['плотное шерстяное термобельё'],
        },
      },
      {
        id: 'mid',
        title: 'утепляющий слой',
        bySeason: {
          summer: ['лёгкий флис'],
          shoulder: ['флис', 'пуховый жилет'],
          winter: ['пуховка'],
        },
      },
      {
        id: 'shell',
        title: 'защитный слой',
        // Мембрана нужна в горах, в межсезонье и зимой
        when: (a) => a.place === 'mountains' || a.season === 'shoulder' || a.season === 'winter',
        ifTrue: ['мембранная куртка', 'мембранные брюки'],
        ifFalse: ['ветровка'],
      },
    ],

    // Снаряжение
    gear: {
      backpack: {
        title: 'рюкзак',
        byDuration: {
          day: ['рюкзак 20–25 л'],
          weekend: ['рюкзак 35–45 л'],
          week: ['рюкзак 55–65 л'],
          long: ['рюкзак 70+ л'],
        },
      },
      sleep: {
        title: 'ночлег',
        byStay: {
          tent: ['палатка', 'коврик', 'спальник с комфортом {temp}'],
          hut: ['вкладыш в спальник'],
          none: [],
        },
        bagComfort: { summer: '+10 °C', shoulder: '0 °C', winter: '−15 °C' },
      },
      shoes: {
        title: 'обувь',
        byPlace: {
          mountains: ['трекинговые ботинки'],
          forest: ['трейловые кроссовки'],
          steppe: ['трейловые кроссовки'],
          water: ['сандалии', 'гермомешки для вещей'],
        },
      },
    },

    // Совет от бренда по маршруту
    tips: {
      mountains: 'Погода в горах меняется за час: мембрана обязательна.',
      forest: 'От клещей спасает закрытая одежда светлых цветов.',
      water: 'Упакуйте всё в гермомешки, даже если не планируете купаться.',
      steppe: 'Главное — защита от солнца и ветра: кепка, баф, очки.',
    },

    // Блок для новичков
    layersGuide: {
      showIf: (a) => a.experience === 'first',
      title: 'как работают слои',
      items: [
        { name: 'Базовый', text: 'отводит влагу от кожи, чтобы вы не мёрзли в мокрой одежде.' },
        { name: 'Утепляющий', text: 'держит тепло тела — его снимают на подъёме и надевают на привале.' },
        { name: 'Защитный', text: 'спасает от ветра и дождя и не даёт промокнуть остальным слоям.' },
      ],
    },

    // Интерфейсные тексты
    text: {
      step: 'шаг {n} из {total}',
      finish: 'финиш',
      back: 'назад',
      next: 'далее',
      resultTitle: 'ваш комплект собран',
      summaryLabel: 'ваш маршрут',
      clothesTitle: 'одежда',
      gearTitle: 'снаряжение',
      tipLabel: 'совет от blaze',
      addToCart: 'положить комплект в корзину',
      checklist: 'скачать чек-лист',
      restart: 'собрать заново',
      toast: 'комплект добавлен',
      printTitle: 'чек-лист похода',
    },
  };

  /* =========================================================
     ТЕКСТЫ КОРЗИНЫ
     ========================================================= */

  const CART = {
    storageKey: 'blaze-cart',
    text: {
      kitType: 'комплект',
      productType: 'товар',
      contents: 'состав',
      things: ['вещь', 'вещи', 'вещей'],
      remove: 'удалить',
      decrease: 'меньше',
      increase: 'больше',
      total: 'итого',
      kitsNote: 'Стоимость комплектов посчитаем после подбора размеров в магазине.',
      checkout: 'оформить заказ',
      checkoutToast: 'Это учебный проект — заказ никуда не отправится',
      clear: 'очистить корзину',
      clearConfirm: 'Очистить корзину?',
      emptyTitle: 'в корзине пока пусто',
      emptyText: 'Соберите комплект под свой маршрут или выберите вещи в каталоге.',
      emptyCta: 'собрать поход',
      kitExists: 'Этот комплект уже в корзине',
      productAdded: '{name} — в корзине',
    },
  };

  /* =========================================================
     ТЕКСТЫ «СОБЕРИ РЮКЗАК» И ПАСПОРТА ВЕЩИ
     ========================================================= */

  const PACK = {
    storageKey: 'blaze-pack',
    defaultVolume: 45,
    heavy: 15000, // граммы
    normal: 10000,
    text: {
      empty: 'Положите вещи в рюкзак — здесь появятся вес и подсказка.',
      overflow: 'не влезет: возьмите рюкзак побольше или оставьте лишнее',
      heavy: 'тяжеловато для первого похода: проверьте, всё ли нужно',
      normal: 'нормально для похода выходного дня',
      light: 'легко: отличный вес для старта',
      add: 'положить в рюкзак: {name}',
      remove: 'выложить из рюкзака: {name}',
      added: '{name} — в рюкзаке · {weight} кг · {volume} из {max} л',
      inPack: 'в рюкзаке {n}',
      svgTitle: 'рюкзак заполнен на {percent} %',
      needKit: 'Сначала соберите поход в конструкторе выше',
      fromKit: 'Взяли из конструктора: {n} {things}. Не забудьте аптечку и фонарик',
      clearConfirm: 'Выложить всё из рюкзака?',
    },
  };

  const ITEM = {
    pathKey: 'blaze-path-',
    text: {
      label: 'паспорт вещи',
      materials: 'из чего сделана',
      care: 'как ухаживать',
      routes: 'куда с ней идти',
      routeCta: 'собрать поход',
      seasons: 'сезоны',
      toCart: 'в корзину',
      toCatalog: 'весь каталог',
      pathLabel: 'мой путь с этой вещью',
      pathZero: '{noun} ждёт первого похода',
      pathTitle: '{noun} {verb} {hikes} {hikesWord} · {km} км',
      hikes: ['поход', 'похода', 'походов'],
      km: 'км',
      addHike: '+ поход',
      reset: 'обнулить',
      resetConfirm: 'Обнулить счётчик походов этой вещи?',
      kmError: 'Введите число километров от 0 до 2000',
      qrCaption: 'этот код печатается на бирке',
      lostTitle: 'метка потерялась',
      lostText: 'Такой вещи нет в каталоге — возможно, ссылка устарела или в ней опечатка.',
      lostCta: 'в каталог',
    },
  };

  /* =========================================================
     Утилиты
     ========================================================= */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ESC[c]);
  const fill = (tpl, data) => tpl.replace(/\{(\w+)\}/g, (_, key) => (key in data ? data[key] : ''));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 250;
  const PAGE = document.body.dataset.page || 'home';
  const HOME = PAGE === 'home' ? '' : 'index.html';
  const formatPrice = (n) => `${n.toLocaleString('ru-RU')} ₽`;
  const formatNum = (n, digits = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits || 1 });
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const productById = (id) => D.products.find((p) => p.id === id);

  function plural(n, forms) {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
    return forms[2];
  }

  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // без хранилища всё работает до перезагрузки страницы
    }
  }

  /* =========================================================
     Ночной режим «у костра»
     Режим ставится ещё в <head>, здесь — переключатель и запоминание.
     ========================================================= */

  function initMode() {
    const root = document.documentElement;
    const button = $('[data-mode-toggle]');
    let animTimer;

    const apply = (mode, animate) => {
      if (animate && !reducedMotion.matches) {
        root.classList.add('mode-anim');
        clearTimeout(animTimer);
        animTimer = setTimeout(() => root.classList.remove('mode-anim'), 450);
      }
      root.dataset.mode = mode;
      if (button) button.setAttribute('aria-pressed', String(mode === 'night'));
    };

    apply(root.dataset.mode === 'night' ? 'night' : 'day', false);
    if (!button) return;

    button.addEventListener('click', () => {
      const next = root.dataset.mode === 'night' ? 'day' : 'night';
      apply(next, true);
      try {
        localStorage.setItem('blaze-mode', next);
      } catch (e) {
        // выбор не запомнится, но режим переключится
      }
    });
  }

  /* =========================================================
     Мобильное меню
     ========================================================= */

  function initMenu() {
    const burger = $('.burger');
    const nav = $('#site-nav');
    if (!burger || !nav) return;

    const setMenu = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'закрыть меню' : 'открыть меню');
      document.body.classList.toggle('menu-open', open);
    };

    burger.addEventListener('click', () => {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setMenu(false);
        burger.focus();
      }
    });

    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* =========================================================
     Тост
     ========================================================= */

  let toastTimer;
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    $('.toast__text', toast).textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  /* =========================================================
     Метки «рисуются» краской
     Полосы каждой метки становятся отдельными элементами и проявляются
     снизу вверх, когда метка попадает в экран.
     ========================================================= */

  const MARK_BARS = {
    'mark-start': ['s1', 'm', 's2'],
    'mark-straight': ['m'],
    'mark-right': ['b', 't'],
    'mark-left': ['b', 't'],
  };

  function initMarks() {
    const canPaint = document.documentElement.classList.contains('paint-ready');

    // один SVG-фильтр на страницу: неровный край «краски по коре»
    document.body.insertAdjacentHTML('afterbegin', `
      <svg class="paint-filter" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="paint" x="-60%" y="-6%" width="220%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>`);

    const io = canPaint
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-painted');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.4 })
      : null;

    function hydrate(mark) {
      if (mark.classList.contains('is-hydrated')) return;
      const type = Object.keys(MARK_BARS).find((cls) => mark.classList.contains(cls));
      if (!type) return;
      const slash = $('.mark__slash', mark);
      MARK_BARS[type].forEach((kind, i) => {
        const bar = document.createElement('i');
        bar.className = `mark__bar mark__bar--${kind}`;
        bar.style.setProperty('--i', i);
        mark.insertBefore(bar, slash);
      });
      if (slash) slash.style.setProperty('--i', MARK_BARS[type].length);
      mark.classList.add('is-hydrated');
      if (io) io.observe(mark);
      else mark.classList.add('is-painted');
    }

    $$('.mark').forEach(hydrate);

    // метки, которые появятся позже (шаги конструктора, корзина и т. д.)
    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('mark')) hydrate(node);
          node.querySelectorAll('.mark').forEach(hydrate);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* =========================================================
     Прогресс-бар «тропа»: 12 меток справа (или полоса сверху на телефоне)
     ========================================================= */

  function initTrailProgress() {
    const sections = $$('[data-theme]');
    if (!sections.length) return;

    const COUNT = 12;
    const nav = document.createElement('nav');
    nav.className = 'tp';
    nav.setAttribute('aria-label', 'прогресс прокрутки страницы');
    nav.dataset.theme = 'light';
    nav.innerHTML = Array.from({ length: COUNT }, (_, i) => `
      <button type="button" class="tp__mark" data-tp="${i}" aria-label="к ${Math.round((i / (COUNT - 1)) * 100)} % страницы">
        <span class="tp__fill"></span>${i === COUNT - 1 ? '<span class="tp__slash"></span>' : ''}
      </button>`).join('');
    document.body.appendChild(nav);

    const fills = $$('.tp__fill', nav);
    const footer = $('.footer');
    const mobile = window.matchMedia('(max-width: 767.98px)');
    let ticking = false;
    let footerVisible = false;

    const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    function update() {
      ticking = false;
      const max = maxScroll();
      const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 1;
      fills.forEach((f, i) => f.style.setProperty('--f', clamp(progress * COUNT - i, 0, 1).toFixed(3)));
      nav.classList.toggle('is-finished', footerVisible || progress > 0.995);
    }

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    // высота страницы меняется (шаги конструктора, картинки) — пересчитываем
    if ('ResizeObserver' in window) new ResizeObserver(requestUpdate).observe(document.body);

    nav.addEventListener('click', (e) => {
      const mark = e.target.closest('[data-tp]');
      if (!mark) return;
      window.scrollTo({
        top: maxScroll() * (Number(mark.dataset.tp) / (COUNT - 1)),
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    });

    if (footer) {
      new IntersectionObserver(([entry]) => {
        footerVisible = entry.isIntersecting;
        update();
      }).observe(footer);
    }

    // цвет контура — по секции под рядом меток (на телефоне — под полосой сверху)
    let themeObserver;
    function watchThemes() {
      if (themeObserver) themeObserver.disconnect();
      const visible = new Map();
      themeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
        const active = sections.find((s) => s.matches('.header') && visible.get(s))
          || sections.find((s) => visible.get(s));
        if (active) nav.dataset.theme = active.dataset.theme;
      }, { rootMargin: mobile.matches ? '0px 0px -99% 0px' : '-50% 0px -49% 0px' });
      sections.forEach((s) => themeObserver.observe(s));
    }

    watchThemes();
    mobile.addEventListener('change', watchThemes);
    update();
  }

  /* =========================================================
     Словарь туриста: термины в тексте становятся кнопками с подсказкой
     ========================================================= */

  const GLOSSARY = D.glossary.map((entry, i) => ({
    ...entry,
    id: `gloss-def-${i}`,
    // слово целиком: перед основой не должно быть буквы, окончание любое
    re: new RegExp(`(^|[^а-яёa-z])((?:${entry.stem})[а-яё]*)`, 'iu'),
  }));

  let tooltip = null;

  function ensureGlossaryDefs() {
    if ($('#glossary-defs')) return;
    const defs = document.createElement('div');
    defs.id = 'glossary-defs';
    defs.hidden = true;
    defs.innerHTML = GLOSSARY.map((g) => `<span id="${g.id}">${esc(g.definition)}</span>`).join('');
    document.body.appendChild(defs);
  }

  function applyGlossary(element) {
    if (!element || !GLOSSARY.length) return;
    ensureGlossaryDefs();

    const used = new Set($$('.term', element).map((t) => t.dataset.term));
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest('a, button, label, input, textarea, script, style, h1, h2, .term, [data-no-glossary]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const text = node.nodeValue;
      const hits = [];
      GLOSSARY.forEach((g, index) => {
        if (used.has(String(index))) return;
        const m = g.re.exec(text);
        if (!m) return;
        const start = m.index + m[1].length;
        hits.push({ index, start, end: start + m[2].length });
      });
      if (!hits.length) return;

      hits.sort((a, b) => a.start - b.start);
      const frag = document.createDocumentFragment();
      let cursor = 0;
      hits.forEach((hit) => {
        if (hit.start < cursor) return; // пересекается с уже найденным термином
        used.add(String(hit.index));
        frag.append(text.slice(cursor, hit.start));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'term';
        button.dataset.term = String(hit.index);
        button.setAttribute('aria-describedby', GLOSSARY[hit.index].id);
        button.textContent = text.slice(hit.start, hit.end);
        frag.append(button);
        cursor = hit.end;
      });
      frag.append(text.slice(cursor));
      node.replaceWith(frag);
    });
  }

  function initGlossaryTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'term-tip';
    tooltip.id = 'term-tip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.appendChild(tooltip);

    const header = $('.header');
    let current = null;
    let pinned = false;

    function place() {
      if (!current) return;
      const r = current.getBoundingClientRect();
      const gap = 10;
      const w = tooltip.offsetWidth;
      const h = tooltip.offsetHeight;
      const topLimit = (header ? header.getBoundingClientRect().bottom : 0) + 8;
      let top = r.top - h - gap;
      let side = 'top';
      if (top < topLimit) {
        top = r.bottom + gap;
        side = 'bottom';
      }
      const left = clamp(r.left + r.width / 2 - w / 2, 8, window.innerWidth - w - 8);
      tooltip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      tooltip.dataset.side = side;
    }

    function show(term) {
      const entry = GLOSSARY[Number(term.dataset.term)];
      if (!entry) return;
      current = term;
      tooltip.textContent = entry.definition;
      tooltip.hidden = false;
      place();
      tooltip.classList.add('is-visible');
    }

    function hide() {
      current = null;
      pinned = false;
      tooltip.classList.remove('is-visible');
      tooltip.hidden = true;
    }

    document.addEventListener('mouseover', (e) => {
      const term = e.target.closest('.term');
      if (term && !pinned && term !== current) show(term);
    });
    document.addEventListener('mouseout', (e) => {
      const term = e.target.closest('.term');
      if (term && !pinned && term === current && !term.contains(e.relatedTarget)) hide();
    });
    document.addEventListener('focusin', (e) => {
      const term = e.target.closest('.term');
      if (term) show(term);
      else if (current) hide();
    });
    document.addEventListener('click', (e) => {
      const term = e.target.closest('.term');
      if (term) {
        if (pinned && current === term) hide();
        else {
          show(term);
          pinned = true;
        }
        return;
      }
      if (current) hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && current) hide();
    });
    window.addEventListener('scroll', () => { if (current) place(); }, { passive: true });
    window.addEventListener('resize', () => { if (current) place(); });
  }

  /* =========================================================
     Корзина: хранится в localStorage этого браузера
     ========================================================= */

  function loadCart() {
    const data = readStore(CART.storageKey, []);
    if (!Array.isArray(data)) return [];
    return data.filter((i) => i && typeof i.id === 'string' && (
      (i.type === 'kit' && typeof i.title === 'string' && Array.isArray(i.items)) ||
      (i.type === 'product' && typeof i.name === 'string' && Number.isFinite(i.price) &&
        Number.isInteger(i.qty) && i.qty > 0)
    ));
  }

  function createCart() {
    const T = CART.text;
    const root = $('#cart');
    const overlay = $('.cart-overlay');
    const body = $('#cart-body');
    const foot = $('#cart-foot');
    const title = $('#cart-title');
    const opener = $('[data-cart-open]');
    const counters = $$('[data-cart-count]');
    if (!root || !body || !foot) return { addKit() {}, addProduct() {} };

    let items = loadCart();
    let lastFocus = null;
    let hideTimer;

    const count = () => items.reduce((sum, i) => sum + (i.type === 'product' ? i.qty : 1), 0);
    const total = () => items.reduce((sum, i) => sum + (i.type === 'product' ? i.price * i.qty : 0), 0);

    function kitHTML(item) {
      return `
        <li class="cart-item">
          <p class="cart-item__type">${esc(T.kitType)}</p>
          <h3 class="cart-item__name">${esc(item.title)}</h3>
          <details class="cart-item__details">
            <summary>${esc(T.contents)}: ${item.items.length} ${esc(plural(item.items.length, T.things))}</summary>
            <ul class="bullets">${item.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          </details>
          <button type="button" class="link-btn cart-item__remove" data-remove="${esc(item.id)}">${esc(T.remove)}</button>
        </li>`;
    }

    function productHTML(item) {
      return `
        <li class="cart-item">
          <p class="cart-item__type">${esc(T.productType)}</p>
          <h3 class="cart-item__name">${esc(item.name)}</h3>
          <div class="cart-item__row">
            <div class="qty" role="group" aria-label="количество">
              <button type="button" class="qty__btn" data-qty="-1" data-id="${esc(item.id)}" aria-label="${esc(T.decrease)}">−</button>
              <span class="qty__value" aria-live="polite">${item.qty}</span>
              <button type="button" class="qty__btn" data-qty="1" data-id="${esc(item.id)}" aria-label="${esc(T.increase)}">+</button>
            </div>
            <p class="cart-item__price">${esc(formatPrice(item.price * item.qty))}</p>
          </div>
          <button type="button" class="link-btn cart-item__remove" data-remove="${esc(item.id)}">${esc(T.remove)}</button>
        </li>`;
    }

    function render() {
      const n = count();
      counters.forEach((c) => {
        c.textContent = String(n);
        c.classList.toggle('has-items', n > 0);
      });
      if (opener) opener.setAttribute('aria-label', `корзина: ${n}`);

      if (!items.length) {
        body.innerHTML = `
          <div class="cart-empty">
            <span class="mark mark-straight" aria-hidden="true"></span>
            <p class="cart-empty__title">${esc(T.emptyTitle)}</p>
            <p>${esc(T.emptyText)}</p>
            <a class="btn btn--primary" href="${HOME}#builder" data-cart-close>${esc(T.emptyCta)}</a>
          </div>`;
        foot.hidden = true;
        foot.innerHTML = '';
        return;
      }

      body.innerHTML = `<ul class="cart-list">${items.map((i) => (i.type === 'kit' ? kitHTML(i) : productHTML(i))).join('')}</ul>`;
      const hasKits = items.some((i) => i.type === 'kit');
      foot.hidden = false;
      foot.innerHTML = `
        <div class="cart-total"><span>${esc(T.total)}</span><span>${esc(formatPrice(total()))}</span></div>
        ${hasKits ? `<p class="cart-note">${esc(T.kitsNote)}</p>` : ''}
        <button type="button" class="btn btn--primary" data-cart-checkout>${esc(T.checkout)}</button>
        <button type="button" class="link-btn cart-clear" data-cart-clear>${esc(T.clear)}</button>`;
    }

    function update() {
      writeStore(CART.storageKey, items);
      render();
    }

    function open() {
      if (!root.hidden && document.body.classList.contains('cart-open')) return;
      clearTimeout(hideTimer);
      if (document.body.classList.contains('menu-open')) $('.burger').click();
      lastFocus = document.activeElement;
      root.hidden = false;
      overlay.hidden = false;
      void root.offsetWidth; // стартовое положение для анимации
      document.body.classList.add('cart-open');
      if (opener) opener.setAttribute('aria-expanded', 'true');
      $('.cart__close', root).focus();
    }

    function close() {
      if (!document.body.classList.contains('cart-open')) return;
      document.body.classList.remove('cart-open');
      if (opener) opener.setAttribute('aria-expanded', 'false');
      hideTimer = setTimeout(() => {
        root.hidden = true;
        overlay.hidden = true;
      }, reducedMotion.matches ? 0 : DURATION);
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    }

    function addKit(kit) {
      const id = `kit:${kit.summary.join('|')}`;
      if (items.some((i) => i.id === id)) {
        showToast(T.kitExists);
        return;
      }
      items.push({
        id,
        type: 'kit',
        title: kit.summary.join(' · '),
        items: [...kit.layers, ...kit.gear].flatMap((group) => group.items),
      });
      update();
      showToast(RULES.text.toast);
    }

    function addProduct(product) {
      const id = `product:${product.id}`;
      const existing = items.find((i) => i.id === id);
      if (existing) existing.qty += 1;
      else items.push({ id, type: 'product', name: product.name, price: product.price, qty: 1 });
      update();
      showToast(fill(T.productAdded, { name: product.name }));
    }

    function removeItem(id) {
      items = items.filter((i) => i.id !== id);
      update();
      title.focus();
    }

    function changeQty(id, delta) {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty < 1) {
        removeItem(id);
        return;
      }
      update();
      const same = $(`.qty__btn[data-id="${CSS.escape(id)}"][data-qty="${delta}"]`, body);
      if (same) same.focus();
    }

    if (opener) opener.addEventListener('click', open);
    overlay.addEventListener('click', close);

    root.addEventListener('click', (e) => {
      const target = e.target.closest('[data-cart-close], [data-remove], [data-qty], [data-cart-clear], [data-cart-checkout]');
      if (!target) return;
      if (target.matches('[data-cart-close]')) close();
      else if (target.matches('[data-remove]')) removeItem(target.dataset.remove);
      else if (target.matches('[data-qty]')) changeQty(target.dataset.id, Number(target.dataset.qty));
      else if (target.matches('[data-cart-clear]')) {
        if (window.confirm(T.clearConfirm)) {
          items = [];
          update();
          title.focus();
        }
      } else if (target.matches('[data-cart-checkout]')) showToast(T.checkoutToast);
    });

    // Esc закрывает, Tab не выходит за пределы панели
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = $$('a[href], button:not([disabled]), summary', root)
        .filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === title)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    // «в корзину» у товара — на любой странице
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-add-product]');
      if (!button) return;
      const product = productById(button.dataset.addProduct);
      if (product) addProduct(product);
    });

    render();
    return { addKit, addProduct };
  }

  /* =========================================================
     Каталог: карточки из data.js, каждая ведёт на паспорт вещи
     ========================================================= */

  function renderCatalog() {
    const list = $('#products');
    if (!list) return;
    list.innerHTML = D.products.map((p) => `
      <li class="product">
        <a class="product__link" href="item.html?id=${encodeURIComponent(p.id)}">
          <div class="product__photo">
            <img src="${esc(p.photo)}" width="1254" height="1254" loading="lazy" alt="${esc(p.alt)}">
          </div>
          <h3 class="product__name">${esc(p.name)}</h3>
        </a>
        <p class="product__desc">${esc(p.short)}</p>
        <p class="product__price">${esc(formatPrice(p.price))}</p>
        <button class="btn btn--outline product__add" type="button" data-add-product="${esc(p.id)}">в корзину</button>
      </li>`).join('');
    $$('.product', list).forEach(applyGlossary);
  }

  /* =========================================================
     Сборка комплекта по ответам
     ========================================================= */

  function labelOf(stepId, value) {
    const step = RULES.steps.find((s) => s.id === stepId);
    const option = step && step.options.find((o) => o.value === value);
    return option ? option.label : '';
  }

  function buildKit(answers) {
    const layers = RULES.layers.map((layer) => ({
      title: layer.title,
      items: layer.bySeason
        ? layer.bySeason[answers.season]
        : (layer.when(answers) ? layer.ifTrue : layer.ifFalse),
    }));

    const { backpack, sleep, shoes } = RULES.gear;
    const gear = [{ title: backpack.title, items: backpack.byDuration[answers.duration] }];

    const sleepItems = answers.stay
      ? sleep.byStay[answers.stay].map((item) => fill(item, { temp: sleep.bagComfort[answers.season] }))
      : [];
    if (sleepItems.length) gear.push({ title: sleep.title, items: sleepItems });

    gear.push({ title: shoes.title, items: shoes.byPlace[answers.place] });

    const summary = RULES.steps
      .filter((step) => answers[step.id])
      .map((step) => labelOf(step.id, answers[step.id]));

    return {
      summary,
      layers,
      gear,
      place: labelOf('place', answers.place),
      tip: RULES.tips[answers.place],
      guide: RULES.layersGuide.showIf(answers) ? RULES.layersGuide : null,
    };
  }

  // Ответы из адреса страницы: ?route=gory&season=zima
  function answersFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const answers = {};
    Object.entries(RULES.urlParams).forEach(([param, rule]) => {
      const slug = params.get(param);
      if (!slug) return;
      const value = Object.keys(rule.values).find((key) => rule.values[key].slug === slug);
      const step = RULES.steps.find((s) => s.id === rule.step);
      if (value && step && step.options.some((o) => o.value === value)) answers[rule.step] = value;
    });
    return answers;
  }

  /* =========================================================
     Конструктор похода
     ========================================================= */

  function initBuilder(cart) {
    const stage = $('#builder-stage');
    if (!stage) return null;

    const label = $('#builder-step-label');
    const progress = $('#builder-progress');
    const meta = $('.builder__meta');
    const printBody = $('#print-sheet-body');
    const header = $('.header');
    const T = RULES.text;
    const total = RULES.steps.length;

    progress.innerHTML = RULES.steps.map(() => '<span class="progress__seg"></span>').join('');
    const segments = Array.from(progress.children);

    const state = { index: 0, answers: {}, finished: false, kit: null };
    let busy = false;

    const isSkipped = (step) => typeof step.skipIf === 'function' && step.skipIf(state.answers);

    // Следующий/предыдущий шаг с учётом пропусков
    function findStep(from, dir) {
      let i = from + dir;
      while (i >= 0 && i < total && isSkipped(RULES.steps[i])) i += dir;
      return i;
    }

    function renderMeta() {
      const reached = state.finished ? total : state.index + 1;
      label.textContent = state.finished ? T.finish : fill(T.step, { n: state.index + 1, total });
      segments.forEach((seg, i) => seg.classList.toggle('is-done', i < reached));
      progress.setAttribute('aria-valuenow', String(reached));
      progress.setAttribute('aria-valuetext', label.textContent);
    }

    function renderStep() {
      const step = RULES.steps[state.index];
      const selected = state.answers[step.id];

      const options = step.options.map((o) => `
        <label class="option">
          <input class="option__input" type="radio" name="${esc(step.id)}" value="${esc(o.value)}"${o.value === selected ? ' checked' : ''}>
          <span class="option__tile">${esc(o.label)}</span>
        </label>`).join('');

      const back = state.index > 0
        ? `<button type="button" class="btn btn--ghost" data-action="back">
             <span class="mark mark-left" aria-hidden="true"></span>${esc(T.back)}
           </button>`
        : '';

      stage.innerHTML = `
        <form class="q" novalidate>
          <fieldset class="q__fieldset">
            <legend class="q__title" tabindex="-1" data-focus>
              <span class="visually-hidden">${esc(fill(T.step, { n: state.index + 1, total }))}: </span>${esc(step.question)}
            </legend>
            <div class="options">${options}</div>
          </fieldset>
          <div class="builder__nav">
            ${back}
            <button type="submit" class="btn btn--primary btn--next" data-action="next"${selected ? '' : ' disabled'}>
              ${esc(T.next)}<span class="mark mark-right" aria-hidden="true"></span>
            </button>
          </div>
        </form>`;
    }

    const bullets = (items) => `<ul class="bullets">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

    function renderResult() {
      const kit = buildKit(state.answers);
      state.kit = kit;

      const layers = kit.layers.map((layer, i) => `
        <li class="layer">
          <p class="layer__num">0${i + 1}</p>
          <h5 class="layer__title">${esc(layer.title)}</h5>
          ${bullets(layer.items)}
        </li>`).join('');

      const guide = kit.guide ? `
        <div class="guide">
          <h5 class="guide__title">${esc(kit.guide.title)}</h5>
          <ul class="guide__list">
            ${kit.guide.items.map((g) => `<li><b>${esc(g.name)}</b> ${esc(g.text)}</li>`).join('')}
          </ul>
        </div>` : '';

      const gear = kit.gear.map((group) => `
        <div class="gear__group">
          <h5 class="gear__title">${esc(group.title)}</h5>
          ${bullets(group.items)}
        </div>`).join('');

      stage.innerHTML = `
        <div class="result">
          <div class="result__head">
            <div class="mark mark-start mark-finish" aria-hidden="true"><span class="mark__slash"></span></div>
            <div>
              <h3 class="result__title" tabindex="-1" data-focus>${esc(T.resultTitle)}</h3>
              <ul class="chips" aria-label="${esc(T.summaryLabel)}">
                ${kit.summary.map((s) => `<li class="chip">${esc(s)}</li>`).join('')}
              </ul>
            </div>
          </div>

          <section class="result__block" aria-label="${esc(T.clothesTitle)}">
            <h4 class="block-title">${esc(T.clothesTitle)}</h4>
            <ul class="layers">${layers}</ul>
            ${guide}
          </section>

          <section class="result__block" aria-label="${esc(T.gearTitle)}">
            <h4 class="block-title">${esc(T.gearTitle)}</h4>
            <div class="gear">${gear}</div>
          </section>

          <aside class="result__block tip">
            <div>
              <p class="tip__label">${esc(T.tipLabel)} · ${esc(kit.place)}</p>
              <p class="tip__text">${esc(kit.tip)}</p>
            </div>
          </aside>

          <div class="result__actions">
            <button type="button" class="btn btn--primary" data-action="cart">${esc(T.addToCart)}</button>
            <button type="button" class="btn btn--outline" data-action="print">${esc(T.checklist)}</button>
            <button type="button" class="link-btn" data-action="restart">${esc(T.restart)}</button>
          </div>
        </div>`;

      applyGlossary($('.result', stage));
      renderPrintSheet(kit);
    }

    function renderPrintSheet(kit) {
      if (!printBody) return;
      const groups = [...kit.layers, ...kit.gear].map((group) => `
        <section class="print-group">
          <h2>${esc(group.title)}</h2>
          <ul class="print-list">
            ${group.items.map((item) => `<li><span class="print-check"></span>${esc(item)}</li>`).join('')}
          </ul>
        </section>`).join('');

      printBody.innerHTML = `
        <h1>${esc(T.printTitle)}</h1>
        <p class="print-sheet__summary">${esc(kit.summary.join(' · '))}</p>
        ${groups}`;
    }

    // Плавная смена экрана: уход → перерисовка → появление
    function swap(dir, update) {
      if (busy) return;
      stage.dataset.dir = dir;

      const finish = () => {
        renderMeta();
        afterSwap();
      };

      if (reducedMotion.matches) {
        update();
        finish();
        return;
      }

      busy = true;
      stage.classList.add('is-out');
      setTimeout(() => {
        update();
        stage.classList.replace('is-out', 'is-in');
        void stage.offsetWidth; // фиксируем стартовое положение до анимации
        stage.classList.remove('is-in');
        finish();
        busy = false;
      }, DURATION);
    }

    function afterSwap() {
      const headerHeight = header ? header.offsetHeight : 0;
      if (meta.getBoundingClientRect().top < headerHeight) {
        meta.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
      const target = $('[data-focus]', stage);
      if (target) target.focus({ preventScroll: true });
    }

    function finishBuilder() {
      // убираем ответы на пропущенные шаги
      RULES.steps.forEach((s) => { if (isSkipped(s)) delete state.answers[s.id]; });
      state.finished = true;
      renderResult();
    }

    function goNext() {
      const step = RULES.steps[state.index];
      if (!state.answers[step.id]) return;

      const next = findStep(state.index, 1);
      if (next >= total) {
        swap('forward', finishBuilder);
      } else {
        swap('forward', () => {
          state.index = next;
          renderStep();
        });
      }
    }

    function goBack() {
      const prev = findStep(state.index, -1);
      if (prev < 0) return;
      swap('back', () => {
        state.index = prev;
        renderStep();
      });
    }

    function restart() {
      swap('back', () => {
        state.index = 0;
        state.answers = {};
        state.finished = false;
        state.kit = null;
        renderStep();
      });
    }

    function printChecklist() {
      if (!state.kit) return;
      document.body.classList.add('is-printing');
      window.print();
    }
    window.addEventListener('afterprint', () => document.body.classList.remove('is-printing'));

    // События
    stage.addEventListener('change', (e) => {
      const input = e.target;
      if (!input.matches('.option__input')) return;
      state.answers[input.name] = input.value;
      const next = $('[data-action="next"]', stage);
      if (next) next.disabled = false;
    });

    stage.addEventListener('submit', (e) => {
      e.preventDefault();
      goNext();
    });

    stage.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      switch (button.dataset.action) {
        case 'back': goBack(); break;
        case 'cart': if (state.kit) cart.addKit(state.kit); break;
        case 'print': printChecklist(); break;
        case 'restart': restart(); break;
        default: break;
      }
    });

    // Предвыбор из адреса: отмечаем ответы и открываем первый неотвеченный шаг
    state.answers = answersFromUrl();
    const firstOpen = RULES.steps.findIndex((s) => !isSkipped(s) && !state.answers[s.id]);
    if (firstOpen === -1) finishBuilder();
    else {
      state.index = firstOpen;
      renderStep();
    }
    renderMeta();

    // пришли по ссылке из паспорта вещи — показываем конструктор, когда страница собрана
    if (window.location.hash === '#builder') {
      window.addEventListener('load', () => {
        $('#builder').scrollIntoView({ block: 'start', behavior: 'instant' });
      }, { once: true });
    }

    return {
      getResult: () => (state.finished && state.kit ? { kit: state.kit, answers: { ...state.answers } } : null),
    };
  }

  /* =========================================================
     «Собери рюкзак»
     ========================================================= */

  function initPack(builder) {
    const root = $('#pack');
    if (!root) return;

    const T = PACK.text;
    const byId = Object.fromEntries(D.packItems.map((i) => [i.id, i]));
    const shelf = $('#pack-available');
    const packed = $('#pack-packed');
    const packedTitle = $('#pack-packed-title');
    const empty = $('#pack-empty');
    const fillRect = $('.pack__fill', root);
    const svgTitle = $('#pack-svg-title');
    const weightEl = $('#pack-weight');
    const volumeEl = $('#pack-volume');
    const maxEl = $('#pack-max');
    const hint = $('#pack-hint');
    const panel = $('.pack__panel', root);
    const volumes = $$('input[name="pack-volume"]', root);

    const saved = readStore(PACK.storageKey, null);
    const state = {
      volume: saved && [25, 45, 65].includes(saved.volume) ? saved.volume : PACK.defaultVolume,
      items: {},
    };
    if (saved && saved.items && typeof saved.items === 'object') {
      Object.entries(saved.items).forEach(([id, qty]) => {
        if (byId[id] && Number.isInteger(qty) && qty > 0) state.items[id] = byId[id].stack ? qty : 1;
      });
    }

    const kg = (grams) => formatNum(grams / 1000, 1);
    const liters = (v) => formatNum(v, v % 1 ? 1 : 0);

    function totals() {
      let weight = 0;
      let volume = 0;
      Object.entries(state.items).forEach(([id, qty]) => {
        weight += byId[id].weight * qty;
        volume += byId[id].volume * qty;
      });
      return { weight, volume };
    }

    function cardHTML(item, inPack) {
      const qty = state.items[item.id] || 0;
      const n = inPack ? qty : 1;
      const meta = `${kg(item.weight * n)} кг · ${liters(item.volume * n)} л`;
      const extra = !inPack && item.stack && qty ? ` · ${fill(T.inPack, { n: qty })}` : '';
      const button = inPack
        ? `<button type="button" class="pack-item__btn" data-pack-remove="${item.id}" aria-label="${esc(fill(T.remove, { name: item.name }))}">×</button>`
        : `<button type="button" class="pack-item__btn" data-pack-add="${item.id}" aria-label="${esc(fill(T.add, { name: item.name }))}">+</button>`;
      return `
        <li class="pack-item${inPack ? ' pack-item--packed' : ''}" draggable="true" data-id="${item.id}">
          <div class="pack-item__info">
            <p class="pack-item__name">${esc(item.name)}${inPack && qty > 1 ? ` <span class="pack-item__qty">× ${qty}</span>` : ''}</p>
            <p class="pack-item__meta">${meta}${extra}</p>
          </div>
          ${button}
        </li>`;
    }

    function render() {
      shelf.innerHTML = D.packItems.filter((i) => i.stack || !state.items[i.id]).map((i) => cardHTML(i, false)).join('');
      const inPack = D.packItems.filter((i) => state.items[i.id]);
      packed.innerHTML = inPack.map((i) => cardHTML(i, true)).join('');
      empty.hidden = inPack.length > 0;

      volumes.forEach((input) => { input.checked = Number(input.value) === state.volume; });

      const { weight, volume } = totals();
      const ratio = volume / state.volume;
      const over = volume > state.volume;
      fillRect.style.setProperty('--f', clamp(ratio, 0, 1).toFixed(3));
      panel.classList.toggle('is-over', over);
      svgTitle.textContent = fill(T.svgTitle, { percent: Math.round(ratio * 100) });

      weightEl.textContent = kg(weight);
      volumeEl.textContent = liters(volume);
      maxEl.textContent = `из ${state.volume} л`;

      let message = T.light;
      if (!inPack.length) message = T.empty;
      else if (over) message = T.overflow;
      else if (weight > PACK.heavy) message = T.heavy;
      else if (weight >= PACK.normal) message = T.normal;
      hint.textContent = message;
      hint.classList.toggle('is-alert', over);
    }

    function save() {
      writeStore(PACK.storageKey, state);
    }

    function add(id, announce) {
      const item = byId[id];
      if (!item) return;
      state.items[id] = item.stack ? (state.items[id] || 0) + 1 : 1;
      save();
      render();
      if (announce) {
        const { weight, volume } = totals();
        showToast(fill(T.added, { name: item.name, weight: kg(weight), volume: liters(volume), max: state.volume }));
      }
    }

    function remove(id, all) {
      if (!state.items[id]) return;
      if (all || state.items[id] <= 1) delete state.items[id];
      else state.items[id] -= 1;
      save();
      render();
    }

    // после перерисовки фокус остаётся рядом с тем местом, где был
    function refocus(list, attr, id, index) {
      const same = $(`[${attr}="${id}"]`, list);
      if (same) return same.focus();
      const buttons = $$(`[${attr}]`, list);
      if (buttons.length) return buttons[Math.min(index, buttons.length - 1)].focus();
      return packedTitle.focus();
    }

    root.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-pack-add]');
      const removeBtn = e.target.closest('[data-pack-remove]');
      if (addBtn) {
        const id = addBtn.dataset.packAdd;
        const index = $$('[data-pack-add]', shelf).indexOf(addBtn);
        add(id, true);
        refocus(shelf, 'data-pack-add', id, index);
      } else if (removeBtn) {
        const id = removeBtn.dataset.packRemove;
        const index = $$('[data-pack-remove]', packed).indexOf(removeBtn);
        remove(id, false);
        refocus(packed, 'data-pack-remove', id, index);
      } else if (e.target.closest('[data-pack-kit]')) {
        takeFromKit();
      } else if (e.target.closest('[data-pack-clear]')) {
        if (Object.keys(state.items).length && window.confirm(T.clearConfirm)) {
          state.items = {};
          save();
          render();
          packedTitle.focus();
        }
      }
    });

    volumes.forEach((input) => input.addEventListener('change', () => {
      state.volume = Number(input.value);
      save();
      render();
    }));

    function takeFromKit() {
      const result = builder && builder.getResult();
      if (!result) {
        showToast(T.needKit);
        return;
      }
      const kitItems = [...result.kit.layers, ...result.kit.gear].flatMap((group) => group.items);
      let taken = 0;
      D.packItems.forEach((item) => {
        if (item.kit && kitItems.some((k) => item.kit.test(k))) {
          state.items[item.id] = 1;
          taken += 1;
        }
      });
      const rules = D.packFromKit;
      const duration = result.answers.duration;
      if (rules.foodDays[duration]) {
        state.items.food = rules.foodDays[duration];
        taken += 1;
      }
      state.items.water = Math.max(state.items.water || 0, rules.water);
      taken += 1;
      state.volume = rules.volume[duration] || state.volume;
      save();
      render();
      showToast(fill(T.fromKit, { n: taken, things: plural(taken, ['вещь', 'вещи', 'вещей']) }));
    }

    // Перетаскивание: с полки в рюкзак и обратно
    let dragFrom = null;
    const zones = $$('[data-drop]', root);

    root.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.pack-item');
      if (!card) return;
      dragFrom = card.closest('[data-drop]').dataset.drop;
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('is-dragging');
    });

    root.addEventListener('dragend', (e) => {
      const card = e.target.closest('.pack-item');
      if (card) card.classList.remove('is-dragging');
      zones.forEach((z) => z.classList.remove('is-drop-target'));
      dragFrom = null;
    });

    zones.forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        if (!dragFrom || dragFrom === zone.dataset.drop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('is-drop-target');
      });
      zone.addEventListener('dragleave', (e) => {
        if (!zone.contains(e.relatedTarget)) zone.classList.remove('is-drop-target');
      });
      zone.addEventListener('drop', (e) => {
        if (!dragFrom || dragFrom === zone.dataset.drop) return;
        e.preventDefault();
        zone.classList.remove('is-drop-target');
        const id = e.dataTransfer.getData('text/plain');
        if (zone.dataset.drop === 'pack') add(id, false);
        else remove(id, true);
      });
    });

    render();
  }

  /* =========================================================
     Паспорт вещи: item.html?id=pereval
     ========================================================= */

  function initItemPage() {
    const root = $('#item');
    if (!root) return;

    const T = ITEM.text;
    const id = new URLSearchParams(window.location.search).get('id');
    const product = id && productById(id);

    if (!product) {
      document.title = `${T.lostTitle} · blaze`;
      root.innerHTML = `
        <section class="section section--birch lost" data-theme="light">
          <div class="container lost__inner">
            <div class="mark mark-straight" aria-hidden="true"></div>
            <h1 class="lost__title">${esc(T.lostTitle)}</h1>
            <p class="lost__text">${esc(T.lostText)}</p>
            <a class="btn btn--primary" href="index.html#catalog">${esc(T.lostCta)}</a>
          </div>
        </section>`;
      return;
    }

    document.title = `${product.name} — ${T.label} · blaze`;
    const firstSeason = D.seasons[product.seasons[0]];
    const routeTiles = product.routes.map((r) => {
      const route = D.routes[r];
      const href = `index.html?route=${route.slug}${firstSeason ? `&season=${firstSeason.slug}` : ''}#builder`;
      return `
        <li>
          <a class="route-tile" href="${esc(href)}">
            <span class="route-tile__name">${esc(route.label)}</span>
            <span class="route-tile__cta">${esc(T.routeCta)}</span>
          </a>
        </li>`;
    }).join('');
    const seasons = product.seasons.map((s) => D.seasons[s].label).join(', ');
    const list = (items) => `<ul class="bullets">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

    root.innerHTML = `
      <section class="section section--white item-hero" data-theme="light" aria-labelledby="item-title">
        <div class="container grid item-hero__grid">
          <div class="item-hero__photo">
            <img src="${esc(product.photo)}" width="1254" height="1254" alt="${esc(product.alt)}">
          </div>
          <div class="item-hero__info">
            <div class="item-hero__label">
              <div class="mark mark-start" aria-hidden="true"></div>
              <p class="eyebrow">${esc(T.label)}</p>
            </div>
            <h1 class="item-hero__title" id="item-title">${esc(product.name)}</h1>
            <p class="item-hero__price">${esc(formatPrice(product.price))}</p>
            <p class="item-hero__short">${esc(product.short)}</p>
            <div class="item-hero__actions">
              <button class="btn btn--primary" type="button" data-add-product="${esc(product.id)}">${esc(T.toCart)}</button>
              <a class="btn btn--ghost" href="index.html#catalog"><span class="mark mark-left" aria-hidden="true"></span>${esc(T.toCatalog)}</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section section--birch" data-theme="light" aria-label="${esc(T.label)}">
        <div class="container passport">
          <article class="passport__block">
            <p class="passport__num">01</p>
            <h2 class="passport__title">${esc(T.materials)}</h2>
            ${list(product.materials)}
          </article>
          <article class="passport__block">
            <p class="passport__num">02</p>
            <h2 class="passport__title">${esc(T.care)}</h2>
            ${list(product.care)}
          </article>
          <article class="passport__block">
            <p class="passport__num">03</p>
            <h2 class="passport__title">${esc(T.routes)}</h2>
            <ul class="route-tiles">${routeTiles}</ul>
            <p class="passport__seasons">${esc(T.seasons)}: ${esc(seasons)}</p>
          </article>
        </div>
      </section>

      <section class="section section--white" data-theme="light" aria-labelledby="journey-title">
        <div class="container grid journey-grid">
          <div class="journey">
            <p class="eyebrow">${esc(T.pathLabel)}</p>
            <h2 class="journey__title" id="journey-title" aria-live="polite"></h2>
            <form class="journey__form" novalidate>
              <label class="journey__field">
                <span class="journey__label">${esc(T.km)}</span>
                <input class="journey__input" id="journey-km" type="number" inputmode="numeric" min="0" max="2000" step="1" placeholder="12" aria-describedby="journey-error">
              </label>
              <button class="btn btn--primary" type="submit">${esc(T.addHike)}</button>
            </form>
            <p class="journey__error" id="journey-error" role="alert"></p>
            <button class="link-btn journey__reset" type="button" data-journey-reset>${esc(T.reset)}</button>
          </div>
          <div class="qr" id="qr" hidden>
            <div class="qr__code" id="qr-code"></div>
            <p class="qr__caption">${esc(T.qrCaption)}</p>
          </div>
        </div>
      </section>`;

    applyGlossary($('.item-hero__info', root));
    $$('.passport__block', root).forEach(applyGlossary);
    initJourney(product);
    initQr();
  }

  function initJourney(product) {
    const T = ITEM.text;
    const key = ITEM.pathKey + product.id;
    const title = $('#journey-title');
    const form = $('.journey__form');
    const input = $('#journey-km');
    const error = $('#journey-error');
    const saved = readStore(key, null);
    const path = {
      hikes: saved && Number.isInteger(saved.hikes) && saved.hikes > 0 ? saved.hikes : 0,
      km: saved && Number.isFinite(saved.km) && saved.km > 0 ? saved.km : 0,
    };

    function render() {
      title.textContent = path.hikes
        ? fill(T.pathTitle, {
          noun: product.path.noun,
          verb: product.path.verb,
          hikes: path.hikes,
          hikesWord: plural(path.hikes, T.hikes),
          km: formatNum(path.km),
        })
        : fill(T.pathZero, { noun: product.path.noun });
    }

    input.addEventListener('input', () => {
      error.textContent = '';
      input.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      const km = raw === '' ? 0 : Number(raw);
      if (!Number.isFinite(km) || km < 0 || km > 2000) {
        error.textContent = T.kmError;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      path.hikes += 1;
      path.km = Math.round((path.km + km) * 10) / 10;
      writeStore(key, path);
      input.value = '';
      render();
    });

    $('[data-journey-reset]').addEventListener('click', () => {
      if (!path.hikes || !window.confirm(T.resetConfirm)) return;
      path.hikes = 0;
      path.km = 0;
      writeStore(key, path);
      render();
    });

    render();
  }

  // QR-код ссылки на эту страницу; без интернета блок остаётся скрытым
  function initQr() {
    const block = $('#qr');
    const target = $('#qr-code');
    if (!block || !target) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = () => {
      if (typeof window.QRCode !== 'function') return;
      try {
        // eslint-disable-next-line no-new
        new window.QRCode(target, {
          text: window.location.href,
          width: 168,
          height: 168,
          colorDark: '#2B2B2B',
          colorLight: '#FFFFFF',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
        const img = $('img', target);
        if (img) img.alt = 'QR-код ссылки на эту страницу';
        block.hidden = false;
      } catch (e) {
        block.hidden = true;
      }
    };
    script.onerror = () => { block.hidden = true; };
    document.head.appendChild(script);
  }

  /* =========================================================
     Запуск
     ========================================================= */

  initMode();
  initMarks();
  initMenu();
  initGlossaryTooltip();
  const cart = createCart();
  renderCatalog();
  const builder = initBuilder(cart);
  initPack(builder);
  initItemPage();
  initTrailProgress();
})();
