// ============================================
// JHALAR Pro Editor
// ============================================
const GITHUB_OWNER = 'jhalardecor', GITHUB_REPO = 'jhalar-hanging-decor', GITHUB_BRANCH = 'main';
const FILES_TO_PUBLISH = ['content/site-settings.json','content/theme.json','content/products.json','content/sections.json','content/custom-css.json'];

let state = {
  settings: null, theme: null, products: [], namingRegistry: null, sections: {}, sectionOrder: [],
  customCSS: '', navItems: [], footerNavItems: [], socialLinks: {},
  imageManifest: [], fontManifest: [], selectedProductId: null, viewport: 'desktop',
  changed: false, githubToken: null, darkMode: false,
  heroHighlights: [], trustItems: [], faqItems: [], sectionCopy: {}, imagePickTarget: null, zoom: 1, selectedPreview: null, inspectorRuleId: 0, moveMode: false, dragRules: {}
};

function defaultSectionCopy() {
  return {
    heroPrimary: {label:'View the collection', href:'#collection'},
    heroSecondary: {label:'', href:''},
    collection: {
      label:'BROWSE DESIGNS', title:'Find what fits the occasion.',
      intro:'Compare colour, form and texture before you enquire.',
      note:''
    },
    customOrders: {
      label:'CUSTOM WORK', title:'Start with your colour story.',
      intro:'Bring a theme, palette or reference. We will discuss colour, size, quantity and timing for your setup.',
      image:'assets/images/custom-orders.jpg',
      chips:[
        {icon:'icon-palette', text:'Colour matching'},
        {icon:'icon-ruler', text:'Size and length'},
        {icon:'icon-chart', text:'Order quantity'}
      ],
      processLabel:'How an enquiry works',
      steps:[
        {title:'Send Your Brief', text:'The design or reference, your colours, how many pieces, and the date you need them.'},
        {title:'Review a Sample', text:'We make one piece to your brief and share it for your approval.'},
        {title:'Confirm the Details', text:'We confirm the design, quantity and timeline with you, and the order goes ahead.'}
      ]
    },
    about: {
      label:'JHALAR', title:'Made by hand. Chosen for the moment.',
      intro:'We make hanging decor for the people who put celebrations together: decorators, planners, retailers and families.',
      image:'assets/images/about-collage.jpg',
      values:[
        {icon:'icon-check', text:'Finished by hand, piece by piece'},
        {icon:'icon-check', text:'One contact from enquiry to dispatch'},
        {icon:'icon-check', text:'Dispatched across India'}
      ]
    },
    faq: {label:'FAQ', title:'Frequently Asked Questions'},
    contact: {
      label:'READY WHEN YOU ARE', title:'Tell us what you are creating.',
      intro:'Send the design, quantity, location and date. We will take it from there.',
      submitLabel:'Start an enquiry'
    },
    footerTagline:'Handcrafted hanging decor · Howrah, India'
  };
}

function deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base || {});
  if (!over || typeof over !== 'object') return out;
  Object.keys(over).forEach(k => {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = deepMerge(out[k], over[k]);
    else out[k] = over[k];
  });
  return out;
}

function defaultThemeTemplate() {
  return {
    colors: {
      '--brand-primary':'#6B2136','--brand-primary-dark':'#42101F','--brand-primary-light':'#C8909A',
      '--brand-accent':'#B48A52','--brand-navy':'#2F1E25','--brand-cream':'#F4EEE4',
      '--brand-background':'#FCFAF5','--brand-alt-background':'#ECE1D1','--brand-text':'#2F1E25',
      '--brand-muted':'#7D6C72','--brand-heading':'#2F1E25','--brand-border':'#E6DACB',
      '--brand-header-background':'#FCFAF5','--brand-footer-background':'#2C1220','--brand-footer-text':'#FCFAF5'
    },
    fonts: {
      heading:"Mogranx, Arial, sans-serif",
      body:"Mogranx, Arial, sans-serif"
    },
    layout: {
      baseFontSize:'16px', sectionY:'96px', cardRadius:'20px', containerWidth:'1140px',
      headerHeight:'72px', productColumns:'3', buttonRadius:'9999px', shadowIntensity:'0.12', revealAnimation:true,
      headingWeight:'600', headingTracking:'-0.01em', headingLeading:'1.18',
      bodyWeight:'400', bodyTracking:'0', bodyLeading:'1.7',
      titleSize:'fluid', heroTitleSize:'fluid', cardTitleSize:'fluid',
      cardPad:'24px', gridGap:'24px', sectionHeaderGap:'48px', sectionAlign:'center',
      heroColumns:'split', splitLayout:'split', aboutLayout:'split', processColumns:'3',
      contactLayout:'split', trustLayout:'auto', faqWidth:'740px', footerColumns:'4',
      productGap:'24px', splitGap:'48px', processGap:'24px', contactGap:'24px',
      faqGap:'12px', trustGap:'12px', footerGap:'48px', productPad:'24px', faqPad:'20px',
      footerPad:'80px', trustPad:'16px'
    }
  };
}
let history = { stack: [], index: -1 };

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  // Never allow legacy browser drafts to override published content.
  try {
    ['jhalar_editor_settings','jhalar_editor_theme','jhalar_editor_products','jhalar_editor_sections','jhalar_editor_customcss']
      .forEach(k => localStorage.removeItem(k));
  } catch(e) { console.warn('Legacy draft cleanup failed', e); }
  setupTabs(); setupViewport(); setupAutoSave(); setupInspector(); setupKeyboardShortcuts(); setupDragDrop();
  setupUploadZone(); restoreDarkMode(); restoreGitHubToken();
  await loadPublishedData(); await loadImageManifest(); await loadFontManifest();
  populateFontOptions(); populateAllForms(); renderSectionList(); renderProductList(); renderMediaGrid();
  applyPreview(); updatePreviewUrl(); pushHistory();
  window.addEventListener('load', applyZoom);
  window.addEventListener('resize', () => { clearTimeout(window.__zr); window.__zr = setTimeout(applyZoom, 150); });
});

// ===== TABS =====
function setupTabs() {
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      const p = document.getElementById('panel-'+tab.dataset.tab); if (p) p.classList.add('active');
    });
  });
}
function openPublishTab() { document.querySelector('.sidebar-tab[data-tab="publish"]').click(); }

// ===== VIEWPORT =====
function setupViewport() {}
function setViewport(m) {
  state.viewport = m;
  document.querySelectorAll('.vp-btn').forEach(b => b.classList.toggle('active', b.dataset.vp === m));
  const f = document.getElementById('preview-frame');
  f.className = m;
  f.style.width = ''; f.style.height = ''; f.style.transform = '';
  const box = document.getElementById('zoom-box');
  if (box) { box.style.width = ''; box.style.height = ''; }
  applyZoom();
}
function setZoom(z) { state.zoom = z; applyZoom(); }
function applyZoom() {
  const f = document.getElementById('preview-frame'); const box = document.getElementById('zoom-box');
  if (!f || !box) return;
  const z = state.zoom || 1;
  const sizes={desktop:[1160,Math.max(700,window.innerHeight-122)],tablet:[768,1024],mobile:[375,812]};
  const [w,h]=sizes[state.viewport||'desktop'];
  f.style.width=w+'px';f.style.height=h+'px';
  f.style.transform='scale('+z+')';
  box.style.width=(w*z)+'px';box.style.height=(h*z)+'px';
}

// ===== DARK MODE =====
function restoreDarkMode() {
  try { state.darkMode = localStorage.getItem('jhalar_editor_dark') === 'true'; } catch(e) {}
  if (state.darkMode) { document.documentElement.classList.add('dark'); document.getElementById('dark-mode-btn').classList.add('active'); }
}
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.documentElement.classList.toggle('dark', state.darkMode);
  document.getElementById('dark-mode-btn').classList.toggle('active', state.darkMode);
  try { localStorage.setItem('jhalar_editor_dark', String(state.darkMode)); } catch(e) {}
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); publishToGitHub(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); previewChanges(); }
  });
}

// ===== LOAD DATA =====
async function loadPublishedData() {
  try {
    // Fresh published state is the source of truth on every editor open.
    // Draft storage is retained only for explicit in-session recovery, never silently loaded as published data.
    const ds = null, dt = null, dp = null, dsec = null, dcss = null;

    const [sr,tr,pr,secr,ccr,nr] = await Promise.all([
      fetch('content/site-settings.json?_build='+Date.now(), {cache:'no-store'}), fetch('content/theme.json?_build='+Date.now(), {cache:'no-store'}),
      fetch('content/products.json?_build='+Date.now(), {cache:'no-store'}), fetch('content/sections.json?_build='+Date.now(), {cache:'no-store'}),
      fetch('content/custom-css.json?_build='+Date.now(), {cache:'no-store'}), fetch('content/product-naming.json?_build='+Date.now(), {cache:'no-store'})
    ]);

    const ps = sr.ok ? await sr.json() : {};
    const pt = tr.ok ? await tr.json() : {};
    const pp = pr.ok ? await pr.json() : {products:[]};
    const psec = secr.ok ? await secr.json() : {sections:{},order:[]};
    const pcc = ccr.ok ? await ccr.json() : {css:''};
    state.namingRegistry = nr.ok ? await nr.json() : null;

    state.settings = ds ? JSON.parse(ds) : ps;
    state.theme = deepMerge(defaultThemeTemplate(), dt ? JSON.parse(dt) : pt);
    state.theme = deepMerge(defaultThemeTemplate(), state.theme);
    state.products = dp ? JSON.parse(dp) : (pp.products||[]);
    if (dsec) {
      const ds = JSON.parse(dsec);
      state.sections = ds.sections || ds;
      state.sectionOrder = ds.order || psec.order || [];
    } else {
      state.sections = psec.sections || {};
      state.sectionOrder = psec.order || [];
    }
    state.customCSS = dcss ? dcss : (pcc.css||'');
    state.navItems = state.settings.navItems||[];
    state.footerNavItems = state.settings.footerNavItems||[];
    state.socialLinks = state.settings.socialLinks||{};
    state.sectionCopy = deepMerge(defaultSectionCopy(), state.settings.sectionCopy||{});
    state.settings.navItems = state.navItems;
    state.settings.footerNavItems = state.footerNavItems;
    state.settings.socialLinks = state.socialLinks;
    state.settings.sectionCopy = state.sectionCopy;
    state.heroHighlights = state.settings.heroHighlights||[];
    state.trustItems = state.settings.trustItems||[];
    state.faqItems = state.settings.faqItems||[
      {q:'Do you show prices on the website?',a:'No. The website is a catalogue, so prices are shared on enquiry. Message us on WhatsApp with the design name or catalogue reference and we will send you a quote.'},
      {q:'What quantities do you take?',a:'From a few dozen to several thousand pieces per design. Tell us the design and the quantity and we will confirm.'},
      {q:'Can you match a specific colour?',a:'Yes. Share a reference photo or your palette and we will match it in the sample.'},
      {q:'Do you deliver outside West Bengal?',a:'Yes, we dispatch across India. Tell us where it needs to reach and we will confirm the arrangements.'},
      {q:'How long does an order take?',a:'It depends on the design and the quantity. Share the date you need it by and we will confirm whether we can meet it.'},
      {q:'How do I enquire about a design?',a:'Open the product and use its Enquire on WhatsApp button, or use the enquiry form below. Include the catalogue reference so we know exactly which design you mean.'}
    ];

    ensureProductIds();
    if (ds||dt||dp||dsec||dcss) { state.changed = true; updateSaveIndicator(); }
  } catch(e) { console.error('Load failed:', e); showToast('Failed to load site data.','error'); }
}

function ensureProductIds() {
  let m = 0; state.products.forEach(p => { if (p.id && p.id > m) m = p.id; });
  state.products.forEach(p => { if (!p.id) p.id = ++m; });
}

// ===== FONT MANIFEST =====
async function loadFontManifest() {
  try {
    const r = await fetch('assets/fonts/manifest.json?_build='+Date.now(), {cache:'no-store'});
    state.fontManifest = r.ok ? (await r.json()).fonts||[] : [];
  } catch(e) { console.warn('Font manifest:', e); state.fontManifest = []; }
}

