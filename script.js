/* JHALAR public site runtime
   - catalogue loader (fail-closed through the shared naming gate)
   - runtime settings/theme/sections/custom-css application (published state)
   - window.JHALAR API consumed by the Pro Editor live preview */
const state={products:[],filter:'all',expanded:false,whatsapp:'918100656258',theme:null,modalMedia:[],modalIndex:0,modalZoom:1};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function categories(){return [...new Set(state.products.map(p=>p.category).filter(Boolean))]}

function renderFilters(){const el=$('#product-filters');el.innerHTML=['all',...categories()].map(c=>'<button class="filter-btn '+(c===state.filter?'active':'')+'" data-filter="'+esc(c)+'" aria-pressed="'+(c===state.filter?'true':'false')+'">'+esc(c==='all'?'All designs':c)+'</button>').join('');el.onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;const next=b.dataset.filter;if(next===state.filter)return;state.filter=next;state.expanded=next!=='all';el.querySelectorAll('[data-filter]').forEach(btn=>{const selected=btn===b;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));});renderProducts();}}
function visibleProducts(){return state.filter==='all'?state.products:state.products.filter(p=>p.category===state.filter)}
function mediaType(src,type){if(type)return type;return /\\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(String(src))?'video':'image'}
function normaliseMedia(item){if(typeof item==='string')return{src:item,type:mediaType(item)};if(item&&typeof item==='object'){const src=item.src||item.url||item.image||item.video||item.source;return src?{src,type:mediaType(src,item.type||item.mediaType)}:null}return null}
function mediaList(p){const raw=[p.image||p.sourceImage,...(Array.isArray(p.gallery)?p.gallery:[])];const seen=new Set;return raw.map(normaliseMedia).filter(m=>m&&m.src&&!seen.has(m.src)&&(seen.add(m.src),true))}
function renderProducts(){const all=visibleProducts(),limit=state.expanded?all.length:Math.min(all.length,8);const grid=$('#product-grid');grid.innerHTML=all.slice(0,limit).map((p,i)=>{const m=mediaList(p),main=m[0]?.src||'',alt=m[1]?.src||'';return '<article class="product-card reveal" style="transition-delay:'+Math.min(i*45,320)+'ms"><button class="product-image" data-id="'+p.id+'" aria-label="View '+esc(p.title)+'"><img src="'+esc(main)+'" alt="'+esc(p.title)+'" loading="lazy">'+(alt?'<img class="alt-img" src="'+esc(alt)+'" alt="" aria-hidden="true" loading="lazy">':'')+'</button><div class="product-info"><span class="product-category">'+esc(p.category)+'</span><h3 class="product-title">'+esc(p.title)+'</h3><button class="product-details-btn" data-id="'+p.id+'">View details <span class="arr">→</span></button></div></article>'}).join('');grid.onclick=e=>{const b=e.target.closest('[data-id]');if(b)openProduct(Number(b.dataset.id))};const more=$('#collection-toggle');if(all.length>8&&state.filter==='all'){more.hidden=false;more.textContent=state.expanded?'Show fewer':'View all '+all.length+' designs'}else more.hidden=true;observeReveals()}
let lastFocus=null;
function setModalZoom(next){
  state.modalZoom=Math.max(1,Math.min(3,Number(next)||1));
  const stage=$('#modal-stage');
  const image=$('#modal-photo');
  const video=$('#modal-video');
  if(!stage)return;
  const activeMedia=stage?.classList.contains('is-video')?video:image;
  if(!activeMedia)return;
  stage.classList.toggle('is-zoomed',state.modalZoom>1);
  activeMedia.style.transform='scale('+state.modalZoom+')';
  const out=$('#modal-zoom-out');
  const reset=$('#modal-zoom-reset');
  if(out)out.disabled=state.modalZoom<=1;
  if(reset)reset.hidden=state.modalZoom<=1;
}
function setModalZoomOrigin(e){
  const stage=$('#modal-stage');
  if(!stage||!e)return;
  const rect=stage.getBoundingClientRect();
  const x=Math.max(0,Math.min(100,((e.clientX-rect.left)/rect.width)*100));
  const y=Math.max(0,Math.min(100,((e.clientY-rect.top)/rect.height)*100));
  const image=$('#modal-photo');
  const video=$('#modal-video');
  const activeMedia=stage?.classList.contains('is-video')?video:image;
  if(activeMedia)activeMedia.style.transformOrigin=x+'% '+y+'%';
}
function showModalMedia(i){const m=state.modalMedia||[];if(!m.length)return;const n=m.length;state.modalIndex=((i%n)+n)%n;state.modalZoom=1;const item=m[state.modalIndex],stage=$('#modal-stage'),photo=$('#modal-photo'),video=$('#modal-video');stage.classList.remove('is-video');if(item.type==='video'){photo.hidden=true;video.hidden=false;video.src=item.src;video.load();stage.classList.add('is-video')}else{video.pause();video.removeAttribute('src');video.load();video.hidden=true;photo.hidden=false;photo.src=item.src;photo.alt=$('#modal-title')?.textContent||'Product media'}setModalZoom(1);const thumbs=$('#modal-thumbs');if(n>1){thumbs.innerHTML=m.map((item,j)=>'<button class="modal-thumb'+(j===state.modalIndex?' active':'')+'" data-thumb="'+j+'" aria-label="'+(item.type==='video'?'Video':'Photo')+' '+(j+1)+' of '+n+'">'+(item.type==='video'?'<span class="modal-thumb-video">Video</span>':'<img src="'+esc(item.src)+'" alt="">')+'</button>').join('');$('.modal-nav.prev').hidden=false;$('.modal-nav.next').hidden=false}else{thumbs.innerHTML='';$('.modal-nav.prev').hidden=true;$('.modal-nav.next').hidden=true}}
function openProduct(id){const p=state.products.find(x=>Number(x.id)===id);if(!p)return;const m=mediaList(p);state.modalMedia=m;state.modalIndex=0;const photo=$('#modal-photo');photo.alt=p.title;showModalMedia(0);$('#modal-category').textContent=p.category;$('#modal-title').textContent=p.title;$('#modal-desc').textContent=p.description||'';const wa=$('#modal-wa-btn');wa.href='https://wa.me/'+state.whatsapp+'?text='+encodeURIComponent('Hello JHALAR, I am interested in '+p.title+'.');wa.innerHTML='Enquire about this design <span aria-hidden="true">→</span>';const modal=$('#product-modal');lastFocus=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modal-close').focus()}
function closeModal(){const m=$('#product-modal');if(!m.classList.contains('open'))return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();lastFocus=null}

/* ---------- runtime defaults: equal to the shipped HTML/settings ---------- */
const DEFAULTS={
 heroImage:'assets/images/hero-jhalar.webp',
 heroHeadline:'Hanging decor for celebrations and events.',
 heroIntro:'Explore handmade designs for weddings, functions, festive spaces and larger orders.',
 heroCta:'View the collection',
 collectionLabel:'BROWSE DESIGNS',collectionTitle:'Browse our collection',collectionIntro:'Explore our hanging designs and find options for your event, celebration or store.',
 customLabel:'CUSTOM WORK',customTitle:'Looking for something specific?',customIntro:'Share your colour preference, size, quantity or reference image. We will be happy to discuss your requirement.',
 customImage:'assets/images/custom-orders.jpg',
 aboutLabel:'JHALAR',aboutTitle:'Made by hand in Howrah',aboutIntro:'We make hanging decor for event decorators, planners, retailers, wholesalers and families.',
 aboutImage:'assets/images/about-collage.jpg',
 contactLabel:'GET IN TOUCH',contactTitle:"Let's discuss your requirement",contactIntro:'Tell us about your event or order. If available, share the quantity, location and date as well.',
 footerTagline:'Handmade hanging decor from Howrah, India',
 siteTitle:'JHALAR | Hanging Decor',
 siteDescription:'Handmade hanging decor for events, celebrations, decorators, retailers and wholesale buyers.',
 ogImage:'assets/images/og-cover.jpg',
 nav:[['Collection','#collection'],['Custom work','#custom'],['Our story','#story']]
};
const setTxt=(sel,val,def)=>{if(!val||val===def)return;const el=typeof sel==='string'?$(sel):sel;if(el)el.textContent=val};
const setImg=(sel,val,def)=>{if(!val||val===def)return;const el=$(sel);if(el)el.src=val};
const absUrl=p=>{try{return new URL(p,window.location.href).href}catch(e){return p}};
function applyNav(items){
 if(!Array.isArray(items))return;
 const same=items.length===DEFAULTS.nav.length&&items.every((it,i)=>it&&it.label===DEFAULTS.nav[i][0]&&it.href===DEFAULTS.nav[i][1]);
 if(same)return;
 const links=items.filter(it=>it&&it.label).map(it=>'<a href="'+esc(it.href||'#')+'">'+esc(it.label)+'</a>').join('');
 const desktop=$('.header .nav');if(desktop)desktop.innerHTML=links;
 const mobile=$('#mobile-nav');
 if(mobile){const extra=items.some(it=>it&&it.label==='Contact')?'':'<a href="#contact">Contact</a>';mobile.innerHTML=links+extra}
}
function applySettings(s){
 if(!s||typeof s!=='object')return;
 setImg('.hero-banner-media img',s.heroImage,DEFAULTS.heroImage);
 setTxt('h1',s.heroHeadline,DEFAULTS.heroHeadline);
 setTxt('p.hero-lead',s.heroIntro,DEFAULTS.heroIntro);
 const cta=$('.hero-banner-cta');
 if(cta){
  if(s.sectionCopy&&s.sectionCopy.heroPrimary&&s.sectionCopy.heroPrimary.href)cta.href=s.sectionCopy.heroPrimary.href;
  if(s.sectionCopy&&s.sectionCopy.heroPrimary&&s.sectionCopy.heroPrimary.label&&s.sectionCopy.heroPrimary.label!==DEFAULTS.heroCta)cta.innerHTML=esc(s.sectionCopy.heroPrimary.label)+' <span>↓</span>';
 }
 const sc=s.sectionCopy||{};
 setTxt('.collection .eyebrow',sc.collection&&sc.collection.label,DEFAULTS.collectionLabel);
 setTxt('.collection h2',sc.collection&&sc.collection.title,DEFAULTS.collectionTitle);
 setTxt('.collection .section-head>p',sc.collection&&sc.collection.intro,DEFAULTS.collectionIntro);
 setTxt('.custom .eyebrow',sc.customOrders&&sc.customOrders.label,DEFAULTS.customLabel);
 setTxt('.custom h2',sc.customOrders&&sc.customOrders.title,DEFAULTS.customTitle);
 const ci=$('.custom-copy p:not(.eyebrow)');setTxt(ci,sc.customOrders&&sc.customOrders.intro,DEFAULTS.customIntro);
 setImg('.custom-image img',sc.customOrders&&sc.customOrders.image,DEFAULTS.customImage);
 setTxt('.story .eyebrow',sc.about&&sc.about.label,DEFAULTS.aboutLabel);
 setTxt('.story h2',sc.about&&sc.about.title,DEFAULTS.aboutTitle);
 const ai=$('.story-copy p:not(.eyebrow)');setTxt(ai,sc.about&&sc.about.intro,DEFAULTS.aboutIntro);
 setImg('.story-image img',sc.about&&sc.about.image,DEFAULTS.aboutImage);
 setTxt('.contact .eyebrow',sc.contact&&sc.contact.label,DEFAULTS.contactLabel);
 setTxt('.contact h2',sc.contact&&sc.contact.title,DEFAULTS.contactTitle);
 const co=$('.contact p:not(.eyebrow)');setTxt(co,sc.contact&&sc.contact.intro,DEFAULTS.contactIntro);
 setTxt('.footer-row span:nth-child(2)',sc.footerTagline,DEFAULTS.footerTagline);
 applyNav(s.navItems);
 if(s.whatsapp&&s.whatsapp!==DEFAULTS.whatsapp){state.whatsapp=s.whatsapp;const a=$('.contact-cta');if(a)a.href='https://wa.me/'+s.whatsapp}
 if(s.siteTitle&&s.siteTitle!==DEFAULTS.siteTitle)document.title=s.siteTitle;
 const md=$('meta[name="description"]');if(md&&s.siteDescription&&s.siteDescription!==DEFAULTS.siteDescription)md.setAttribute('content',s.siteDescription);
 if(s.ogImage&&s.ogImage!==DEFAULTS.ogImage){const og=absUrl(s.ogImage);['meta[property="og:image"]','meta[name="twitter:image"]'].forEach(sel=>{const el=$(sel);if(el)el.setAttribute('content',og)})}
}

/* ---------- theme application (editor Theme tab -> CSS variables) ---------- */
const COLOR_MAP={'--brand-primary':'--wine','--brand-primary-dark':'--wine-deep','--brand-primary-light':'--blush','--brand-accent':'--gold','--brand-cream':'--cream','--brand-background':'--paper','--brand-alt-background':'--cream-deep','--brand-text':'--wine-ink','--brand-muted':'--muted','--brand-heading':'--wine-ink','--brand-border':'--line','--brand-header-background':'--header-bg','--brand-footer-background':'--footer-bg'};
const px=v=>typeof v==='string'&&/\d/.test(v)?v:null;
function setTheme(t){
 state.theme=t||null;
 if(!t||typeof t!=='object')return;
 const r=document.documentElement.style;
 const c=t.colors||{};
 Object.keys(COLOR_MAP).forEach(k=>{if(c[k])r.setProperty(COLOR_MAP[k],c[k]);else r.removeProperty(COLOR_MAP[k])});
 if(t.fonts){
  if(t.fonts.heading)r.setProperty('--font-heading',t.fonts.heading);else r.removeProperty('--font-heading');
  if(t.fonts.body)r.setProperty('--font-body',t.fonts.body);else r.removeProperty('--font-body');
 }
 const l=t.layout||{};
 const put=(v,val,unit)=>{const p=px(val);if(p)r.setProperty(v,unit==='num'?val:p);else r.removeProperty(v)};
 put('--h1-size',l.heroTitleSize);put('--h2-size',l.titleSize);put('--card-title-size',l.cardTitleSize);
 put('--space-6',l.sectionY);put('--shell-max',l.containerWidth);put('--header-h',l.headerHeight);
 put('--radius-btn',l.buttonRadius);put('--radius-card',l.cardRadius);
 put('--grid-gap',l.gridGap||l.productGap);put('--section-head-gap',l.sectionHeaderGap);put('--split-gap',l.splitGap);
 if(l.cardPad){const v=px(l.cardPad);if(v)r.setProperty('--card-pad',v+' 0 '+(Math.round(parseInt(v,10)*2))+'px')}
 if(l.productColumns)r.setProperty('--product-cols',String(l.productColumns));
 if(l.baseFontSize&&l.baseFontSize!=='16px')r.fontSize=l.baseFontSize;else r.fontSize='';
 if(l.headingWeight)r.setProperty('--heading-weight',String(l.headingWeight));else r.removeProperty('--heading-weight');
 if(l.bodyWeight&&l.bodyWeight!=='400')r.setProperty('--body-weight',String(l.bodyWeight));else r.removeProperty('--body-weight');
 if(l.headingTracking)r.setProperty('--heading-tracking',l.headingTracking);else r.removeProperty('--heading-tracking');
 if(l.headingLeading)r.setProperty('--heading-leading',String(l.headingLeading));else r.removeProperty('--heading-leading');
 if(l.bodyTracking)r.setProperty('--body-tracking',l.bodyTracking);else r.removeProperty('--body-tracking');
 if(l.bodyLeading&&l.bodyLeading!=='1.7')r.setProperty('--body-leading',String(l.bodyLeading));else r.removeProperty('--body-leading');
 document.body.classList.toggle('no-shadow',l.shadowIntensity!==undefined&&Number(l.shadowIntensity)<=0.05);
 revealOn=l.revealAnimation!==false&&!reducedMotion;
 document.body.classList.toggle('no-reveal',!revealOn);
 document.body.classList.toggle('stack-custom',l.splitLayout==='stack');
 document.body.classList.toggle('stack-about',l.aboutLayout==='stack');
 document.querySelectorAll('.section').forEach(sec=>sec.classList.toggle('align-center',l.sectionAlign==='center'));
}
function setSections(d){
 if(!d||!d.sections)return;
 ['hero','collection','customOrders','about','contact'].forEach(key=>{
  const el=document.querySelector('[data-section="'+key+'"]');
  if(el)el.hidden=!!(d.sections[key]&&d.sections[key].visible===false);
 });
}
function setCustomCSS(css){
 let el=document.getElementById('jhalar-custom-css');
 if(css){if(!el){el=document.createElement('style');el.id='jhalar-custom-css';document.head.appendChild(el)}el.textContent=css}
 else if(el)el.remove();
}
function setProducts(list){
 state.products=Array.isArray(list)?list.filter(p=>p&&typeof p==='object'&&Number.isInteger(p.id)):[];
 renderFilters();renderProducts();
}
window.JHALAR={setSettings:applySettings,applySettings,setTheme,setSections,setCustomCSS,setProducts,
 setSectionHidden(key,hidden){const el=document.querySelector('[data-section="'+key+'"]');if(el)el.hidden=!!hidden}};

/* ---------- scroll reveal + header shadow ---------- */
const reducedMotion=typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealOn=!reducedMotion,revealOb=null;
function observeReveals(){
 const els=document.querySelectorAll('.reveal:not(.in)');
 if(!els.length)return;
 if(!revealOn||reducedMotion){document.body.classList.add('no-reveal');return}
 if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('in'));return}
 if(!revealOb)revealOb=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');revealOb.unobserve(en.target)}}),{threshold:.1,rootMargin:'0px 0px -6% 0px'});
 els.forEach(e=>revealOb.observe(e));
}
function markRevealTargets(){
 ['.intro-grid','.collection .section-head','.custom-image','.custom-copy','.contact-box > *'].forEach(sel=>{document.querySelectorAll(sel).forEach(e=>e.classList.add('reveal'))});
}

