/* JHALAR public site runtime
   - catalogue loader (fail-closed through the shared naming gate)
   - runtime settings/theme/sections/custom-css application (published state)
   - window.JHALAR API consumed by the Pro Editor live preview */
const state={products:[],filter:'all',expanded:false,whatsapp:'918100656258',theme:null,modalProduct:null,modalMedia:[],modalIndex:0,modalZoom:1};
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Canonical application root. Dynamic /products/... routes must never change where data or media are fetched from. */
function appRoot(){
 /*
  The homepage canonical URL is the deployment contract. It is stable across
  homepage, modal state and restored /products/... routes.
 */
 const canonical=document.querySelector('link[rel="canonical"]')?.href;
 if(canonical)return new URL('./',canonical).href;
 const runtime=document.querySelector('script[data-jhalar-runtime]')?.src;
 if(runtime)return new URL('./',runtime).href;
 return location.origin+'/';
}
function appUrl(path){
 const clean=String(path).replace(/^\.\//,'').replace(/^\/+/, '');
 return new URL(clean,appRoot()).href;
}
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
/* Logo/home should always resolve to the latest published application state. */
document.querySelectorAll('a[href="./"],a[href="/"],a.logo,a.site-logo').forEach(link=>{
  link.addEventListener('click',event=>{
    const isModified=event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button===1;
    if(isModified)return;
    event.preventDefault();
    const home=new URL(location.href);
    home.searchParams.delete('product');
    home.hash='';
    home.searchParams.set('v',String(window.JHALAR_BUILD||Date.now()));
    location.replace(home.pathname+home.search);
  });
});

window.addEventListener('popstate',()=>{
 const wanted=new URLSearchParams(location.search).get('product');
 if(!wanted){closeModal(false);return}
 const id=Number(String(wanted).match(/-(\\d+)$/)?.[1]);
 if(id)openProduct(id,false);
});

function initProductDeepLink(){
 const match=location.pathname.match(/\/products\/([^/]+)-(\d+)\/?$/);
 if(!match)return;
 const id=Number(match[2]);
 if(id&&state.products?.some(p=>Number(p.id)===id))openProduct(id,false);
}

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

function slugify(value){
 return String(value||'product').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'product';
}
function productSlug(p){return slugify(p.title)+'-'+p.id}
function appBasePath(){
 const marker='/products/';
 const path=location.pathname;
 const i=path.indexOf(marker);
 return i>=0?path.slice(0,i):path;
}
function productUrl(p){
 return appBasePath().replace(/\/?$/,'/')+'products/'+productSlug(p)+'/';
}
function syncProductUrl(p,replace=false){
 history[replace?'replaceState':'pushState']({product:p.id},'',productUrl(p));
}
function clearProductUrl(){
 history.replaceState({},'',appBasePath()||'/');
}
function visibleProducts(){return state.filter==='all'?state.products:state.products.filter(p=>p.category===state.filter)}
function mediaType(src,type){if(type)return type;return /\\.(mp4|webm|ogg|mov)(?:[?#]|$)/i.test(String(src))?'video':'image'}
function normaliseMedia(item){
 const raw=typeof item==='string'?item:(item&&typeof item==='object'?(item.src||item.url||item.image||item.video||item.source):'');
 if(!raw)return null;
 const src=String(raw).trim().replace(/^\.\//,'');
 return {
   src:/^(https?:|data:|blob:)/i.test(src)?src:appUrl(src),
   type:mediaType(src,typeof item==='object'?(item.type||item.mediaType):undefined)
 };
}
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
   const slug=slugify(p.title)+'-'+p.id;
   return '<article class="product-card reveal" data-id="'+p.id+'" style="transition-delay:'+Math.min(i*45,320)+'ms">'+
     '<a class="product-link" href="'+esc(productUrl(p))+'" data-product-link="'+p.id+'" aria-label="View '+esc(p.title)+'">'+
     '<div class="product-image"><img src="'+esc(main)+'" alt="'+esc(productAlt(p))+'" loading="lazy">'+
     (alt?'<img class="alt-img" src="'+esc(alt)+'" alt="" loading="lazy">':'')+
     '</div><div class="product-info"><span class="product-category">'+esc(p.category)+'</span><h3 class="product-title">'+esc(name.name)+'</h3>'+
     (name.variant?'<span class="product-variant">'+esc(name.variant)+'</span>':'')+
     '</div></a></article>';
 }).join('');
 if(!grid.dataset.productActivation){
   const activate=e=>{
     const card=e.target.closest('.product-card[data-id]');
     if(!card||!grid.contains(card))return;
     const link=e.target.closest('a.product-link');
     /* Preserve native browser behavior for Ctrl/Cmd-click, middle click and context menus. */
     if(link&&(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey))return;
     e.preventDefault();
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
    const card=cardFrom(e);
    if(!card)return;
    /* Never allow the anchor to navigate away from the static application.
       Modified clicks retain native new-tab/context behaviour. */
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1)return;
    e.preventDefault();
    if(Date.now()-lastOpen<450)return;
    activate(card,e);
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
   photo.removeAttribute('srcset');
   photo.onerror=()=>{console.error('JHALAR product media failed:',item.src);photo.removeAttribute('src');photo.alt='Product media could not be loaded';};
   photo.onload=()=>{photo.onerror=null;};
   photo.src=item.src;
   photo.alt=(state.modalIndex===0&&state.modalProduct?productAlt(state.modalProduct):$('#modal-title')?.textContent)||'Product media';
 }
 const thumbs=$('#modal-thumbs');
 thumbs.innerHTML=m.length>1?m.map((x,j)=>'<button class="modal-thumb'+(j===state.modalIndex?' active':'')+'" data-thumb="'+j+'">'+(x.type==='video'?'<span>Video</span>':'<img src="'+esc(x.src)+'" alt="">')+'</button>').join(''):'';
 $('.modal-nav.prev').hidden=m.length<=1;$('.modal-nav.next').hidden=m.length<=1;
 stage.dispatchEvent(new CustomEvent('product-media-change'));
}
function openProduct(id,updateUrl=true){
 const p=state.products.find(x=>Number(x.id)===id);if(!p)return;
 if(updateUrl)syncProductUrl(p);
 state.modalProduct=p;state.modalMedia=mediaList(p);state.modalIndex=0;
 const name=productNameParts(p);$('#modal-category').textContent=p.category;$('#modal-title').textContent=name.name;$('#modal-variant').textContent=name.variant;$('#modal-variant').hidden=!name.variant;$('#modal-desc').textContent=p.description||'';
 const wa=$('#modal-wa-btn');wa.href='https://wa.me/'+state.whatsapp+'?text='+encodeURIComponent('Hello JHALAR, I am interested in '+p.title+'.');
 showModalMedia(0);
 const copy=$('.modal-copy');if(copy)copy.scrollTop=0;
 const modal=$('#product-modal');document.body.classList.add('product-view-open');document.querySelector('.header')?.classList.remove('is-hidden');lastFocus=document.activeElement;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#modal-close').focus();
}
function closeModal(updateUrl=true){
 const m=$('#product-modal');
 if(!m||!m.classList.contains('open'))return;
 const activeVideo=m.querySelector('video');
 if(activeVideo){activeVideo.pause();activeVideo.currentTime=0;}
 m.classList.remove('is-closing');
 m.classList.remove('open');
 m.setAttribute('aria-hidden','true');
 if(updateUrl)clearProductUrl();
 document.body.style.overflow='';
 if(lastFocus?.focus)requestAnimationFrame(()=>lastFocus.focus());
 lastFocus=null;
}


/* Recover a clean product route after static-host fallback redirects to the app shell. */
(function recoverProductRoute(){
 const pending=sessionStorage.getItem('jhalar_product_route');
 if(!pending)return;
 sessionStorage.removeItem('jhalar_product_route');
 history.replaceState({},'',pending);
})();

/* ---------- runtime defaults: equal to the shipped HTML/settings ---------- */
/* Public-site copy is owned by content/copy.json.
   Legacy runtime copy injection removed to prevent stale/duplicate section copy. */
async function applySettings(){ return; }

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
  const pr=await fetch(appUrl('content/products.json?ts='+Date.now()),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
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
    const nr=await fetch(appUrl('content/product-naming.json'),{cache:'no-store'});
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
      fetch(appUrl('content/site-settings.json'),{cache:'no-store'}),
      fetch(appUrl('content/sections.json'),{cache:'no-store'})
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
 const finePointer=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
 const MAX=finePointer()?2.4:1.8;
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
 stage.addEventListener('wheel',e=>{
   if(!finePointer()||!modal.classList.contains('open')||stage.classList.contains('is-video'))return;
   /* Ctrl/⌘ + wheel belongs to the browser's page zoom, never the product viewer. */
   if(e.ctrlKey||e.metaKey)return;
   e.preventDefault();
   zoom(z*Math.exp(-e.deltaY*.001),e.clientX,e.clientY)
 },{passive:false});

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
   if(pinch||e.isPrimary===false)return;
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
 stage.addEventListener('dblclick',e=>{
   /* Double activation is always a return to the true contained state. */
   closeFullMedia();reset();
 });

 // Dedicated full-screen viewer — separate from the popup layout.
 const lightbox=document.getElementById('media-lightbox');
 const lightboxImage=document.getElementById('media-lightbox-image');
 const lightboxClose=lightbox&&lightbox.querySelector('.media-lightbox-close');
 const openFullMedia=()=>{
   if(stage.classList.contains('is-video')||!lightbox||!img.src)return;
   resetLightbox();
   lightboxImage.src=img.currentSrc||img.src;
   lightboxImage.alt=img.alt||'Product image';
   lightbox.classList.add('open');
   lightbox.setAttribute('aria-hidden','false');
   document.body.classList.add('lightbox-open');
   lightboxClose&&lightboxClose.focus({preventScroll:true});
 };
 const toggleFullMedia=()=>{
   if(lightbox&&lightbox.classList.contains('open'))closeFullMedia();
   else openFullMedia();
 };
 let lbScale=1,lbX=0,lbY=0,lbPointers=new Map(),lbStartDist=0,lbStartScale=1,lbDrag=null;
 const renderLightbox=()=>{
   if(!lightboxImage)return;
   lightboxImage.style.transform=`translate3d(${lbX}px,${lbY}px,0) scale(${lbScale})`;
 };
 const resetLightbox=()=>{lbScale=1;lbX=0;lbY=0;renderLightbox();};
 const closeFullMedia=()=>{
   if(!lightbox||!lightbox.classList.contains('open'))return;
   lightbox.classList.remove('open');
   lightbox.setAttribute('aria-hidden','true');
   document.body.classList.remove('lightbox-open');
   lbPointers.clear();
   lbDrag=null;
   lbDismissStart=null;
   resetLightbox();
 };

 /* Full-screen media zoom + pan */
 lightbox&&lightbox.addEventListener('wheel',e=>{
   if(!lightbox.classList.contains('open')||e.ctrlKey||e.metaKey)return;
   e.preventDefault();
   lbScale=Math.max(1,Math.min(4,lbScale*Math.exp(-e.deltaY*.0015)));
   if(lbScale===1){lbX=0;lbY=0;}
   renderLightbox();
 },{passive:false});

 lightboxImage&&lightboxImage.addEventListener('pointerdown',e=>{
   if(!lightbox.classList.contains('open'))return;
   lightboxImage.setPointerCapture(e.pointerId);
   lbPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(lbPointers.size===1)lbDrag={x:e.clientX,y:e.clientY,baseX:lbX,baseY:lbY};
   if(lbPointers.size===2){
     const p=[...lbPointers.values()];
     lbStartDist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
     lbStartScale=lbScale;
     lbDrag=null;
   }
 });
 lightboxImage&&lightboxImage.addEventListener('pointermove',e=>{
   if(!lbPointers.has(e.pointerId))return;
   lbPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
   if(lbPointers.size===2){
     const p=[...lbPointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
     lbScale=Math.max(1,Math.min(4,lbStartScale*(d/lbStartDist)));
     if(lbScale===1){lbX=0;lbY=0;}
     renderLightbox();
   }else if(lbDrag&&lbScale>1){
     lbX=lbDrag.baseX+(e.clientX-lbDrag.x);
     lbY=lbDrag.baseY+(e.clientY-lbDrag.y);
     renderLightbox();
   }
 });
 const endLightboxPointer=e=>{
   lbPointers.delete(e.pointerId);
   if(lbPointers.size===0)lbDrag=null;
   else if(lbPointers.size===1){
     const p=[...lbPointers.values()][0];
     lbDrag={x:p.x,y:p.y,baseX:lbX,baseY:lbY};
   }
 };
 lightboxImage&&lightboxImage.addEventListener('pointerup',endLightboxPointer);
 lightboxImage&&lightboxImage.addEventListener('pointercancel',endLightboxPointer);
 lightboxImage&&lightboxImage.addEventListener('dblclick',resetLightbox);

 /* Mobile direct-manipulation dismissal: swipe the viewer down from its resting state. */
 let lbDismissStart=null;
 lightbox&&lightbox.addEventListener('pointerdown',e=>{
   if(!lightbox.classList.contains('open')||lbScale>1.01)return;
   lbDismissStart={x:e.clientX,y:e.clientY};
 });
 lightbox&&lightbox.addEventListener('pointerup',e=>{
   if(!lbDismissStart||lbScale>1.01)return;
   const dy=e.clientY-lbDismissStart.y,dx=e.clientX-lbDismissStart.x;
   if(dy>90&&Math.abs(dx)<Math.abs(dy)*.65)closeFullMedia();
   lbDismissStart=null;
 });
 lightbox&&lightbox.addEventListener('pointercancel',()=>{lbDismissStart=null});

 lightboxClose&&lightboxClose.addEventListener('click',closeFullMedia);
 lightbox&&lightbox.addEventListener('click',e=>{
   if(e.target===lightbox)closeFullMedia();
 });
 lightboxImage&&lightboxImage.addEventListener('click',e=>e.stopPropagation());
 stage.addEventListener('click',e=>{
   if(e.detail===1&&!drag&&finePointer())toggleFullMedia();
 });
 // Mobile: a deliberate single tap opens the true full-screen viewer.
 // Ignore gestures that were part of pinch or pan.
 let touchStart=null,touchMoved=false;
 stage.addEventListener('touchstart',e=>{
   if(e.touches.length===1){
     touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()};
     touchMoved=false;
   }
 },{passive:true});
 stage.addEventListener('touchmove',e=>{
   if(!touchStart||!e.touches[0])return;
   const dx=e.touches[0].clientX-touchStart.x,dy=e.touches[0].clientY-touchStart.y;
   if(Math.hypot(dx,dy)>12)touchMoved=true;
 },{passive:true});
 stage.addEventListener('touchend',e=>{
   if(!touchStart)return;
   const duration=Date.now()-touchStart.time;
   const shouldOpen=!touchMoved&&!pinch&&!drag&&duration<450;
   touchStart=null;
   if(shouldOpen)toggleFullMedia();
 },{passive:true});
 document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&lightbox&&lightbox.classList.contains('open'))closeFullMedia();
 });
 img.addEventListener('load',()=>{img.style.transformOrigin='center center';reset()});
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


