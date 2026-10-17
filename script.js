const menuToggle=document.getElementById("menuToggle"),navMenu=document.getElementById("navMenu");
menuToggle.addEventListener("click",()=>{navMenu.classList.toggle("open");menuToggle.setAttribute("aria-expanded",navMenu.classList.contains("open"))});
navMenu.querySelectorAll("a").forEach(l=>l.addEventListener("click",()=>navMenu.classList.remove("open")));
document.getElementById("year").textContent=new Date().getFullYear();
const observer=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}})},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

(() => {
  const hero = document.querySelector('#skills');
  if (!hero) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const cv = document.createElement('canvas');
  cv.className = 'net';
  cv.setAttribute('aria-hidden', 'true');
  hero.prepend(cv);
  const ctx = cv.getContext('2d');


  let W = 0, H = 0, nodes = [], edges = [], outs = new Map(), firstEdges = [], sig = [];
  let mouse = null, running = true, visible = true, raf = 0;

  function build() {
    W = cv.clientWidth; H = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const layers = W < 700 ? [3, 5, 5, 3] : [4, 6, 8, 7, 6, 4, 3];
    const L = layers.length;
    nodes = []; edges = []; outs = new Map(); sig = [];
    layers.forEach((n, li) => {
      const x = W * (0.04 + 0.92 * li / (L - 1));
      for (let i = 0; i < n; i++) {
        const y = H * (0.12 + 0.76 * (i + 0.5) / n) + (Math.random() - 0.5) * H * 0.06;
        nodes.push({ x, y, bx: x, by: y, l: li, g: 0, ph: Math.random() * 6.28 });
      }
    });
    for (let li = 0; li < L - 1; li++) {
      const a = nodes.filter((n) => n.l === li), b = nodes.filter((n) => n.l === li + 1);
      a.forEach((n) => {
        b.slice().sort((p, q) => Math.abs(p.y - n.y) - Math.abs(q.y - n.y)).slice(0, 3)
          .forEach((m) => {
            const e = { a: n, b: m };
            edges.push(e);
            if (!outs.has(n)) outs.set(n, []);
            outs.get(n).push(e);
          });
      });
    }
    firstEdges = edges.filter((e) => e.a.l === 0);
  }

  const fire = (e) => { if (e && sig.length < 70) sig.push({ e, t: 0, v: 0.007 + Math.random() * 0.008 }); };

  function draw(animate) {
    ctx.clearRect(0, 0, W, H);

    nodes.forEach((n) => {
      let tx = n.bx, ty = n.by;
      if (animate) {
        n.ph += 0.008;
        tx += Math.cos(n.ph) * 6; ty += Math.sin(n.ph * 1.3) * 6;
        if (mouse) {
          const dx = mouse.x - n.x, dy = mouse.y - n.y, d = Math.hypot(dx, dy);
          if (d < 190) { const f = 1 - d / 190; tx += dx * f * 0.18; ty += dy * f * 0.18; n.g = Math.max(n.g, f * 0.9); }
        }
        n.x += (tx - n.x) * 0.08; n.y += (ty - n.y) * 0.08; n.g *= 0.94;
      }
    });

    ctx.lineWidth = 1;
    edges.forEach((e) => {
      const g = Math.max(e.a.g, e.b.g);
      ctx.strokeStyle = 'rgba(169,154,255,' + (0.08 + g * 0.4).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    });

    if (mouse && animate) {
      nodes.map((n) => ({ n, d: Math.hypot(mouse.x - n.x, mouse.y - n.y) }))
        .filter((o) => o.d < 190).sort((p, q) => p.d - q.d).slice(0, 3)
        .forEach((o) => {
          ctx.strokeStyle = 'rgba(201,243,106,' + ((1 - o.d / 190) * 0.55).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(o.n.x, o.n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        });
    }

    if (animate) {
      if (Math.random() < 0.07) fire(firstEdges[Math.floor(Math.random() * firstEdges.length)]);
      sig = sig.filter((s) => {
        s.t += s.v;
        const { a, b } = s.e;
        const x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        ctx.fillStyle = 'rgba(201,243,106,0.2)';
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(201,243,106,0.95)';
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill();
        if (s.t >= 1) {
          b.g = 1;
          const next = outs.get(b);
          if (next) next.slice().sort(() => Math.random() - 0.5).slice(0, 1 + (Math.random() < 0.4 ? 1 : 0)).forEach(fire);
          return false;
        }
        return true;
      });
    }

    nodes.forEach((n) => {
      ctx.fillStyle = 'rgba(201,243,106,' + (n.g * 0.16).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, 8 + n.g * 12, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(201,243,106,' + (0.28 + n.g * 0.72).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(n.x, n.y, 2.2 + n.g * 2.6, 0, 6.283); ctx.fill();
    });
  }

  function loop() {
    if (!running || !visible) { raf = 0; return; }
    draw(true);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && running && visible) raf = requestAnimationFrame(loop); };

  build();
  if (reduce) { draw(false); }
  else {
    start();
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; start(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; start(); });
    if (fine) {
      hero.addEventListener('pointermove', (e) => {
        const r = cv.getBoundingClientRect();
        mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      });
      hero.addEventListener('pointerleave', () => { mouse = null; });
      hero.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a,button')) return;
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const n = nodes.reduce((best, c) => (Math.hypot(c.x - x, c.y - y) < Math.hypot(best.x - x, best.y - y) ? c : best));
        n.g = 1;
        (outs.get(n) || []).forEach(fire);
        for (let i = 0; i < 2; i++) firstEdges.slice().sort(() => Math.random() - 0.5).slice(0, 2).forEach(fire);
      });
    }
  }

  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { build(); if (reduce) draw(false); }, 150);
  });
})();