/* ---------- catalogue loader (fail-closed through the naming gate) ---------- */
async function initProducts(){
 try{
  const pr=await fetch('content/products.json',{cache:'no-store'});
  if(!pr.ok)throw Error('Catalogue unavailable');
  const d=await pr.json();
  const products=Array.isArray(d.products)?d.products:[];
  // Product titles and descriptions are owner-editable public content.
  // Validation must never hide the catalogue because a display name changes.
  state.products=products.filter(p=>p&&typeof p==='object'&&Number.isInteger(p.id));
  if(!state.products.length)throw Error('No products in catalogue');
  // Run naming validation only as diagnostics when available.
  try{
   const gate=window.JHALARNaming;
   if(gate){
    const nr=await fetch('content/product-naming.json',{cache:'no-store'});
    if(nr.ok){
     const registry=await nr.json();
     const report=gate.validateCatalogue({products:state.products},registry);
     if(report&&report.errors&&report.errors.length)console.warn('Catalogue naming diagnostics:',report.errors);
    }
   }
  }catch(validationError){console.warn('Catalogue naming diagnostics unavailable:',validationError)}
  renderFilters();
  renderProducts();
 }catch(e){
  console.error(e);
  $('#product-grid').innerHTML='<p>We are unable to load the collection right now. Please refresh the page or contact us directly.</p>';
 }
}
async function initRuntime(){try{const[ss,th,se,cc]=await Promise.all([fetch('content/site-settings.json',{cache:'no-store'}),fetch('content/theme.json',{cache:'no-store'}),fetch('content/sections.json',{cache:'no-store'}),fetch('content/custom-css.json',{cache:'no-store'})]);if(ss.ok)applySettings(await ss.json());if(th.ok)setTheme(await th.json());if(se.ok){const d=await se.json();setSections({sections:d.sections,order:d.order})}if(cc.ok)setCustomCSS((await cc.json()).css||'')}catch(e){console.warn('Runtime settings unavailable',e)}}


