/* JHALAR public site runtime
   - catalogue loader (fail-closed through the shared naming gate)
   - runtime settings/theme/sections/custom-css application (published state)
   - window.JHALAR API consumed by the Pro Editor live preview */
const state={products:[],filter:'all',expanded:false,whatsapp:'918100656258',theme:null,modalProduct:null,modalMedia:[],modalIndex:0,modalZoom:1};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function categories(){return [...new Set(state.products.map(p=>p.category).filter(Boolean))]}

function renderFilters(){
  const el=$('#product-filters');
  el.innerHTML=['all',...categories()].map(c=>'<button class="filter-btn '+(c===state.filter?'active':'')+'" data-filter="'+esc(c)+'" aria-pressed="'+(c===state.filter?'true':'false')+'">'+esc(c==='all'?'All designs':c)+'</button>').join('');
  el.onclick=e=>{
    const b=e.target.closest('[data-filter]');
    if(!b)return;
    e.preventDefault();
    const selectedFilter=b.dataset.filter;
    // Even an already-active filter should re-align the rail when tapped.

    const scrollX=window.scrollX;
    const scrollY=window.scrollY;

    state.filter=selectedFilter;
    state.expanded=selectedFilter!=='all';

    el.querySelectorAll('[data-filter]').forEach(btn=>{
      const selected=btn===b;
      btn.classList.toggle('active',selected);
      btn.setAttribute('aria-pressed',String(selected));
    });

    /* Keep the rail's natural order. Only reveal the tapped filter when it is off-screen. */
    if(window.matchMedia('(max-width:760px)').matches){
      requestAnimationFrame(()=>{
        const rail=el.getBoundingClientRect();
        const button=b.getBoundingClientRect();
        const left=button.left-rail.left;
        const right=button.right-rail.left;
        let target=el.scrollLeft;
        if(left<0) target+=left;
        else if(right>el.clientWidth) target+=right-el.clientWidth;
        target=Math.max(0,Math.min(target,el.scrollWidth-el.clientWidth));
        if(Math.abs(target-el.scrollLeft)>1){
          el.scrollTo({left:target,top:0,behavior:'smooth'});
        }
      });
    }

    const grid=$('#product-grid');
    if(grid){
      grid.classList.remove('filter-changing');
      void grid.offsetWidth;
      grid.classList.add('filter-changing');
    }

    renderProducts();

    /* Product filtering never moves the filter options or the page. */
    requestAnimationFrame(()=>{
      window.scrollTo(scrollX,scrollY);
      const target=$('#product-grid');
      if(target){
        target.classList.remove('filter-changing');
        requestAnimationFrame(()=>target.classList.add('catalogue-ready'));
      }
    });
  };
}

