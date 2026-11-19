(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- header: solid once the hero has scrolled away ---------- */
  const header = $('.site-header');
  const hero = $('.hero, .legal-hero');
  if (header) {
    if (hero) {
      new IntersectionObserver(([e]) => header.classList.toggle('is-solid', !e.isIntersecting), {
        rootMargin: '-80px 0px 0px 0px',
      }).observe(hero);
    } else {
      header.classList.add('is-solid');
    }
  }

  /* ---------- mobile sheet ---------- */
  const sheet = $('#sheet');
  const openBtn = $('.site-header .menu-toggle');
  if (sheet && openBtn) {
    const open = () => {
      sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add('is-open'));
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
      $('[data-close]', sheet).focus();
    };
    const close = (focus = true) => {
      sheet.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      setTimeout(() => (sheet.hidden = true), 350);
      if (focus) openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    $('[data-close]', sheet).addEventListener('click', () => close());
    $$('a', sheet).forEach((a) => a.addEventListener('click', () => close(false)));
    document.addEventListener('keydown', (e) => e.key === 'Escape' && sheet.classList.contains('is-open') && close());
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- active nav link ---------- */
  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  if (navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const link = map.get(e.target.id);
        if (link && e.isIntersecting) {
          navLinks.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- scorecard ---------- */
  const holes = [
    { par: 5, si: 9, siL: 6, w: 571, r: 483, note: 'A par 5 to open, and the longest hole on the card.' },
    { par: 4, si: 17, siL: 16, w: 375, r: 342, note: 'A shorter par 4 and one of the easier holes by stroke index.' },
    { par: 4, si: 7, siL: 4, w: 399, r: 355, note: 'A strong par 4 of almost 400 yards from the whites.' },
    { par: 3, si: 15, siL: 18, w: 169, r: 158, note: 'The first of two par 3s. Club selection is everything.' },
    { par: 4, si: 1, siL: 2, w: 461, r: 370, note: 'Stroke index 1. The toughest hole on the course for men.' },
    { par: 5, si: 5, siL: 10, w: 530, r: 437, note: 'The second par 5, playing over 500 yards from the whites.' },
    { par: 3, si: 13, siL: 14, w: 159, r: 183, note: 'The shortest hole from the white tees.' },
    { par: 4, si: 3, siL: 12, w: 381, r: 358, note: 'Stroke index 3. Walk off with par and you have earned it.' },
    { par: 4, si: 11, siL: 8, w: 369, r: 331, note: 'A par 4 to close out the nine.' },
  ];
  const TOT = { w18: 6671, r18: 5888 };
  let unit = 'yd';
  let current = 0;
  const conv = (y) => (unit === 'yd' ? y : Math.round(y * 0.9144));
  const fmt = (n) => n.toLocaleString('en-ZA').replace(/ /g, ' ');

  const body = $('#card-body');
  function renderTable() {
    if (!body) return;
    const sum = (k) => holes.reduce((a, h) => a + h[k], 0);
    const row = (label, vals, out, tot, cls = '') =>
      `<tr${cls ? ` class="${cls}"` : ''}><th scope="row">${label}</th>${vals.map((v, i) => `<td data-col="${i}">${v}</td>`).join('')}<td class="tot">${out}</td><td class="tot">${tot}</td></tr>`;
    body.innerHTML = [
      row('Par', holes.map((h) => h.par), sum('par'), 72),
      row('White tees', holes.map((h) => fmt(conv(h.w))), fmt(conv(sum('w'))), fmt(conv(TOT.w18))),
      row('Red tees', holes.map((h) => fmt(conv(h.r))), fmt(conv(sum('r'))), fmt(conv(TOT.r18))),
      row('Stroke index (men)', holes.map((h) => h.si), '', ''),
      row('Stroke index (ladies)', holes.map((h) => h.siL), '', ''),
    ].join('');
    highlight();
    const cap = $('#unit-caption');
    if (cap) cap.textContent = unit === 'yd' ? 'Distances in yards.' : 'Distances in metres.';
  }
  function highlight() {
    $$('#card-body td[data-col], .card-table thead th').forEach((c) => c.classList.remove('is-active'));
    $$(`#card-body td[data-col="${current}"]`).forEach((c) => c.classList.add('is-active'));
    const th = $$('.card-table thead th')[current + 1];
    if (th) th.classList.add('is-active');
  }
  function showHole(i, animate = true) {
    current = i;
    const h = holes[i];
    const numEl = $('#hole-num');
    if (!numEl) return;
    const set = () => {
      numEl.textContent = i + 1;
      $('#hole-note').textContent = unit === 'yd' ? h.note : h.note.replace('almost 400 yards', 'about 365 metres').replace('over 500 yards', 'nearly 485 metres');
      $('#hole-par').textContent = h.par;
      $('#hole-si').textContent = h.si;
      $('#hole-white').textContent = fmt(conv(h.w));
      $('#hole-red').textContent = fmt(conv(h.r));
    };
    if (animate && !reduce && numEl.animate) {
      const out = numEl.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-40%)', opacity: 0 }], { duration: 180, easing: 'ease-in' });
      out.onfinish = () => {
        set();
        numEl.animate([{ transform: 'translateY(40%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(0.16,1,0.3,1)' });
      };
      $$('.hole-stats dd, #hole-note').forEach((el) => el.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }));
    } else set();
    $$('.hole-picker button').forEach((b, j) => {
      b.setAttribute('aria-selected', j === i ? 'true' : 'false');
      b.tabIndex = j === i ? 0 : -1;
    });
    highlight();
  }
  const picker = $('.hole-picker');
  if (picker) {
    picker.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-hole]');
      if (b) showHole(+b.dataset.hole);
    });
    picker.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (current + d + holes.length) % holes.length;
      showHole(n);
      picker.children[n].focus();
    });
    $$('.hole-picker button').forEach((b, j) => (b.tabIndex = j === 0 ? 0 : -1));
    $$('.units button').forEach((b) =>
      b.addEventListener('click', () => {
        unit = b.dataset.unit;
        $$('.units button').forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        renderTable();
        showHole(current, false);
      })
    );
    renderTable();
  }

  /* ---------- gallery strip ---------- */
  const strip = $('#strip');
  if (strip) {
    const step = () => Math.max(280, strip.clientWidth * 0.7);
    $$('[data-strip]').forEach((b) =>
      b.addEventListener('click', () => strip.scrollBy({ left: b.dataset.strip === 'next' ? step() : -step(), behavior: reduce ? 'auto' : 'smooth' }))
    );
    // drag to pan (mouse only; touch scrolls natively)
    let down = false, startX = 0, startLeft = 0, moved = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = strip.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5 && !moved) { moved = true; strip.classList.add('is-dragging'); }
      if (moved) strip.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      strip.classList.remove('is-dragging');
    });
    strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // lightbox
    const lb = $('#lightbox');
    const items = $$('button', strip);
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const img = $('img', items[idx]);
      const big = $('img', lb);
      big.src = items[idx].dataset.full;
      big.alt = img.alt;
      $('p', lb).textContent = img.alt;
    };
    items.forEach((b, i) => b.addEventListener('click', () => { show(i); lb.showModal(); }));
    lb.addEventListener('click', (e) => {
      const a = e.target.closest('[data-lb]');
      if (a) {
        if (a.dataset.lb === 'close') lb.close();
        else show(idx + (a.dataset.lb === 'next' ? 1 : -1));
      } else if (e.target === lb) lb.close();
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    lb.addEventListener('close', () => items[idx] && items[idx].focus({ preventScroll: true }));
    let tx = 0;
    lb.addEventListener('touchstart', (e) => (tx = e.touches[0].clientX), { passive: true });
    lb.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------- booking form ---------- */
  const form = $('#book-form');
  if (form) {
    const WA = '27660142639';
    const EMAIL = 'drakensigmilitarygolf@gmail.com';
    const topic = $('#f-topic');
    const date = $('#f-date');
    const status = $('#form-status');
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    date.min = today.toISOString().slice(0, 10);

    const isTee = () => topic.value === 'Tee time booking';
    const syncTopic = () => $$('[data-tee]', form).forEach((el) => (el.hidden = !isTee()));
    topic.addEventListener('change', syncTopic);
    syncTopic();

    // other CTAs can preselect a topic
    $$('[data-topic]').forEach((a) =>
      a.addEventListener('click', () => { topic.value = a.dataset.topic; syncTopic(); })
    );

    const fieldOk = (input, test) => {
      const ok = test(input.value.trim());
      input.closest('.field').classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    const validate = () => {
      const checks = [
        fieldOk($('#f-name'), (v) => v.length > 1),
        fieldOk($('#f-phone'), (v) => v.replace(/\D/g, '').length >= 9),
      ];
      if (isTee()) checks.push(fieldOk(date, (v) => !!v));
      const ok = checks.every(Boolean);
      if (!ok) {
        const first = $('.has-error input, .has-error select', form);
        if (first) first.focus();
        status.textContent = '';
      }
      return ok;
    };
    $$('input, select', form).forEach((el) =>
      el.addEventListener('input', () => el.closest('.field') && el.closest('.field').classList.remove('has-error'))
    );

    const compose = () => {
      const d = new FormData(form);
      const lines = [`Hello Drakensig Golf Club, this is ${d.get('name').trim()}.`, `Topic: ${d.get('topic')}`];
      if (isTee()) {
        const when = d.get('date')
          ? new Date(d.get('date') + 'T12:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : '';
        lines.push(`Date: ${when}`, `Time: ${d.get('time')}`, `Players: ${d.get('players')}`, `Holes: ${d.get('holes')}`, `Cart: ${d.get('cart') ? 'Yes please' : 'No'}`);
      }
      const msg = (d.get('message') || '').trim();
      if (msg) lines.push('', msg);
      lines.push('', `Phone: ${d.get('phone').trim()}`);
      return lines.join('\n');
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(compose())}`;
      status.textContent = 'Opening WhatsApp with your message. Press send to deliver it to the club.';
      window.open(url, '_blank', 'noopener');
    });
    $('#send-email').addEventListener('click', () => {
      if (!validate()) return;
      const subject = `${topic.value} - Drakensig Golf Club website`;
      status.textContent = 'Opening your email app with the message filled in.';
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(compose())}`;
    });
  }

  /* ---------- map facade (loads Google only on request) ---------- */
  const mapBtn = $('#load-map');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const map = $('#map');
      const f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=-24.3473703,30.9325647&z=15&output=embed';
      f.title = 'Map showing Drakensig Golf Club at AFB Hoedspruit';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      map.innerHTML = '';
      map.appendChild(f);
      map.classList.add('is-live');
    });
  }
})();
