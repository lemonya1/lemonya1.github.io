(() => {
 'use strict';
 const $ = (selector, root = document) => root.querySelector(selector);
 const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
 const pad = number => String(number).padStart(2, '0');
 document.documentElement.classList.add('interactive');

 // Native scrolling, with a quiet indication of position in the archive.
 const progress = document.createElement('div');
 progress.className = 'reading-progress'; progress.setAttribute('aria-hidden', 'true'); document.body.append(progress);
 const top = document.createElement('button');
 top.type = 'button'; top.className = 'back-top'; top.textContent = '↑';
 top.setAttribute('aria-label', '回到页面顶部'); top.hidden = true; document.body.append(top);
 top.addEventListener('click', () => window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'}));
 let scrollQueued = false;
 const updateScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`; top.hidden = scrollY < 600;
  $$('.site-header nav a[href^="#"]').forEach(link => {
   const section = $(link.hash);
   const active = section && section.getBoundingClientRect().top <= 180 && section.getBoundingClientRect().bottom > 180;
   if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  }); scrollQueued = false;
 };
 addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, {passive: true});
 addEventListener('resize', updateScroll); updateScroll();
 $('[data-copy-url]')?.addEventListener('click', async () => {
  const url = $('link[rel="canonical"]')?.href || new URL('./', location.href).href;
  try { await navigator.clipboard.writeText(url); $('.copy-status').textContent = '链接已复制，可以直接分享。'; }
  catch { $('.copy-status').textContent = `请复制：${url}`; }
 });
 if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), {threshold: 0.06});
  document.documentElement.classList.add('js-reveal');
  $$('.current .section-heading, .work-card, .about').forEach(item => { item.classList.add('reveal-item'); observer.observe(item); });
 }

 $$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.filter; let count = 0;
  $$('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $$('.work-card[data-category]').forEach(card => {
   card.hidden = type !== 'all' && card.dataset.category !== type;
   if (!card.hidden) { count++; card.classList.add('is-visible'); } else card.querySelector('video')?.pause();
  });
  $('.archive-count').textContent = `${pad(count)} / ${pad($$('.work-card[data-category]').length)} 项档案`; updateScroll();
 }));

 // The existing silent clip loads only after an intentional pointer hover.
 if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  $$('[data-preview-video]').forEach(card => {
   let video, timer, hovering = false;
   card.addEventListener('pointerenter', () => {
    hovering = true;
    timer = setTimeout(async () => {
     if (!hovering) return;
     if (!video) {
      video = document.createElement('video'); video.className = 'card-video';
      video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
      video.src = card.dataset.previewVideo; video.setAttribute('aria-hidden', 'true');
      $('.work-image', card).append(video);
     }
     try { await video.play(); if (hovering) card.classList.add('preview-playing'); else video.pause(); } catch { /* Retain the still image. */ }
    }, 220);
   });
   card.addEventListener('pointerleave', () => { hovering = false; clearTimeout(timer); video?.pause(); card.classList.remove('preview-playing'); });
   document.addEventListener('visibilitychange', () => { if (document.hidden) { hovering = false; video?.pause(); card.classList.remove('preview-playing'); } });
  });
 }

 const sketches = $$('.sketch-entry');
 if (sketches.length) {
  const nav = document.createElement('nav'); nav.className = 'sketch-index'; nav.setAttribute('aria-label', '速写快速索引');
  sketches.forEach((entry, i) => {
   entry.id = `sketch-${i + 1}`;
   const link = document.createElement('a'); link.href = `#${entry.id}`;
   link.textContent = `${pad(i + 1)} ${$('h2', entry).textContent.split(' · ')[0]}`; nav.append(link);
  }); $('.sketch-grid').before(nav);
 }

 // Preserve reference/study labels and the complete original images in the viewer.
 const dialog = $('.lightbox'), images = $$('[data-image]');
 if (dialog && typeof dialog.showModal === 'function' && images.length) {
  dialog.innerHTML = '<div class="viewer-top"><span class="viewer-index" role="status" aria-live="polite"></span><div class="viewer-actions"><button type="button" class="viewer-zoom" aria-pressed="false">放大 2×</button><button class="lightbox-close" type="button" aria-label="关闭图片查看器">关闭 ×</button></div></div><div class="viewer-stage"><img class="viewer-image" alt="" draggable="false"></div><div class="viewer-bottom"><button type="button" class="viewer-prev" aria-label="上一张">←</button><div class="viewer-info"><p class="lightbox-caption" aria-live="polite"></p><p class="viewer-hint">← → 切换 · 双击放大 · Esc 关闭</p></div><button type="button" class="viewer-next" aria-label="下一张">→</button></div>';
  const stage = $('.viewer-stage', dialog), img = $('.viewer-image', dialog), zoom = $('.viewer-zoom', dialog);
  let current = 0, opener, zoomed = false, x = 0, y = 0, drag, oldOverflow, imageTicket = 0;
  const transform = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${zoomed ? 2 : 1})`; };
  const setZoom = value => {
   zoomed = value; x = y = 0; dialog.classList.toggle('is-zoomed', value);
   zoom.textContent = value ? '适应画面' : '放大 2×'; zoom.setAttribute('aria-pressed', String(value)); transform();
  };
  const show = index => {
   current = (index + images.length) % images.length;
   const source = images[current]; setZoom(false); img.src = source.dataset.image; img.alt = $('img', source).alt;
   $('.lightbox-caption', dialog).textContent = img.alt;
   $('.viewer-index', dialog).textContent = `${pad(current + 1)} / ${pad(images.length)} — IMAGE ARCHIVE`;
   const ticket = ++imageTicket; img.classList.add('is-loading');
   img.decode().catch(() => {}).finally(() => { if (ticket === imageTicket) img.classList.remove('is-loading'); });
  };
  $('.viewer-prev', dialog).hidden = $('.viewer-next', dialog).hidden = images.length < 2;
  if (images.length < 2) $('.viewer-hint', dialog).textContent = '双击放大 · 放大后拖动 · Esc 关闭';
  images.forEach((button, index) => button.addEventListener('click', () => {
   opener = button; oldOverflow = document.body.style.overflow; show(index);
   dialog.showModal(); document.body.style.overflow = 'hidden'; $('.lightbox-close', dialog).focus();
  }));
  $('.lightbox-close', dialog).addEventListener('click', () => dialog.close());
  $('.viewer-prev', dialog).addEventListener('click', () => show(current - 1));
  $('.viewer-next', dialog).addEventListener('click', () => show(current + 1));
  zoom.addEventListener('click', () => setZoom(!zoomed));
  stage.addEventListener('dblclick', event => { if (event.target === img) setZoom(!zoomed); });
  dialog.addEventListener('keydown', event => {
   if (event.key === 'ArrowRight' && images.length > 1) { event.preventDefault(); show(current + 1); }
   if (event.key === 'ArrowLeft' && images.length > 1) { event.preventDefault(); show(current - 1); }
  });
  stage.addEventListener('pointerdown', event => {
   if (event.button !== 0) return;
   drag = {id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y};
   if (zoomed) stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', event => {
   if (!drag || drag.id !== event.pointerId || !zoomed) return;
   const limitX = Math.max(0, (img.clientWidth * 2 - stage.clientWidth) / 2);
   const limitY = Math.max(0, (img.clientHeight * 2 - stage.clientHeight) / 2);
   x = Math.max(-limitX, Math.min(limitX, drag.x + event.clientX - drag.startX));
   y = Math.max(-limitY, Math.min(limitY, drag.y + event.clientY - drag.startY)); transform();
  });
  stage.addEventListener('pointerup', event => {
   if (!drag || drag.id !== event.pointerId) return;
   const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
   if (!zoomed && event.pointerType !== 'mouse' && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
   if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId); drag = null;
  });
  stage.addEventListener('pointercancel', () => { drag = null; });
  dialog.addEventListener('close', () => { document.body.style.overflow = oldOverflow || ''; setZoom(false); opener?.focus(); });
  addEventListener('resize', () => { if (dialog.open) setZoom(false); });
 }

 const film = $('video.video');
 if (film) {
  const cinema = document.createElement('div'); cinema.className = 'cinema'; film.before(cinema); cinema.append(film);
  const controls = document.createElement('div'); controls.className = 'film-controls';
  controls.innerHTML = '<span class="film-state" role="status">无声镜头 / 约 3 秒</span><div><button type="button" data-replay>从头播放 ↺</button><button type="button" data-loop aria-pressed="false">循环播放</button><button type="button" data-cinema aria-pressed="false">影院模式 ⤢</button></div>';
  cinema.append(controls); film.muted = true;
  $('[data-replay]').addEventListener('click', async () => { film.currentTime = 0; try { await film.play(); } catch { $('.film-state').textContent = '请点击视频播放按钮'; } });
  $('[data-loop]').addEventListener('click', event => {
   film.loop = !film.loop; event.currentTarget.setAttribute('aria-pressed', String(film.loop));
   event.currentTarget.textContent = film.loop ? '循环已开启' : '循环播放';
  });
  const cinemaButton = $('[data-cinema]'); let oldOverflow;
  const setCinema = active => {
   cinema.classList.toggle('cinema-active', active); document.body.classList.toggle('cinema-open', active);
   cinemaButton.textContent = active ? '退出影院 ×' : '影院模式 ⤢'; cinemaButton.setAttribute('aria-pressed', String(active));
   if (active) { oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
   else { document.body.style.overflow = oldOverflow || ''; cinemaButton.focus(); }
   let child = cinema;
   while (child.parentElement && child.parentElement !== document.documentElement) {
    [...child.parentElement.children].filter(sibling => sibling !== child).forEach(sibling => {
     if (active) { sibling.dataset.cinemaInert = String(sibling.inert); sibling.inert = true; }
     else { sibling.inert = sibling.dataset.cinemaInert === 'true'; delete sibling.dataset.cinemaInert; }
    }); child = child.parentElement;
   }
  };
  cinemaButton.addEventListener('click', () => setCinema(!cinema.classList.contains('cinema-active')));
  document.addEventListener('keydown', event => {
   if (!cinema.classList.contains('cinema-active')) return;
   if (event.key === 'Escape') setCinema(false);
   if (event.key === 'Tab') {
    const focusables = [film, ...$$('button', controls)];
    if (event.shiftKey && document.activeElement === focusables[0]) { event.preventDefault(); focusables.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === focusables.at(-1)) { event.preventDefault(); focusables[0].focus(); }
   }
  });
 }
})();
