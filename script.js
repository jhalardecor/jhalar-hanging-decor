/* JHALAR — public site runtime
   - catalogue loader (fail-closed through the shared naming gate)
   - runtime settings/theme/sections/custom-css application (published state)
   - window.JHALAR API consumed by the Pro Editor live preview */
const state={products:[],filter:'all',expanded:false,whatsapp:'918100656258',theme:null,modalMedia:[],modalIndex:0};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function categories(){return [...new Set(state.products.map(p=>p.category).filter(Boolean))]}

function renderFilters(){const el=$('#product-filters');el.innerHTML=['all',...categories()].map(c=>'<button class="filter-btn '+(c===state.filter?'active':'')+'" data-filter="'+esc(c)+'" aria-pressed="'+(c===state.filter?'true':'false')+'">'+esc(c==='all'?'All designs':c)+'</button>').join('');el.onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;const next=b.dataset.filter;if(next===state.filter)return;state.filter=next;state.expanded=next!=='all';el.querySelectorAll('[data-filter]').forEach(btn=>{const selected=btn===b;btn.classList.toggle('active',selected);btn.setAttribute('aria-pressed',String(selected));});renderProducts();}}
function visibleProducts(){return state.filter==='all'?state.products:state.products.filter(p=>p.category===state.filter)}
function mediaList(p){const main=p.image||p.sourceImage;const g=Array.isArray(p.gallery)?p.gallery.filter(x=>typeof x==='string'&&x):[];return[main,...g.filter(x=>x!==main)].filter(Boolean)}
function renderProducts(){const all=visibleProducts(),limit=state.expanded?all.length:Math.min(all.length,8);const grid=$('#product-grid');grid.innerHTML=all.slice(0,limit).map((p,i)=>{const m=mediaList(p),main=m[0]||'',alt=m[1]||'';return '<article class="product-card reveal" style="transition-delay:'+Math.min(i*45,320)+'ms"><button class="product-image" data-id="'+p.id+'" aria-label="View '+esc(p.title)+'"><img src="'+esc(main)+'" alt="'+esc(p.title)+'" loading="lazy">'+(alt?'<img class="alt-img" src="'+esc(alt)+'" alt="" aria-hidden="true" loading="lazy">':'')+'</button><div class="product-info"><span class="product-category">'+esc(p.category)+'</span><h3 class="product-title">'+esc(p.title)+'</h3><button class="product-details-btn" data-id="'+p.id+'">View design <span class="arr">→</span></button></div></article>'}).join('');grid.onclick=e=>{const b=e.target.closest('[data-id]');if(b)openProduct(Number(b.dataset.id))};const more=$('#collection-toggle');if(all.length>8&&state.filter==='all'){more.hidden=false;more.textContent=state.expanded?'Show fewer':'View all '+all.length+' designs'}else more.hidden=true;observeReveals()}
let lastFocus=null;
function showModalMedia(i){const m=state.modalMedia||[];if(!m.length)return;const n=m.length;state.modalIndex=((i%n)+n)%n;const photo=$('#modal-photo');photo.src=m[state.modalIndex];const thumbs=$('#modal-thumbs');if(n>1){thumbs.innerHTML=m.map((src,j)=>'<button class="modal-thumb'+(j===state.modalIndex?' active':'')+'" data-thumb="'+j+'" aria-label="Photo '+(j+1)+' of '+n+'"><img src="'+esc(src)+'" alt=""></button>').join('');$('.modal-nav.prev').hidden=false;$('.modal-nav.next').hidden=false}else{thumbs.innerHTML='';$('.modal-nav.prev').hidden=true;$('.modal-nav.next').hidden=true}}
function openProduct(id){const p=state.products.find(x=>Number(x.id)===id);if(!p)return;const m=mediaList(p);state.modalMedia=m;state.modalIndex=0;const photo=$('#modal-photo');photo.src=m[0]||'';photo.alt=p.title;showModalMedia(0);$('#modal-category').textContent=p.category;$('#modal-title').textContent=p.title;$('#modal-desc').textContent=p.description||'';const wa=$('#modal-wa-btn');wa.href='https://wa.me/'+state.whatsapp+'?text='+encodeURIComponent('Hello JHALAR, I am interested in '+p.title+'.');wa.innerHTML='Enquire about this design <span aria-hidden="true">→</span>';const modal=$('#product-modal');lastFocus=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modal-close').focus()}
function closeModal(){const m=$('#product-modal');if(!m.classList.contains('open'))return;m.classList.remove('open');m.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();lastFocus=null}

/* ---------- runtime defaults: equal to the shipped HTML/settings ---------- */
const DEFAULTS={
 heroImage:'assets/images/hero-jhalar.webp',
 heroHeadline:'Let the colour do the talking.',
 heroIntro:'Handmade jhalars and hanging decor for the weddings, events and festive spaces you are putting together.',
 heroCta:'View the collection',
 collectionLabel:'BROWSE DESIGNS',collectionTitle:'Find what fits the occasion.',collectionIntro:'Compare colour, form and texture before you enquire.',
 customLabel:'CUSTOM WORK',customTitle:'Start with your colour story.',customIntro:'Bring a theme, palette or reference. We will discuss colour, size, quantity and timing for your setup.',
 customImage:'assets/images/custom-orders.jpg',
 aboutLabel:'JHALAR',aboutTitle:'Made by hand. Chosen for the moment.',aboutIntro:'We make hanging decor for the people who put celebrations together: decorators, planners, retailers and families.',
 aboutImage:'assets/images/about-collage.jpg',
 contactLabel:'READY WHEN YOU ARE',contactTitle:'Tell us what you are creating.',contactIntro:'Send the design, quantity, location and date. We will take it from there.',
 footerTagline:'Handcrafted hanging decor · Howrah, India',
 siteTitle:'JHALAR — Hanging Decor for Celebrations',
 siteDescription:'Handcrafted jhalars and hanging decor for weddings, events and festive spaces.',
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
async function initProducts(){try{const gate=window.JHALARNaming;if(!gate)throw Error('Naming gate unavailable');const[pr,nr]=await Promise.all([fetch('content/products.json',{cache:'no-store'}),fetch('content/product-naming.json',{cache:'no-store'})]);if(!pr.ok)throw Error('Catalogue unavailable');if(!nr.ok)throw Error('Naming registry unavailable');const d=await pr.json();const registry=await nr.json();const products=Array.isArray(d.products)?d.products:[];const report=gate.validateCatalogue({products},registry);if(report.errors.length)throw Error('Catalogue rejected by naming gate: '+report.errors[0]);const approved=new Set(report.products.filter(x=>x.status===gate.STATUS.APPROVED&&!x.humanReviewRequired).map(x=>x.productId));state.products=products.filter(p=>approved.has(p.id));if(!state.products.length)throw Error('No approved products in catalogue');renderFilters();renderProducts()}catch(e){console.error(e);$('#product-grid').innerHTML='<p>Products are being updated. Please check back shortly.</p>'}}
async function initRuntime(){try{const[ss,th,se,cc]=await Promise.all([fetch('content/site-settings.json',{cache:'no-store'}),fetch('content/theme.json',{cache:'no-store'}),fetch('content/sections.json',{cache:'no-store'}),fetch('content/custom-css.json',{cache:'no-store'})]);if(ss.ok)applySettings(await ss.json());if(th.ok)setTheme(await th.json());if(se.ok){const d=await se.json();setSections({sections:d.sections,order:d.order})}if(cc.ok)setCustomCSS((await cc.json()).css||'')}catch(e){console.warn('Runtime settings unavailable',e)}}


$('#collection-toggle').onclick=()=>{state.expanded=!state.expanded;renderProducts();if(!state.expanded)$('#collection').scrollIntoView({behavior:'smooth'})};
$('#menu').onclick=()=>{const b=$('#menu'),n=$('#mobile-nav'),open=!n.classList.contains('open');n.classList.toggle('open',open);b.setAttribute('aria-expanded',String(open))};
$('#mobile-nav').onclick=e=>{if(e.target.matches('a')){$('#mobile-nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')}};
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.querySelectorAll('.modal-nav').forEach(b=>b.addEventListener('click',()=>showModalMedia(state.modalIndex+Number(b.dataset.nav))));
$('#modal-thumbs').addEventListener('click',e=>{const b=e.target.closest('[data-thumb]');if(b)showModalMedia(Number(b.dataset.thumb))});
window.addEventListener('scroll',()=>{$('.header').classList.toggle('scrolled',window.scrollY>8)},{passive:true});
$('#year').textContent=new Date().getFullYear();
markRevealTargets();observeReveals();
initProducts();initRuntime();