/* Contextual sticky header behavior — stable and intentional. */
(function(){
  const header=document.querySelector('.header');
  if(!header)return;
  let lastY=window.scrollY,ticking=false,downDistance=0;
  function update(){
    const y=Math.max(0,window.scrollY),delta=y-lastY;
    header.classList.toggle('is-scrolled',y>10);

    /* Mobile stays available; desktop hides only after meaningful downward travel. */
    if(matchMedia('(max-width:760px)').matches){
      header.classList.remove('is-hidden');
    }else if(y<120){
      downDistance=0;
      header.classList.remove('is-hidden');
    }else if(delta>0){
      downDistance+=delta;
      if(downDistance>56)header.classList.add('is-hidden');
    }else if(delta<0){
      downDistance=0;
      header.classList.remove('is-hidden');
    }
    lastY=y;ticking=false;
  }
  window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
  update();
})();



/* JHALAR DEPLOYMENT VERSION MARKER — no runtime asset swapping or forced reloads */
(function(){
  const VERSION_URL='content/version.json';
  const VERSION_KEY='jhalar-live-version';
  const RELOAD_KEY='jhalar-reload-version';

  async function checkVersion(){
    try{
      const r=await fetch(appUrl(VERSION_URL+'?t='+Date.now()),{
        cache:'no-store',
        headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}
      });
      if(!r.ok)return false;
      const data=await r.json();
      const next=data&&data.version;
      if(!next)return false;

      const previous=localStorage.getItem(VERSION_KEY);
      localStorage.setItem(VERSION_KEY,next);

      /* A new deployment should never require the customer to know about
         hard refresh. Reload once when a genuinely newer version is detected. */
      if(previous&&previous!==next&&sessionStorage.getItem(RELOAD_KEY)!==next){
        sessionStorage.setItem(RELOAD_KEY,next);
        location.reload();
        return true;
      }
      return false;
    }catch(e){return false}
  }

  window.JHALAR_CHECK_FOR_UPDATE=checkVersion;
  checkVersion();

  /* Catch long-open tabs after a new catalogue/deploy goes live. */
  window.addEventListener('focus',checkVersion,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='visible')checkVersion();
  });
  setInterval(checkVersion,60000);
})();


