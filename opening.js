(() => {
 'use strict';
 const opening = document.querySelector('.lemon-opening');
 const replay = document.querySelector('[data-opening-replay]');
 const logo = document.querySelector('.type-title .lemon-mark');
 if (!opening || !replay || !logo) return;
 if (typeof opening.showModal !== 'function' || typeof opening.animate !== 'function') { replay.hidden = true; return; }
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const enter = opening.querySelector('[data-opening-enter]');
 const pause = opening.querySelector('[data-opening-pause]');
 const word = opening.querySelector('.opening-word');
 const track = opening.querySelector('.opening-track span');
 const sessionKey = 'wyh-opening-lemon-v1';
 const duration = 2400, ns = 'http://www.w3.org/2000/svg';
 let animations = [], master, watchdog, opener, overflow = '', paused = false, cleaned = true;
 const remember = () => { try { sessionStorage.setItem(sessionKey, 'seen'); } catch {} };
 const seen = () => { try { return sessionStorage.getItem(sessionKey) === 'seen'; } catch { return false; } };
 const restore = () => {
  if (cleaned) return;
  cleaned = true; clearTimeout(watchdog);
  animations.forEach(animation => animation.cancel()); animations = []; master = null;
  document.body.classList.remove('lemon-opening-active');
  document.body.style.overflow = overflow;
  word.replaceChildren(); word.removeAttribute('style'); track.removeAttribute('style');
  paused = false; pause.hidden = false; pause.textContent = '暂停'; pause.setAttribute('aria-pressed', 'false');
  opener?.focus({preventScroll: true});
 };
 const finish = () => { if (opening.open) opening.close(); restore(); };
 const safetyTimer = () => {
  clearTimeout(watchdog);
  watchdog = setTimeout(finish, Math.max(0, duration - Number(master?.currentTime || 0)) + 900);
 };
 const createWord = () => {
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', logo.getAttribute('viewBox'));
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  const defs = document.createElementNS(ns, 'defs'); svg.append(defs);
  const bands = [[0, 95], [95, 66], [161, 89]], pieces = [];
  bands.forEach(([y, height], band) => {
   const clip = document.createElementNS(ns, 'clipPath'), rect = document.createElementNS(ns, 'rect');
   clip.id = 'lemon-intro-band-' + band; clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
   rect.setAttribute('x', '-100'); rect.setAttribute('y', String(y)); rect.setAttribute('width', '1330'); rect.setAttribute('height', String(height));
   clip.append(rect); defs.append(clip);
  });
  [...logo.querySelectorAll('path[data-glyph]')].forEach((path, letter) => {
   bands.forEach((_, band) => {
    const piece = document.createElementNS(ns, 'g'), mask = document.createElementNS(ns, 'g');
    piece.classList.add('lemon-piece'); piece.dataset.letter = String(letter); piece.dataset.band = String(band);
    mask.setAttribute('clip-path', 'url(#lemon-intro-band-' + band + ')');
    const glyph = path.cloneNode(true); glyph.removeAttribute('data-glyph'); mask.append(glyph); piece.append(mask); svg.append(piece);
    pieces.push({element: piece, letter, band});
   });
  });
  word.replaceChildren(svg); return pieces;
 };
 const play = (manual = false) => {
  if (opening.open) return;
  opener = manual ? replay : document.querySelector('.type-actions .primary-link');
  overflow = document.body.style.overflow; cleaned = false;
  try {
   const pieces = createWord();
   document.body.style.overflow = 'hidden';
   const target = logo.getBoundingClientRect();
   if (!target.width || !target.height) { finish(); return; }
   const startWidth = Math.min(innerWidth * .84, 980);
   const scale = startWidth / target.width;
   const dx = innerWidth / 2 - (target.left + target.width / 2);
   const dy = innerHeight * .46 - (target.top + target.height / 2);
   Object.assign(word.style, {left: target.left + 'px', top: target.top + 'px', width: target.width + 'px', height: target.height + 'px'});
   opening.showModal(); document.body.classList.add('lemon-opening-active'); enter.focus({preventScroll: true}); remember();
   if (reduced.matches) {
    pause.hidden = true; track.style.transform = 'scaleX(1)';
    word.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')'; return;
   }
   const timing = {duration, fill: 'both', easing: 'linear'};
   const add = (element, frames) => { const animation = element.animate(frames, timing); animations.push(animation); return animation; };
   const start = 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')';
   add(word, [
    {transform: start, opacity: 0, offset: 0}, {transform: start, opacity: 1, offset: .12},
    {transform: start, opacity: 1, offset: .54, easing: 'cubic-bezier(.22,.75,.2,1)'},
    {transform: 'translate(0,0) scale(1)', opacity: 1, offset: .94}, {transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1}
   ]);
   pieces.forEach(({element, letter, band}) => {
    const direction = letter % 2 === 0 ? -1 : 1;
    const x = band === 1 ? direction * 32 : (letter - 2) * 13 + (band === 0 ? -15 : 15);
    const y = band === 0 ? -46 : band === 2 ? 46 : direction * 5;
    add(element, [
     {transform: 'translate(0,0)', offset: 0}, {transform: 'translate(0,0)', offset: .21, easing: 'cubic-bezier(.3,0,.2,1)'},
     {transform: 'translate(' + x + 'px,' + y + 'px)', offset: .50 + letter * .012},
     {transform: 'translate(' + x + 'px,' + y + 'px)', offset: .58, easing: 'cubic-bezier(.22,.8,.2,1)'},
     {transform: 'translate(0,0)', offset: .92 + letter * .012}, {transform: 'translate(0,0)', offset: 1}
    ]);
   });
   [['.opening-curtain-top', '-101%'], ['.opening-curtain-bottom', '101%']].forEach(([selector, to]) => {
    add(opening.querySelector(selector), [{transform: 'translateY(0)', offset: 0}, {transform: 'translateY(0)', offset: .21, easing: 'cubic-bezier(.5,0,.2,1)'}, {transform: 'translateY(' + to + ')', offset: .62}, {transform: 'translateY(' + to + ')', offset: 1}]);
   });
   ['.opening-grid', '.opening-meta'].forEach(selector => add(opening.querySelector(selector), [{opacity: 1, offset: 0}, {opacity: 1, offset: .3}, {opacity: 0, offset: .6}, {opacity: 0, offset: 1}]));
   [['.type-copy', .62], ['.type-actions', .70], ['.type-register', .76]].forEach(([selector, offset]) => {
    add(document.querySelector(selector), [{opacity: 0, transform: 'translateY(12px)', offset: 0}, {opacity: 0, transform: 'translateY(12px)', offset, easing: 'ease-out'}, {opacity: 1, transform: 'translateY(0)', offset: Math.min(.99, offset + .22)}, {opacity: 1, transform: 'translateY(0)', offset: 1}]);
   });
   master = add(track, [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}]);
   master.onfinish = finish; safetyTimer();
  } catch { finish(); }
 };
 enter.addEventListener('click', finish);
 replay.addEventListener('click', () => play(true));
 pause.addEventListener('click', () => {
  if (!master) return;
  paused = !paused; pause.textContent = paused ? '继续' : '暂停'; pause.setAttribute('aria-pressed', String(paused));
  // Hold a fully legible word when pausing during its first appearance.
  if (paused && Number(master.currentTime || 0) < duration * .13) animations.forEach(animation => { animation.currentTime = duration * .13; });
  animations.forEach(animation => paused ? animation.pause() : animation.play());
  if (paused) clearTimeout(watchdog); else safetyTimer();
 });
 opening.addEventListener('cancel', event => { event.preventDefault(); finish(); });
 opening.addEventListener('close', restore);
 opening.addEventListener('wheel', event => { if (Math.abs(event.deltaY) > 15) finish(); }, {passive: true});
 document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
 addEventListener('pagehide', finish);
 addEventListener('resize', () => { if (opening.open) finish(); });
 reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
 const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
 if (!location.hash && !returning && !reduced.matches && !seen()) play();
})();
