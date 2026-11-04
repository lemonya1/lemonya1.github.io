(() => {
 'use strict';
 const opening = document.querySelector('.opening');
 const replay = document.querySelector('[data-opening-replay]');
 if (!opening || !replay || typeof opening.showModal !== 'function' || typeof opening.animate !== 'function') return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const enter = opening.querySelector('[data-opening-enter]');
 const pause = opening.querySelector('[data-opening-pause]');
 const aperture = opening.querySelector('.opening-aperture');
 const frame = opening.querySelector('.opening-frame');
 const title = opening.querySelector('.opening-title-block');
 const track = opening.querySelector('.opening-track span');
 const note = opening.querySelector('.opening-frame-note');
 const sessionKey = 'wyh-opening-v1';
 const duration = 3400;
 let animations = [], watchdog, opener, overflow, paused = false, pointerFrame = 0;

 const remember = () => { try { sessionStorage.setItem(sessionKey, 'seen'); } catch { /* Storage is optional. */ } };
 const seen = () => { try { return sessionStorage.getItem(sessionKey) === 'seen'; } catch { return false; } };
 const restore = () => {
  clearTimeout(watchdog); cancelAnimationFrame(pointerFrame); pointerFrame = 0;
  animations.forEach(animation => animation.cancel()); animations = [];
  document.body.style.overflow = overflow || '';
  opening.style.removeProperty('--opening-x'); opening.style.removeProperty('--opening-y');
  track.style.removeProperty('transform'); pause.hidden = false;
  paused = false; pause.setAttribute('aria-pressed', 'false'); pause.textContent = '暂停';
  opener?.focus({preventScroll: true});
 };
 const finish = (animateHero = false) => {
  if (!opening.open) return;
  opening.close(); restore();
  if (animateHero && !reduced.matches && !document.querySelector('.hero')?.classList.contains('scene-focused')) {
   document.querySelector('.hero-content')?.animate([{opacity: 0, transform: 'translateY(14px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)'});
  }
 };
 const safetyTimer = () => {
  clearTimeout(watchdog);
  const remaining = Math.max(0, duration - Number(animations[0]?.currentTime || 0));
  watchdog = setTimeout(() => finish(), remaining + 800);
 };
 const play = (manual = false) => {
  if (opening.open) return;
  opener = manual ? replay : document.querySelector('.hero .primary-link');
  overflow = document.body.style.overflow;
  try {
   opening.showModal(); document.body.style.overflow = 'hidden'; enter.focus({preventScroll: true}); remember();
   if (reduced.matches) { pause.hidden = true; track.style.transform = 'scaleX(1)'; return; }
   safetyTimer();
   const inset = innerWidth <= 540 ? '24% 8% 30% 8%' : '24% 18% 24% 18%';
   const timing = {duration, fill: 'both', easing: 'linear'};
   const add = (element, keyframes) => {
    const animation = element.animate(keyframes, timing); animations.push(animation); return animation;
   };
   add(aperture, [
    {clipPath: 'inset(49.8% 49%)', offset: 0, easing: 'cubic-bezier(.2,.7,.2,1)'},
    {clipPath: `inset(${inset})`, offset: .23}, {clipPath: `inset(${inset})`, offset: .64, easing: 'cubic-bezier(.7,0,.2,1)'},
    {clipPath: 'inset(0%)', offset: .94}, {clipPath: 'inset(0%)', offset: 1}
   ]);
   add(frame, [
    {inset: '49.8% 49%', opacity: .35, offset: 0, easing: 'cubic-bezier(.2,.7,.2,1)'},
    {inset, opacity: 1, offset: .23}, {inset, opacity: 1, offset: .64, easing: 'cubic-bezier(.7,0,.2,1)'},
    {inset: '0%', opacity: 0, offset: .94}, {inset: '0%', opacity: 0, offset: 1}
   ]);
   add(title, [
    {opacity: 0, transform: 'translateY(30px)', offset: 0}, {opacity: 0, transform: 'translateY(30px)', offset: .1, easing: 'cubic-bezier(.2,.7,.2,1)'},
    {opacity: 1, transform: 'translateY(0)', offset: .3}, {opacity: 1, transform: 'translateY(0)', offset: .64},
    {opacity: 0, transform: 'translateY(-22px)', offset: .86}, {opacity: 0, transform: 'translateY(-22px)', offset: 1}
   ]);
   add(note, [{opacity: 0, offset: 0}, {opacity: 1, offset: .3}, {opacity: 1, offset: .64}, {opacity: 0, offset: .8}, {opacity: 0, offset: 1}]);
   add(track, [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}]);
   const exit = add(opening, [{opacity: 1, offset: 0}, {opacity: 1, offset: .88}, {opacity: 0, offset: 1}]);
   exit.onfinish = () => finish(true);
  } catch { finish(); }
 };

 enter.addEventListener('click', () => finish(true));
 opening.addEventListener('cancel', event => { event.preventDefault(); finish(); });
 opening.addEventListener('close', () => { if (animations.length) restore(); });
 pause.addEventListener('click', () => {
  paused = !paused; pause.setAttribute('aria-pressed', String(paused)); pause.textContent = paused ? '继续' : '暂停';
  // Pausing during the initial shutter reveal holds on a legible title frame.
  if (paused && Number(animations[0]?.currentTime || 0) < duration * .3) animations.forEach(animation => { animation.currentTime = duration * .3; });
  animations.forEach(animation => paused ? animation.pause() : animation.play());
  if (paused) clearTimeout(watchdog); else safetyTimer();
 });
 replay.addEventListener('click', () => play(true));
 opening.addEventListener('wheel', event => { if (Math.abs(event.deltaY) > 15) finish(); }, {passive: true});
 opening.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || reduced.matches || pointerFrame) return;
  const x = (event.clientX / innerWidth - .5) * 12, y = (event.clientY / innerHeight - .5) * 8;
  pointerFrame = requestAnimationFrame(() => { opening.style.setProperty('--opening-x', `${x}px`); opening.style.setProperty('--opening-y', `${y}px`); pointerFrame = 0; });
 });
 opening.addEventListener('pointerleave', () => { opening.style.setProperty('--opening-x', '0px'); opening.style.setProperty('--opening-y', '0px'); });
 document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
 addEventListener('pagehide', () => finish());
 reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
 // Anchor links, return navigation, and reduced-motion preferences go straight to the work.
 const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
 if (!location.hash && !returning && !reduced.matches && !seen()) play();
})();
