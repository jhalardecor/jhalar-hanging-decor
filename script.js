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
function showModalMedia(i){
 const m=state.modalMedia||[];if(!m.length)return;
 state.modalIndex=((i%m.length)+m.length)%m.length;
 const item=m[state.modalIndex],stage=$('#modal-stage'),photo=$('#modal-photo'),video=$('#modal-video');
 stage.classList.toggle('is-video',item.type==='video');
 if(item.type==='video'){
   photo.hidden=true;video.hidden=false;video.src=item.src;video.load();
 }else{
   video.pause();video.removeAttribute('src');video.load();video.hidden=true;
   photo.hidden=false;photo.src=item.src;photo.alt=$('#modal-title')?.textContent||'Product media';
 }
 const thumbs=$('#modal-thumbs');
 thumbs.innerHTML=m.length>1?m.map((x,j)=>'<button class="modal-thumb'+(j===state.modalIndex?' active':'')+'" data-thumb="'+j+'">'+(x.type==='video'?'<span>Video</span>':'<img src="'+esc(x.src)+'" alt="">')+'</button>').join(''):'';
 $('.modal-nav.prev').hidden=m.length<=1;$('.modal-nav.next').hidden=m.length<=1;
}
function openProduct(id){
 const p=state.products.find(x=>Number(x.id)===id);if(!p)return;
 state.modalMedia=mediaList(p);state.modalIndex=0;
 $('#modal-category').textContent=p.category;$('#modal-title').textContent=p.title;$('#modal-desc').textContent=p.description||'';
 const wa=$('#modal-wa-btn');wa.href='https://wa.me/'+state.whatsapp+'?text='+encodeURIComponent('Hello JHALAR, I am interested in '+p.title+'.');
 showModalMedia(0);
 const modal=$('#product-modal');lastFocus=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modal-close').focus();
}
function closeModal(){const m=$('#product-modal');if(!m.classList.contains('open'))return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus?.focus)lastFocus.focus();lastFocus=null}

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
async function initRuntime(){
 try{
  const [ss,th,se,cc]=await Promise.all([
   fetch('content/site-settings.json',{cache:'no-store'}),
   fetch('content/theme.json',{cache:'no-store'}),
   fetch('content/sections.json',{cache:'no-store'}),
   fetch('content/custom-css.json',{cache:'no-store'})
  ]);
  if(ss.ok) applySettings(await ss.json());
  if(th.ok) setTheme(await th.json());
  if(se.ok){const d=await se.json();setSections({sections:d.sections,order:d.order})}
  if(cc.ok) setCustomCSS((await cc.json()).css||'');
 }catch(e){console.warn('Runtime settings unavailable',e)}
}


const __collectionToggle=$('#collection-toggle'); if(__collectionToggle) __collectionToggle.onclick=()=>{state.expanded=!state.expanded;renderProducts();if(!state.expanded)$('#collection').scrollIntoView({behavior:'smooth'})};
const __menu=$('#menu'); if(__menu) __menu.onclick=()=>{const b=$('#menu'),n=$('#mobile-nav'),open=!n.classList.contains('open');n.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open))};
const __mobileNav=$('#mobile-nav'); if(__mobileNav) __mobileNav.onclick=e=>{if(e.target.matches('a')){$('#mobile-nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')}};
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.modal-nav').forEach(b=>b.addEventListener('click',()=>showModalMedia(state.modalIndex+Number(b.dataset.nav))));
const __syncHeader=()=>{$('.header')?.classList.toggle('scrolled',window.scrollY>8)};window.addEventListener('scroll',__syncHeader,{passive:true});__syncHeader();
const __year=$('#year'); if(__year)__year.textContent=new Date().getFullYear();
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

