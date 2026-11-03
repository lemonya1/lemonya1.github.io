(() => {
 'use strict';
 const siteUrl = new URL('./', window.location.href).href;
 const copyButton = document.querySelector('[data-copy-url]');
 if (copyButton) copyButton.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  try { await navigator.clipboard.writeText(siteUrl); status.textContent = '链接已复制'; }
  catch { status.textContent = siteUrl; }
 });
 if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = document.querySelectorAll('.current .section-heading, .work-card, .about');
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  items.forEach(item => { item.classList.add('reveal-item'); observer.observe(item); });
 }
 const dialog = document.querySelector('.lightbox');
 if (dialog && typeof dialog.showModal === 'function') {
  let opener;
  document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
   opener = button;
   const img = dialog.querySelector('img'); img.src = button.dataset.image; img.alt = button.querySelector('img').alt;
   dialog.querySelector('.lightbox-caption').textContent = img.alt; dialog.showModal(); document.body.style.overflow = 'hidden';
  }));
  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (opener) opener.focus(); });
 }
})();
