(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Load sequence: one frame after first paint so the transitions run.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));

  // Mobile menu
  const bar = document.querySelector('.bar');
  const toggle = document.querySelector('.bar__toggle');
  const setMenu = (open) => {
    bar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Zavřít' : 'Menu';
  };
  toggle.addEventListener('click', () => setMenu(!bar.classList.contains('is-open')));
  document.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Open now? Hours are daily 15:00–23:00, Prague time.
  const OPEN = 15 * 60, CLOSE = 23 * 60;
  const pragueNow = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[get('weekday')], min: Number(get('hour')) * 60 + Number(get('minute')) };
  };
  const span = (m) => {
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h}\u00a0h ${r}\u00a0min` : `${r}\u00a0min`;
  };
  const status = document.querySelector('[data-status]');
  const statusText = document.querySelector('[data-status-text]');
  const updateStatus = () => {
    const { day, min } = pragueNow();
    const open = min >= OPEN && min < CLOSE;
    status.classList.toggle('is-open', open);
    status.classList.toggle('is-closed', !open);
    if (open) statusText.textContent = `Teď otevřeno · zavíráme ve\u00a023:00, za\u00a0${span(CLOSE - min)}`;
    else if (min < OPEN) statusText.textContent = `Teď zavřeno · otevíráme dnes v\u00a015:00, za\u00a0${span(OPEN - min)}`;
    else statusText.textContent = 'Teď zavřeno · otevíráme zítra v\u00a015:00';
    document.querySelectorAll('.hours tr').forEach((tr) => tr.classList.toggle('is-today', Number(tr.dataset.day) === day));
  };
  updateStatus();
  setInterval(updateStatus, 30000);

  // The tap list pours into the mug
  const NAMES = {
    '11': 'Bakalář 11° · světlé pivo',
    '12': 'Bakalář 12° · světlý ležák',
    '12t': 'Bakalář 12° tmavý · tmavý ležák',
    '12r': 'Bakalář 12° řezaný · světlé a tmavé',
    '13m': 'Bakalář 13° medový · světlý speciál',
    'pu': 'Pilsner Urquell 12° · světlý ležák',
  };
  const beers = document.querySelectorAll('.beer');
  const pour = document.querySelector('[data-pour]');
  const caption = document.getElementById('glass-caption');
  const taps = document.querySelectorAll('.tap');
  const pick = (id, animate) => {
    beers.forEach((b) => b.classList.toggle('is-on', b.dataset.beer === id));
    taps.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.pick === id)));
    caption.textContent = NAMES[id];
    if (animate && !reduce.matches && pour.animate) {
      pour.animate(
        [{ transform: 'scaleY(0.18)' }, { transform: 'scaleY(1)' }],
        { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
  };
  taps.forEach((t) => t.addEventListener('click', () => pick(t.dataset.pick, true)));
  pick('12', false);

  // Section entrances: parts arrive in reading order, once
  const groups = new Map();
  document.querySelectorAll('.rv').forEach((el) => {
    const host = el.closest('section, footer') || document.body;
    const i = groups.get(host) || 0;
    groups.set(host, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 8) * 70}ms`);
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.rv').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
  }

  // The hero horseshoe turns slowly as the page scrolls
  const drift = document.querySelector('.hero__shoe');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = Math.min(window.scrollY, window.innerHeight * 1.2);
    drift.style.transform = `translateY(${y * 0.12}px) rotate(${y * 0.012}deg)`;
  };
  if (!reduce.matches) {
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
  }

  // Mark the section in view in the navigation
  const links = [...document.querySelectorAll('.nav a')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${e.target.id}`)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }
})();