$('#collection-toggle').onclick=()=>{state.expanded=!state.expanded;renderProducts();if(!state.expanded)$('#collection').scrollIntoView({behavior:'smooth'})};
$('#menu').onclick=()=>{const b=$('#menu'),n=$('#mobile-nav'),open=!n.classList.contains('open');n.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open))};
$('#mobile-nav').onclick=e=>{if(e.target.matches('a')){$('#mobile-nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')}};
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.modal-nav').forEach(b=>b.addEventListener('click',()=>showModalMedia(state.modalIndex+Number(b.dataset.nav))));
document.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();setModalZoom(b.dataset.zoom==='reset'?1:state.modalZoom+Number(b.dataset.zoom))}));
const modalStage=$('#modal-stage');
const modalMedia=$('#product-modal .modal-media');
const handleModalWheel=e=>{
  if(matchMedia('(hover:none),(pointer:coarse)').matches)return;
  if(!$('#product-modal')?.classList.contains('open'))return;
  if(Math.abs(e.deltaY)<1)return;
  e.preventDefault();
  e.stopPropagation();
  setModalZoom(state.modalZoom+(e.deltaY<0?.2:-.2));
};
[modalStage,modalMedia].filter(Boolean).forEach(el=>el.addEventListener('wheel',handleModalWheel,{passive:false}));
if(modalStage){
  modalStage.addEventListener('pointermove',setModalZoomOrigin);
  modalStage.addEventListener('dblclick',e=>{setModalZoomOrigin(e);setModalZoom(state.modalZoom>1?1:2)});
  modalStage.addEventListener('click',e=>{
    if(matchMedia('(hover:none),(pointer:coarse)').matches)return;
    const video=$('#modal-video');
    if(video&&!video.hidden)return;
    setModalZoomOrigin(e);
    setModalZoom(state.modalZoom>1?1:2);
  });
}
$('#modal-thumbs').addEventListener('click',e=>{const b=e.target.closest('[data-thumb]');if(b)showModalMedia(Number(b.dataset.thumb))});
window.addEventListener('scroll',()=>{$('.header').classList.toggle('scrolled',window.scrollY>8)},{passive:true});
$('#year').textContent=new Date().getFullYear();
markRevealTargets();observeReveals();
initProducts();initRuntime();


