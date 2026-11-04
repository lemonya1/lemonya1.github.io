(() => {
 'use strict';
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
 const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
 const motionButton = document.querySelector('.motion-toggle');
 let motionOff = reduced.matches;
 try { const saved=localStorage.getItem('wyh-motion'); if(saved!==null) motionOff = saved==='off' || reduced.matches; } catch {}
 const setMotion = () => {
  document.documentElement.classList.toggle('motion-off',motionOff);
  if(motionButton){motionButton.setAttribute('aria-pressed',String(motionOff));motionButton.textContent=motionOff?'开启动效 ↗':'关闭动效 Ⅱ';}
 };
 setMotion();
 motionButton?.addEventListener('click',()=>{motionOff=!motionOff;setMotion();try{localStorage.setItem('wyh-motion',motionOff?'off':'on');}catch{}});
 reduced.addEventListener('change',event=>{motionOff=event.matches;setMotion();});
 const scenes={
  snow:{name:'雪地场景',type:'场景作品 · 完成画面',note:'完成画面与白模制作过程',link:'project-snow.html',number:'01'},
  cyberhouse:{name:'CyberHouse',type:'环境场景 · 练习项目',note:'山水环境中的科幻建筑',link:'study-cyberhouse.html',number:'02'},
  gamejam:{name:'Game Jam',type:'团队场景 · 2026',note:'场景搭建 / 灯光 / 素材库资产',link:'study-gamejam.html',number:'04'},
  flight:{name:'飞船穿越洞穴',type:'镜头练习 · 2024',note:'约 2.8 秒 · 原速度 · 无音轨',link:'study-flight.html',number:'05'},
  sketches:{name:'3D 场景速写',type:'参考临摹 · 5 组作品与练习',note:'空间 / 体块 / 光影',link:'study-sketches.html',number:'03'}
 };
 const sceneButtons=[...document.querySelectorAll('[data-scene]')];
 function selectScene(key){
  const scene=scenes[key];if(!scene)return;
  sceneButtons.forEach(b=>{const active=b.dataset.scene===key;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-backdrop]').forEach(el=>el.classList.toggle('is-current',el.dataset.backdrop===key));
  document.querySelector('[data-scene-name]').textContent=scene.name;
  document.querySelector('[data-scene-type]').textContent=scene.type;
  document.querySelector('[data-scene-note]').textContent=scene.note;
  document.querySelector('[data-scene-number]').textContent=scene.number;
  document.querySelector('[data-scene-link]').href=scene.link;
 }
 sceneButtons.forEach((button,index)=>{
  button.addEventListener('click',()=>selectScene(button.dataset.scene));
  button.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();let next=event.key==='Home'?0:event.key==='End'?sceneButtons.length-1:(index+(event.key==='ArrowRight'?1:-1)+sceneButtons.length)%sceneButtons.length;
   sceneButtons[next].focus();selectScene(sceneButtons[next].dataset.scene);
  });
 });
 const hero=document.querySelector('.scene-hero');
 let pointerFrame=0;
 hero?.addEventListener('pointermove',event=>{
  if(motionOff||!fine.matches||pointerFrame)return;
  pointerFrame=requestAnimationFrame(()=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--scene-x',`${((event.clientX-r.left)/r.width-.5)*-12}px`);hero.style.setProperty('--scene-y',`${((event.clientY-r.top)/r.height-.5)*-8}px`);pointerFrame=0;});
 },{passive:true});
 hero?.addEventListener('pointerleave',()=>{hero.style.setProperty('--scene-x','0px');hero.style.setProperty('--scene-y','0px');});
 document.querySelectorAll('[data-tilt]').forEach(card=>{
  card.addEventListener('pointermove',event=>{if(motionOff||!fine.matches)return;const r=card.getBoundingClientRect();card.style.setProperty('--tilt-x',`${((event.clientY-r.top)/r.height-.5)*-3}deg`);card.style.setProperty('--tilt-y',`${((event.clientX-r.left)/r.width-.5)*3}deg`);},{passive:true});
  card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
 });
 const filterButtons=[...document.querySelectorAll('[data-filter]')];
 filterButtons.forEach(button=>button.addEventListener('click',()=>{
  const value=button.dataset.filter;let count=0;
  filterButtons.forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('[data-category]').forEach(card=>{card.hidden=value!=='all'&&value!==card.dataset.category;if(!card.hidden)count++;});
  document.querySelector('.editorial-grid').classList.toggle('is-filtered',value!=='all');
  document.querySelector('.filter-status').textContent=`${count} 组作品与练习`;
 }));
 const range=document.querySelector('#comparison-range');
 range?.addEventListener('input',()=>{range.closest('.compare-stage').style.setProperty('--split',`${range.value}%`);range.setAttribute('aria-valuetext',`参考画面占 ${range.value}%，本人练习占 ${100-Number(range.value)}%`);});
 const film=document.querySelector('.film-dialog');
 const filmButton=document.querySelector('[data-open-film]');
 let previousOverflow='';
 filmButton?.addEventListener('click',()=>{
  if(typeof film.showModal!=='function'){location.href='study-flight.html';return;}
  previousOverflow=document.body.style.overflow;film.showModal();document.body.style.overflow='hidden';film.querySelector('[data-close-film]').focus();
  const video=film.querySelector('video');video.currentTime=0;video.play().catch(()=>{});
 });
 film?.querySelector('[data-close-film]').addEventListener('click',()=>film.close());
 film?.addEventListener('click',event=>{if(event.target===film){const r=film.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)film.close();}});
 film?.addEventListener('close',()=>{film.querySelector('video').pause();document.body.style.overflow=previousOverflow;filmButton.focus();});
 let scrollFrame=0;
 function updateScroll(){const total=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--reading',total>0?Math.max(0,Math.min(1,scrollY/total)):0);scrollFrame=0;}
 addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);},{passive:true});updateScroll();
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.floating-header nav a').forEach(a=>a.classList.toggle('is-active',a.hash===`#${entry.target.id}`));}});},{rootMargin:'-20% 0px -60% 0px'});
  document.querySelectorAll('#studies,#current,#about').forEach(section=>observer.observe(section));
 }
})();
