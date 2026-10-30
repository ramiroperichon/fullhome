(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  const t0 = performance.now();
  const ready = () => setTimeout(() => document.body.classList.add('loaded'),
    reduce ? 0 : Math.max(0, 1500 - (performance.now() - t0)));
  document.readyState === 'complete' ? ready() : addEventListener('load', ready);
  setTimeout(() => document.body.classList.add('loaded'), 4000);

  /* ---------- Marquees: duplicar contenido para loop infinito ---------- */
  $$('.marquee').forEach(m => {
    m.style.setProperty('--speed', (m.dataset.speed || 40) + 's');
    const html = m.innerHTML;
    m.innerHTML = html + html;
  });

  /* ---------- Hero: linterna ---------- */
  const stage = $('#stage');
  const dim = $('.scene-dim', stage);
  const lit = dim.cloneNode(true);
  lit.classList.replace('scene-dim', 'scene-lit');
  lit.setAttribute('aria-hidden', 'true');
  dim.after(lit);

  const hero = $('#inicio');
  const sw = $('#lightSwitch');
  let w = 0, h = 0, px = 0, py = 0, x = 0, y = 0, r = 0;
  let hovering = false, flood = false, heroVisible = true;

  const measure = () => {
    const b = stage.getBoundingClientRect();
    w = b.width; h = b.height;
    if (!x && !y) { x = px = w * 0.62; y = py = h * 0.45; }
  };
  measure();
  addEventListener('resize', measure);

  stage.addEventListener('pointermove', e => {
    const b = stage.getBoundingClientRect();
    px = e.clientX - b.left; py = e.clientY - b.top;
    hovering = true;
  });
  stage.addEventListener('pointerleave', () => { hovering = false; });
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch') {
      const b = stage.getBoundingClientRect();
      px = e.clientX - b.left; py = e.clientY - b.top; hovering = true;
    }
  });
  stage.addEventListener('pointerup', e => { if (e.pointerType === 'touch') hovering = false; });

  sw.addEventListener('click', () => {
    flood = !flood;
    sw.setAttribute('aria-pressed', flood);
    $('.sw-label', sw).textContent = flood ? 'Apagar la luz' : 'Prender la luz';
  });

  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);

  const loop = t => {
    if (heroVisible) {
      if (!hovering && !reduce) {
        px = w * (0.5 + 0.3 * Math.sin(t * 0.0005));
        py = h * (0.48 + 0.22 * Math.sin(t * 0.0008 + 1.3));
      }
      x += (px - x) * 0.13; y += (py - y) * 0.13;
      const base = clamp(w * 0.2, 150, 270);
      const target = flood ? Math.hypot(w, h) : base;
      r += (target - r) * 0.06;
      stage.style.setProperty('--mx', x.toFixed(1) + 'px');
      stage.style.setProperty('--my', y.toFixed(1) + 'px');
      stage.style.setProperty('--r', r.toFixed(1) + 'px');
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  if (finePointer) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cursor.classList.add('on'); });
    document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
    (function move() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px,${cy}px)`;
      requestAnimationFrame(move);
    })();
    document.addEventListener('pointerover', e => {
      cursor.classList.toggle('big', !!e.target.closest('a,button,.item,.card'));
    });
  }

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        el.style.transform = `translate(${dx * 0.22}px,${dy * 0.32}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Tilt 3D ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const b = el.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width - 0.5, py = (e.clientY - b.top) / b.height - 0.5;
        el.style.transform = `rotateX(${(-py * 14).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg) translateY(-6px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Reveal + contadores ---------- */
  const countUp = el => {
    const end = +el.dataset.count, pre = el.dataset.prefix || '';
    if (reduce) { el.textContent = pre + end; return; }
    const dur = 1800, s = performance.now();
    (function tick(n) {
      const p = clamp((n - s) / dur, 0, 1);
      el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    })(s);
  };
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- Pasillos: scroll horizontal ---------- */
  const aisles = $('#pasillos');
  const track = $('.aisles-track', aisles);
  const bar = $('.aisles-bar i', aisles);
  const panels = $$('.panel', aisles);
  const now = $('#aisleNow');
  const desktop = matchMedia('(min-width: 901px)');
  let activeIdx = -1;

  const setActive = i => {
    if (i === activeIdx) return;
    activeIdx = i;
    panels.forEach((p, k) => p.classList.toggle('active', k === i));
    now.textContent = String(i + 1).padStart(2, '0');
  };

  const updateAisles = () => {
    if (!desktop.matches) {
      track.style.transform = '';
      return;
    }
    const rect = aisles.getBoundingClientRect();
    const total = aisles.offsetHeight - innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    track.style.transform = `translate3d(${(-p * (panels.length - 1) * 100).toFixed(3)}vw,0,0)`;
    bar.style.transform = `scaleX(${p})`;
    setActive(Math.round(p * (panels.length - 1)));
  };

  // En mobile los paneles se apilan: se activan al entrar en pantalla
  const panelIO = new IntersectionObserver(entries => entries.forEach(e => {
    if (!desktop.matches) e.target.classList.toggle('active', e.isIntersecting);
  }), { threshold: 0.35 });
  panels.forEach(p => panelIO.observe(p));
  desktop.addEventListener('change', () => { activeIdx = -1; panels.forEach(p => p.classList.remove('active')); updateAisles(); });

  /* ---------- Scroll: progreso, nav, pasillos ---------- */
  const nav = $('#nav');
  const prog = $('.progress i');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      nav.classList.toggle('hide', y > lastY && y > 300);
      lastY = y;
      updateAisles();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Catálogo ---------- */
  // Nombres de ejemplo: ajustar al stock real del local
  const ITEMS = [
    ['Ollas y cacerolas', 'cocina', 'pot'], ['Sartenes', 'cocina', 'pan'], ['Cubiertos', 'cocina', 'cutlery'], ['Utensilios', 'cocina', 'cutlery'],
    ['Tazas y mugs', 'bazar', 'cup'], ['Vasos y copas', 'bazar', 'glass'], ['Platos y bowls', 'bazar', 'plate'], ['Termos y botellas', 'bazar', 'bottle'],
    ['Linternas', 'luz', 'flash'], ['Lámparas LED', 'luz', 'bulb'], ['Pilas', 'luz', 'battery'], ['Faroles', 'luz', 'flash'],
    ['Decoración', 'hogar', 'spark'], ['Relojes', 'hogar', 'clock'], ['Limpieza', 'hogar', 'broom'], ['Regalos', 'hogar', 'gift'],
    ['Cajas organizadoras', 'orden', 'box'], ['Canastos', 'orden', 'basket'],
  ];
  const LABEL = { cocina: 'Cocina', bazar: 'Bazar', luz: 'Luz', hogar: 'Hogar', orden: 'Orden' };
  const grid = $('#items');
  const els = ITEMS.map(([name, cat, icon]) => {
    const a = document.createElement('article');
    a.className = 'item';
    a.dataset.cat = cat;
    a.innerHTML = `<svg class="ic"><use href="#i-${icon}"/></svg><small>${LABEL[cat]}</small><b>${name}</b>`;
    a.classList.add('out');
    grid.append(a);
    return a;
  });

  let token = 0;
  const show = (filter, stagger = 40) => {
    const my = ++token;
    let i = 0;
    els.forEach(el => {
      const match = filter === 'all' || el.dataset.cat === filter;
      if (match) {
        el.hidden = false;
        const d = i++ * stagger;
        setTimeout(() => { if (my === token) el.classList.remove('out'); }, 30 + d);
      } else {
        el.classList.add('out');
        setTimeout(() => { if (my === token) el.hidden = true; }, 350);
      }
    });
  };
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { show('all', 55); o.disconnect(); } }, { threshold: 0.2 }).observe(grid);

  $('#chips').addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (!c) return;
    $$('.chip').forEach(b => { b.classList.toggle('on', b === c); b.setAttribute('aria-selected', b === c); });
    show(c.dataset.f);
  });

  /* ---------- Abierto / cerrado ---------- */
  // Horarios de ejemplo: confirmar con el local. Cada tramo es [apertura, cierre] en horas decimales.
  const HOURS = { 1: [[9, 13], [16.5, 21]], 2: [[9, 13], [16.5, 21]], 3: [[9, 13], [16.5, 21]], 4: [[9, 13], [16.5, 21]], 5: [[9, 13], [16.5, 21]], 6: [[9, 13], [16.5, 21]], 0: [] };
  const badge = $('#openBadge');
  const fmt = hr => { const hh = Math.floor(hr), mm = Math.round((hr - hh) * 60); return mm ? `${hh}:${String(mm).padStart(2, '0')}` : `${hh}`; };
  const checkOpen = () => {
    const ar = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const hr = ar.getHours() + ar.getMinutes() / 60;
    const slots = HOURS[ar.getDay()] || [];
    const cur = slots.find(([a, b]) => hr >= a && hr < b);
    const label = $('b', badge);
    badge.classList.remove('open', 'closed');
    if (cur) {
      badge.classList.add('open');
      label.textContent = `Abierto ahora · cierra a las ${fmt(cur[1])}`;
    } else {
      badge.classList.add('closed');
      const next = slots.find(([a]) => a > hr);
      label.textContent = next ? `Cerrado · abre a las ${fmt(next[0])}` : 'Cerrado por hoy';
    }
  };
  checkOpen();
  setInterval(checkOpen, 60000);

  /* ---------- Varios ---------- */
  $('#year').textContent = new Date().getFullYear();
  $('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
})();