/* Mobile modal scroll isolation */
(function(){
  const modal=document.getElementById('product-modal');
  if(!modal)return;
  let scrollY=0, locked=false;
  const lock=()=>{if(locked||!matchMedia('(max-width:760px)').matches)return;scrollY=window.scrollY;document.body.style.top='-'+scrollY+'px';document.body.classList.add('modal-open');locked=true};
  const unlock=()=>{if(!locked)return;document.body.classList.remove('modal-open');document.body.style.top='';window.scrollTo(0,scrollY);locked=false};
  new MutationObserver(()=>modal.classList.contains('open')?lock():unlock()).observe(modal,{attributes:true,attributeFilter:['class']});
  modal.addEventListener('touchmove',e=>{if(e.target===modal)e.preventDefault()},{passive:false});
})();


/* Zoom affordance: contextual hints without permanent controls */
(function(){
  const modal=document.getElementById('product-modal');
  if(!modal)return;
  const addHint=()=>{
    const stage=modal.querySelector('.modal-stage');
    if(!stage||stage.querySelector('.zoom-hint'))return;
    const hint=document.createElement('div');
    hint.className='zoom-hint '+(matchMedia('(max-width:760px)').matches?'mobile':'desktop');
    hint.textContent=matchMedia('(max-width:760px)').matches?'Pinch to zoom':'Scroll to zoom';
    stage.appendChild(hint);
    requestAnimationFrame(()=>hint.classList.add('is-visible'));
    setTimeout(()=>{hint.classList.remove('is-visible');setTimeout(()=>hint.remove(),400)},2800);
  };
  new MutationObserver(()=>{
    if(modal.classList.contains('open'))setTimeout(addHint,180);
  }).observe(modal,{attributes:true,attributeFilter:['class']});
})();