/* Global browser pinch-zoom guard.
   The popup product media is excluded because it has its own custom zoom engine. */
(function(){
  const viewer=e=>e.target.closest&&e.target.closest('#modal-stage');
  document.addEventListener('gesturestart',e=>{if(!viewer(e))e.preventDefault()},{passive:false});
  document.addEventListener('gesturechange',e=>{if(!viewer(e))e.preventDefault()},{passive:false});
  document.addEventListener('gestureend',e=>{if(!viewer(e))e.preventDefault()},{passive:false});

  document.addEventListener('touchmove',e=>{
    if(e.touches.length>1&&!viewer(e))e.preventDefault();
  },{passive:false});
})();


/* Custom project inquiry → structured WhatsApp handoff */
(function(){
  const modal=document.getElementById('project-inquiry-modal');
  const form=document.getElementById('project-inquiry-form');
  const triggers=document.querySelectorAll('.discuss-project-trigger');
  if(!modal||!form)return;

  const open=()=>{
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('project-inquiry-open');
    setTimeout(()=>form.elements.name&&form.elements.name.focus(),220);
  };
  const close=()=>{
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('project-inquiry-open');
  };
  triggers.forEach(t=>t.addEventListener('click',open));
  modal.querySelectorAll('[data-project-close]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))close()});

  /* Role-first progressive questions */
  const roleInputs=form.querySelectorAll('input[name="role"]');
  const dynamicQuestions=document.getElementById('inquiry-dynamic-questions');
  const questionSets={
    'Retailer':[
      ['Business / store name','business','text','Your shop or business name'],
      ['Where is your store?','location','location','Start typing your address or city'],
      ['What quantity are you looking for?','quantity','text','For example: 50 pieces'],
      ['What kind of collection interests you?','interest','text','Festival, floral, hanging decor…']
    ],
    'Wholesaler':[
      ['Business name','business','text','Your wholesale business'],
      ['Where is your business located?','location','location','Start typing your address or city'],
      ['Approximate order quantity','quantity','text','For example: 500+ pieces'],
      ['Which markets or cities do you supply?','markets','text','Your distribution area']
    ],
    'Event decorator':[
      ['Where is the event?','location','location','Start typing venue, city or address'],
      ['What type of event is it?','eventType','text','Wedding, festival, corporate…'],
      ['When is the event?','timeline','text','Approximate date'],
      ['What do you need us to create?','details','textarea','Colours, style, quantity and concept']
    ],
    'Personal / self decorator':[
      ['Where are you decorating?','location','location','Start typing your city or address'],
      ['What space are you decorating?','space','text','Home, balcony, puja space…'],
      ['How many pieces do you need?','quantity','text','Approximate quantity'],
      ['Tell us your idea','details','textarea','Colours, style or occasion']
    ],
    'Bulk buyer':[
      ['Where should we deliver?','location','location','Start typing your city or address'],
      ['How many pieces are you considering?','quantity','text','Approximate quantity'],
      ['What are you buying for?','purpose','text','Resale, event, gifting…'],
      ['Any specific requirements?','details','textarea','Colours, styles or timeline']
    ]
  };
  const renderQuestions=role=>{
    const questions=questionSets[role]||[];
    dynamicQuestions.innerHTML='';
    questions.forEach(([label,name,type,placeholder])=>{
      const field=document.createElement('label');
      field.textContent=label;
      let input;
      if(type==='textarea'){
        input=document.createElement('textarea');input.rows=4;
      }else{
        input=document.createElement('input');input.type=type==='location'?'text':type;
      }
      input.name=name;input.placeholder=placeholder;input.required=name==='location'||name==='quantity';
      if(type==='location'){input.id='project-location';input.autocomplete='street-address'}
      field.appendChild(input);
      if(type==='location'){
        const wrap=document.createElement('span');wrap.className='location-field';
        field.removeChild(input);wrap.appendChild(input);
        const spinner=document.createElement('span');spinner.className='location-spinner';spinner.setAttribute('aria-hidden','true');wrap.appendChild(spinner);
        const list=document.createElement('div');list.id='location-suggestions';list.className='location-suggestions';list.setAttribute('role','listbox');wrap.appendChild(list);
        field.appendChild(wrap);
      }
      dynamicQuestions.appendChild(field);
    });
    bindLocationAutocomplete();
  };
  /* Use both change and click delegation: reliable across mobile label/radio handling. */
  const chooseRole=role=>{
    if(!role)return;
    roleInputs.forEach(input=>{input.checked=input.value===role});
    renderQuestions(role);

    /* Progressive disclosure: once the choice is made, collapse the chooser
       so the next questions become the only active focus. */
    const roleChooser=form.querySelector('.inquiry-role-options');
    const roleFieldset=form.querySelector('.inquiry-role');
    if(roleChooser){
      roleChooser.classList.add('is-collapsed');
      roleChooser.setAttribute('aria-hidden','true');
    }
    if(roleFieldset){
      roleFieldset.classList.add('is-selected');
      roleFieldset.querySelector('legend').textContent='You are a '+role;
    }

    requestAnimationFrame(()=>dynamicQuestions.scrollIntoView({block:'nearest',behavior:'smooth'}));
  };
  roleInputs.forEach(input=>{
    input.addEventListener('change',()=>chooseRole(input.value));
    input.addEventListener('click',()=>chooseRole(input.value));
  });
  form.querySelector('.inquiry-role-options')?.addEventListener('click',event=>{
    const label=event.target.closest('label');
    const input=label&&label.querySelector('input[name="role"]');
    if(input){event.preventDefault();chooseRole(input.value)}
  });

  let locationTimer=null,locationAbort=null;
  const bindLocationAutocomplete=()=>{
    const locationInput=document.getElementById('project-location');
    const suggestions=document.getElementById('location-suggestions');
    const locationField=locationInput&&locationInput.closest('.location-field');
    if(!locationInput)return;
    const clearSuggestions=()=>{suggestions.innerHTML='';suggestions.classList.remove('show')};
    locationInput.addEventListener('input',()=>{
      const query=locationInput.value.trim();clearTimeout(locationTimer);clearSuggestions();if(query.length<3)return;
      locationTimer=setTimeout(async()=>{
        if(locationAbort)locationAbort.abort();locationAbort=new AbortController();locationField.classList.add('loading');
        try{
          const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q='+encodeURIComponent(query),{signal:locationAbort.signal,headers:{Accept:'application/json'}});
          const results=await response.json();
          results.forEach(item=>{
            const button=document.createElement('button');button.type='button';button.className='location-suggestion';
            const parts=item.display_name.split(',');
            button.innerHTML='<strong>'+parts.slice(0,2).map(x=>x.trim()).join(', ')+'</strong><span>'+parts.slice(2).map(x=>x.trim()).join(', ')+'</span>';
            button.addEventListener('click',()=>{locationInput.value=item.display_name;clearSuggestions()});
            suggestions.appendChild(button);
          });
          if(results.length)suggestions.classList.add('show');
        }catch(err){}finally{locationField.classList.remove('loading')}
      },350);
    });
    locationInput.addEventListener('blur',()=>setTimeout(clearSuggestions,180));
  };

  form.addEventListener('submit',e=>{
    e.preventDefault();
    const data=new FormData(form);
    const val=k=>(data.get(k)||'').toString().trim();
    const message=[
      'Hello JHALAR, I would like to discuss a custom project.',
      '',
      'Name: '+val('name'),
      'I am: '+val('role'),
      val('quantity')?'Quantity: '+val('quantity'):null,
      val('location')?'Location: '+val('location'):null,
      val('details')?'Requirements: '+val('details'):null
    ].filter(Boolean).join('\n');
    window.open('https://wa.me/918100656258?text='+encodeURIComponent(message),'_blank','noopener');
    close();
  });
})();