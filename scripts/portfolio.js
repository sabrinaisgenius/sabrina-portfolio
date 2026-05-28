/* =================================================================
   PORTFOLIO — interactive layer
   ----------------------------------------------------------------
   - Drives horizontal pan from window.scrollY (sticky-translate pattern)
   - Keeps the spacer height in sync with the track's scrollWidth
   - Updates: minimap dashes, nav active state, section badge,
              scroll progress bar, topbar inverted theme on Contact
   - Custom cursor (dot + ring + label badge)
   - Top-orbit drifts toward the cursor (rauno-style)
   ================================================================= */

(() => {
  // Prevent browser from restoring old scroll position on page load/back-nav
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const page = document.getElementById('page');
  const track = document.getElementById('track');
  const stage = document.getElementById('stage');
  const topbar = document.getElementById('topbar');
  const progress = document.getElementById('scrollProgress');
  const dashStrip = document.getElementById('minimap');
  const badge = document.getElementById('sectionBadge');
  const badgeNow = badge && badge.querySelector('.now');
  const badgeLbl = badge && badge.querySelector('.lbl');
  const navLinks = [...document.querySelectorAll('.nav-link')];

  // ---------- 1. SIZE THE SPACER ----------
  const SPEED_RATIO = 0.95;

  let trackWidth = 0;
  let maxTranslate = 0;
  let maxScroll = 0;

  function measure() {
    const vw = window.innerWidth;
    trackWidth = track.scrollWidth;
    maxTranslate = Math.max(0, trackWidth - vw);
    page.style.height = (maxTranslate * SPEED_RATIO + window.innerHeight) + 'px';
    maxScroll = page.offsetHeight - window.innerHeight;
    update();
  }

  // ---------- 2. SECTION ANCHOR POSITIONS ----------
  const panels = [...track.querySelectorAll('section.panel')];
  let anchors = [];

  function measureAnchors() {
    anchors = [];
    let cursorX = 0;
    panels.forEach(p => {
      const w = p.offsetWidth;
      const panelStartX = cursorX;
      const panelEndX = cursorX + w;
      const startY = (panelStartX) * SPEED_RATIO;
      const endY = (Math.max(0, panelEndX - window.innerWidth)) * SPEED_RATIO;
      anchors.push({
        id: p.id,
        label: p.dataset.screenLabel || p.id,
        counter: p.dataset.counter || '',
        startY,
        endY: endY || startY,
        el: p,
      });
      cursorX += w;
    });
  }

  // ---------- 3. SCROLL → TRANSLATE ----------
  function update() {
    const y = window.scrollY;
    const prog = maxScroll > 0 ? Math.min(1, Math.max(0, y / maxScroll)) : 0;
    const tx = -prog * maxTranslate;
    track.style.transform = `translate3d(${tx}px, 0, 0)`;
    progress.style.width = (prog * 100) + '%';

    const viewportCenterX = -tx + window.innerWidth / 2;
    let active = 0;
    let cursorX = 0;
    panels.forEach((p, i) => {
      const w = p.offsetWidth;
      if (viewportCenterX >= cursorX && viewportCenterX < cursorX + w) active = i;
      cursorX += w;
    });
    setActive(active, prog);
  }

  let lastActive = -1;
  function setActive(i, prog) {
    if (i !== lastActive) {
      navLinks.forEach((a, ai) => a.classList.toggle('active', ai === i));
      const a = anchors[i];
      if (a) {
        if (badgeNow) badgeNow.textContent = a.counter;
        if (badgeLbl) badgeLbl.textContent = a.label.replace(/^\d+\s*/, '');
      }
      const isContact = panels[i] && panels[i].classList.contains('panel--contact');
      topbar.classList.toggle('inv', isContact);
      if (badge) badge.classList.toggle('inv', isContact);
      lastActive = i;
    }
    if (dashStrip) {
      const dashes = dashStrip.children;
      const n = dashes.length;
      const filled = Math.round(prog * (n - 1));
      for (let k = 0; k < n; k++) {
        dashes[k].classList.toggle('on', k <= filled);
        dashes[k].classList.toggle('peak', k === filled);
      }
    }
  }

  // ---------- 4. NAV CLICK → SCROLL TO ANCHOR ----------
  navLinks.forEach((a, i) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = anchors[i];
      if (!target) return;
      window.scrollTo({ top: target.startY, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-goto');
      const idx = anchors.findIndex(a => a.id === id);
      if (idx >= 0) { e.preventDefault(); window.scrollTo({ top: anchors[idx].startY, behavior: 'smooth' }); }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); jumpBy(+1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); jumpBy(-1); }
  });
  function jumpBy(delta) {
    const next = Math.max(0, Math.min(anchors.length - 1, lastActive + delta));
    window.scrollTo({ top: anchors[next].startY, behavior: 'smooth' });
  }

  // ---------- 5. CURSOR ----------
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const cBadge = document.getElementById('cursorBadge');
  const cBadgeText = document.getElementById('cursorBadgeText');
  const cBadgeGlyph = cBadge && cBadge.querySelector('.glyph');

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;
  let badgeX = mouseX, badgeY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    if (dot) dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  const orbitInner = document.getElementById('topOrbitInner');
  const topOrbit = document.getElementById('topOrbit');
  let orbitBaseX = 0, orbitBaseY = 0;
  function measureOrbit() {
    if (!topOrbit) return;
    const r = topOrbit.getBoundingClientRect();
    orbitBaseX = r.left + r.width / 2;
    orbitBaseY = r.top + r.height / 2;
  }

  function tick() {
    if (ring) {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    }
    if (cBadge) {
      badgeX += (mouseX - badgeX) * 0.12;
      badgeY += (mouseY - badgeY) * 0.12;
      cBadge.style.transform = `translate(${badgeX}px, ${badgeY - 36}px) translate(-50%, -100%)`;
    }
    if (orbitInner && orbitBaseX) {
      const dx = mouseX - orbitBaseX;
      const dy = mouseY - orbitBaseY;
      const dist = Math.hypot(dx, dy) || 1;
      const max = 36;
      const tx = (dx / dist) * Math.min(max, dist * 0.10);
      const ty = (dy / dist) * Math.min(max, dist * 0.10);
      orbitInner.style.transform = `translate(${tx}px, ${ty}px)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---------- 6. HOVER LABELS ON CURSOR ----------
  const hoverLabels = {
    view:    { text: 'VIEW WORK',  glyph: '↗' },
    contact: { text: 'SAY HELLO',  glyph: '✦' },
    preview: { text: 'PLAY REEL',  glyph: '▶' },
    project: { text: 'OPEN CASE',  glyph: '↗' },
    video:   { text: 'WATCH LOOP', glyph: '▶' },
    email:   { text: 'COPY EMAIL', glyph: '@' },
  };
  document.querySelectorAll('[data-hover]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (ring) ring.classList.add('hovering');
      const key = el.getAttribute('data-hover');
      const lbl = hoverLabels[key];
      if (lbl && cBadge && cBadgeText && cBadgeGlyph) {
        cBadgeText.textContent = lbl.text;
        cBadgeGlyph.textContent = lbl.glyph;
        cBadge.classList.add('visible');
      }
    });
    el.addEventListener('mouseleave', () => {
      if (ring) ring.classList.remove('hovering');
      if (cBadge) cBadge.classList.remove('visible');
    });
  });

  // ---------- 7. AUTOPLAY REELS AT CUSTOM SPEED ----------
  document.querySelectorAll('video.proj__reel').forEach(v => {
    const rate = parseFloat(v.dataset.rate) || 1;
    const apply = () => { try { v.playbackRate = rate; } catch (e) {} };
    v.addEventListener('loadedmetadata', apply);
    v.addEventListener('play', apply);
    apply();
    v.addEventListener('seeked', apply);
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener('click', tryPlay, { once: true });
  });

  // ---------- 8. HASH NAVIGATION ----------
  // Handles Webfolio.html#work style links from case study back buttons.
  // The browser's native hash scroll doesn't work with horizontal pan,
  // so we intercept it here and scroll to the correct panel manually.
  let hashHandled = false;
  function handleHash() {
    if (hashHandled || !anchors.length) return;
    const hash = window.location.hash.slice(1);
    if (hash) {
      const idx = anchors.findIndex(a => a.id === hash);
      if (idx >= 0) {
        hashHandled = true;
        // Remove hash from URL so it doesn't fight us on re-measure
        history.replaceState(null, '', window.location.pathname + window.location.search);
        window.scrollTo({ top: anchors[idx].startY, behavior: 'instant' });
        return;
      }
    }
    // No hash — ensure page starts at the very beginning
    hashHandled = true;
    window.scrollTo(0, 0);
  }

  // ---------- 9. MOBILE TOUCH → HORIZONTAL PAN ----------
  // Converts horizontal finger swipe into window.scrollY changes so the
  // existing scroll→translate mechanism works on mobile without modification.
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    let tStartX = 0, tStartY = 0, tStartScrollY = 0;
    let swipeDir = null; // 'h' | 'v' | null

    const mobileHint = document.getElementById('mobileHint');

    window.addEventListener('touchstart', (e) => {
      tStartX = e.touches[0].clientX;
      tStartY = e.touches[0].clientY;
      tStartScrollY = window.scrollY;
      swipeDir = null;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      const dx = tStartX - e.touches[0].clientX; // positive = swipe left
      const dy = tStartY - e.touches[0].clientY;

      // Determine swipe axis on first significant movement
      if (!swipeDir) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        swipeDir = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      }

      if (swipeDir === 'h') {
        e.preventDefault(); // block vertical scroll during horizontal swipe
        const newY = Math.max(0, Math.min(maxScroll, tStartScrollY + dx / SPEED_RATIO));
        window.scrollTo(0, newY);

        // Dismiss hint on first real swipe
        if (mobileHint && !mobileHint.dataset.dismissed) {
          mobileHint.dataset.dismissed = '1';
          mobileHint.style.transition = 'opacity 0.3s';
          mobileHint.style.opacity = '0';
          setTimeout(() => mobileHint.remove(), 350);
        }
      }
      // vertical swipes fall through → browser scrolls inside the panel (overflow-y: auto)
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (swipeDir !== 'h' || !anchors.length) return;
      // Snap to nearest panel
      const y = window.scrollY;
      let nearest = anchors[0];
      let minDist = Infinity;
      anchors.forEach(a => {
        const d = Math.abs(a.startY - y);
        if (d < minDist) { minDist = d; nearest = a; }
      });
      window.scrollTo({ top: nearest.startY, behavior: 'smooth' });
      swipeDir = null;
    }, { passive: true });
  }

  // ---------- 10. INIT + RESIZE ----------
  function init() {
    measureAnchors();
    measure();
    measureOrbit();
    handleHash();
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { init(); });

  // Re-measure when track content changes size (images loading, etc.)
  // This fixes the "blank page after contact" issue caused by late image renders
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); }).observe(track);
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
  setTimeout(init, 80);
  setTimeout(init, 400);
  setTimeout(init, 1200); // catch late font/image layout shifts
})();
