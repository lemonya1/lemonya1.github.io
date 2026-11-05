(() => {
 'use strict';
 const siteUrl = 'https://lemonya1.github.io/';
 const copyButton = document.querySelector('[data-copy-url]');
 if (copyButton) copyButton.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  status.textContent = siteUrl;
  try { await navigator.clipboard.writeText(siteUrl); status.textContent = '链接已复制'; }
  catch { status.textContent = `作品集链接：${siteUrl}`; }
 });
 const dialog = document.querySelector('.lightbox');
 const buttons = [...document.querySelectorAll('[data-image]')];
 if (!dialog || typeof dialog.showModal !== 'function') {
  buttons.forEach(button => button.addEventListener('click', () => { window.location.href = button.dataset.image; }));
  return;
 }
 let opener, current = 0, previousOverflow = '';
 const previous = dialog.querySelector('[data-prev]');
 const next = dialog.querySelector('[data-next]');
 const showImage = index => {
  current = Math.max(0, Math.min(buttons.length - 1, index));
  const button = buttons[current];
  const img = dialog.querySelector('img');
  img.src = button.dataset.image;
  img.alt = button.dataset.imageAlt || button.querySelector('img')?.alt || button.getAttribute('aria-label') || '';
  dialog.querySelector('.lightbox-caption').textContent = img.alt;
  dialog.querySelector('.lightbox-count').textContent = `${current + 1} / ${buttons.length}`;
  previous.disabled = current === 0;
  next.disabled = current === buttons.length - 1;
 };
 buttons.forEach((button, index) => button.addEventListener('click', () => {
  opener = button;
  showImage(index);
  previousOverflow = document.body.style.overflow;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  dialog.querySelector('.lightbox-close').focus();
 }));
 previous.addEventListener('click', () => showImage(current - 1));
 next.addEventListener('click', () => showImage(current + 1));
 dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
   event.preventDefault();
   showImage(current + (event.key === 'ArrowLeft' ? -1 : 1));
  }
 });
 dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
 dialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  if (opener) opener.focus();
 });
})();

