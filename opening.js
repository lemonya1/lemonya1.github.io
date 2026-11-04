(() => {
 'use strict';
 const opening = document.querySelector('.opening');
 const replay = document.querySelector('[data-opening-replay]');
 if (!opening || !replay || typeof opening.showModal !== 'function') return;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const scene = opening.querySelector('[data-opening-scene]');
 const next = opening.querySelector('[data-opening-next]');
 const slider = opening.querySelector('[data-opening-reveal]');
 const scrub = opening.querySelector('.opening-scrub');
 const status = opening.querySelector('[data-opening-status]');
 const hint = opening.querySelector('[data-opening-hint]');
 const percentage = opening.querySelector('[data-opening-percent]');
 const steps = [...opening.querySelectorAll('[data-opening-step]')];
 const sessionKey = 'wyh-opening-v2';
 const labels = ['寻找一个视角。', '让场景，慢慢显影。', '走进我的场景。'];
 const hints = ['移动鼠标取景 · 点击画面确认', '左右拖动画面或滑杆，展开色彩', '向下滚动或上滑，进入作品集'];
 let stage = 0, opener, overflow = '', cleaned = true, exiting = false, suppressClick = false;
 let pointerFrame = 0, dragId = null, touchY = null, wheelTotal = 0, wheelTime = 0, stageTime = 0;
 let exitAnimation, exitTimer;
 const remember = () => { try { sessionStorage.setItem(sessionKey, 'seen'); } catch {} };
 const seen = () => { try { return sessionStorage.getItem(sessionKey) === 'seen'; } catch { return false; } };
 const reveal = value => {
  const amount = Math.max(0, Math.min(100, Number(value)));
  slider.value = String(amount);
  slider.setAttribute('aria-valuetext', '场景显影 ' + Math.round(amount) + '%');
  opening.style.setProperty('--reveal', amount + '%');
  percentage.textContent = String(Math.round(amount)).padStart(2, '0') + '%';
 };
 const setStage = number => {
  if (exiting) return;
  stage = Math.max(0, Math.min(2, number));
  opening.dataset.stage = String(stage);
  stageTime = performance.now(); wheelTotal = 0;
  status.textContent = labels[stage];
  hint.textContent = stage === 0 && matchMedia('(pointer: coarse)').matches ? '轻触画面取景 · 开始探索' : hints[stage];
  next.innerHTML = ['确认取景 <span aria-hidden="true">→</span>', '完成显影 <span aria-hidden="true">→</span>', '进入作品集 <span aria-hidden="true">↗</span>'][stage];
  // Restore keyboard focus before hiding the completed range.
  if (stage !== 1 && scrub.contains(document.activeElement)) next.focus({preventScroll: true});
  scrub.hidden = stage !== 1;
  scene.setAttribute('aria-label', ['点击确认取景，进入显影', '拖动画面显影，也可使用下方滑杆', '进入作品集'][stage]);
  steps.forEach((button, index) => {
   button.setAttribute('aria-current', index === stage ? 'step' : 'false');
   button.dataset.complete = String(index < stage);
  });
  reveal(stage === 0 ? 0 : stage === 1 ? 18 : 100);
 };
 const release = () => {
  if (dragId !== null && scene.hasPointerCapture(dragId)) scene.releasePointerCapture(dragId);
  dragId = null; touchY = null;
 };
 const cleanup = () => {
  if (cleaned) return;
  cleaned = true; release(); clearTimeout(exitTimer); cancelAnimationFrame(pointerFrame); pointerFrame = 0;
  exitAnimation?.cancel(); exitAnimation = null;
  opening.classList.remove('is-leaving');
  document.body.style.overflow = overflow;
  opener?.focus({preventScroll: true});
 };
 const close = () => { if (opening.open) opening.close(); cleanup(); };
 const finish = (transition = false) => {
  if (!opening.open || exiting) return;
  exiting = true; release();
  if (!transition || reduced.matches || typeof opening.animate !== 'function') { close(); return; }
  opening.classList.add('is-leaving');
  // Only the final hand-off is timed; each scene waits for the visitor.
  exitTimer = setTimeout(close, 800);
  try {
   exitAnimation = opening.animate([{opacity: 1}, {opacity: 0}], {duration: 500, easing: 'ease-out', fill: 'forwards'});
   exitAnimation.onfinish = close;
  } catch { close(); }
 };
 const play = (manual = false) => {
  if (opening.open) return;
  opener = manual ? replay : document.querySelector('.hero .primary-link');
  overflow = document.body.style.overflow; cleaned = false; exiting = false; suppressClick = false;
  opening.style.setProperty('--opening-x', '0px'); opening.style.setProperty('--opening-y', '0px');
  opening.style.setProperty('--target-x', '50%'); opening.style.setProperty('--target-y', '50%');
  try {
   setStage(0); opening.showModal(); document.body.style.overflow = 'hidden'; remember();
   next.focus({preventScroll: true});
  } catch { close(); }
 };
 const advance = () => stage < 2 ? setStage(stage + 1) : finish(true);
 const dragReveal = event => {
  const rect = scene.getBoundingClientRect();
  reveal(Math.round((event.clientX - rect.left) / rect.width * 100));
 };
 replay.addEventListener('click', () => play(true));
 opening.querySelector('[data-opening-enter]').addEventListener('click', () => finish());
 next.addEventListener('click', advance);
 steps.forEach(button => button.addEventListener('click', () => setStage(Number(button.dataset.openingStep))));
 slider.addEventListener('input', () => reveal(slider.value));
 slider.addEventListener('change', () => { if (Number(slider.value) >= 96) setStage(2); });
 scene.addEventListener('click', () => {
  if (suppressClick) { suppressClick = false; return; }
  if (stage === 0) setStage(1); else if (stage === 2) finish(true);
 });
 scene.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advance(); }
 });
 scene.addEventListener('pointerdown', event => {
  if (stage !== 1 || !event.isPrimary || event.button !== 0) return;
  suppressClick = true; dragId = event.pointerId; scene.setPointerCapture(dragId); dragReveal(event);
 });
 scene.addEventListener('pointermove', event => {
  if (stage === 1 && event.pointerId === dragId) { dragReveal(event); return; }
  if (stage !== 0 || event.pointerType !== 'mouse' || reduced.matches || pointerFrame) return;
  const rect = scene.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  pointerFrame = requestAnimationFrame(() => {
   opening.style.setProperty('--target-x', x * 100 + '%'); opening.style.setProperty('--target-y', y * 100 + '%');
   opening.style.setProperty('--opening-x', (x - .5) * -14 + 'px'); opening.style.setProperty('--opening-y', (y - .5) * -10 + 'px');
   pointerFrame = 0;
  });
 });
 scene.addEventListener('pointerup', event => {
  if (event.pointerId !== dragId) return;
  dragReveal(event); release();
  if (Number(slider.value) >= 96) setStage(2);
 });
 scene.addEventListener('pointercancel', release);
 scene.addEventListener('pointerleave', () => {
  if (stage !== 0) return;
  opening.style.setProperty('--opening-x', '0px'); opening.style.setProperty('--opening-y', '0px');
 });
 // Scrolling is optional and begins the hand-off only in the last scene.
 opening.addEventListener('wheel', event => {
  if (stage !== 2 || exiting || performance.now() - stageTime < 650) return;
  const now = performance.now();
  if (now - wheelTime > 200) wheelTotal = 0;
  wheelTime = now;
  wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (wheelTotal > 60) finish(true);
 }, {passive: true});
 opening.addEventListener('touchstart', event => { if (stage === 2 && event.touches.length === 1) touchY = event.touches[0].clientY; }, {passive: true});
 opening.addEventListener('touchend', event => {
  if (stage === 2 && touchY !== null && touchY - event.changedTouches[0].clientY > 55) finish(true);
  touchY = null;
 }, {passive: true});
 opening.addEventListener('keydown', event => {
  if (stage === 2 && ['ArrowDown', 'PageDown'].includes(event.key)) { event.preventDefault(); finish(true); }
 });
 opening.addEventListener('cancel', event => { event.preventDefault(); finish(); });
 opening.addEventListener('close', cleanup);
 addEventListener('pagehide', close);
 reduced.addEventListener('change', () => { if (reduced.matches) finish(); });
 const returning = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
 if (!location.hash && !returning && !reduced.matches && !seen()) play();
})();