/* Prevent browser double-tap page zoom only on interactive product media.
   Pinch remains available for image zoom. */
(function(){
  const modal=document.getElementById('product-modal');
  if(!modal)return;
  let lastTap=0;
  modal.addEventListener('touchend',function(e){
    const stage=e.target.closest('.modal-stage');
    const image=stage&&e.target.closest('img[data-zoomable="true"]');
    if(!image)return;
    const now=Date.now();
    if(now-lastTap<320)e.preventDefault();
    lastTap=now;
  },{passive:false});
})();


/* Real mobile pinch-to-zoom for product images. No double-tap zoom. */
(function(){
  const modal=document.getElementById('product-modal');
  const stage=document.getElementById('modal-stage');
  const image=document.getElementById('modal-photo');
  if(!modal||!stage||!image)return;
  let pointers=new Map(),startDistance=0,startZoom=1,dragging=false;

  const distance=()=>{
    const p=[...pointers.values()];
    return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;
  };
  const update=()=>{
    image.style.transform='scale('+state.modalZoom+')';
    stage.classList.toggle('is-zoomed',state.modalZoom>1);
  };

  stage.addEventListener('pointerdown',e=>{
    if(matchMedia('(min-width:761px)').matches)return;
    if(stage.classList.contains('is-video'))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    stage.setPointerCapture?.(e.pointerId);
    if(pointers.size===2){startDistance=distance();startZoom=state.modalZoom;dragging=true;}
  });
  stage.addEventListener('pointermove',e=>{
    if(matchMedia('(min-width:761px)').matches||!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2&&startDistance){
      e.preventDefault();
      state.modalZoom=Math.max(1,Math.min(3,startZoom*(distance()/startDistance)));
      update();
    }
  },{passive:false});
  const end=e=>{
    pointers.delete(e.pointerId);
    if(pointers.size<2){startDistance=0;dragging=false;}
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',end);

  stage.addEventListener('dblclick',e=>{
    if(matchMedia('(max-width:760px)').matches)e.preventDefault();
  });

  /* Suppress browser double-tap gesture without affecting normal pinch. */
  let lastTap=0;
  stage.addEventListener('pointerup',e=>{
    if(matchMedia('(min-width:761px)').matches||dragging)return;
    const now=Date.now();
    if(now-lastTap<350)e.preventDefault();
    lastTap=now;
  });
})();


/* Product zoom UX controller — replaces conflicting mobile zoom handlers. */
(function(){
  const stage=document.getElementById('modal-stage');
  const photo=document.getElementById('modal-photo');
  const modal=document.getElementById('product-modal');
  if(!stage||!photo||!modal)return;

  let activePointers=new Map(), pinchStart=0, zoomStart=1;
  const mobile=()=>matchMedia('(max-width:760px)').matches;
  const apply=()=>{
    photo.style.transform='scale('+state.modalZoom+')';
    stage.classList.toggle('is-zoomed',state.modalZoom>1.01);
  };
  const reset=()=>{state.modalZoom=1;photo.style.transformOrigin='50% 50%';apply()};

  stage.addEventListener('pointerdown',e=>{
    if(!mobile()||stage.classList.contains('is-video'))return;
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(activePointers.size===2){
      const p=[...activePointers.values()];
      pinchStart=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      zoomStart=state.modalZoom;
    }
  });

  stage.addEventListener('pointermove',e=>{
    if(!mobile()||!activePointers.has(e.pointerId)||activePointers.size!==2)return;
    activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const p=[...activePointers.values()];
    const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
    if(!pinchStart)return;
    state.modalZoom=Math.max(1,Math.min(3,zoomStart*(d/pinchStart)));
    apply();
  });

  const release=e=>{activePointers.delete(e.pointerId);if(activePointers.size<2)pinchStart=0};
  stage.addEventListener('pointerup',release);
  stage.addEventListener('pointercancel',release);

  /* Reset automatically when switching media or closing. */
  new MutationObserver(()=>{if(!modal.classList.contains('open'))reset()})
    .observe(modal,{attributes:true,attributeFilter:['class']});
})();


/* Single contained pan + pinch controller. Replaces scale-only drifting behavior. */
(function(){
  const stage=document.getElementById('modal-stage');
  const img=document.getElementById('modal-photo');
  if(!stage||!img)return;
  let pts=new Map(), scale=1, tx=0, ty=0, startScale=1, startTx=0, startTy=0;
  let startDist=0,startMid=null,dragStart=null;

  const clamp=()=>{
    const r=stage.getBoundingClientRect();
    const iw=img.naturalWidth||r.width, ih=img.naturalHeight||r.height;
    const fit=Math.min(r.width/iw,r.height/ih);
    const bw=iw*fit*scale,bh=ih*fit*scale;
    const maxX=Math.max(0,(bw-r.width)/2),maxY=Math.max(0,(bh-r.height)/2);
    tx=Math.max(-maxX,Math.min(maxX,tx));
    ty=Math.max(-maxY,Math.min(maxY,ty));
  };
  const render=()=>{
    clamp();
    img.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';
    stage.classList.toggle('is-zoomed',scale>1.01);
  };
  const reset=()=>{scale=1;tx=0;ty=0;render()};

  stage.addEventListener('pointerdown',e=>{
    if(matchMedia('(min-width:761px)').matches||stage.classList.contains('is-video'))return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    stage.setPointerCapture?.(e.pointerId);
    if(pts.size===1){dragStart={x:e.clientX,y:e.clientY};startTx=tx;startTy=ty}
    if(pts.size===2){
      const p=[...pts.values()];
      startDist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      startScale=scale;
      startMid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};
    }
  });
  stage.addEventListener('pointermove',e=>{
    if(matchMedia('(min-width:761px)').matches||!pts.has(e.pointerId))return;
    pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){
      const p=[...pts.values()];
      const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
      scale=Math.max(1,Math.min(3,startScale*(d/startDist)));
      render();
      return;
    }
    if(pts.size===1&&scale>1.01&&dragStart){
      tx=startTx+(e.clientX-dragStart.x);
      ty=startTy+(e.clientY-dragStart.y);
      render();
    }
  });
  const end=e=>{
    pts.delete(e.pointerId);
    if(pts.size===0){startDist=0;dragStart=null}
    else if(pts.size===1){const p=[...pts.values()][0];dragStart={x:p.x,y:p.y};startTx=tx;startTy=ty}
  };
  stage.addEventListener('pointerup',end);
  stage.addEventListener('pointercancel',end);

  /* Always reset when a new modal image loads. */
  img.addEventListener('load',reset);
})();