/* Cover letters: dodge the cursor, photo drifts the other way for depth */
(() => {
  const stage = document.querySelector('.cover-stage');
  if (!stage) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const word = stage.querySelector('.cover-word');
  const letters = [...stage.querySelectorAll('.L')];
  const photo = stage.querySelector('.cover-photo');
  const props = ['--dx', '--dy', '--dr'];
  let raf;
  stage.addEventListener('pointermove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const sr = stage.getBoundingClientRect();
      const mx = e.clientX - sr.left, my = e.clientY - sr.top;
      letters.forEach((L) => {
        const cx = word.offsetLeft + L.offsetLeft + L.offsetWidth / 2;
        const cy = word.offsetTop + L.offsetTop + L.offsetHeight / 2;
        const dx = cx - mx, dy = cy - my, d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / 280);
        L.style.setProperty('--dx', (dx / d * f * 38).toFixed(1) + 'px');
        L.style.setProperty('--dy', (dy / d * f * 38).toFixed(1) + 'px');
        L.style.setProperty('--dr', ((dx > 0 ? 1 : -1) * f * 16).toFixed(1) + 'deg');
      });
      photo.style.setProperty('--px', (-(mx / sr.width - 0.5) * 16).toFixed(1) + 'px');
      photo.style.setProperty('--py', (-(my / sr.height - 0.5) * 8).toFixed(1) + 'px');
    });
  });
  stage.addEventListener('pointerleave', () => {
    letters.forEach((L) => props.forEach((p) => L.style.removeProperty(p)));
    ['--px', '--py'].forEach((p) => photo.style.removeProperty(p));
  });
})();

/* Section extras */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Silhouette echoes slide with the cursor
  const stage = document.querySelector('.cover-stage');
  if (stage && fine && !reduce) {
    const ech = [...stage.querySelectorAll('.echo')];
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      ech.forEach((el, i) => {
        const k = i ? -1 : 1;
        el.style.setProperty('--ex', (x * 34 * k).toFixed(1) + 'px');
        el.style.setProperty('--ey', (y * 18 * k).toFixed(1) + 'px');
      });
    });
    stage.addEventListener('pointerleave', () => ech.forEach((el) => { el.style.removeProperty('--ex'); el.style.removeProperty('--ey'); }));
  }

  // Giant outline words that drift sideways as you scroll
  const words = { about: 'ABOUT', skills: 'TOOLKIT', projects: 'WORK', education: 'LEARNING' };
  const wms = [];
  Object.keys(words).forEach((id) => {
    const s = document.getElementById(id);
    if (!s) return;
    const d = document.createElement('div');
    d.className = 'wm'; d.setAttribute('aria-hidden', 'true'); d.textContent = words[id];
    s.prepend(d); wms.push([s, d]);
  });

  // Timeline line draws itself, dots light up
  const tl = document.querySelector('.timeline');
  let fill = null, items = [];
  if (tl) { fill = document.createElement('span'); fill.className = 'tl-fill'; tl.prepend(fill); items = [...tl.querySelectorAll('.timeline-item')]; }

  let ticking = false;
  const update = () => {
    wms.forEach(([s, d]) => {
      const r = s.getBoundingClientRect();
      const t = (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight;
      d.style.transform = 'translateX(' + (t * -240).toFixed(0) + 'px)';
    });
    if (tl) {
      const r = tl.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (innerHeight * 0.75 - r.top) / r.height));
      fill.style.transform = 'scaleY(' + p + ')';
      items.forEach((it) => it.classList.toggle('on', it.offsetTop <= p * tl.offsetHeight + 8));
    }
    ticking = false;
  };
  if (reduce) { if (fill) fill.style.transform = 'scaleY(1)'; items.forEach((it) => it.classList.add('on')); }
  else { addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true }); update(); }

  // Card spotlight and tilt, magnetic buttons
  if (fine && !reduce) {
    document.querySelectorAll('.skill-card, .project-card').forEach((el) => {
      el.classList.add('spot');
      const k = el.classList.contains('skill-card') ? 8 : 3;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
        el.style.transform = 'perspective(900px) rotateX(' + (-(y / r.height - 0.5) * k).toFixed(2) + 'deg) rotateY(' + ((x / r.width - 0.5) * k * 1.2).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('.button-primary').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - (r.left + r.width / 2)) * 0.18).toFixed(1) + 'px,' + ((e.clientY - (r.top + r.height / 2)) * 0.25).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // SGPA counts up when it appears
  const q = [...document.querySelectorAll('.quick-facts strong')].find((s) => s.textContent.trim() === '8.39');
  if (q && !reduce) {
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      (function f(n) { const p = Math.min(1, (n - t0) / 1400); q.textContent = (8.39 * (1 - Math.pow(1 - p, 3))).toFixed(2); if (p < 1) requestAnimationFrame(f); })(t0);
    }, { threshold: 0.6 });
    io.observe(q);
  }
})();