/* SINGLE PRODUCT VIEWER ENGINE — only zoom/pan controller */
(function(){
 const stage=document.getElementById('modal-stage'),img=document.getElementById('modal-photo'),modal=document.getElementById('product-modal');
 if(!stage||!img||!modal)return;
 let z=1,x=0,y=0,drag=null,raf=0;
 const MAX=2.8;
 function frame(){
   const r=stage.getBoundingClientRect(),cs=getComputedStyle(stage),px=(parseFloat(cs.paddingLeft)||0)*2,py=(parseFloat(cs.paddingTop)||0)*2;
   return {r,w:r.width-px,h:r.height-py};
 }
 function bounds(){
   const f=frame(),nw=img.naturalWidth||f.w,nh=img.naturalHeight||f.h,k=Math.min(f.w/nw,f.h/nh);
   return {mx:Math.max(0,(nw*k*z-f.w)/2),my:Math.max(0,(nh*k*z-f.h)/2)};
 }
 function render(){raf=0;const b=bounds();x=Math.max(-b.mx,Math.min(b.mx,x));y=Math.max(-b.my,Math.min(b.my,y));img.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+z+')';stage.classList.toggle('is-zoomed',z>1.001)}
 function paint(){if(!raf)raf=requestAnimationFrame(render)}
 function reset(){z=1;x=y=0;drag=null;paint()}
 function zoom(next,cx,cy){
   next=Math.max(1,Math.min(MAX,next));const old=z;if(Math.abs(next-old)<.0001)return;
   const r=stage.getBoundingClientRect(),ox=cx-(r.left+r.width/2),oy=cy-(r.top+r.height/2),ratio=next/old;
   x=ox-(ox-x)*ratio;y=oy-(oy-y)*ratio;z=next;if(z===1)x=y=0;paint();
 }
 stage.addEventListener('wheel',e=>{if(!modal.classList.contains('open')||stage.classList.contains('is-video'))return;e.preventDefault();zoom(z*Math.exp(-e.deltaY*.001),e.clientX,e.clientY)},{passive:false});
 stage.addEventListener('pointerdown',e=>{if(z<=1.001||stage.classList.contains('is-video'))return;drag={id:e.pointerId,cx:e.clientX,cy:e.clientY,x,y};stage.setPointerCapture(e.pointerId);stage.classList.add('is-panning');e.preventDefault()});
 stage.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.x+e.clientX-drag.cx;y=drag.y+e.clientY-drag.cy;paint()});
 const stop=()=>{drag=null;stage.classList.remove('is-panning')};stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);
 stage.addEventListener('dblclick',e=>zoom(z>1.01?1:2,e.clientX,e.clientY));
 img.addEventListener('load',reset);
 new MutationObserver(()=>{if(!modal.classList.contains('open'))reset()}).observe(modal,{attributes:true,attributeFilter:['class']});
})();


/* Fresh navigation guard */
(function(){
 document.addEventListener('click',function(e){
   const logo=e.target.closest('a.logo,a.brand,[data-home-logo]');
   if(!logo)return;
   const href=logo.getAttribute('href')||'';
   if(href==='/'||href==='index.html'||href==='./'){
     e.preventDefault();
     const u=new URL(location.href);
     u.searchParams.set('_fresh',Date.now().toString());
     location.replace(u.pathname+u.search+u.hash);
   }
 },true);
})();

/* build 20260907.16 */


/* Header direction behavior + reliable logo navigation */
(function(){
  const header=document.querySelector('.header');
  const mobileNav=document.getElementById('mobile-nav');
  const menu=document.getElementById('menu');
  if(header){
    let lastY=window.scrollY, ticking=false;
    const update=()=>{
      const y=Math.max(0,window.scrollY);
      const delta=y-lastY;
      header.classList.toggle('scrolled',y>8);
      if(y<80 || delta<-4){
        header.classList.remove('header-hidden');
      }else if(delta>6 && y>120 && !(mobileNav&&mobileNav.classList.contains('open'))){
        header.classList.add('header-hidden');
      }
      lastY=y;ticking=false;
    };
    window.addEventListener('scroll',()=>{
      if(!ticking){ticking=true;requestAnimationFrame(update)}
    },{passive:true});
    update();
  }

  document.querySelectorAll('.brand[href="#top"],.footer-brand[href="#top"]').forEach(logo=>{
    logo.addEventListener('click',e=>{
      e.preventDefault();
      header?.classList.remove('header-hidden');
      if(mobileNav){mobileNav.classList.remove('open')}
      if(menu){menu.setAttribute('aria-expanded','false')}
      window.scrollTo({top:0,behavior:'smooth'});
      history.replaceState(null,'',location.pathname+location.search);
    });
  });
})();