/* Premium product media engine — natural pan, focal-point pinch, hard containment. */
(function(){
  const stage=document.getElementById('modal-stage');
  const img=document.getElementById('modal-photo');
  if(!stage||!img)return;

  let points=new Map(), scale=1, x=0, y=0;
  let pinchBase=null, dragBase=null;

  const bounds=()=>{
    const r=stage.getBoundingClientRect();
    const nw=img.naturalWidth||r.width, nh=img.naturalHeight||r.height;
    const fit=Math.min(r.width/nw,r.height/nh);
    const w=nw*fit*scale, h=nh*fit*scale;
    return {maxX:Math.max(0,(w-r.width)/2),maxY:Math.max(0,(h-r.height)/2)};
  };
  const constrain=()=>{
    const b=bounds();
    x=Math.min(b.maxX,Math.max(-b.maxX,x));
    y=Math.min(b.maxY,Math.max(-b.maxY,y));
  };
  const paint=()=>{
    constrain();
    img.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+scale+')';
    stage.classList.toggle('is-zoomed',scale>1.001);
  };
  const midpoint=()=>{
    const p=[...points.values()];
    return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};
  };
  const distance=()=>{
    const p=[...points.values()];
    return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
  };
  const reset=()=>{scale=1;x=0;y=0;paint()};

  stage.addEventListener('pointerdown',e=>{
    if(stage.classList.contains('is-video'))return;
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    stage.setPointerCapture?.(e.pointerId);

    if(points.size===1) dragBase={x:e.clientX,y:e.clientY,tx:x,ty:y};
    if(points.size===2){
      const mid=midpoint();
      pinchBase={distance:distance(),scale,x,y,mid};
      dragBase=null;
    }
  });

  stage.addEventListener('pointermove',e=>{
    if(!points.has(e.pointerId)||stage.classList.contains('is-video'))return;
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});

    if(points.size===2&&pinchBase){
      const mid=midpoint();
      const next=Math.max(1,Math.min(4,pinchBase.scale*(distance()/pinchBase.distance)));
      const ratio=next/pinchBase.scale;
      // Keep the content under the fingers stable while pinching.
      const rect=stage.getBoundingClientRect();
      const ox=pinchBase.mid.x-(rect.left+rect.width/2);
      const oy=pinchBase.mid.y-(rect.top+rect.height/2);
      scale=next;
      x=pinchBase.x*ratio+ox*(1-ratio)+(mid.x-pinchBase.mid.x);
      y=pinchBase.y*ratio+oy*(1-ratio)+(mid.y-pinchBase.mid.y);
      paint();
      return;
    }

    if(points.size===1&&dragBase&&scale>1.001){
      // Direct manipulation: image follows the finger in the same direction.
      x=dragBase.tx+(e.clientX-dragBase.x);
      y=dragBase.ty+(e.clientY-dragBase.y);
      paint();
    }
  });

  const release=e=>{
    points.delete(e.pointerId);
    if(points.size===1){
      const p=[...points.values()][0];
      dragBase={x:p.x,y:p.y,tx:x,ty:y};
      pinchBase=null;
    } else if(points.size===0){
      dragBase=null;pinchBase=null;
    }
  };
  stage.addEventListener('pointerup',release);
  stage.addEventListener('pointercancel',release);

  // Reset on new media and when the modal closes.
  img.addEventListener('load',reset);
  const modal=document.getElementById('product-modal');
  if(modal)new MutationObserver(()=>{if(!modal.classList.contains('open'))reset()})
    .observe(modal,{attributes:true,attributeFilter:['class']});
})();