// Premium interaction layer
function initPremiumInteractions(){
  const audienceCopy={
    wholesale:'Decorative products suitable for bulk business requirements.',
    retail:'Distinctive hanging decor selected for stores and customers.',
    event:'Flexible decorative options for weddings, functions and event spaces.'
  };
  const audienceItems=[...document.querySelectorAll('.audience-item')],audienceNote=$('#audience-note');
  audienceItems.forEach(btn=>btn.addEventListener('click',()=>{
    audienceItems.forEach(x=>{x.classList.toggle('active',x===btn);x.setAttribute('aria-selected',String(x===btn))});
    if(audienceNote){audienceNote.classList.remove('interaction-swap');void audienceNote.offsetWidth;audienceNote.textContent=audienceCopy[btn.dataset.audience]||'';audienceNote.classList.add('interaction-swap')}
  }));
  const plans={
    wedding:'Planning wedding decor? Share your colours, venue style and quantity and we’ll help you find what works.',
    retail:'Looking for your store? Share your preferred styles, quantity and customer profile.',
    event:'Working on an event? Share your theme, space and quantity requirements with us.',
    custom:'Have a specific idea? Send your reference, colours, size and quantity and we’ll discuss what can be made.'
  };
  const planButtons=[...document.querySelectorAll('.planning-option')],planCopy=$('#custom-plan-copy');
  planButtons.forEach(btn=>btn.addEventListener('click',()=>{
    planButtons.forEach(x=>x.classList.toggle('active',x===btn));
    if(planCopy){planCopy.classList.remove('interaction-swap');void planCopy.offsetWidth;planCopy.textContent=plans[btn.dataset.plan];planCopy.classList.add('interaction-swap')}
  }));
  // Product image reveal without layout shift.
  document.addEventListener('load',e=>{const img=e.target;if(img.matches?.('.product-image img'))img.closest('.product-image')?.classList.add('media-ready')},true);
  // Active desktop navigation section, no underline.
  if(window.matchMedia('(min-width:761px)').matches){
    const navLinks=[...document.querySelectorAll('.header .nav a[href^="#"]')];
    const sections=navLinks.map(a=>[a,document.querySelector(a.getAttribute('href'))]).filter(([,el])=>el);
    const io=new IntersectionObserver(entries=>{
      const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;navLinks.forEach(a=>a.classList.toggle('nav-current',a.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-25% 0px -60% 0px',threshold:[0,.1,.25]});
    sections.forEach(([,el])=>io.observe(el));
  }
}

function visibleProducts(){return state.filter==='all'?state.products:state.products.filter(p=>p.category===state.filter)}
function mediaType(src,type){if(type)return type;return /\\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(String(src))?'video':'image'}
function normaliseMedia(item){if(typeof item==='string')return{src:item,type:mediaType(item)};if(item&&typeof item==='object'){const src=item.src||item.url||item.image||item.video||item.source;return src?{src,type:mediaType(src,item.type||item.mediaType)}:null}return null}
// Descriptive alt text is optional owner-editable content; fall back to the product name.
function productNameParts(p){
 const full=String(p?.title||'').trim();
 const cut=full.indexOf(',');
 if(cut<0)return{name:full,variant:''};
 return{name:full.slice(0,cut).trim(),variant:full.slice(cut+1).trim()};
}
function productAlt(p){const a=typeof p.imageAlt==='string'?p.imageAlt.trim():'';return a||p.title||''}
function mediaList(p){const raw=[p.image||p.sourceImage,...(Array.isArray(p.gallery)?p.gallery:[])];const seen=new Set;return raw.map(normaliseMedia).filter(m=>m&&m.src&&!seen.has(m.src)&&(seen.add(m.src),true))}
function renderProducts(){
 const all=visibleProducts(),grid=$('#product-grid');
 if(!grid)return;
 grid.innerHTML=all.map((p,i)=>{
   const m=mediaList(p),main=m[0]?.src||'',alt=m[1]?.src||'',name=productNameParts(p);
   return '<article class="product-card reveal" data-id="'+p.id+'" role="button" tabindex="0" aria-label="View '+esc(p.title)+'" style="transition-delay:'+Math.min(i*45,320)+'ms">'+
     '<div class="product-image" aria-hidden="true"><img src="'+esc(main)+'" alt="'+esc(productAlt(p))+'" loading="lazy">'+
     (alt?'<img class="alt-img" src="'+esc(alt)+'" alt="" loading="lazy">':'')+
     '</div><div class="product-info"><span class="product-category">'+esc(p.category)+'</span><h3 class="product-title">'+esc(name.name)+'</h3>'+
     (name.variant?'<span class="product-variant">'+esc(name.variant)+'</span>':'')+
     '<span class="product-open">View design <span aria-hidden="true">→</span></span></div></article>';
 }).join('');
 if(!grid.dataset.productActivation){
   const activate=e=>{
     const card=e.target.closest('.product-card[data-id]');
     if(!card||!grid.contains(card))return;
     openProduct(Number(card.dataset.id));
   };
   grid.addEventListener('click',activate);
   grid.addEventListener('keydown',e=>{
     if((e.key==='Enter'||e.key===' ')&&e.target.closest('.product-card[data-id]')){
       e.preventDefault();activate(e);
     }
   });
   grid.dataset.productActivation='true';
 }
 observeReveals();
}

// UNIVERSAL PRODUCT ACTIVATION — capture phase so no device-specific overlay,
// nested handler, or later bubbling handler can block opening a product.
(function installUniversalProductActivation(){
  let down=null,lastOpen=0;
  const cardFrom=e=>{
    const node=e.target;
    return node&&node.nodeType===1?node.closest('.product-card[data-id]'):node?.parentElement?.closest?.('.product-card[data-id]');
  };
  const activate=(card,e)=>{
    if(!card)return;
    const id=Number(card.dataset.id);
    if(!Number.isFinite(id))return;
    lastOpen=Date.now();
    openProduct(id);
  };
  document.addEventListener('pointerdown',e=>{
    const card=cardFrom(e);
    if(card)down={card,x:e.clientX,y:e.clientY,id:e.pointerId};
  },true);
  document.addEventListener('pointerup',e=>{
    if(!down||down.id!==e.pointerId)return;
    const d=down;down=null;
    const moved=Math.hypot(e.clientX-d.x,e.clientY-d.y);
    if(moved<14)activate(d.card,e);
  },true);
  document.addEventListener('touchend',e=>{
    if(Date.now()-lastOpen<450)return;
    const t=e.changedTouches&&e.changedTouches[0],card=cardFrom(e);
    if(card&&(!t||!down||Math.hypot(t.clientX-down.x,t.clientY-down.y)<14))activate(card,e);
    down=null;
  },true);
  document.addEventListener('click',e=>{
    if(Date.now()-lastOpen<450)return;
    activate(cardFrom(e),e);
  },true);
})();

let lastFocus=null;
function showModalMedia(i){
 const m=state.modalMedia||[];if(!m.length)return;
 state.modalIndex=((i%m.length)+m.length)%m.length;
 const item=m[state.modalIndex],stage=$('#modal-stage'),photo=$('#modal-photo'),video=$('#modal-video');
 stage.classList.toggle('is-video',item.type==='video');
 if(item.type==='video'){
   // Force a single active media element. Do not rely on the hidden attribute alone.
   photo.hidden=true;
   photo.style.display='none';
   video.hidden=false;
   video.style.display='block';
   video.src=item.src;
   video.load();
 }else{
   // Image product: physically remove the video from the rendered layout.
   video.pause();
   video.removeAttribute('src');
   video.load();
   video.hidden=true;
   video.style.display='none';
   photo.hidden=false;
   photo.style.display='block';
   photo.src=item.src;
   photo.alt=(state.modalIndex===0&&state.modalProduct?productAlt(state.modalProduct):$('#modal-title')?.textContent)||'Product media';
 }
 const thumbs=$('#modal-thumbs');
 thumbs.innerHTML=m.length>1?m.map((x,j)=>'<button class="modal-thumb'+(j===state.modalIndex?' active':'')+'" data-thumb="'+j+'">'+(x.type==='video'?'<span>Video</span>':'<img src="'+esc(x.src)+'" alt="">')+'</button>').join(''):'';
 $('.modal-nav.prev').hidden=m.length<=1;$('.modal-nav.next').hidden=m.length<=1;
 stage.dispatchEvent(new CustomEvent('product-media-change'));
}
function openProduct(id){
 const p=state.products.find(x=>Number(x.id)===id);if(!p)return;
 state.modalProduct=p;state.modalMedia=mediaList(p);state.modalIndex=0;
 const name=productNameParts(p);$('#modal-category').textContent=p.category;$('#modal-title').textContent=name.name;$('#modal-variant').textContent=name.variant;$('#modal-variant').hidden=!name.variant;$('#modal-desc').textContent=p.description||'';
 const wa=$('#modal-wa-btn');wa.href='https://wa.me/'+state.whatsapp+'?text='+encodeURIComponent('Hello JHALAR, I am interested in '+p.title+'.');
 showModalMedia(0);
 const copy=$('.modal-copy');if(copy)copy.scrollTop=0;
 const modal=$('#product-modal');lastFocus=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modal-close').focus();
}
function closeModal(){
 const m=$('#product-modal');
 if(!m||!m.classList.contains('open'))return;
 const activeVideo=m.querySelector('video');
 if(activeVideo){activeVideo.pause();activeVideo.currentTime=0;}
 m.classList.remove('is-closing');
 m.classList.remove('open');
 m.setAttribute('aria-hidden','true');
 document.body.style.overflow='';
 if(lastFocus?.focus)requestAnimationFrame(()=>lastFocus.focus());
 lastFocus=null;
}

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
 /* Font families are controlled by the production stylesheet to prevent late runtime swaps. */
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
  const pr=await fetch('content/products.json?ts='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
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
    const [ss,se]=await Promise.all([
      fetch('content/site-settings.json',{cache:'no-store'}),
      fetch('content/sections.json',{cache:'no-store'})
    ]);
    if(ss.ok) applySettings(await ss.json());
    if(se.ok){const d=await se.json();setSections({sections:d.sections,order:d.order})}
  }catch(e){console.warn('Runtime settings unavailable',e)}
}

/* Production UI owns theme and CSS. Editor runtime overrides are intentionally disabled. */

const __menu=$('#menu');
const __mobileNav=$('#mobile-nav');
const __navBackdrop=$('#nav-backdrop');

const setMobileNav=(open)=>{
  if(!__menu||!__mobileNav)return;
  __mobileNav.classList.toggle('open',open);
  __menu.classList.toggle('open',open);
  __menu.setAttribute('aria-expanded',String(open));
  __menu.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');
  if(__navBackdrop)__navBackdrop.classList.toggle('open',open);
  document.body.classList.toggle('nav-open',open);
};

if(__menu)__menu.addEventListener('click',()=>setMobileNav(!__mobileNav.classList.contains('open')));
if(__navBackdrop)__navBackdrop.addEventListener('click',()=>setMobileNav(false));
if(__mobileNav)__mobileNav.addEventListener('click',e=>{if(e.target.matches('a'))setMobileNav(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&__mobileNav?.classList.contains('open')){setMobileNav(false);__menu?.focus();}});
window.addEventListener('resize',()=>{if(window.innerWidth>760)setMobileNav(false)});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close]')){closeModal();return}
  if(!$('#product-modal')?.classList.contains('open'))return;
  if(e.target.closest('.header a[href],#mobile-nav a[href],a.logo,a.brand'))closeModal();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
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
    const mouseUI=matchMedia('(hover:hover) and (pointer:fine)').matches;
    hint.className='zoom-hint '+(mouseUI?'desktop':'mobile');
    hint.textContent=mouseUI?'Scroll to zoom':'Pinch to zoom';
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
 // Mouse / fine-pointer devices only: wheel or trackpad scroll zooms the product image.
 // Touch screens must keep normal page scrolling; zoom there is pinch-only.
 const finePointer=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
 stage.addEventListener('wheel',e=>{if(!finePointer()||!modal.classList.contains('open')||stage.classList.contains('is-video'))return;e.preventDefault();zoom(z*Math.exp(-e.deltaY*.001),e.clientX,e.clientY)},{passive:false});

 // Mobile: two-finger pinch zooms the product image itself, not the page.
 let pinch=null;
 const distance=t=>Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);
 const center=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});
 stage.addEventListener('touchstart',e=>{
   if(!modal.classList.contains('open')||stage.classList.contains('is-video'))return;
   if(e.touches.length===2){
     const p=center(e.touches);
     pinch={distance:distance(e.touches),zoom:z,x:p.x,y:p.y};
     e.preventDefault();
   }
 },{passive:false});
 stage.addEventListener('touchmove',e=>{
   if(!pinch||e.touches.length!==2)return;
   const p=center(e.touches);
   const next=pinch.zoom*(distance(e.touches)/pinch.distance);
   zoom(next,p.x,p.y);
   e.preventDefault();
 },{passive:false});
 const endPinch=e=>{if(e.touches.length<2)pinch=null};
 stage.addEventListener('touchend',endPinch,{passive:true});
 stage.addEventListener('touchcancel',()=>{pinch=null},{passive:true});

 // Pan works with mouse AND with one finger on touch screens after zooming.
 // Pointer Events are used here so mobile dragging is not blocked by the desktop-only handler.
 stage.addEventListener('pointerdown',e=>{
   if(!modal.classList.contains('open')||z<=1.001||stage.classList.contains('is-video'))return;
   if(e.pointerType==='touch'&&pinch)return;
   drag={id:e.pointerId,cx:e.clientX,cy:e.clientY,x,y};
   try{stage.setPointerCapture(e.pointerId)}catch(err){}
   stage.classList.add('is-panning');
   e.preventDefault();
 },{passive:false});
 stage.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   x=drag.x+e.clientX-drag.cx;
   y=drag.y+e.clientY-drag.cy;
   paint();
   e.preventDefault();
 },{passive:false});
 const stop=e=>{
   if(e&&drag&&e.pointerId!==undefined&&drag.id!==e.pointerId)return;
   drag=null;stage.classList.remove('is-panning');
 };
 stage.addEventListener('pointerup',stop);
 stage.addEventListener('pointercancel',stop);
 stage.addEventListener('dblclick',e=>zoom(z>1.01?1:2,e.clientX,e.clientY));
 img.addEventListener('load',reset);
 // Every product/media swap starts from the true 1× contained view.
 stage.addEventListener('product-media-change',()=>requestAnimationFrame(reset));
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

/* build 20260909.74 */


/* Header remains permanently available; no scroll-hide behavior. */



/* JHALAR DEPLOYMENT VERSION MARKER — no runtime asset swapping or forced reloads */
(function(){
  const VERSION_URL='content/version.json';
  async function checkVersion(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const v=(await r.json()).version;
      if(v)localStorage.setItem('jhalar-live-version',v);
    }catch(e){}
  }
  window.JHALAR_CHECK_FOR_UPDATE=checkVersion;
  checkVersion();
})();