function isFontFile(file) {
  const ext = (file.name.split('.').pop()||'').toLowerCase();
  return ['ttf','otf','woff','woff2'].includes(ext) ||
         /font\//.test(file.type);
}
function fontFormat(ext) {
  if (ext === 'woff2') return 'woff2';
  if (ext === 'woff') return 'woff';
  if (ext === 'otf') return 'opentype';
  return 'truetype';
}
function familyFromFilename(name) {
  let stem = name.replace(/\.(ttf|otf|woff2?)$/i,'');
  stem = stem.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
  return stem.replace(/\b\w/g, c => c.toUpperCase());
}
function populateFontOptions() {
  const extra = state.fontManifest.map(f => ({
    family: f.family,
    heading: `'${f.family}', Georgia, 'Times New Roman', serif`,
    body: `'${f.family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  }));
  const headSel = document.getElementById('ed-font-heading');
  const bodySel = document.getElementById('ed-font-body');
  if (!headSel || !bodySel) return;
  const curH = headSel.value, curB = bodySel.value;
  extra.forEach(f => {
    if (![...headSel.options].some(o => o.value === f.heading))
      headSel.add(new Option(`${f.family} (self-hosted)`, f.heading));
    if (![...bodySel.options].some(o => o.value === f.body))
      bodySel.add(new Option(`${f.family} (self-hosted)`, f.body));
  });
  if (state.theme?.fonts?.heading) headSel.value = state.theme.fonts.heading;
  else if (curH) headSel.value = curH;
  if (state.theme?.fonts?.body) bodySel.value = state.theme.fonts.body;
  else if (curB) bodySel.value = curB;
}

// ===== IMAGE MANIFEST =====
async function loadImageManifest() {
  const fallback = () => [...new Set([
    'assets/images/about-collage.jpg', 'assets/images/custom-orders.jpg',
    'assets/images/hero-jhalar.jpg', 'assets/images/og-cover.jpg',
    ...state.products.map(p => p.image).filter(Boolean)
  ])];
  try {
    const r = await fetch('assets/images/manifest.json?_build='+Date.now(), {cache:'no-store'});
    const data = r.ok ? await r.json() : null;
    state.imageManifest = Array.isArray(data?.images) ? data.images : fallback();
  } catch(e) { console.warn('Manifest:', e); state.imageManifest = fallback(); }
  populateImageDropdowns();
}

function populateImageDropdowns() {
  const opts = state.imageManifest.map(p => `<option value="${p}">${p.split('/').pop()}</option>`).join('');
  ['ed-prod-image','ed-hero-image','ed-seo-ogimage','ed-custom-image','ed-about-image'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opts; });
}

// ===== POPULATE ALL FORMS =====
function populateAllForms() {
  if (!state.settings) return;
  setVal('ed-whatsapp', state.settings.whatsapp||'');
  setVal('ed-phone', state.settings.phone||'');
  setVal('ed-email', state.settings.email||'');
  setVal('ed-location', state.settings.location||'');
  setVal('ed-gst', state.settings.gst||'');
  setVal('ed-hero-headline', state.settings.heroHeadline||'');
  setVal('ed-hero-intro', state.settings.heroIntro||'');
  setVal('ed-hero-image', state.settings.heroImage||'assets/images/hero-jhalar.webp');
  updateHeroImagePreview(state.settings.heroImage||'assets/images/hero-jhalar.webp');
  const sc = state.sectionCopy || defaultSectionCopy();
  state.sectionCopy = deepMerge(defaultSectionCopy(), sc);
  setVal('ed-hero-primary-label', state.sectionCopy?.heroPrimary?.label||'');
  setVal('ed-hero-primary-href', state.sectionCopy?.heroPrimary?.href||'');
  setVal('ed-hero-secondary-label', state.sectionCopy?.heroSecondary?.label||'');
  setVal('ed-hero-secondary-href', state.sectionCopy?.heroSecondary?.href||'');
  setVal('ed-collection-label', state.sectionCopy?.collection?.label||'');
  setVal('ed-collection-title', state.sectionCopy?.collection?.title||'');
  setVal('ed-collection-intro', state.sectionCopy?.collection?.intro||'');
  setVal('ed-collection-note', state.sectionCopy?.collection?.note||'');
  setVal('ed-custom-label', state.sectionCopy?.customOrders?.label||'');
  setVal('ed-custom-title', state.sectionCopy?.customOrders?.title||'');
  setVal('ed-custom-intro', state.sectionCopy?.customOrders?.intro||'');
  setVal('ed-custom-image', state.sectionCopy?.customOrders?.image||'assets/images/custom-orders.jpg');
  updateSectionImagePreview('custom', state.sectionCopy?.customOrders?.image||'assets/images/custom-orders.jpg');
  setVal('ed-process-label', state.sectionCopy?.customOrders?.processLabel||'');
  setVal('ed-about-label', state.sectionCopy?.about?.label||'');
  setVal('ed-about-title', state.sectionCopy?.about?.title||'');
  setVal('ed-about-intro', state.sectionCopy?.about?.intro||'');
  setVal('ed-about-image', state.sectionCopy?.about?.image||'assets/images/about-collage.jpg');
  updateSectionImagePreview('about', state.sectionCopy?.about?.image||'assets/images/about-collage.jpg');
  setVal('ed-faq-label', state.sectionCopy?.faq?.label||'');
  setVal('ed-faq-title', state.sectionCopy?.faq?.title||'');
  setVal('ed-contact-label', state.sectionCopy?.contact?.label||'');
  setVal('ed-contact-title', state.sectionCopy?.contact?.title||'');
  setVal('ed-contact-intro', state.sectionCopy?.contact?.intro||'');
  setVal('ed-contact-submit-label', state.sectionCopy?.contact?.submitLabel||'Message on WhatsApp');
  setVal('ed-footer-tagline', state.sectionCopy?.footerTagline||'');
  setVal('ed-social-instagram', state.socialLinks.instagram?.url||'');
  setVal('ed-social-facebook', state.socialLinks.facebook?.url||'');
  setVal('ed-social-whatsapp', state.socialLinks.whatsapp?.url||'');
  setVal('ed-seo-title', state.settings.siteTitle||'');
  setVal('ed-seo-desc', state.settings.siteDescription||'');
  setVal('ed-seo-ogimage', state.settings.ogImage||'assets/images/og-cover.jpg');
  setVal('ed-custom-css', state.customCSS||'');
  setVal('ed-layout-fs-base', state.theme?.layout?.baseFontSize || '16px');
  setVal('ed-layout-section-y', parseInt(state.theme?.layout?.sectionY || '64px', 10) || 64);
  setVal('ed-layout-radius', parseInt(state.theme?.layout?.cardRadius || '20px', 10) || 20);
  setVal('ed-layout-container', parseInt(state.theme?.layout?.containerWidth || '1140px', 10) || 1140);
  const sy = getVal('ed-layout-section-y'), rl = getVal('ed-layout-radius'), ct = getVal('ed-layout-container');
  const h1 = document.getElementById('help-section-y'); if (h1) h1.textContent = sy;
  const h2 = document.getElementById('help-radius'); if (h2) h2.textContent = rl;
  const h3 = document.getElementById('help-container'); if (h3) h3.textContent = ct;
  renderNavEditor();
  renderFooterNavEditor();
  renderHighlightEditor();
  renderTrustEditor();
  renderFaqEditor();
  if (state.theme) {
    if (state.theme.colors) {
      const c = state.theme.colors;
      setVal('ed-color-red', c['--brand-primary']||'#6B2136');
      setVal('ed-color-red-dark', c['--brand-primary-dark']||'#42101F');
      setVal('ed-color-red-light', c['--brand-primary-light']||'#C8909A');
      setVal('ed-color-gold', c['--brand-accent']||'#B48A52');
      setVal('ed-color-navy', c['--brand-navy']||'#2F1E25');
      setVal('ed-color-cream', c['--brand-cream']||'#F4EEE4');
      setVal('ed-color-bg', c['--brand-background']||'#FCFAF5');
      setVal('ed-color-alt', c['--brand-alt-background']||'#ECE1D1');
      setVal('ed-color-text', c['--brand-text']||'#2F1E25');
      setVal('ed-color-muted', c['--brand-muted']||'#7D6C72');
      setVal('ed-color-heading', c['--brand-heading']||'#2F1E25');
      setVal('ed-color-border', c['--brand-border']||'#E6DACB');
      setVal('ed-color-header', c['--brand-header-background']||'#FCFAF5');
      setVal('ed-color-footer-bg', c['--brand-footer-background']||'#2C1220');
      setVal('ed-color-footer-text', c['--brand-footer-text']||'#FCFAF5');
    }
    if (state.theme.fonts) {
      setVal('ed-font-heading', state.theme.fonts.heading||'Mogranx, Arial, sans-serif');
      setVal('ed-font-body', state.theme.fonts.body||'Mogranx, Arial, sans-serif');
    }
    const l = state.theme.layout || {};
    setVal('ed-layout-header-h', parseInt(l.headerHeight||'72px',10)||72);
    setVal('ed-layout-product-cols', String(l.productColumns||'3'));
    const brRaw = parseInt(l.buttonRadius||'9999px',10);
    setVal('ed-layout-button-radius', l.buttonRadius === '9999px' || !Number.isFinite(brRaw) ? 40 : brRaw);
    setVal('ed-layout-shadow', Number(l.shadowIntensity??'0.12'));
    setVal('ed-layout-reveal', l.revealAnimation === false ? 'false' : 'true');
    // Typography
    setVal('ed-font-heading-weight', String(l.headingWeight||'600'));
    setVal('ed-font-heading-tracking', l.headingTracking||'-0.01em');
    setVal('ed-font-heading-leading', String(l.headingLeading||'1.18'));
    setVal('ed-font-body-weight', String(l.bodyWeight||'400'));
    setVal('ed-font-body-tracking', l.bodyTracking||'0');
    setVal('ed-font-body-leading', String(l.bodyLeading||'1.7'));
    // Rows / columns / inner spacing
    setVal('ed-layout-hero-cols', l.heroColumns==='stack'?'stack':'split');
    setVal('ed-layout-split', l.splitLayout==='stack'?'stack':'split');
    setVal('ed-layout-about', l.aboutLayout==='stack'?'stack':'split');
    setVal('ed-layout-trust', l.trustLayout||'auto');
    setVal('ed-layout-process-cols', String(l.processColumns||'3'));
    setVal('ed-layout-contact', l.contactLayout==='stack'?'stack':'split');
    setVal('ed-layout-faq-width', l.faqWidth||'740px');
    setVal('ed-layout-footer-cols', String(l.footerColumns||'4'));
    setVal('ed-layout-section-align', l.sectionAlign||'center');
    setVal('ed-layout-card-pad', parseInt(l.cardPad||'24px',10)||24);
    setVal('ed-layout-grid-gap', parseInt(l.gridGap||'24px',10)||24);
    setVal('ed-layout-section-gap', parseInt(l.sectionHeaderGap||'48px',10)||48);
    const fluidTitle = (v, fallback) => (v && v !== 'fluid') ? parseInt(v,10) : null;
    const tsz = fluidTitle(l.titleSize), hsz = fluidTitle(l.heroTitleSize), csz = fluidTitle(l.cardTitleSize);
    setVal('ed-layout-title-size', tsz || 38);
    setVal('ed-layout-hero-title-size', hsz || 52);
    setVal('ed-layout-card-title-size', csz || 22);
    setVal('ed-layout-product-gap', parseInt(l.productGap||'24px',10)||24);
    setVal('ed-layout-split-gap', parseInt(l.splitGap||'48px',10)||48);
    setVal('ed-layout-process-gap', parseInt(l.processGap||'24px',10)||24);
    setVal('ed-layout-contact-gap', parseInt(l.contactGap||'24px',10)||24);
    setVal('ed-layout-faq-gap', parseInt(l.faqGap||'12px',10)||12);
    setVal('ed-layout-trust-gap', parseInt(l.trustGap||'12px',10)||12);
    setVal('ed-layout-footer-gap', parseInt(l.footerGap||'48px',10)||48);
    setVal('ed-layout-product-pad', parseInt(l.productPad||'24px',10)||24);
    setVal('ed-layout-faq-pad', parseInt(l.faqPad||'20px',10)||20);
    setVal('ed-layout-footer-pad', parseInt(l.footerPad||'80px',10)||80);
    setVal('ed-layout-trust-pad', parseInt(l.trustPad||'16px',10)||16);
    const hh = document.getElementById('help-header-h'); if (hh) hh.textContent = getVal('ed-layout-header-h');
    const br2 = document.getElementById('help-button-radius'); if (br2) br2.textContent = getVal('ed-layout-button-radius') === '40' ? '40px (pill-like)' : getVal('ed-layout-button-radius')+'px';
    const sh = document.getElementById('help-shadow'); if (sh) sh.textContent = getVal('ed-layout-shadow');
    const cp = document.getElementById('help-card-pad'); if (cp) cp.textContent = getVal('ed-layout-card-pad');
    const gg = document.getElementById('help-grid-gap'); if (gg) gg.textContent = getVal('ed-layout-grid-gap');
    const sg = document.getElementById('help-section-gap'); if (sg) sg.textContent = getVal('ed-layout-section-gap');
    const ts = document.getElementById('help-title-size'); if (ts) ts.textContent = tsz ? tsz+'px' : 'Auto (responsive)';
    const hs = document.getElementById('help-hero-title-size'); if (hs) hs.textContent = hsz ? hsz+'px' : 'Auto (responsive)';
    const cts = document.getElementById('help-card-title-size'); if (cts) cts.textContent = csz ? csz+'px' : 'Auto (responsive)';
    const pg = document.getElementById('help-product-gap'); if (pg) pg.textContent = getVal('ed-layout-product-gap');
    const sgl = document.getElementById('help-split-gap'); if (sgl) sgl.textContent = getVal('ed-layout-split-gap');
    const prg = document.getElementById('help-process-gap'); if (prg) prg.textContent = getVal('ed-layout-process-gap');
    const cg = document.getElementById('help-contact-gap'); if (cg) cg.textContent = getVal('ed-layout-contact-gap');
    const fg2 = document.getElementById('help-faq-gap'); if (fg2) fg2.textContent = getVal('ed-layout-faq-gap');
    const tg = document.getElementById('help-trust-gap'); if (tg) tg.textContent = getVal('ed-layout-trust-gap');
    const ftg = document.getElementById('help-footer-gap'); if (ftg) ftg.textContent = getVal('ed-layout-footer-gap');
    const pp = document.getElementById('help-product-pad'); if (pp) pp.textContent = getVal('ed-layout-product-pad');
    const fp = document.getElementById('help-faq-pad'); if (fp) fp.textContent = getVal('ed-layout-faq-pad');
    const ftp = document.getElementById('help-footer-pad'); if (ftp) ftp.textContent = getVal('ed-layout-footer-pad');
    const tp = document.getElementById('help-trust-pad'); if (tp) tp.textContent = getVal('ed-layout-trust-pad');
  }

  renderProcessEditor();
  renderValueEditor();
}

// ===== NAV EDITOR =====
function renderNavEditor() {
  const c = document.getElementById('nav-editor'); if (!c) return;
  c.innerHTML = state.navItems.map((n,i) => `
    <div class="nav-item-row" data-index="${i}">
      <span style="cursor:grab;color:var(--text3);font-size:12px"><i class="fas fa-grip-vertical"></i></span>
      <input type="text" class="nav-label" value="${escapeHtml(n.label)}" placeholder="Label">
      <input type="text" class="nav-href" value="${escapeHtml(n.href)}" placeholder="#section">
      <button class="del" onclick="removeNavItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.nav-label').forEach((inp,i) => inp.addEventListener('input', () => { state.navItems[i].label = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
  c.querySelectorAll('.nav-href').forEach((inp,i) => inp.addEventListener('input', () => { state.navItems[i].href = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addNavItem() { state.navItems.push({label:'New Link',href:'#'}); renderNavEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeNavItem(i) { state.navItems.splice(i,1); renderNavEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== FOOTER NAV EDITOR =====
function renderFooterNavEditor() {
  const c = document.getElementById('footer-nav-editor'); if (!c) return;
  c.innerHTML = state.footerNavItems.map((n,i) => `
    <div class="nav-item-row" data-index="${i}">
      <span style="cursor:grab;color:var(--text3);font-size:12px"><i class="fas fa-grip-vertical"></i></span>
      <input type="text" class="fnav-label" value="${escapeHtml(n.label)}" placeholder="Label">
      <input type="text" class="fnav-href" value="${escapeHtml(n.href)}" placeholder="#section">
      <button class="del" onclick="removeFooterNavItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.fnav-label').forEach((inp,i) => inp.addEventListener('input', () => { state.footerNavItems[i].label = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
  c.querySelectorAll('.fnav-href').forEach((inp,i) => inp.addEventListener('input', () => { state.footerNavItems[i].href = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addFooterNavItem() { state.footerNavItems.push({label:'New Link',href:'#'}); renderFooterNavEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeFooterNavItem(i) { state.footerNavItems.splice(i,1); renderFooterNavEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== ICON OPTIONS =====
const ICON_OPTIONS = ['icon-mfr','icon-palette','icon-bulk','icon-check','icon-clock','icon-design','icon-ruler','icon-chart','icon-route','icon-phone','icon-email','icon-location','icon-invoice'];
function iconOptionsHtml(sel) {
  return ICON_OPTIONS.map(ic => `<option value="${ic}" ${sel===ic?'selected':''}>${ic.replace('icon-','')}</option>`).join('');
}
function svgSlot(icon, w) {
  return `<svg class="icon" width="${w||16}" height="${w||16}" aria-hidden="true"><use href="assets/icons.svg#${icon||'icon-check'}"/></svg>`;
}
function bindIconPreview(sel) {
  sel.addEventListener('change', () => {
    const row = sel.closest('.icon-row');
    const pre = row && row.querySelector('.icon-preview');
    if (pre) pre.innerHTML = svgSlot(sel.value,16);
  });
}

// ===== HIGHLIGHT EDITOR =====
function renderHighlightEditor() {
  const c = document.getElementById('highlight-editor'); if (!c) return;
  c.innerHTML = state.heroHighlights.map((h,i) => `
    <div class="icon-row" data-index="${i}">
      <span class="icon-preview">${svgSlot(h.icon,16)}</span>
      <select class="hl-icon">${iconOptionsHtml(h.icon)}</select>
      <input type="text" class="hl-text" value="${escapeHtml(h.text)}" placeholder="Highlight text">
      <button class="del" onclick="removeHighlight(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.hl-icon').forEach((sel,i) => {
    bindIconPreview(sel);
    sel.addEventListener('change', () => { state.heroHighlights[i].icon = sel.value; markChanged(); saveDrafts(); applyPreview(); });
  });
  c.querySelectorAll('.hl-text').forEach((inp,i) => inp.addEventListener('input', () => { state.heroHighlights[i].text = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addHighlight() { state.heroHighlights.push({text:'New highlight',icon:'icon-check'}); renderHighlightEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeHighlight(i) { state.heroHighlights.splice(i,1); renderHighlightEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== TRUST EDITOR =====
function renderTrustEditor() {
  const c = document.getElementById('trust-editor'); if (!c) return;
  c.innerHTML = state.trustItems.map((t,i) => `
    <div class="icon-row" data-index="${i}">
      <span class="icon-preview">${svgSlot(t.icon,16)}</span>
      <select class="tr-icon">${iconOptionsHtml(t.icon)}</select>
      <input type="text" class="tr-label" value="${escapeHtml(t.label)}" placeholder="Label">
      <button class="del" onclick="removeTrustItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.tr-icon').forEach((sel,i) => {
    bindIconPreview(sel);
    sel.addEventListener('change', () => { state.trustItems[i].icon = sel.value; markChanged(); saveDrafts(); applyPreview(); });
  });
  c.querySelectorAll('.tr-label').forEach((inp,i) => inp.addEventListener('input', () => { state.trustItems[i].label = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addTrustItem() { state.trustItems.push({label:'New item',icon:'icon-check'}); renderTrustEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeTrustItem(i) { state.trustItems.splice(i,1); renderTrustEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== FEATURE / CHIP / PROCESS / VALUE EDITORS =====
function ensureSectionCopy() {
  if (!state.sectionCopy) state.sectionCopy = defaultSectionCopy();
  state.sectionCopy = deepMerge(defaultSectionCopy(), state.sectionCopy);
  if (!state.sectionCopy.customOrders) state.sectionCopy.customOrders = {chips:[],steps:[]};
  if (!Array.isArray(state.sectionCopy.customOrders.chips)) state.sectionCopy.customOrders.chips = [];
  if (!Array.isArray(state.sectionCopy.customOrders.steps)) state.sectionCopy.customOrders.steps = [];
  if (!state.sectionCopy.about) state.sectionCopy.about = {values:[]};
  if (!Array.isArray(state.sectionCopy.about.values)) state.sectionCopy.about.values = [];
}
function renderChipEditor() {
  ensureSectionCopy();
  const c = document.getElementById('chip-editor'); if (!c) return;
  c.innerHTML = state.sectionCopy.customOrders.chips.map((x,i) => `
    <div class="icon-row" data-index="${i}">
      <span class="icon-preview">${svgSlot(x.icon,16)}</span>
      <select class="chip-icon">${iconOptionsHtml(x.icon)}</select>
      <input type="text" class="chip-text" value="${escapeHtml(x.text)}" placeholder="Chip label">
      <button class="del" onclick="removeChipItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.chip-icon').forEach((sel,i) => { bindIconPreview(sel); sel.addEventListener('change', () => { state.sectionCopy.customOrders.chips[i].icon = sel.value; markChanged(); saveDrafts(); applyPreview(); }); });
  c.querySelectorAll('.chip-text').forEach((inp,i) => inp.addEventListener('input', () => { state.sectionCopy.customOrders.chips[i].text = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addChipItem() { ensureSectionCopy(); state.sectionCopy.customOrders.chips.push({icon:'icon-check',text:'New chip'}); renderChipEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeChipItem(i) { state.sectionCopy.customOrders.chips.splice(i,1); renderChipEditor(); markChanged(); saveDrafts(); applyPreview(); }

function renderProcessEditor() {
  ensureSectionCopy();
  const c = document.getElementById('process-editor'); if (!c) return;
  c.innerHTML = state.sectionCopy.customOrders.steps.map((x,i) => `
    <div class="icon-row" style="align-items:flex-start" data-index="${i}">
      <span class="icon-preview" style="font-weight:800;font-family:var(--mono);color:var(--navy)">${String(i+1).padStart(2,'0')}</span>
      <input type="text" class="proc-title" value="${escapeHtml(x.title)}" placeholder="Step title">
      <input type="text" class="proc-text" value="${escapeHtml(x.text)}" placeholder="Step description">
      <button class="del" onclick="removeProcessItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.proc-title').forEach((inp,i) => inp.addEventListener('input', () => { state.sectionCopy.customOrders.steps[i].title = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
  c.querySelectorAll('.proc-text').forEach((inp,i) => inp.addEventListener('input', () => { state.sectionCopy.customOrders.steps[i].text = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addProcessItem() { ensureSectionCopy(); state.sectionCopy.customOrders.steps.push({title:'New step',text:'Describe the step.'}); renderProcessEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeProcessItem(i) { state.sectionCopy.customOrders.steps.splice(i,1); renderProcessEditor(); markChanged(); saveDrafts(); applyPreview(); }

function renderValueEditor() {
  ensureSectionCopy();
  const c = document.getElementById('value-editor'); if (!c) return;
  c.innerHTML = state.sectionCopy.about.values.map((x,i) => `
    <div class="icon-row" data-index="${i}">
      <span class="icon-preview">${svgSlot(x.icon,16)}</span>
      <select class="val-icon">${iconOptionsHtml(x.icon)}</select>
      <input type="text" class="val-text" value="${escapeHtml(x.text)}" placeholder="Value / benefit">
      <button class="del" onclick="removeValueItem(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('');
  c.querySelectorAll('.val-icon').forEach((sel,i) => { bindIconPreview(sel); sel.addEventListener('change', () => { state.sectionCopy.about.values[i].icon = sel.value; markChanged(); saveDrafts(); applyPreview(); }); });
  c.querySelectorAll('.val-text').forEach((inp,i) => inp.addEventListener('input', () => { state.sectionCopy.about.values[i].text = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addValueItem() { ensureSectionCopy(); state.sectionCopy.about.values.push({icon:'icon-check',text:'New value'}); renderValueEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeValueItem(i) { state.sectionCopy.about.values.splice(i,1); renderValueEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== FAQ EDITOR =====
function renderFaqEditor() {
  const c = document.getElementById('faq-editor'); if (!c) return;
  c.innerHTML = state.faqItems.map((f,i) => `
    <div class="faq-row" style="border:1px solid rgba(128,128,128,0.15);border-radius:var(--r-sm);padding:8px;margin-bottom:6px">
      <div class="form-group" style="margin-bottom:4px"><label>Question</label><input type="text" class="faq-q" value="${escapeHtml(f.q)}"></div>
      <div class="form-group" style="margin-bottom:4px"><label>Answer</label><textarea class="faq-a" rows="2">${escapeHtml(f.a)}</textarea></div>
      <button class="btn-sm danger" onclick="removeFaqItem(${i})" style="width:100%;justify-content:center"><i class="fas fa-trash"></i> Remove</button>
    </div>
  `).join('');
  c.querySelectorAll('.faq-q').forEach((inp,i) => inp.addEventListener('input', () => { state.faqItems[i].q = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
  c.querySelectorAll('.faq-a').forEach((inp,i) => inp.addEventListener('input', () => { state.faqItems[i].a = inp.value; markChanged(); saveDrafts(); applyPreview(); }));
}
function addFaqItem() { state.faqItems.push({q:'New question?',a:'Answer text.'}); renderFaqEditor(); markChanged(); saveDrafts(); applyPreview(); }
function removeFaqItem(i) { state.faqItems.splice(i,1); renderFaqEditor(); markChanged(); saveDrafts(); applyPreview(); }

// ===== SECTION LIST =====
function renderSectionList() {
  const c = document.getElementById('section-list'); if (!c) return;
  if (!state.sectionOrder.length) { c.innerHTML = '<p style="color:var(--text3);font-size:12px;text-align:center;padding:16px;">No sections configured.</p>'; return; }
  c.innerHTML = state.sectionOrder.map((key,i) => {
    const s = state.sections[key]; if (!s) return '';
    const v = s.visible !== false;
    return `<div class="section-item" draggable="true" data-key="${key}" data-index="${i}">
      <button class="toggle ${v?'active':''}" onclick="toggleSection('${key}')"></button>
      <div class="info"><div class="name">${escapeHtml(s.label||key)}</div><div class="status">${v?'Visible':'Hidden'} | ${key}</div></div>
      <div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>
    </div>`;
  }).join('');
}
function toggleSection(key) {
  if (!state.sections[key]) return;
  state.sections[key].visible = state.sections[key].visible === false;
  renderSectionList(); markChanged(); saveDrafts(); applyPreview();
  showToast(`${state.sections[key].label||key} ${state.sections[key].visible?'visible':'hidden'}`, 'success');
}

// ===== DRAG & DROP =====
function setupDragDrop() {
  let dragSrc = null;
  document.addEventListener('dragstart', e => {
    const item = e.target.closest('.section-item');
    if (!item) return;
    dragSrc = item.dataset.key;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragend', e => {
    document.querySelectorAll('.section-item').forEach(el => el.classList.remove('dragging','drag-over'));
  });
  document.addEventListener('dragover', e => {
    const item = e.target.closest('.section-item');
    if (!item || item.dataset.key === dragSrc) return;
    e.preventDefault();
    document.querySelectorAll('.section-item').forEach(el => el.classList.remove('drag-over'));
    item.classList.add('drag-over');
  });
  document.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.section-item');
    if (!target || !dragSrc || target.dataset.key === dragSrc) return;
    const from = state.sectionOrder.indexOf(dragSrc);
    const to = state.sectionOrder.indexOf(target.dataset.key);
    if (from === -1 || to === -1) return;
    state.sectionOrder.splice(from, 1);
    state.sectionOrder.splice(to, 0, dragSrc);
    renderSectionList(); markChanged(); saveDrafts(); applyPreview();
    showToast('Section reordered', 'success');
  });
}

// ===== PRODUCT LIST =====
function renderProductList() {
  const c = document.getElementById('product-list'); if (!c) return;
  if (!state.products.length) { c.innerHTML = '<p style="color:var(--text3);font-size:12px;text-align:center;padding:16px;">No products. Click <strong>Add</strong> to create one.</p>'; return; }
  c.innerHTML = state.products.map((p,i) => `
    <div class="product-list-item ${state.selectedProductId===p.id?'active':''}" data-id="${p.id}" data-index="${i}">
      <img class="thumb" src="${escapeHtml(p.image||'assets/images/og-cover.jpg')}" alt="" onerror="this.src='assets/images/og-cover.jpg'">
      <div class="info"><div class="name">${escapeHtml(p.title||'Untitled')}</div><div class="cat">${escapeHtml(p.category||'Uncategorised')} · ${escapeHtml(window.JHALARNaming.productReference(p))}</div></div>
      <div class="actions">
        <button onclick="event.stopPropagation();moveProduct(${p.id},-1)" title="Up"><i class="fas fa-chevron-up"></i></button>
        <button onclick="event.stopPropagation();moveProduct(${p.id},1)" title="Down"><i class="fas fa-chevron-down"></i></button>
        <button class="del" onclick="event.stopPropagation();deleteProduct(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  c.querySelectorAll('.product-list-item').forEach(el => el.addEventListener('click', () => selectProduct(Number(el.dataset.id))));
  if (state.selectedProductId === null && state.products.length > 0) selectProduct(state.products[0].id);
}

function selectProduct(id) {
  state.selectedProductId = id;
  const p = state.products.find(x => x.id === id); if (!p) return;
  document.querySelectorAll('.product-list-item').forEach(el => el.classList.toggle('active', Number(el.dataset.id) === id));
  const ed = document.getElementById('product-editor'); ed.style.display = 'block';
  setVal('ed-prod-title', p.title||'');
  setVal('ed-prod-category', p.category||'');
  setVal('ed-prod-description', p.description||'');
  setVal('ed-prod-image', p.image||'assets/images/og-cover.jpg');
  setVal('ed-prod-image-alt', p.imageAlt||'');
  renderProdGallery();
  ['ed-prod-title','ed-prod-category','ed-prod-description','ed-prod-image','ed-prod-image-alt'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.removeEventListener('input', onProductChange); el.removeEventListener('change', onProductChange); el.addEventListener('input', onProductChange); el.addEventListener('change', onProductChange); }
  });
}
function onProductChange() {
  const p = state.products.find(x => x.id === state.selectedProductId); if (!p) return;
  p.title = getVal('ed-prod-title'); p.category = getVal('ed-prod-category');
  p.description = getVal('ed-prod-description'); p.image = getVal('ed-prod-image');
  const alt = getVal('ed-prod-image-alt').trim(); if (alt) p.imageAlt = alt; else delete p.imageAlt;
  renderProductList(); markChanged(); saveDrafts(); applyPreview();
}
function renderProdGallery() {
  const c = document.getElementById('prod-gallery'); if (!c) return;
  const p = state.products.find(x => x.id === state.selectedProductId);
  if (!p) { c.innerHTML = '<p class="gal-empty">Select a product first.</p>'; return; }
  if (!Array.isArray(p.gallery)) p.gallery = [];
  if (!p.gallery.length) { c.innerHTML = '<p class="gal-empty">No gallery images yet — add a few so the popup shows a full set of photos.</p>'; return; }
  c.innerHTML = p.gallery.map((g, i) =>
    '<div class="gal-item"><img src="' + escapeHtml(g) + '" alt="" loading="lazy">' +
    (i === 0 ? '<span class="gal-main">2nd on card</span>' : '') +
    '<button class="gal-del" title="Remove" onclick="removeGalleryImage(' + i + ')"><i class="fas fa-times"></i></button></div>'
  ).join('');
}
function removeGalleryImage(i) {
  const p = state.products.find(x => x.id === state.selectedProductId); if (!p) return;
  if (!Array.isArray(p.gallery)) p.gallery = [];
  p.gallery.splice(i, 1);
  renderProdGallery(); markChanged(); saveDrafts(); applyPreview();
  showToast('Gallery image removed', 'success');
}
function addGalleryImage(path) {
  if (!path) return;
  const p = state.products.find(x => x.id === state.selectedProductId);
  if (!p) { showToast('Select a product first', 'error'); return; }
  if (!Array.isArray(p.gallery)) p.gallery = [];
  if (p.gallery.includes(path) || path === p.image) { showToast('Already in this product', 'error'); return; }
  p.gallery.push(path);
  state.imagePickTarget = null;
  renderProdGallery(); markChanged(); saveDrafts(); applyPreview();
  showToast('Added to product gallery', 'success');
}
function addProduct() {
  const m = state.products.reduce((a,p) => Math.max(a,p.id||0),0);
  state.products.push({id:m+1,title:'New Product',category:'Custom Designs',description:'Describe this product...',image:'assets/images/og-cover.jpg',gallery:[]});
  renderProductList(); selectProduct(state.products[state.products.length-1].id); markChanged(); saveDrafts(); applyPreview();
  showToast('Product added','success');
}
function duplicateProduct() {
  const o = state.products.find(p => p.id === state.selectedProductId);
  if (!o) { showToast('Select a product first','error'); return; }
  const m = state.products.reduce((a,p) => Math.max(a,p.id||0),0);
  const c = JSON.parse(JSON.stringify(o)); c.id = m+1; c.title = o.title+' (Copy)';
  state.products.push(c); renderProductList(); selectProduct(c.id); markChanged(); saveDrafts(); applyPreview();
  showToast('Product duplicated','success');
}
function deleteProduct(id) {
  if (state.products.length <= 1) { showToast('Cannot delete the last product','error'); return; }
  const i = state.products.findIndex(p => p.id === id); if (i===-1) return;
  state.products.splice(i,1);
  if (state.selectedProductId === id) state.selectedProductId = state.products.length > 0 ? state.products[Math.min(i,state.products.length-1)].id : null;
  renderProductList(); if (state.selectedProductId === null) document.getElementById('product-editor').style.display = 'none';
  markChanged(); saveDrafts(); applyPreview(); showToast('Product deleted','success');
}
function moveProduct(id, d) {
  const i = state.products.findIndex(p => p.id === id); if (i===-1) return;
  const n = i + d; if (n < 0 || n >= state.products.length) return;
  [state.products[i], state.products[n]] = [state.products[n], state.products[i]];
  renderProductList(); markChanged(); saveDrafts(); applyPreview();
}
function exportProducts() { downloadFile(JSON.stringify({products:state.products},null,2),'products-export.json','application/json'); showToast('Products exported','success'); }
function importProducts(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.products && Array.isArray(data.products)) {
        state.products = data.products; ensureProductIds();
        renderProductList(); markChanged(); saveDrafts(); applyPreview();
        showToast(`Imported ${state.products.length} products`,'success');
      } else showToast('Invalid format','error');
    } catch(e) { showToast('Invalid JSON','error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ===== MEDIA =====
function updateHeroImagePreview(path) {
  const wrap=document.getElementById('hero-image-preview'), img=document.getElementById('hero-image-preview-img');
  if(!wrap||!img)return;
  if(path){img.src=path;wrap.classList.remove('is-empty');}else{img.removeAttribute('src');wrap.classList.add('is-empty');}
}
function setHeroImage(path) {
  if(!path)return;
  state.settings.heroImage=path;
  setVal('ed-hero-image',path);
  updateHeroImagePreview(path);
  state.imagePickTarget=null;
  markChanged();saveDrafts();applyPreview();
  showToast('Hero image selected','success');
}
function chooseHeroImage() { chooseImageFor('hero'); }
function uploadHeroImage() { uploadImageFor('hero'); }
const IMAGE_TARGET_NAMES = { hero:'hero banner', custom:'custom work', about:'our story', product:'product', 'product-gallery':'product gallery' };
function chooseImageFor(target) {
  state.imagePickTarget=target;
  const tab=document.querySelector('.sidebar-tab[data-tab="media"]');
  if(tab)tab.click();
  showToast('Choose an image below to use as the '+(IMAGE_TARGET_NAMES[target]||'section')+' image','success');
}
function uploadImageFor(target) {
  state.imagePickTarget=target;
  const input=document.getElementById('file-input');
  if(input)input.click();
}
function updateSectionImagePreview(which, path) {
  const wrap=document.getElementById(which+'-image-preview'), img=document.getElementById(which+'-image-preview-img');
  if(!wrap||!img)return;
  if(path){img.src=path;wrap.classList.remove('is-empty');}else{img.removeAttribute('src');wrap.classList.add('is-empty');}
}
function setSectionImage(which, path) {
  if(!path)return;
  ensureSectionCopy();
  if(which==='custom'){ state.sectionCopy.customOrders.image=path; setVal('ed-custom-image',path); updateSectionImagePreview('custom',path); }
  else if(which==='about'){ state.sectionCopy.about.image=path; setVal('ed-about-image',path); updateSectionImagePreview('about',path); }
  state.imagePickTarget=null;
  markChanged();saveDrafts();applyPreview();
  showToast((which==='custom'?'Custom work':'Our story')+' image updated','success');
}
function setProductImage(path) {
  if(!path)return;
  const p=state.products.find(x=>x.id===state.selectedProductId);
  if(!p){ showToast('Select a product first','error'); return; }
  p.image=path;
  setVal('ed-prod-image',path);
  const ed=document.getElementById('product-editor'); if(ed)ed.style.display='block';
  state.imagePickTarget=null;
  markChanged();saveDrafts();applyPreview();
  showToast('Product image updated','success');
}
function renderMediaGrid() {
  const c = document.getElementById('media-grid'); if (!c) return;
  c.innerHTML = state.imageManifest.map(p => {
    const fn = p.split('/').pop();
    const escapedP = p.replace(/'/g, "\\'");
    return `<div class="media-item" onclick="selectMedia('${escapedP}')" title="${fn}">
      <img src="${p}" alt="${fn}" loading="lazy" onerror="this.closest('.media-item').innerHTML='<span style=display:flex;align-items:center;justify-content:center;height:100%;color:gray;font-size:10px>Error</span>'">
      <button class="del-overlay" onclick="event.stopPropagation();deleteMedia('${escapedP}')"><i class="fas fa-times"></i></button>
    </div>`;
  }).join('');
}
function selectMedia(path) {
  document.querySelectorAll('.media-item').forEach(el => el.classList.toggle('active', el.querySelector('img')?.src?.includes(path)));
  const t=state.imagePickTarget;
  if(t==='hero'){ setHeroImage(path); const tab=document.querySelector('.sidebar-tab[data-tab="content"]'); if(tab)tab.click(); }
  else if(t==='custom'||t==='about'){ setSectionImage(t,path); const tab=document.querySelector('.sidebar-tab[data-tab="content"]'); if(tab)tab.click(); }
  else if(t==='product'){ setProductImage(path); const tab=document.querySelector('.sidebar-tab[data-tab="products"]'); if(tab)tab.click(); }
  else if(t==='product-gallery'){ addGalleryImage(path); const tab=document.querySelector('.sidebar-tab[data-tab="products"]'); if(tab)tab.click(); }
}
function triggerUpload() { document.getElementById('file-input').click(); }
function setupUploadZone() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--red)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; handleFiles(e.dataTransfer.files); });
}
async function handleUpload(e) { handleFiles(e.target.files); e.target.value = ''; }
// ===== GITHUB COMMIT HELPER (retries non-fast-forward races) =====
async function createCommitWithRetry(token, entries, message, onLog) {
  /* Use the Contents API instead of the Git Blob API.
     This works with fine-grained GitHub tokens that have Contents: Read/Write. */
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;
  const branch = GITHUB_BRANCH;
  const enc = new TextEncoder();

  for (const e of entries) {
    if (onLog) onLog(`Saving: ${e.path}...`, 'act');
    const url = `${baseUrl}/${e.path}`;
    let sha = null;
    const existing = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, {headers});
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    } else if (existing.status !== 404) {
      throw new Error(`Read error for ${e.path}: ${existing.status}`);
    }

    const base64 = e.base64 || btoa(String.fromCharCode(...enc.encode(e.content)));
    const body = {message, content: base64, branch};
    if (sha) body.sha = sha;

    const saved = await fetch(url, {method:'PUT', headers, body:JSON.stringify(body)});
    if (!saved.ok) {
      if (saved.status === 403) {
        throw new Error('GitHub rejected this save (403). This is an account/token permission issue, not a publishing-data error. For a fine-grained token: Repository access → jhalardecor/jhalar-hanging-decor, Repository permissions → Contents: Read and write. For a classic token: enable repo scope. Also ensure your GitHub account has write access and main is not blocking direct pushes.');
      }
      throw new Error(`Save error for ${e.path}: ${saved.status}`);
    }
    const result = await saved.json();
    if (onLog) onLog(`  ${e.path} [saved]`, 'done');
    if (result.commit?.sha) lastCommit = result.commit.sha;
  }
  return typeof lastCommit !== 'undefined' ? lastCommit : null;
}
async function handleFiles(files) {
  if (!files.length) return;
  const token = getVal('ed-github-token').trim();
  if (!token) { showToast('Set a GitHub token in the Publish tab to upload files','error'); return; }
  for (const file of files) {
    const isFont = isFontFile(file);
    const isImage = file.type.startsWith('image/');
    if (!isFont && !isImage) { showToast(`Skipped ${file.name} (not an image or font)`, 'error'); continue; }
    showToast(`Uploading ${file.name}...`, 'success');
    try {
      const base64 = await fileToBase64(file);
      const path = isFont ? `assets/fonts/${file.name}` : `assets/images/${file.name}`;
      // Uploads only count when the branch update actually succeeds (retries on 422)
      await createCommitWithRetry(token, [{path, base64: base64.split(',')[1]}], `Upload ${file.name} via editor`);
      if (isFont) {
        const ext = (file.name.split('.').pop()||'').toLowerCase();
        const family = familyFromFilename(file.name);
        const entry = { family, file: path, format: fontFormat(ext), weight: 400 };
        const newManifest = state.fontManifest.some(f => f.file === path) ? state.fontManifest.slice() : state.fontManifest.slice().concat(entry);
        const face = `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${entry.weight}; font-display: swap; src: url('${path}') format('${entry.format}'); }`;
        const newCSS = state.customCSS.includes(face) ? state.customCSS : (state.customCSS ? state.customCSS + '\n' : '') + face;
        // Commit manifest + custom CSS before mutating local state so a 422 never creates phantom entries.
        await createCommitWithRetry(token, [
          { path: 'assets/fonts/manifest.json', content: JSON.stringify({fonts:newManifest}, null, 2) },
          { path: 'content/custom-css.json', content: JSON.stringify({css:newCSS}, null, 2) }
        ], `Register font ${family} via editor`);
        if (!state.fontManifest.some(f => f.file === path)) state.fontManifest.push(entry);
        state.customCSS = newCSS;
        setVal('ed-custom-css', state.customCSS);
        populateFontOptions();
        markChanged(); saveDrafts(); applyPreview();
        showToast(`Font '${family}' uploaded - pick it in Theme -> Fonts`, 'success');
      } else {
        // Update image manifest only after the commit succeeds
        if (!state.imageManifest.includes(path)) {
          const next = [...state.imageManifest, path].sort();
          await createCommitWithRetry(token, [{ path:'assets/images/manifest.json', content: JSON.stringify({images:next},null,2) }], `Update image manifest via editor`);
          state.imageManifest = next;
        }
        if(state.imagePickTarget==='hero') setHeroImage(path);
        else if(state.imagePickTarget==='custom') setSectionImage('custom',path);
        else if(state.imagePickTarget==='about') setSectionImage('about',path);
        else if(state.imagePickTarget==='product') setProductImage(path);
        else if(state.imagePickTarget==='product-gallery') addGalleryImage(path);
        renderMediaGrid();
        populateImageDropdowns();
        showToast(`Uploaded ${file.name}`, 'success');
      }
    } catch(e) { showToast(`Upload failed: ${e.message}`, 'error'); }
  }
}

async function updateFontManifest(token) {
  await createCommitWithRetry(token, [{ path:'assets/fonts/manifest.json', content: JSON.stringify({fonts:state.fontManifest},null,2) }], 'Update font manifest via editor');
}
async function updateManifest(token) {
  await createCommitWithRetry(token, [{ path:'assets/images/manifest.json', content: JSON.stringify({images:state.imageManifest},null,2) }], 'Update image manifest via editor');
}
function deleteMedia(path) {
  if (!confirm(`Delete ${path.split('/').pop()}?`)) return;
  state.imageManifest = state.imageManifest.filter(p => p !== path);
  renderMediaGrid(); populateImageDropdowns();
  showToast('Image removed from manifest (not deleted from repo)','success');
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
  });
}

// ===== AUTO-SAVE =====
function setupAutoSave() {
  // Content fields
  ['ed-whatsapp','ed-phone','ed-email','ed-location','ed-gst',
   'ed-hero-headline','ed-hero-intro','ed-hero-image',
   'ed-hero-primary-label','ed-hero-primary-href','ed-hero-secondary-label','ed-hero-secondary-href',
   'ed-collection-label','ed-collection-title','ed-collection-intro','ed-collection-note',
   'ed-custom-label','ed-custom-title','ed-custom-intro','ed-custom-image','ed-process-label',
   'ed-about-label','ed-about-title','ed-about-intro','ed-about-image',
   'ed-faq-label','ed-faq-title','ed-contact-label','ed-contact-title','ed-contact-intro','ed-footer-tagline',
   'ed-social-instagram','ed-social-facebook','ed-social-whatsapp',
   'ed-seo-title','ed-seo-desc','ed-seo-ogimage'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', onChange); el.addEventListener('change', onChange); }
  });
  // Theme fields
  ['ed-color-red','ed-color-red-dark','ed-color-red-light','ed-color-gold','ed-color-navy','ed-color-cream',
   'ed-color-bg','ed-color-alt','ed-color-text','ed-color-muted','ed-color-heading','ed-color-border',
   'ed-color-header','ed-color-footer-bg','ed-color-footer-text'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', onChange);
  });
  ['ed-font-heading','ed-font-body'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', onChange);
  });
  // Typography selects
  ['ed-font-heading-weight','ed-font-heading-tracking','ed-font-heading-leading','ed-font-body-weight','ed-font-body-tracking','ed-font-body-leading'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', onChange);
  });
  // Layout selects
  ['ed-layout-fs-base','ed-layout-product-cols','ed-layout-reveal','ed-layout-hero-cols','ed-layout-split','ed-layout-about','ed-layout-trust','ed-layout-process-cols','ed-layout-contact','ed-layout-faq-width','ed-layout-footer-cols','ed-layout-section-align'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', onChange);
  });
  // Layout ranges
  ['ed-layout-section-y','ed-layout-radius','ed-layout-container','ed-layout-header-h','ed-layout-button-radius','ed-layout-shadow','ed-layout-card-pad','ed-layout-grid-gap','ed-layout-section-gap','ed-layout-title-size','ed-layout-hero-title-size','ed-layout-card-title-size','ed-layout-product-gap','ed-layout-split-gap','ed-layout-process-gap','ed-layout-contact-gap','ed-layout-faq-gap','ed-layout-trust-gap','ed-layout-footer-gap','ed-layout-product-pad','ed-layout-faq-pad','ed-layout-footer-pad','ed-layout-trust-pad'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const key = id.replace('ed-layout-','');
      const h = document.getElementById('help-'+key);
      if (h) {
        const v = el.value;
        if (key === 'shadow') h.textContent = v;
        else if (key === 'button-radius') h.textContent = v === '40' ? '40px (pill-like)' : v+'px';
        else h.textContent = v+'px';
      }
      onChange();
    });
  });
  // Custom CSS
  const cssEl = document.getElementById('ed-custom-css');
  if (cssEl) cssEl.addEventListener('input', onChange);
}

function onChange() {
  collectAllData(); markChanged(); saveDrafts(); applyPreview();
}

function collectAllData() {
  // Settings
  if (!state.settings) state.settings = {};
  state.settings.whatsapp = getVal('ed-whatsapp');
  state.settings.phone = getVal('ed-phone');
  state.settings.email = getVal('ed-email');
  state.settings.location = getVal('ed-location');
  state.settings.gst = getVal('ed-gst');
  state.settings.heroHeadline = getVal('ed-hero-headline');
  state.settings.heroIntro = getVal('ed-hero-intro');
  state.settings.heroImage = getVal('ed-hero-image');
  state.settings.siteTitle = getVal('ed-seo-title');
  state.settings.siteDescription = getVal('ed-seo-desc');
  state.settings.ogImage = getVal('ed-seo-ogimage');
  state.settings.navItems = state.navItems;
  state.settings.footerNavItems = state.footerNavItems;
  state.settings.heroHighlights = state.heroHighlights;
  state.settings.trustItems = state.trustItems;
  state.settings.faqItems = state.faqItems;
  state.socialLinks = {
    instagram: {url: getVal('ed-social-instagram'), label: 'Instagram'},
    facebook: {url: getVal('ed-social-facebook'), label: 'Facebook'},
    whatsapp: {url: getVal('ed-social-whatsapp'), label: 'WhatsApp'}
  };
  state.settings.socialLinks = state.socialLinks;
  // Section copy
  ensureSectionCopy();
  const sc = state.sectionCopy;
  sc.heroPrimary = { label: getVal('ed-hero-primary-label'), href: getVal('ed-hero-primary-href') };
  sc.heroSecondary = { label: getVal('ed-hero-secondary-label'), href: getVal('ed-hero-secondary-href') };
  sc.collection.label = getVal('ed-collection-label'); sc.collection.title = getVal('ed-collection-title');
  sc.collection.intro = getVal('ed-collection-intro'); sc.collection.note = getVal('ed-collection-note');
  sc.customOrders.label = getVal('ed-custom-label'); sc.customOrders.title = getVal('ed-custom-title');
  sc.customOrders.intro = getVal('ed-custom-intro'); sc.customOrders.image = getVal('ed-custom-image');
  sc.customOrders.processLabel = getVal('ed-process-label');
  sc.about.label = getVal('ed-about-label'); sc.about.title = getVal('ed-about-title');
  sc.about.intro = getVal('ed-about-intro'); sc.about.image = getVal('ed-about-image');
  sc.faq.label = getVal('ed-faq-label'); sc.faq.title = getVal('ed-faq-title');
  sc.contact.label = getVal('ed-contact-label'); sc.contact.title = getVal('ed-contact-title');
  sc.contact.intro = getVal('ed-contact-intro'); sc.contact.submitLabel = getVal('ed-contact-submit-label');
  sc.footerTagline = getVal('ed-footer-tagline');
  state.settings.sectionCopy = sc;
  // Theme
  if (!state.theme) state.theme = {colors:{},fonts:{},layout:{}};
  if (!state.theme.colors) state.theme.colors = {};
  if (!state.theme.fonts) state.theme.fonts = {};
  if (!state.theme.layout) state.theme.layout = {};
  const c = state.theme.colors;
  c['--brand-primary'] = getVal('ed-color-red');
  c['--brand-primary-dark'] = getVal('ed-color-red-dark');
  c['--brand-primary-light'] = getVal('ed-color-red-light');
  c['--brand-accent'] = getVal('ed-color-gold');
  c['--brand-navy'] = getVal('ed-color-navy');
  c['--brand-cream'] = getVal('ed-color-cream');
  c['--brand-background'] = getVal('ed-color-bg');
  c['--brand-alt-background'] = getVal('ed-color-alt');
  c['--brand-text'] = getVal('ed-color-text');
  c['--brand-muted'] = getVal('ed-color-muted');
  c['--brand-heading'] = getVal('ed-color-heading');
  c['--brand-border'] = getVal('ed-color-border');
  c['--brand-header-background'] = getVal('ed-color-header');
  c['--brand-footer-background'] = getVal('ed-color-footer-bg');
  c['--brand-footer-text'] = getVal('ed-color-footer-text');
  state.theme.fonts.heading = getVal('ed-font-heading');
  state.theme.fonts.body = getVal('ed-font-body');
  // Layout
  const l = state.theme.layout;
  l.baseFontSize = getVal('ed-layout-fs-base') || '16px';
  l.sectionY = (getVal('ed-layout-section-y') || '64') + 'px';
  l.cardRadius = (getVal('ed-layout-radius') || '20') + 'px';
  l.containerWidth = (getVal('ed-layout-container') || '1140') + 'px';
  l.headerHeight = (getVal('ed-layout-header-h') || '72') + 'px';
  l.productColumns = getVal('ed-layout-product-cols') || '3';
  const br = Number(getVal('ed-layout-button-radius') || '40');
  l.buttonRadius = (br >= 40) ? '9999px' : br+'px';
  l.shadowIntensity = String(getVal('ed-layout-shadow') || '0.12');
  l.revealAnimation = getVal('ed-layout-reveal') !== 'false';
  // Typography
  l.headingWeight = getVal('ed-font-heading-weight') || '600';
  l.headingTracking = getVal('ed-font-heading-tracking') || '-0.01em';
  l.headingLeading = getVal('ed-font-heading-leading') || '1.18';
  l.bodyWeight = getVal('ed-font-body-weight') || '400';
  l.bodyTracking = getVal('ed-font-body-tracking') || '0';
  l.bodyLeading = getVal('ed-font-body-leading') || '1.7';
  // Rows / columns / inner spacing
  l.heroColumns = getVal('ed-layout-hero-cols') || 'split';
  l.splitLayout = getVal('ed-layout-split') || 'split';
  l.aboutLayout = getVal('ed-layout-about') || 'split';
  l.trustLayout = getVal('ed-layout-trust') || 'auto';
  l.processColumns = getVal('ed-layout-process-cols') || '3';
  l.contactLayout = getVal('ed-layout-contact') || 'split';
  l.faqWidth = getVal('ed-layout-faq-width') || '740px';
  l.footerColumns = getVal('ed-layout-footer-cols') || '4';
  l.sectionAlign = getVal('ed-layout-section-align') || 'center';
  l.cardPad = (getVal('ed-layout-card-pad') || '24') + 'px';
  l.gridGap = (getVal('ed-layout-grid-gap') || '24') + 'px';
  l.sectionHeaderGap = (getVal('ed-layout-section-gap') || '48') + 'px';
  // Only save explicit sizes; keep "fluid" when user leaves the auto values untouched.
  const tsz = getVal('ed-layout-title-size'), hsz = getVal('ed-layout-hero-title-size'), csz = getVal('ed-layout-card-title-size');
  l.titleSize = (state.theme && state.theme.layout && state.theme.layout.titleSize === 'fluid' && tsz === '38') ? 'fluid' : (Number(tsz)||38)+'px';
  l.heroTitleSize = (state.theme && state.theme.layout && state.theme.layout.heroTitleSize === 'fluid' && hsz === '52') ? 'fluid' : (Number(hsz)||52)+'px';
  l.cardTitleSize = (state.theme && state.theme.layout && state.theme.layout.cardTitleSize === 'fluid' && csz === '22') ? 'fluid' : (Number(csz)||22)+'px';
  l.productGap = (getVal('ed-layout-product-gap') || '24') + 'px';
  l.splitGap = (getVal('ed-layout-split-gap') || '48') + 'px';
  l.processGap = (getVal('ed-layout-process-gap') || '24') + 'px';
  l.contactGap = (getVal('ed-layout-contact-gap') || '24') + 'px';
  l.faqGap = (getVal('ed-layout-faq-gap') || '12') + 'px';
  l.trustGap = (getVal('ed-layout-trust-gap') || '12') + 'px';
  l.footerGap = (getVal('ed-layout-footer-gap') || '48') + 'px';
  l.productPad = (getVal('ed-layout-product-pad') || '24') + 'px';
  l.faqPad = (getVal('ed-layout-faq-pad') || '20') + 'px';
  l.footerPad = (getVal('ed-layout-footer-pad') || '80') + 'px';
  l.trustPad = (getVal('ed-layout-trust-pad') || '16') + 'px';
  // Custom CSS
  state.customCSS = getVal('ed-custom-css');
}

// ===== HISTORY / UNDO / REDO =====
function pushHistory() {
  const snapshot = JSON.stringify({
    settings: state.settings, theme: state.theme, products: state.products,
    sections: state.sections, sectionOrder: state.sectionOrder,
    customCSS: state.customCSS, navItems: state.navItems, socialLinks: state.socialLinks
  });
  history.stack = history.stack.slice(0, history.index + 1);
  history.stack.push(snapshot);
  if (history.stack.length > 50) history.stack.shift();
  history.index = history.stack.length - 1;
}
function undo() {
  if (history.index <= 0) return;
  history.index--;
  restoreHistory();
}
function redo() {
  if (history.index >= history.stack.length - 1) return;
  history.index++;
  restoreHistory();
}
function restoreHistory() {
  const data = JSON.parse(history.stack[history.index]);
  state.settings = data.settings; state.theme = data.theme; state.products = data.products;
  state.sections = data.sections; state.sectionOrder = data.sectionOrder;
  state.customCSS = data.customCSS; state.navItems = data.navItems; state.socialLinks = data.socialLinks;
  if (state.settings) {
    state.settings.navItems = state.navItems;
    state.settings.socialLinks = state.socialLinks;
    state.footerNavItems = state.settings.footerNavItems||[];
    state.heroHighlights = state.settings.heroHighlights||[];
    state.trustItems = state.settings.trustItems||[];
    state.faqItems = state.settings.faqItems||[];
    state.sectionCopy = deepMerge(defaultSectionCopy(), state.settings.sectionCopy||{});
  }
  populateAllForms(); renderSectionList(); renderProductList();
  markChanged(); saveDrafts(); applyPreview();
  showToast(`Undo/Redo (${history.index+1}/${history.stack.length})`,'success');
}


// ===== SELECTED-ITEM INSPECTOR: STABLE VERSION =====
function setupInspector(){
  const ids=['ins-bg','ins-opacity','ins-color','ins-radius','ins-width','ins-maxwidth','ins-display','ins-padding','ins-margin','ins-gap','ins-fontsize','ins-weight','ins-leading','ins-tracking','ins-transform','ins-fit','ins-position'];
  ids.forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('input',previewInspectorChange)});
  document.querySelectorAll('[data-align]').forEach(b=>b.addEventListener('click',()=>applyInspectorAlignment(b.dataset.align)));
  document.querySelectorAll('[data-container-align]').forEach(b=>b.addEventListener('click',()=>applyInspectorContainerAlignment(b.dataset.containerAlign)));
  document.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>applyInspectorDirection(b.dataset.direction)));
  document.getElementById('preview-frame')?.addEventListener('load',()=>setTimeout(bindPreviewInspector,100));
}
function toggleMoveMode(){
  state.moveMode=!state.moveMode;
  const b=document.getElementById('move-mode-btn');
  if(b){b.classList.toggle('active',state.moveMode);b.innerHTML=state.moveMode?'<i class="fas fa-check"></i> Moving':'<i class="fas fa-arrows-alt"></i> Move';}
  const frame=document.getElementById('preview-frame');
  try{frame?.contentDocument?.documentElement?.classList.toggle('editor-move-mode',state.moveMode)}catch(e){}
  showToast(state.moveMode?'Move mode on — drag any element in the preview':'Move mode off','success');
}

function stableEditorSelector(el){
  if(el.id)return '#'+CSS.escape(el.id);
  if(el.dataset?.section)return '[data-section="'+el.dataset.section+'"]';
  const parts=[];let node=el;
  while(node&&node.nodeType===1&&node.tagName.toLowerCase()!=='html'){
    if(node.id){parts.unshift('#'+CSS.escape(node.id));break;}
    let part=node.tagName.toLowerCase();
    const classes=[...node.classList].filter(c=>!c.startsWith('editor-')&&!c.startsWith('is-')).slice(0,2);
    if(classes.length)part+='.'+classes.map(CSS.escape).join('.');
    else{
      const parent=node.parentElement;
      if(parent){const siblings=[...parent.children].filter(x=>x.tagName===node.tagName);if(siblings.length>1)part+=':nth-of-type('+(siblings.indexOf(node)+1)+')';}
    }
    parts.unshift(part);node=node.parentElement;
    if(parts.length>=6)break;
  }
  return parts.join(' > ');
}
function persistDragRule(el){
  const selector=stableEditorSelector(el);
  const x=Number(el.dataset.editorDragX||0),y=Number(el.dataset.editorDragY||0);
  state.dragRules[selector]={x,y};
  const rules=Object.entries(state.dragRules).map(([sel,p])=>sel+'{transform:translate('+p.x+'px,'+p.y+'px)!important}').join('\n');
  state.customCSS=(state.customCSS||'').replace(/\/\* EDITOR_DRAG_RULES_START \*\/[\s\S]*?\/\* EDITOR_DRAG_RULES_END \*\//,'').trim()
    +'\n/* EDITOR_DRAG_RULES_START */\n'+rules+'\n/* EDITOR_DRAG_RULES_END */';
  markChanged();saveDrafts();
}
function installCanvasDrag(doc){
  if(doc.__jhalarCanvasDrag)return;
  const style=doc.createElement('style');style.textContent='html.editor-move-mode *{cursor:move!important}html.editor-move-mode [data-editor-selected="true"]{outline:2px solid #C82039!important;outline-offset:3px!important}';doc.head.appendChild(style);
  let drag=null;
  const pick=e=>e.target?.closest?.('section,[data-section],.shell,.section-head,.hero-banner-copy,.custom-copy,.story-copy,.contact-box,.product-card,.product-info,h1,h2,h3,p,a,button,img,video');
  doc.addEventListener('pointerdown',e=>{
    if(!state.moveMode)return;
    const el=pick(e);if(!el)return;
    e.preventDefault();e.stopPropagation();
    selectPreviewElement(el);
    drag={el,startX:e.clientX,startY:e.clientY,baseX:Number(el.dataset.editorDragX||0),baseY:Number(el.dataset.editorDragY||0),baseTransform:el.style.transform||''};
    try{el.setPointerCapture(e.pointerId)}catch(err){}
  },true);
  doc.addEventListener('pointermove',e=>{
    if(!drag)return;
    const x=Math.round(drag.baseX+(e.clientX-drag.startX)),y=Math.round(drag.baseY+(e.clientY-drag.startY));
    drag.el.dataset.editorDragX=x;drag.el.dataset.editorDragY=y;
    drag.el.style.transform='translate('+x+'px,'+y+'px) '+drag.baseTransform;
  },true);
  const end=e=>{
    if(!drag)return;
    const el=drag.el;drag=null;persistDragRule(el);showToast('Position saved — publish when ready','success');
  };
  doc.addEventListener('pointerup',end,true);doc.addEventListener('pointercancel',end,true);
  doc.__jhalarCanvasDrag=true;
}

function bindPreviewInspector(){
  const frame=document.getElementById('preview-frame'); if(!frame)return;
  let doc;try{doc=frame.contentDocument}catch(e){return}
  if(!doc)return;
  installCanvasDrag(doc);
  doc.documentElement.classList.toggle('editor-move-mode',state.moveMode);
  if(doc.__jhalarInspectorHandler)return;
  const handler=e=>{
    const raw=e.target;
    const target=raw?.closest?.('section,[data-section],.shell,.section-head,.hero-banner-copy,.custom-copy,.story-copy,.contact-box,.product-card,.product-info,h1,h2,h3,p,a,button,img');
    if(!target)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    selectPreviewElement(target);
  };
  doc.addEventListener('click',handler,true);
  doc.__jhalarInspectorHandler=handler;
}
function setInspectorActive(group,attr,value){document.querySelectorAll(group+' ['+attr+']').forEach(b=>b.classList.toggle('active',b.dataset[attr]===value))}
function applyInspectorAlignment(value){const el=state.selectedPreview;if(!el)return;el.style.textAlign=value;setInspectorActive('#ins-text-align','align',value)}
function applyInspectorContainerAlignment(value){const el=state.selectedPreview;if(!el)return;if(!['flex','grid'].includes(getComputedStyle(el).display))el.style.display='flex';el.style.justifyContent=value==='start'?'flex-start':value==='end'?'flex-end':value==='stretch'?'stretch':'center';setInspectorActive('#ins-container-align','containerAlign',value)}
function applyInspectorDirection(value){const el=state.selectedPreview;if(!el)return;el.style.display='flex';el.style.flexDirection=value;setInspectorActive('#ins-direction','direction',value)}
function inspectorSelector(el){
  if(el.id)return '#'+CSS.escape(el.id);
  if(el.dataset?.section)return '[data-section="'+el.dataset.section+'"]';
  if(!el.dataset.editorUid)el.dataset.editorUid='editor-'+(++state.inspectorRuleId);
  return '[data-editor-uid="'+el.dataset.editorUid+'"]';
}
function selectPreviewElement(el){
  clearPreviewOutline();
  state.selectedPreview=el;el.dataset.editorSelected='true';
  const doc=el.ownerDocument;
  if(!doc.getElementById('editor-selection-style')){
    const style=doc.createElement('style');style.id='editor-selection-style';
    style.textContent='[data-editor-selected="true"]{outline:2px solid #a46b35!important;outline-offset:3px!important;cursor:crosshair!important}';
    doc.head.appendChild(style);
  }
  document.getElementById('inspector-empty').style.display='none';
  document.getElementById('inspector-panel').style.display='block';
  document.getElementById('inspector-path').textContent=inspectorSelector(el)+' · '+el.tagName.toLowerCase();
  syncInspectorFromElement(el);
}
function clearPreviewOutline(){try{const d=document.getElementById('preview-frame').contentDocument;d?.querySelectorAll('[data-editor-selected="true"]').forEach(x=>delete x.dataset.editorSelected)}catch(e){}}
function clearInspectorSelection(){clearPreviewOutline();state.selectedPreview=null;document.getElementById('inspector-empty').style.display='block';document.getElementById('inspector-panel').style.display='none'}
function selectInspectorParent(){if(state.selectedPreview?.parentElement)selectPreviewElement(state.selectedPreview.parentElement)}
function rgbToHex(v){if(!v||v==='transparent'||v==='rgba(0, 0, 0, 0)')return '#fffaf1';const m=v.match(/\d+/g);if(!m)return '#fffaf1';return '#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join('')}
function syncInspectorFromElement(el){
 const cs=el.ownerDocument.defaultView.getComputedStyle(el),set=(id,v)=>{const x=document.getElementById(id);if(x)x.value=v};
 set('ins-bg',rgbToHex(cs.backgroundColor));set('ins-color',rgbToHex(cs.color));set('ins-opacity',cs.opacity||'1');set('ins-radius',parseFloat(cs.borderRadius)||0);
 ['width','maxWidth','display','padding','margin','gap','fontSize','fontWeight','lineHeight','letterSpacing','textTransform','objectFit','objectPosition'].forEach(k=>set('ins-'+({maxWidth:'maxwidth',fontSize:'fontsize',fontWeight:'weight',lineHeight:'leading',letterSpacing:'tracking',textTransform:'transform',objectFit:'fit',objectPosition:'position'}[k]||k),el.style[k]||''));
 document.getElementById('ins-opacity-value').textContent=Math.round((parseFloat(cs.opacity)||1)*100)+'%';
 document.getElementById('ins-radius-value').textContent=(parseFloat(cs.borderRadius)||0)+'px';
 setInspectorActive('#ins-text-align','align',cs.textAlign);
 const jc=cs.justifyContent;setInspectorActive('#ins-container-align','containerAlign',jc==='flex-start'?'start':jc==='flex-end'?'end':jc==='stretch'?'stretch':'center');
 setInspectorActive('#ins-direction','direction',cs.flexDirection);
}
function previewInspectorChange(){
 const el=state.selectedPreview;if(!el)return;
 const v=id=>document.getElementById(id)?.value??'';
 const set=(k,x)=>{if(x!==''&&x!==null)el.style[k]=x};
 set('backgroundColor',v('ins-bg'));set('opacity',v('ins-opacity'));set('color',v('ins-color'));set('borderRadius',v('ins-radius')+'px');
 [['width','ins-width'],['maxWidth','ins-maxwidth'],['display','ins-display'],['padding','ins-padding'],['margin','ins-margin'],['gap','ins-gap'],['fontSize','ins-fontsize'],['fontWeight','ins-weight'],['lineHeight','ins-leading'],['letterSpacing','ins-tracking'],['textTransform','ins-transform'],['objectFit','ins-fit'],['objectPosition','ins-position']].forEach(([k,id])=>set(k,v(id)));
 const align=v('ins-align');if(align){el.style.textAlign=align}
 document.getElementById('ins-opacity-value').textContent=Math.round((parseFloat(v('ins-opacity'))||1)*100)+'%';
 document.getElementById('ins-radius-value').textContent=v('ins-radius')+'px';
}
function applyInspectorToAll(){
 const el=state.selectedPreview;if(!el)return;
 const selector=inspectorSelector(el);
 const declarations=Array.from(el.style).map(k=>k+':'+el.style.getPropertyValue(k)+' !important').join(';');
 state.customCSS=(state.customCSS||'')+'\n'+selector+'{'+declarations+'}';
 markChanged();saveDrafts();
 showToast('Selected styling saved','success');
}

// ===== PREVIEW =====
// ===== LIVE PREVIEW =====
let previewTimer = null, previewRetry = 0;
function setLiveBadge(state, text) {
  const b = document.getElementById('live-badge');
  const t = document.getElementById('live-badge-text');
  if (!b || !t) return;
  b.className = 'live-badge' + (state ? ' ' + state : '');
  t.textContent = text || (state === 'live' ? 'Live' : 'Syncing');
}
function applyPreview() { schedulePreview(); }
function schedulePreview() {
  clearTimeout(previewTimer);
  setLiveBadge('', 'Syncing');
  previewTimer = setTimeout(syncPreview, 250);
}
function syncPreview() {
  const frame = document.getElementById('preview-frame'); if (!frame) return;
  try {
    const w = frame.contentWindow;
    if (w && w.JHALAR && frame.contentDocument && frame.contentDocument.readyState === 'complete') {
      pushToIframe();
      previewRetry = 0;
      setLiveBadge('live', 'Live');
      bindPreviewInspector();
      return;
    }
  } catch(e) {}
  // JHALAR not ready yet - retry a few times, then hard-reload the iframe
  previewRetry++;
  if (previewRetry > 8) {
    previewRetry = 0;
    reloadPreview();
    return;
  }
  previewTimer = setTimeout(syncPreview, 300);
}
function reloadPreview() {
  const frame = document.getElementById('preview-frame'); if (!frame) return;
  const ld = document.getElementById('preview-loading');
  if (ld) ld.style.display = 'block';
  collectAllData();
  frame.src = 'index.html?_t=' + Date.now();
  frame.addEventListener('load', () => {
    if (ld) ld.style.display = 'none';
    previewRetry = 0;
    schedulePreview();
  }, { once: true });
}
function pushToIframe() {
  const frame = document.getElementById('preview-frame'); if (!frame) return;
  const w = frame.contentWindow; if (!w || !w.JHALAR) return;
  try {
    const s = JSON.parse(JSON.stringify(state.settings));
    s.navItems = state.navItems; s.footerNavItems = state.footerNavItems; s.socialLinks = state.socialLinks;
    s.heroHighlights = state.heroHighlights; s.trustItems = state.trustItems; s.faqItems = state.faqItems;
    s.sectionCopy = state.sectionCopy || s.sectionCopy || {};
    s.siteTitle = getVal('ed-seo-title'); s.siteDescription = getVal('ed-seo-desc'); s.ogImage = getVal('ed-seo-ogimage');
    if (s) w.JHALAR.setSettings(s);
    if (state.theme) w.JHALAR.setTheme(state.theme);
    if (state.products) w.JHALAR.setProducts(state.products);
    if (state.sections) w.JHALAR.setSections({ sections: state.sections, order: state.sectionOrder });
    if (state.customCSS !== undefined) w.JHALAR.setCustomCSS(state.customCSS);
    setTimeout(bindPreviewInspector,50);
  } catch(e) { console.warn('Push to iframe:', e); }
}
function previewChanges() {
  const frame = document.getElementById('preview-frame'); if (!frame) return;
  const ld = document.getElementById('preview-loading');
  if (ld) ld.style.display = 'block';
  collectAllData();
  frame.src = 'index.html?_build='+Date.now();
  frame.addEventListener('load', () => { if (ld) ld.style.display = 'none'; previewRetry = 0; setTimeout(schedulePreview, 200); }, { once: true });
  showToast('Preview refreshed','success');
}
function updatePreviewUrl() {
  const el = document.getElementById('preview-url');
  if (el) el.textContent = window.location.origin + window.location.pathname.replace('editor.html','') + 'index.html';
}

// ===== DRAFTS =====
function saveDrafts() {
  // Intentionally no persistent browser draft cache.
  // Editor state lives in memory and published GitHub files are always reloaded fresh.
  collectAllData();
  pushHistory();
}
function markChanged() { state.changed = true; updateSaveIndicator(); }
function updateSaveIndicator() {
  const el = document.getElementById('save-indicator');
  if (el) {
    el.innerHTML = state.changed ? '<i class="fas fa-pen"></i> Unsaved' : '<i class="fas fa-check-circle" style="color:#2e7d32"></i> Saved';
    el.style.color = state.changed ? 'var(--gold)' : '';
  }
}
function resetThemeDefaults() {
  state.theme = defaultThemeTemplate();
  populateAllForms();
  markChanged(); saveDrafts(); applyPreview();
  showToast('Theme restored to defaults','success');
}
async function resetToPublished() {
  if (!confirm('Reset all changes? This reloads the latest published version.')) return;
  try {
    ['jhalar_editor_settings','jhalar_editor_theme','jhalar_editor_products','jhalar_editor_sections','jhalar_editor_customcss'].forEach(k => localStorage.removeItem(k));
    state.changed = false; updateSaveIndicator();
    await loadPublishedData(); await loadFontManifest(); populateFontOptions(); populateAllForms(); renderSectionList(); renderProductList(); applyPreview();
    showToast('Reloaded latest published state','success');
  } catch(e) { showToast('Reset failed','error'); }
}

// ===== GITHUB TOKEN =====
function restoreGitHubToken() {
  try { const s = localStorage.getItem('jhalar_github_token'); if (s) { state.githubToken = atob(s); setVal('ed-github-token', state.githubToken); updateTokenStatus('Token restored','ok'); } } catch(e) {}
}
function saveGitHubToken() { if (state.githubToken) { try { localStorage.setItem('jhalar_github_token', btoa(state.githubToken)); } catch(e) {} } }
async function testGitHubToken() {
  const t = getVal('ed-github-token').trim(); if (!t) { updateTokenStatus('Enter a token','bad'); return; }
  state.githubToken = t; saveGitHubToken();
  updateTokenStatus('Checking repository write access...','');
  const headers = { 'Authorization': `Bearer ${t}`, 'Accept': 'application/vnd.github+json' };
  try {
    const repoUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    const r = await fetch(repoUrl, { headers });
    if (r.status === 401) { updateTokenStatus('Invalid or expired token','bad'); return; }
    if (!r.ok) { updateTokenStatus(`Cannot access repository (${r.status})`,'bad'); return; }
    const d = await r.json();
    if (d.permissions && !d.permissions.push) {
      updateTokenStatus('Connected, but this token/account cannot write to the repository. Grant repository write access and Contents: Read and write.','bad');
      return;
    }
    const probe = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/site-settings.json?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {headers});
    if (probe.status === 401) { updateTokenStatus('Invalid or expired token','bad'); return; }
    if (probe.status === 403) {
      updateTokenStatus('Repository is visible but Contents access is blocked. Fine-grained token: select this repository and set Contents to Read and write.','bad');
      return;
    }
    if (!probe.ok && probe.status !== 404) { updateTokenStatus(`Contents check failed (${probe.status})`,'bad'); return; }
    updateTokenStatus(`Connected to ${d.full_name} — repository access verified`,'ok');
    showToast('GitHub repository access verified!','success');
  } catch(e) { updateTokenStatus('Network error while checking GitHub','bad'); }
}
function updateTokenStatus(msg, type) { const el = document.getElementById('token-status'); if (el) { el.textContent = msg; el.className = 'token-status' + (type ? ' '+type : ''); } }

// Validate against the published registry, not a candidate's self-approval flags.
async function catalogueReadyToPublish() {
  try {
    const response = await fetch('content/product-naming.json?_build='+Date.now(), {cache:'no-store'});
    if (!response.ok) throw new Error('The approved naming registry could not be loaded.');
    state.namingRegistry = await response.json();
    const report = window.JHALARNaming.validateCatalogue({ products: state.products }, state.namingRegistry);
    if (report.errors.length || report.reviewCount || !state.products.length) {
      throw new Error(report.errors[0] || `${report.reviewCount} product(s) require naming review.`);
    }
    return true;
  } catch (error) {
    showToast('Publication blocked: ' + error.message, 'error');
    return false;
  }
}

// ===== GITHUB PUBLISH =====
async function publishToGitHub() {
  const btn = document.getElementById('btn-publish');
  const progress = document.getElementById('publish-progress');
  const fill = document.getElementById('progress-fill');
  const status = document.getElementById('progress-status');
  const log = document.getElementById('progress-log');

  collectAllData();
  if (!await catalogueReadyToPublish()) return;
  const token = getVal('ed-github-token').trim();
  if (!token) { showToast('Enter GitHub token first','error'); return; }
  state.githubToken = token; saveGitHubToken();

  const files = [
    { path: 'content/site-settings.json', content: JSON.stringify({...state.settings, navItems: state.navItems, footerNavItems: state.footerNavItems, socialLinks: state.socialLinks}, null, 2) },
    { path: 'content/theme.json', content: JSON.stringify(state.theme, null, 2) },
    { path: 'content/products.json', content: JSON.stringify({ products: state.products }, null, 2) },
    { path: 'content/sections.json', content: JSON.stringify({ sections: state.sections, order: state.sectionOrder }, null, 2) },
    { path: 'content/custom-css.json', content: JSON.stringify({ css: state.customCSS || '' }, null, 2) }
  ];

  progress.classList.add('show');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
  log.innerHTML = ''; fill.style.width = '0%'; status.textContent = 'Starting...';

  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const commitMsg = `Theme Editor update: ${new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}`;

  try {
    const commitSha = await createCommitWithRetry(token, files, commitMsg, addLog);
    fill.style.width = '100%';
    status.textContent = '[OK] Published!';
    status.style.color = '#2e7d32';
    addLog('Published successfully!','done');
    addLog('GitHub Pages will rebuild in ~1-2 min.','done');

    state.changed = false; updateSaveIndicator();
    showToast('Published to GitHub!','success');
    btn.innerHTML = '<i class="fas fa-check"></i> Published!';
    setTimeout(() => { btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Publish to GitHub'; }, 3000);
  } catch(e) {
    console.error('Publish:', e);
    status.textContent = `[X] ${e.message}`; status.style.color = 'var(--red)';
    addLog(`Error: ${e.message}`,'err');
    showToast('Publish failed: '+e.message,'error');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Publish to GitHub';
  }
}
function addLog(msg, type) {
  const log = document.getElementById('progress-log'); if (!log) return;
  const d = document.createElement('div'); d.textContent = msg; d.className = type||'';
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}

// ===== DOWNLOAD =====
function downloadSettings() { collectAllData(); downloadFile(JSON.stringify(state.settings, null, 2), 'site-settings.json', 'application/json'); showToast('site-settings.json downloaded','success'); }
function downloadTheme() { collectAllData(); downloadFile(JSON.stringify(state.theme, null, 2), 'theme.json', 'application/json'); showToast('theme.json downloaded','success'); }
function downloadProducts() { downloadFile(JSON.stringify({products: state.products}, null, 2), 'products.json', 'application/json'); showToast('products.json downloaded','success'); }
function downloadSections() { downloadFile(JSON.stringify({sections: state.sections, order: state.sectionOrder}, null, 2), 'sections.json', 'application/json'); showToast('sections.json downloaded','success'); }
function downloadCustomCSS() { downloadFile(JSON.stringify({css: state.customCSS||''}, null, 2), 'custom-css.json', 'application/json'); showToast('custom-css.json downloaded','success'); }
function downloadFile(content, name, type) {
  const blob = new Blob([content], {type}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ===== EXPORT / IMPORT ALL =====
function exportAllData() {
  collectAllData();
  const data = {
    exportedAt: new Date().toISOString(),
    settings: state.settings, theme: state.theme, products: state.products,
    sections: state.sections, sectionOrder: state.sectionOrder,
    customCSS: state.customCSS, navItems: state.navItems, socialLinks: state.socialLinks
  };
  downloadFile(JSON.stringify(data, null, 2), 'jhalar-full-backup.json', 'application/json');
  showToast('Full backup downloaded','success');
}
function importAllData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      if (!d.settings) { showToast('Invalid backup file','error'); return; }
      state.settings = d.settings; state.theme = deepMerge(defaultThemeTemplate(), d.theme||{}); state.products = d.products||[];
      state.sections = d.sections||{}; state.sectionOrder = d.sectionOrder||[];
      state.customCSS = d.customCSS||''; state.navItems = d.navItems||state.settings.navItems||[];
      state.socialLinks = d.socialLinks||state.settings.socialLinks||{};
      state.footerNavItems = state.settings.footerNavItems||[];
      state.heroHighlights = state.settings.heroHighlights||[];
      state.trustItems = state.settings.trustItems||[];
      state.faqItems = state.settings.faqItems||[];
      state.sectionCopy = deepMerge(defaultSectionCopy(), d.sectionCopy || state.settings.sectionCopy || {});
      ensureProductIds();
      populateAllForms(); renderSectionList(); renderProductList();
      markChanged(); saveDrafts(); applyPreview();
      showToast('Full backup restored!','success');
    } catch(e) { showToast('Invalid file','error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ===== TOAST =====
function showToast(msg, type) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.className = 'toast'+(type?' '+type:''); t.classList.add('show');
  clearTimeout(t._timeout); t._timeout = setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== UTILITIES =====
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; }
function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

// ===== PRO STUDIO UPGRADE =====
function installProStudio(){
  const panel=document.getElementById('panel-theme');
  if(!panel||document.getElementById('pro-studio'))return;

  const box=document.createElement('div');
  box.className='pro-studio';box.id='pro-studio';
  box.innerHTML=`
    <div class="pro-studio-head"><h4>✦ Hero Gradient Editor</h4><span class="help">Desktop + mobile</span></div>
    <p class="help">Control the hero overlay separately for each device. Changes appear immediately in the live preview.</p>
    <div id="studio-gradient-preview" class="gradient-preview"></div>
    <div class="studio-row">
      <div><label>Ivory color</label><input id="studio-a" type="color" value="#FFFAF1"></div>
      <div><label>Angle <strong id="studio-angle-value">0°</strong></label><input id="studio-angle" type="range" min="0" max="360" value="0"></div>
    </div>
    <div class="studio-row">
      <div><label>Desktop solid zone <strong id="studio-desktop-value">28%</strong></label><input id="studio-desktop" type="range" min="0" max="70" value="28"></div>
      <div><label>Desktop fade end <strong id="studio-desktop-end-value">100%</strong></label><input id="studio-desktop-end" type="range" min="45" max="100" value="100"></div>
    </div>
    <div class="studio-row">
      <div><label>Mobile solid zone <strong id="studio-mobile-value">34%</strong></label><input id="studio-mobile" type="range" min="0" max="80" value="34"></div>
      <div><label>Mobile fade end <strong id="studio-mobile-end-value">100%</strong></label><input id="studio-mobile-end" type="range" min="45" max="100" value="100"></div>
    </div>
    <div class="studio-actions"><button class="btn-sm primary" id="studio-hero">Apply & Save Hero Gradient</button><button class="btn-sm" id="studio-reset">Reset Hero</button></div>`;
  panel.appendChild(box);

  const q=id=>document.getElementById(id);
  const removeHeroCSS=()=>{state.customCSS=(state.customCSS||'').replace(/\/\* PRO_STUDIO_HERO_START \*\/[\s\S]*?\/\* PRO_STUDIO_HERO_END \*\//,'');};
  const buildHeroCSS=()=>{
    const a=q('studio-a').value,ang=q('studio-angle').value;
    const ds=+q('studio-desktop').value,de=+q('studio-desktop-end').value;
    const ms=+q('studio-mobile').value,me=+q('studio-mobile-end').value;
    // 0deg = bottom to top. The solid zone and fade endpoint are independently editable.
    const dMid=Math.min(de-1,Math.max(ds+1,Math.round((ds+de)/2)));
    const mMid=Math.min(me-1,Math.max(ms+1,Math.round((ms+me)/2)));
    return `/* PRO_STUDIO_HERO_START */
.hero.hero-banner .hero-banner-shade{display:block!important;position:absolute!important;inset:0!important;pointer-events:none!important;background:linear-gradient(${ang}deg,${a} 0%,${a} ${ds}%,rgba(255,250,241,.52) ${dMid}%,rgba(255,250,241,0) ${de}%)!important}
@media(max-width:760px){.hero.hero-banner .hero-banner-shade{background:linear-gradient(${ang}deg,${a} 0%,${a} ${ms}%,rgba(255,250,241,.58) ${mMid}%,rgba(255,250,241,0) ${me}%)!important}}
/* PRO_STUDIO_HERO_END */`;
  };
  const paint=()=>{
    const a=q('studio-a').value,ang=q('studio-angle').value,ds=q('studio-desktop').value,de=q('studio-desktop-end').value,ms=q('studio-mobile').value,me=q('studio-mobile-end').value;
    q('studio-angle-value').textContent=ang+'°';
    q('studio-desktop-value').textContent=ds+'%';q('studio-desktop-end-value').textContent=de+'%';
    q('studio-mobile-value').textContent=ms+'%';q('studio-mobile-end-value').textContent=me+'%';
    q('studio-gradient-preview').style.background=`linear-gradient(${ang}deg,${a} 0%,${a} ${ds}%,rgba(255,250,241,.52) ${Math.round((Number(ds)+Number(de))/2)}%,rgba(255,250,241,0) ${de}%)`;
    removeHeroCSS();state.customCSS=(state.customCSS||'')+'\n'+buildHeroCSS();
    state.changed=true;updateSaveIndicator();applyPreview();
  };
  ['studio-a','studio-angle','studio-desktop','studio-desktop-end','studio-mobile','studio-mobile-end'].forEach(id=>q(id).addEventListener('input',paint));
  q('studio-hero').onclick=()=>{paint();showToast('Hero gradient applied — save changes to publish','success');};
  q('studio-reset').onclick=()=>{
    q('studio-a').value='#FFFAF1';q('studio-angle').value=0;q('studio-desktop').value=28;q('studio-desktop-end').value=100;q('studio-mobile').value=34;q('studio-mobile-end').value=100;
    paint();showToast('Hero gradient reset','success');
  };
  paint();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(installProStudio,900));


// ===== SHOPIFY-STYLE HERO CONTROLS =====
function installShopifyHeroControls(){
 const panel=document.getElementById('panel-sections')||document.getElementById('panel-theme');
 if(!panel||document.getElementById('shopify-hero-controls'))return;
 const box=document.createElement('div');box.className='panel-section shopify-controls';box.id='shopify-hero-controls';
 box.innerHTML='<h4>Hero banner</h4><p>Control the hero independently, similar to a storefront theme editor.</p><div><label>Desktop height</label><div class="choice-grid" id="hero-desktop"><button class="choice-btn" data-v="520">Compact</button><button class="choice-btn active" data-v="640">Standard</button><button class="choice-btn" data-v="760">Tall</button></div></div><div><label>Mobile ratio</label><div class="choice-grid" id="hero-mobile"><button class="choice-btn" data-v="1.00">Square</button><button class="choice-btn active" data-v="1.25">Portrait</button><button class="choice-btn" data-v="1.50">Tall</button></div></div><div><label>Text size</label><div class="range-line"><input id="hero-font-size" type="range" min="32" max="96" value="64"><output id="hero-font-output">64px</output></div></div><div class="studio-actions"><button class="btn-sm primary" id="hero-apply">Apply live</button><button class="btn-sm" id="hero-clear">Reset</button></div>';
 panel.prepend(box);
 const bind=(id,key)=>box.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{box.querySelectorAll('#'+id+' button').forEach(x=>x.classList.remove('active'));b.classList.add('active');box.dataset[key]=b.dataset.v;});
 bind('hero-desktop','desktop');bind('hero-mobile','mobile');
 const slider=document.getElementById('hero-font-size'),out=document.getElementById('hero-font-output');slider.oninput=()=>out.textContent=slider.value+'px';
 document.getElementById('hero-apply').onclick=()=>{const d=box.dataset.desktop||640,m=box.dataset.mobile||1.25,s=slider.value;const css='/* SHOPIFY_HERO */ .hero-banner{min-height:'+d+'px}.hero-banner-copy h1{font-size:clamp(32px,6vw,'+s+'px)}@media(max-width:760px){.hero-banner{min-height:calc(100vw * '+m+');height:calc(100vw * '+m+')}.hero-banner-copy h1{font-size:clamp(32px,11vw,'+Math.min(s,64)+'px)}}';state.customCSS=(state.customCSS||'').replace(/\/\* SHOPIFY_HERO \*[\s\S]*?(?=\/\*|$)/,'')+css;state.changed=true;updateSaveIndicator();applyPreview();showToast('Hero settings applied','success');};
 document.getElementById('hero-clear').onclick=()=>{state.customCSS=(state.customCSS||'').replace(/\/\* SHOPIFY_HERO \*[\s\S]*?(?=\/\*|$)/,'');state.changed=true;updateSaveIndicator();applyPreview();showToast('Hero reset','success');};
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(installShopifyHeroControls,1100));

// ===== JHALAR DESIGN TOKENS — TYPOGRAPHY, SPACING & HEADER =====
function installDesignSystemControls(){
 const panel=document.getElementById('panel-theme')||document.getElementById('panel-sections');
 if(!panel||document.getElementById('jhalar-design-system'))return;
 const box=document.createElement('div');box.id='jhalar-design-system';box.className='panel-section shopify-controls';
 box.innerHTML='<h4>Design system</h4><p>Consistent typography, spacing and logo sizing.</p>'+
 '<div><label>Typography scale</label><div class="choice-grid" id="type-scale"><button class="choice-btn" data-v="compact">Compact</button><button class="choice-btn active" data-v="standard">Standard</button><button class="choice-btn" data-v="editorial">Editorial</button></div></div>'+
 '<div><label>Section spacing</label><div class="choice-grid" id="space-scale"><button class="choice-btn" data-v="compact">Compact</button><button class="choice-btn active" data-v="standard">Standard</button><button class="choice-btn" data-v="spacious">Spacious</button></div></div>'+
 '<div><label>Desktop logo width</label><div class="range-line"><input id="logo-desktop" type="range" min="200" max="350" value="250"><output id="logo-desktop-out">250px</output></div></div>'+
 '<div><label>Mobile logo width</label><div class="range-line"><input id="logo-mobile" type="range" min="120" max="200" value="150"><output id="logo-mobile-out">150px</output></div></div>'+
 '<div class="studio-actions"><button class="btn-sm primary" id="design-system-apply">Apply system</button><button class="btn-sm" id="design-system-reset">Reset</button></div>';
 panel.appendChild(box);
 const pick=(id,key)=>box.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{box.querySelectorAll('#'+id+' button').forEach(x=>x.classList.remove('active'));b.classList.add('active');box.dataset[key]=b.dataset.v;});
 pick('type-scale','type');pick('space-scale','space');
 const ld=document.getElementById('logo-desktop'),lm=document.getElementById('logo-mobile');
 ld.oninput=()=>document.getElementById('logo-desktop-out').textContent=ld.value+'px';
 lm.oninput=()=>document.getElementById('logo-mobile-out').textContent=lm.value+'px';
 document.getElementById('design-system-apply').onclick=()=>{
   const type=box.dataset.type||'standard',space=box.dataset.space||'standard';
   const typeMap={compact:['clamp(32px,4vw,42px)','clamp(24px,3vw,32px)','clamp(19px,2vw,22px)'],standard:['clamp(36px,4.5vw,52px)','clamp(28px,3.5vw,40px)','clamp(20px,2.2vw,26px)'],editorial:['clamp(40px,5vw,58px)','clamp(30px,4vw,44px)','clamp(21px,2.5vw,28px)']}[type];
   const gapMap={compact:['32px','16px'],standard:['56px','32px'],spacious:['72px','40px']}[space];
   const css='/* JHALAR_DESIGN_SYSTEM */:root{--j-h1:'+typeMap[0]+';--j-h2:'+typeMap[1]+';--j-h3:'+typeMap[2]+';--j-section:'+gapMap[0]+';--j-section-mobile:'+gapMap[1]+';--j-logo:'+ld.value+'px;--j-logo-mobile:'+lm.value+'px}h1{font-size:var(--j-h1);line-height:1.25}h2{font-size:var(--j-h2);line-height:1.25}h3{font-size:var(--j-h3);line-height:1.35}body{font-size:16px;line-height:1.55}.section,.page-section{padding-block:var(--j-section)}@media(max-width:760px){.section,.page-section{padding-block:var(--j-section-mobile)}body{font-size:16px}.site-logo,.logo img{max-width:var(--j-logo-mobile);width:100%}}@media(min-width:761px){.site-logo,.logo img{max-width:var(--j-logo);width:100%}}';
   state.customCSS=(state.customCSS||'').replace(/\/\* JHALAR_DESIGN_SYSTEM \*[\s\S]*?(?=\/\*|$)/,'')+css;
   state.changed=true;updateSaveIndicator();applyPreview();showToast('Design system applied live','success');
 };
 document.getElementById('design-system-reset').onclick=()=>{state.customCSS=(state.customCSS||'').replace(/\/\* JHALAR_DESIGN_SYSTEM \*[\s\S]*?(?=\/\*|$)/,'');state.changed=true;updateSaveIndicator();applyPreview();showToast('Design system reset','success');};
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(installDesignSystemControls,1300));
