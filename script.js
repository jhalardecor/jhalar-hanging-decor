// JHALAR Hanging Decor - Pro Engine
// Data sources: content/*.json

let products = [];
let settings = {
  whatsapp: "918100656258",
  phone: "+91 81006 56258",
  email: "lokeshdugar040@gmail.com",
  location: "Howrah, West Bengal, India",
  gst: "Available on request",
  heroHeadline: "Handcrafted Jhalars and Hangings, Made to Order in Howrah",
  heroIntro: "Pom pom garlands, torans, floral jhalars, bead and bell hangings — made to order for weddings, events, pandals and retail displays.",
  heroImage: "assets/images/hero-jhalar.jpg",
  siteTitle: "JHALAR | Handcrafted Jhalars, Torans and Hangings — Made in Howrah",
  siteDescription: "Pom pom garlands, torans, floral jhalars, bead and bell hangings — handmade in Howrah and delivered across India. Custom colours and large orders welcome.",
  ogImage: "assets/images/og-cover.jpg",
  navItems: [{label:"Collection",href:"#collection"},{label:"Custom Orders",href:"#custom-orders"},{label:"Who It's For",href:"#who-uses"},{label:"About",href:"#about"},{label:"FAQ",href:"#faq"},{label:"Contact",href:"#contact"}],
  footerNavItems: [{label:"Collection",href:"#collection"},{label:"Custom Orders",href:"#custom-orders"},{label:"Who It's For",href:"#who-uses"},{label:"About",href:"#about"},{label:"Contact",href:"#contact"}],
  socialLinks: {instagram:{url:"#",label:"Instagram"},facebook:{url:"#",label:"Facebook"},whatsapp:{url:"https://wa.me/918100656258",label:"WhatsApp"}},
  sectionCopy: {
    heroTag: {icon:"icon-mfr", text:"Made in Howrah | Delivered across India"},
    heroPrimary: {label:"View Collection", href:"#collection"},
    heroSecondary: {label:"Message on WhatsApp", href:"https://wa.me/918100656258"},
    why: {
      label:"Why JHALAR",
      title:"What You Get Working With Us",
      intro:"We are the makers, not a reseller — so the design, the price and the timeline all come from one place.",
      features:[
        {icon:"icon-mfr", title:"No Middlemen", text:"You talk to the people who actually make the pieces, not a trading desk in between."},
        {icon:"icon-palette", title:"Matched to Your Brief", text:"Send a reference photo or your palette and we will work to it."},
        {icon:"icon-bulk", title:"Built for Volume", text:"From a few dozen pieces to several thousand per design, made to the same standard throughout."}
      ]
    },
    collection: {
      label:"Our Collection",
      title:"Jhalars, Torans, Tassels and More",
      intro:"Pom pom, bead, bell, floral, torans, tassels, strings and custom work.",
      note:"Looking for something else? "
    },
    customOrders: {
      label:"Custom Orders",
      title:"Order Something Made to Your Own Design",
      intro:"Send a reference and your palette. Any design in the collection can be remade in your colours.",
      image:"assets/images/custom-orders.jpg",
      chips:[
        {icon:"icon-palette", text:"Colour matching"},
        {icon:"icon-ruler", text:"Size and length"},
        {icon:"icon-chart", text:"Order quantity"}
      ],
      processLabel:"How it works",
      steps:[
        {title:"Send Your Brief", text:"The category, your colours, how many pieces, and the date you need them."},
        {title:"Approve a Sample", text:"We make one piece to your brief. Nothing goes into production until you sign it off."},
        {title:"Production and Dispatch", text:"Once you approve the sample, we confirm the price and the timeline, and production starts."}
      ]
    },
    whoUses: {
      label:"Who It's For",
      title:"Who We Work With",
      intro:"Event decorators, wedding planners, retailers and puja committees.",
      personas:[
        {icon:"icon-route", title:"Event Decorators", text:"Venue-scale quantities against a fixed install date. Give us the date and we work backwards from it."},
        {icon:"icon-palette", title:"Wedding Planners", text:"Colours matched to your theme, so the whole setting works as one."},
        {icon:"icon-bulk", title:"Retailers and Stores", text:"Designs you can reorder in the same colours, run after run."},
        {icon:"icon-design", title:"Puja Committees", text:"Traditional torans and jhalars for pujas, pandals and festival programmes."}
      ]
    },
    about: {
      label:"About JHALAR",
      title:"From Our Workshop in Howrah to Your Venue",
      intro:"JHALAR makes hanging decor in Howrah, West Bengal. Every piece is finished by hand, and one person stays on your order from the first message to dispatch.",
      image:"assets/images/about-collage.jpg",
      values:[
        {icon:"icon-check", text:"Finished by hand, piece by piece"},
        {icon:"icon-check", text:"One contact from quote to dispatch"},
        {icon:"icon-check", text:"Repeat orders in the same colours"}
      ]
    },
    faq: {label:"FAQ", title:"Frequently Asked Questions"},
    contact: {
      label:"Contact",
      title:"Get in Touch or Place an Order",
      intro:"Include a photo if you have one. The clearer the brief, the faster the quote.",
      submitLabel:"Review and Send on WhatsApp"
    },
    footerTagline:"Handcrafted jhalars and hangings, made in Howrah and delivered across India."
  }
};

let theme = {
  colors: {
    "--brand-primary": "#C82039",
    "--brand-primary-dark": "#A3182E",
    "--brand-primary-light": "#E8485F",
    "--brand-accent": "#C9A84C",
    "--brand-navy": "#141942",
    "--brand-cream": "#FFFAF1",
    "--brand-background": "#FFFFFF",
    "--brand-alt-background": "#F9F7F4",
    "--brand-text": "#4A4752",
    "--brand-muted": "#6B6874",
    "--brand-heading": "#1F1D24",
    "--brand-border": "#F0EFEB",
    "--brand-header-background": "#FFFFFF",
    "--brand-footer-background": "#141942",
    "--brand-footer-text": "#FFFFFF"
  },
  fonts: {
    heading: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    body: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  },
  layout: {
    baseFontSize: "16px",
    sectionY: "96px",
    cardRadius: "20px",
    containerWidth: "1140px",
    headerHeight: "72px",
    productColumns: "3",
    buttonRadius: "9999px",
    shadowIntensity: "0.12",
    revealAnimation: true,
    headingWeight: "600",
    headingTracking: "-0.01em",
    headingLeading: "1.18",
    bodyWeight: "400",
    bodyTracking: "0",
    bodyLeading: "1.7",
    titleSize: "fluid",
    heroTitleSize: "fluid",
    cardTitleSize: "fluid",
    cardPad: "24px",
    gridGap: "24px",
    sectionHeaderGap: "48px",
    sectionAlign: "center",
    heroColumns: "split",
    featureColumns: "3",
    splitLayout: "split",
    aboutLayout: "split",
    processColumns: "3",
    contactLayout: "split",
    trustLayout: "auto",
    faqWidth: "740px",
    footerColumns: "4",
    featureGap: "24px",
    productGap: "24px",
    splitGap: "48px",
    processGap: "24px",
    contactGap: "24px",
    faqGap: "12px",
    trustGap: "12px",
    footerGap: "48px",
    productPad: "24px",
    faqPad: "20px",
    footerPad: "80px",
    trustPad: "16px"
  }
};

let sections = {};
let sectionOrder = [];
let customCSS = '';
let livePushed = { settings:false, theme:false, products:false, sections:false, css:false };

// ===== INIT =====
async function init() {
  setupSmoothScroll();
  setupMobileNav();
  setupAutoHideHeader();
  setupAccordions();
  setupModal();
  updateYear();
  setupReveal();
  setupEnquiryForm();

  await Promise.allSettled([loadSettings(), loadProducts(), loadTheme(), loadSections(), loadCustomCSS()]);
  applySiteSettings();
  applyTheme();
  applySectionVisibility();
  applySectionOrder();
  applyNavigation();
  applySEO();
  applyCustomCSS();
  renderProducts(products);
  setupFilterButtons();
  setupCollectionToggle();
  applyCollapse();
}

// ===== LOADERS =====
async function loadProducts() {
  try {
    const r = await fetch('content/products.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (livePushed.products) return;
    products = Array.isArray(d.products) ? d.products : [];
    if (!products.length) showFallbackProducts();
  } catch(e) { console.error('Products load failed:', e); if (!livePushed.products) showFallbackProducts(); }
}

async function loadSettings() {
  try {
    const r = await fetch('content/site-settings.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (livePushed.settings) return;
    settings = Object.assign({}, settings, d);
  } catch(e) { console.warn('Settings fallback:', e); }
}

async function loadTheme() {
  try {
    const r = await fetch('content/theme.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (livePushed.theme) return;
    if (d.colors) theme.colors = Object.assign({}, theme.colors, d.colors);
    if (d.fonts) theme.fonts = Object.assign({}, theme.fonts, d.fonts);
    if (d.layout) theme.layout = Object.assign({}, theme.layout, d.layout);
  } catch(e) { console.warn('Theme fallback:', e); }
}

async function loadSections() {
  try {
    const r = await fetch('content/sections.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (livePushed.sections) return;
    sections = d.sections || {};
    sectionOrder = Array.isArray(d.order) ? d.order : Object.keys(sections);
  } catch(e) { console.warn('Sections fallback:', e);
    if (livePushed.sections) return;
    document.querySelectorAll('[data-section]').forEach(el => { sections[el.dataset.section] = { visible: true }; });
    if (!sectionOrder.length) sectionOrder = document.querySelectorAll('[data-section]').length ? Array.from(document.querySelectorAll('[data-section]')).map(el=>el.dataset.section) : [];
  }
}

async function loadCustomCSS() {
  try {
    const r = await fetch('content/custom-css.json');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (livePushed.css) return;
    customCSS = d.css || '';
  } catch(e) { customCSS = ''; }
}

// ===== APPLIERS =====
// Colors are a single canonical --brand-* set: content/theme.json keys match
// the tokens used in style.css 1:1, so applyTheme just copies values through.
function applyTheme() {
  const root = document.documentElement;
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([k,v]) => {
      if (!v) return;
      root.style.setProperty(k, v);
    });
  }
  if (theme.fonts) {
    if (theme.fonts.heading) root.style.setProperty('--font-heading', theme.fonts.heading);
    if (theme.fonts.body) root.style.setProperty('--sans', theme.fonts.body);
  }
  if (theme.layout) {
    const l = theme.layout;
    if (l.baseFontSize) root.style.setProperty('--fs-base', l.baseFontSize);
    if (l.sectionY) root.style.setProperty('--section-y', l.sectionY);
    if (l.cardRadius) root.style.setProperty('--radius-lg', l.cardRadius);
    if (l.containerWidth) root.style.setProperty('--container', l.containerWidth);
    if (l.headerHeight) root.style.setProperty('--header-h', l.headerHeight);
    if (l.buttonRadius) root.style.setProperty('--button-radius', l.buttonRadius);
    if (l.shadowIntensity) root.style.setProperty('--shadow-alpha', l.shadowIntensity);
    // typography
    if (l.headingWeight) {
      root.style.setProperty('--heading-weight', l.headingWeight);
      // Display headings (h1/h2) stay at least Bold so the hierarchy survives any weight choice
      const hw = Number(l.headingWeight) || 600;
      root.style.setProperty('--heading-weight-strong', String(Math.max(700, hw)));
    }
    if (l.headingTracking) root.style.setProperty('--heading-tracking', l.headingTracking);
    if (l.headingLeading) root.style.setProperty('--heading-leading', l.headingLeading);
    if (l.bodyWeight) root.style.setProperty('--body-weight', l.bodyWeight);
    if (l.bodyTracking) root.style.setProperty('--body-tracking', l.bodyTracking);
    if (l.bodyLeading) root.style.setProperty('--body-leading', l.bodyLeading);
    // Base font size scales the whole rem-based type scale proportionally
    if (l.baseFontSize) {
      root.style.setProperty('--fs-base', l.baseFontSize);
      root.style.fontSize = l.baseFontSize;
    }
    if (l.titleSize && l.titleSize !== 'fluid') root.style.setProperty('--title-size', l.titleSize);
    if (l.heroTitleSize && l.heroTitleSize !== 'fluid') root.style.setProperty('--hero-title-size', l.heroTitleSize);
    if (l.cardTitleSize && l.cardTitleSize !== 'fluid') root.style.setProperty('--card-title-size', l.cardTitleSize);
    // inner spacing
    if (l.cardPad) root.style.setProperty('--card-pad', l.cardPad);
    if (l.gridGap) root.style.setProperty('--grid-gap', l.gridGap);
    if (l.sectionHeaderGap) root.style.setProperty('--section-header-gap', l.sectionHeaderGap);
    if (l.sectionAlign) {
      root.style.setProperty('--section-align', l.sectionAlign);
      root.style.setProperty('--section-header-margin', l.sectionAlign === 'left' ? '0 0 var(--section-header-gap,3rem)' : '0 auto var(--section-header-gap,3rem)');
      root.style.setProperty('--section-subtitle-margin', l.sectionAlign === 'left' ? '0' : '0 auto');
      root.style.setProperty('--faq-margin', l.sectionAlign === 'left' ? '0' : '0 auto');
    }
    // rows / columns
    if (l.heroColumns) root.style.setProperty('--hero-cols', l.heroColumns === 'stack' ? '1fr' : '1.1fr .9fr');
    if (l.featureColumns) root.style.setProperty('--feature-cols', l.featureColumns);
    if (l.splitLayout) root.style.setProperty('--split-cols', l.splitLayout === 'stack' ? '1fr' : '1.1fr 1fr');
    if (l.aboutLayout) root.style.setProperty('--about-cols', l.aboutLayout === 'stack' ? '1fr' : '1fr 1.1fr');
    if (l.processColumns) root.style.setProperty('--process-cols', l.processColumns);
    if (l.contactLayout) root.style.setProperty('--contact-cols', l.contactLayout === 'stack' ? '1fr' : '1.15fr .85fr');
    if (l.trustLayout) root.style.setProperty('--trust-direction', l.trustLayout === 'stack' ? 'column' : 'row');
    if (l.faqWidth) root.style.setProperty('--faq-width', l.faqWidth);
    if (l.footerColumns) root.style.setProperty('--footer-cols', l.footerColumns === '2' ? '1.4fr 1fr' : (l.footerColumns === '3' ? '1.2fr 1fr 1fr' : '1.4fr 1fr 1.2fr 1fr'));
    if (l.featureGap) root.style.setProperty('--feature-gap', l.featureGap);
    if (l.productGap) root.style.setProperty('--product-gap', l.productGap);
    if (l.splitGap) root.style.setProperty('--split-gap', l.splitGap);
    if (l.processGap) root.style.setProperty('--process-gap', l.processGap);
    if (l.contactGap) root.style.setProperty('--contact-gap', l.contactGap);
    if (l.faqGap) root.style.setProperty('--faq-gap', l.faqGap);
    if (l.trustGap) root.style.setProperty('--trust-gap', l.trustGap);
    if (l.footerGap) root.style.setProperty('--footer-gap', l.footerGap);
    if (l.productPad) root.style.setProperty('--product-pad', l.productPad);
    if (l.faqPad) root.style.setProperty('--faq-pad', l.faqPad);
    if (l.footerPad) root.style.setProperty('--footer-pad', l.footerPad);
    if (l.trustPad) root.style.setProperty('--trust-pad', l.trustPad);
    root.style.setProperty('--grid-min', l.productColumns === '2' ? '380px' : (l.productColumns === '4' ? '260px' : '300px'));
  }
  const mt = document.querySelector('meta[name="theme-color"]');
  if (mt && theme.colors && theme.colors['--brand-primary']) mt.content = theme.colors['--brand-primary'];
  applyRevealMode();
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function applySectionVisibility() {
  document.querySelectorAll('[data-section]').forEach(el => {
    const s = sections[el.dataset.section];
    el.style.display = (s && s.visible === false) ? 'none' : '';
  });
}

function applySectionOrder() {
  const main = document.querySelector('main');
  if (!main || !Array.isArray(sectionOrder) || !sectionOrder.length) return;
  sectionOrder.forEach(key => {
    const el = main.querySelector(`[data-section="${key}"]`);
    if (el) main.appendChild(el);
  });
}

function applyCustomCSS() {
  let el = document.getElementById('jhalar-custom-css');
  if (!el) { el = document.createElement('style'); el.id = 'jhalar-custom-css'; document.head.appendChild(el); }
  el.textContent = customCSS || '';
}

function applyNavigation() {
  // Desktop nav
  const navList = document.querySelector('.desktop-nav .nav-list');
  if (navList && settings.navItems && settings.navItems.length) {
    navList.innerHTML = settings.navItems.map(n => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('');
  }
  // Mobile nav
  const mobileList = document.querySelector('.mobile-nav-list');
  if (mobileList && settings.navItems && settings.navItems.length) {
    mobileList.innerHTML = settings.navItems.map(n => `<li><a href="${esc(n.href)}" class="mobile-link">${esc(n.label)}</a></li>`).join('');
  }
  // Footer nav
  const footerList = document.querySelector('.footer-links ul');
  if (footerList && settings.footerNavItems) {
    const lines = settings.footerNavItems.map(n => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`);
    if (!lines.some(l => /privacy\.html/.test(l))) lines.push('<li><a href="privacy.html">Privacy Policy</a></li>');
    footerList.innerHTML = lines.join('');
  }
  // Social links
  const socialContainer = document.querySelector('.footer-social ul');
  if (socialContainer && settings.socialLinks) {
    socialContainer.innerHTML = '';
    const sl = settings.socialLinks;
    if (sl.instagram) socialContainer.innerHTML += `<li><a href="${esc(sl.instagram.url)}" aria-label="Instagram"><i class="fab fa-instagram"></i> ${esc(sl.instagram.label)}</a></li>`;
    if (sl.facebook) socialContainer.innerHTML += `<li><a href="${esc(sl.facebook.url)}" aria-label="Facebook"><i class="fab fa-facebook"></i> ${esc(sl.facebook.label)}</a></li>`;
    if (sl.whatsapp) socialContainer.innerHTML += `<li><a href="${esc(sl.whatsapp.url)}" data-wa target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i> ${esc(sl.whatsapp.label)}</a></li>`;
  }
}

function applySEO() {
  if (settings.siteTitle) document.title = settings.siteTitle;
  if (settings.siteDescription) {
    let m = document.querySelector('meta[name="description"]');
    if (m) m.content = settings.siteDescription;
    m = document.querySelector('meta[property="og:description"]');
    if (m) m.content = settings.siteDescription;
    m = document.querySelector('meta[name="twitter:description"]');
    if (m) m.content = settings.siteDescription;
  }
  if (settings.ogImage) {
    const img = settings.ogImage.startsWith('http') ? settings.ogImage : 'https://lokeshdugar040.github.io/jhalar-hanging-decor/' + settings.ogImage;
    let m = document.querySelector('meta[property="og:image"]');
    if (m) m.content = img;
    m = document.querySelector('meta[name="twitter:image"]');
    if (m) m.content = img;
  }
}

function showFallbackProducts() {
  products = [
    {id:1,title:"Pink Pom Pom Gota Hanging",category:"Pom Pom Hangings",description:"Hand-tied pink pom poms with gota fan accents and a finishing bell.",image:"assets/images/products/pom-pom-pink-gota.jpg",b2bTag:"Repeat order"},
    {id:7,title:"Marigold Floral Jhalar",category:"Floral Jhalars",description:"Full-petal orange marigold (genda) jhalar, cut for Diwali and Durga Puja installations.",image:"assets/images/products/floral-marigold-orange.jpg",b2bTag:"Large orders"},
    {id:5,title:"Pink Blossom Bell Hanging",category:"Bell Hangings",description:"Pink blossoms set around a large golden temple bell, weighted at the base.",image:"assets/images/products/bell-pink-blossom.jpg",b2bTag:"Repeat order"},
    {id:9,title:"Mogra Pearl Door Toran",category:"Torans",description:"White mogra-pearl toran with a bell centrepiece, cut to standard doorway width.",image:"assets/images/products/toran-mogra.jpg",b2bTag:"Heavier weight"}
  ];
}

function renderProducts(productList) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  if (!productList || !productList.length) {
    grid.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No products available right now. Please WhatsApp us for the latest catalog.</p>';
    return;
  }
  grid.innerHTML = productList.map(p => `
    <div class="product-card" data-category="${esc(p.category)}">
      <div class="product-image"><img src="${esc(p.image)}" alt="${esc(p.title)} - ${esc(p.category)}" width="1080" height="1080" loading="lazy" decoding="async"></div>
      <div class="product-info">
        <span class="product-category">${esc(p.category)}</span>
        <h3 class="product-title">${esc(p.title)}</h3>
        <p class="product-desc">${esc(p.description)}</p>
        <span class="product-meta">${esc(p.b2bTag)}</span>
        <button class="btn btn-primary product-details-btn" data-product-id="${p.id}" style="margin-top:1rem;width:100%;">View Details</button>
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.product-details-btn').forEach(b => b.addEventListener('click', () => openProductModal(Number(b.dataset.productId))));
  applyCollapse();
}

// Progressive disclosure: 16 cards inline made the collection 31% of the page
// and pushed everything after it out of reach. Show a first screenful, let the
// rest open on request. Filtered views are short already, so never collapse them.
var PREVIEW_COUNT = 6;
var collectionExpanded = false;

function applyCollapse() {
  const grid = document.getElementById('product-grid');
  const btn = document.getElementById('collection-toggle');
  if (!grid || !btn) return;
  const cards = [...grid.querySelectorAll('.product-card:not(.is-filtered-out)')];
  const collapsible = !collectionExpanded && cards.length > PREVIEW_COUNT;
  cards.forEach((c, i) => {
    const hide = collapsible && i >= PREVIEW_COUNT;
    c.classList.toggle('is-collapsed', hide);
    // Keep hidden cards out of the tab order and off the a11y tree.
    c.querySelectorAll('button,a').forEach(el => el.tabIndex = hide ? -1 : 0);
    c.setAttribute('aria-hidden', hide ? 'true' : 'false');
  });
  const hiddenCount = cards.length - PREVIEW_COUNT;
  if (cards.length > PREVIEW_COUNT) {
    btn.hidden = false;
    btn.textContent = collectionExpanded ? 'Show fewer' : `View all ${cards.length} designs`;
    btn.setAttribute('aria-expanded', String(collectionExpanded));
  } else {
    btn.hidden = true;
  }
}

function setupCollectionToggle() {
  const btn = document.getElementById('collection-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    collectionExpanded = !collectionExpanded;
    applyCollapse();
    if (typeof revealVisible === 'function') revealVisible();
    if (!collectionExpanded) {
      const sec = document.getElementById('collection');
      if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
}

function setupFilterButtons() {
  const btns = document.querySelectorAll('.filter-btn');
  if (!btns.length) return;
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
    b.classList.add('active'); b.setAttribute('aria-selected','true');
    filterProducts(b.dataset.filter);
  }));
}

function filterProducts(cat) {
  // A category holds only 2 items; collapsing it would hide real results.
  // "All" returns to the collapsed preview.
  collectionExpanded = !!(cat && cat !== 'all');
  // Use a class, not inline display: an inline style would outrank
  // .is-collapsed{display:none} and defeat the preview entirely.
  document.querySelectorAll('.product-card').forEach(c => {
    c.style.display = '';
    c.classList.toggle('is-filtered-out', !(cat === 'all' || c.dataset.category === cat));
  });
  applyCollapse();
}

// ===== UI SETUP =====
function closeMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.getElementById('mobile-nav');
  const hdr = document.querySelector('.site-header');
  if (nav) nav.classList.remove('open');
  if (toggle) toggle.setAttribute('aria-expanded','false');
  if (hdr) hdr.classList.remove('nav-open');
}

function setupMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.getElementById('mobile-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const exp = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!exp));
    nav.classList.toggle('open');
    const hdr = document.querySelector('.site-header');
    if (hdr) {
      hdr.classList.toggle('nav-open', nav.classList.contains('open'));
      if (nav.classList.contains('open')) hdr.classList.remove('header-hidden');
    }
  });
  // Delegated: applyNavigation() replaces the menu's innerHTML after this runs,
  // so listeners bound directly to the anchors would be discarded.
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMobileNav(); });
  // Close on Escape, and when returning to the desktop breakpoint.
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) closeMobileNav(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900 && nav.classList.contains('open')) closeMobileNav(); });
}

function setupAutoHideHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const nav = document.getElementById('mobile-nav');
  let last = window.scrollY;
  let ticking = false;
  // Ignore sub-pixel jitter and the rubber-band overscroll at either end.
  const DELTA = 6;
  // Never hide over the hero; there is nothing to reclaim yet.
  const OFFSET = 120;
  // Programmatic anchor jumps move thousands of px at once. Suppress the
  // controller briefly so a jump does not read as "scrolled down".
  let suppressUntil = 0;
  window.__headerSuppress = (ms) => { suppressUntil = Date.now() + (ms || 700); };

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 4);

    // Menu open: always visible, and keep the baseline current.
    if (nav && nav.classList.contains('open')) {
      header.classList.remove('header-hidden');
      last = y;
      return;
    }
    if (Date.now() < suppressUntil) { last = y; return; }

    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (y <= OFFSET || y >= maxY - 2) {        // top, or bounced at the bottom
      header.classList.remove('header-hidden');
      last = y;
      return;
    }
    const diff = y - last;
    if (Math.abs(diff) < DELTA) return;         // too small to be intent
    header.classList.toggle('header-hidden', diff > 0);
    last = y;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  // A resize can change scrollHeight enough to strand a hidden header.
  window.addEventListener('resize', () => { header.classList.remove('header-hidden'); last = window.scrollY; }, { passive: true });
  update();
}

function setupAccordions() {
  document.querySelectorAll('.accordion-header').forEach(h => h.addEventListener('click', () => {
    const exp = h.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.accordion-header').forEach(x => { x.setAttribute('aria-expanded','false'); const c = document.getElementById(x.getAttribute('aria-controls')); if (c) c.hidden = true; });
    if (!exp) { h.setAttribute('aria-expanded','true'); const c = document.getElementById(h.getAttribute('aria-controls')); if (c) c.hidden = false; }
  }));
}

function setupModal() {
  const modal = document.getElementById('product-modal');
  const close = document.getElementById('modal-close');
  if (!modal || !close) return;
  close.addEventListener('click', () => closeModal(modal));
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(modal); });
}

function closeModal(modal) { modal.setAttribute('aria-hidden','true'); modal.style.display = 'none'; document.body.style.overflow = ''; }

function openProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  const s = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  s('modal-title', p.title); s('modal-category', p.category); s('modal-desc', p.description); s('modal-tag', p.b2bTag);
  const ph = document.getElementById('modal-photo');
  if (ph) { ph.src = p.image; ph.alt = p.title; }
  const wa = document.getElementById('modal-wa-btn');
  if (wa) wa.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent('Hello JHALAR, I am interested in "' + p.title + '" (' + p.category + '). Could you share pricing?')}`;
  modal.setAttribute('aria-hidden','false'); modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
  const cb = document.getElementById('modal-close'); if (cb) cb.focus();
}

function svgIcon(name, cls, size) {
  return `<svg class="icon ${cls||''}" aria-hidden="true" width="${size||18}" height="${size||18}"><use href="assets/icons.svg#${esc(name||'icon-check')}"/></svg>`;
}

function setText(sel, text, asHtml) {
  const el = document.querySelector(sel);
  if (!el) return;
  el[asHtml ? 'innerHTML' : 'textContent'] = text == null ? '' : (asHtml ? text : esc(text));
}

function applySiteSettings() {
  const copy = settings.sectionCopy || {};

  document.querySelectorAll('[data-contact]').forEach(el => { const k = el.dataset.contact; if (settings[k]) el.textContent = settings[k]; });
  document.querySelectorAll('a[data-wa]').forEach(a => { a.href = `https://wa.me/${settings.whatsapp}`; });
  document.querySelectorAll('a[data-wa-msg]').forEach(a => { a.href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(a.dataset.waMsg||'Hello JHALAR, I would like a quote.')}`; });
  document.querySelectorAll('a[data-tel]').forEach(a => { a.href = `tel:+${String(settings.whatsapp).replace(/\\D/g,'')}`; });
  document.querySelectorAll('a[data-mailto]').forEach(a => { a.href = `mailto:${settings.email}`; });

  // Hero
  if (settings.heroHeadline) setText('.hero-title', settings.heroHeadline);
  if (settings.heroIntro) setText('.hero-desc', settings.heroIntro);
  if (settings.heroImage) { const t = document.querySelector('.hero-img'); if (t) t.src = settings.heroImage; }
  if (copy.heroTag) { const tag = document.querySelector('.hero .tag'); if (tag) tag.innerHTML = svgIcon(copy.heroTag.icon, '', 18) + ' ' + esc(copy.heroTag.text); }
  const heroActions = document.querySelectorAll('.hero-actions a');
  if (copy.heroPrimary && heroActions[0]) { heroActions[0].textContent = copy.heroPrimary.label; heroActions[0].href = copy.heroPrimary.href || '#collection'; }
  if (copy.heroSecondary && heroActions[1]) {
    heroActions[1].innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> ' + esc(copy.heroSecondary.label);
    heroActions[1].href = copy.heroSecondary.href || settings.socialLinks?.whatsapp?.url || `https://wa.me/${settings.whatsapp}`;
  }

  // Hero highlights
  if (Array.isArray(settings.heroHighlights) && settings.heroHighlights.length) {
    const ul = document.querySelector('.hero-highlights');
    if (ul) ul.innerHTML = settings.heroHighlights.map(h => `<li>${svgIcon(h.icon,'',18)} ${esc(h.text)}</li>`).join('');
  }

  // Trust bar
  if (Array.isArray(settings.trustItems) && settings.trustItems.length) {
    const bar = document.querySelector('.trust-bar-inner');
    if (bar) bar.innerHTML = settings.trustItems.map((t,i) => `${i ? '<div class="trust-bar-divider" aria-hidden="true"></div>' : ''}<div class="trust-bar-item">${svgIcon(t.icon,'',16)} ${esc(t.label)}</div>`).join('');
  }

  // Why JHALAR
  if (copy.why) {
    setText('#why-jhalar .eyebrow', copy.why.label);
    setText('#why-jhalar .section-title', copy.why.title);
    setText('#why-jhalar .section-subtitle', copy.why.intro);
    const grid = document.querySelector('#why-jhalar .feature-grid');
    if (grid && Array.isArray(copy.why.features)) {
      grid.innerHTML = copy.why.features.map(f => `
        <div class="feature-card">
          <div class="feature-icon">${svgIcon(f.icon,'',20)}</div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.text)}</p>
        </div>
      `).join('');
    }
  }

  // Collection
  if (copy.collection) {
    setText('#collection .eyebrow', copy.collection.label);
    setText('#collection .section-title', copy.collection.title);
    setText('#collection .section-subtitle', copy.collection.intro);
    const note = document.querySelector('#collection .collection-note');
    if (note) note.innerHTML = esc(copy.collection.note) + ' <a href="https://wa.me/' + esc(settings.whatsapp) + '" data-wa target="_blank" rel="noopener">Message us on WhatsApp</a> — we will share pricing and availability.';
  }

  // Custom orders
  if (copy.customOrders) {
    const cs = copy.customOrders;
    setText('#custom-orders .eyebrow', cs.label);
    setText('#custom-orders h2', cs.title);
    const customIntro = document.querySelector('#custom-orders .split-text > p');
    if (customIntro) customIntro.textContent = cs.intro;
    if (cs.image) { const img = document.querySelector('#custom-orders .split-img'); if (img) img.src = cs.image; }
    const chips = document.querySelector('#custom-orders .chips');
    if (chips && Array.isArray(cs.chips)) chips.innerHTML = cs.chips.map(c => `<span class="chip">${svgIcon(c.icon,'',16)} ${esc(c.text)}</span>`).join('');
    const pl = document.querySelector('#custom-orders .process-label');
    if (pl) pl.innerHTML = svgIcon('icon-route','',18) + ' ' + esc(cs.processLabel || 'How it works');
    const steps = document.querySelector('#custom-orders .process-grid');
    if (steps && Array.isArray(cs.steps)) {
      steps.innerHTML = cs.steps.map((s,i) => `
        <li class="step">
          <div class="step-num">${String(i+1).padStart(2,'0')}</div>
          <div><div class="step-title">${esc(s.title)}</div><p class="step-desc">${esc(s.text)}</p></div>
        </li>
      `).join('');
    }
  }

  // About
  if (copy.about) {
    const ab = copy.about;
    setText('#about .eyebrow', ab.label);
    setText('#about h2', ab.title);
    const aboutIntro = document.querySelector('#about .split-text > p');
    if (aboutIntro) aboutIntro.textContent = ab.intro;
    if (ab.image) { const img = document.querySelector('#about .split-img'); if (img) img.src = ab.image; }
    const vals = document.querySelector('#about .values');
    if (vals && Array.isArray(ab.values)) vals.innerHTML = ab.values.map(v => `<li>${svgIcon(v.icon,'',20)} ${esc(v.text)}</li>`).join('');
  }

  // FAQ
  if (copy.faq) {
    setText('#faq .eyebrow', copy.faq.label);
    setText('#faq .section-title', copy.faq.title);
  }
  if (Array.isArray(settings.faqItems) && settings.faqItems.length) {
    const acc = document.querySelector('.accordion');
    if (acc) {
      acc.innerHTML = settings.faqItems.map((f,i) => `
        <div class="accordion-item">
          <button class="accordion-header" aria-expanded="false" aria-controls="faq-${i}">${esc(f.q)}</button>
          <div class="accordion-content" id="faq-${i}" hidden><p>${esc(f.a)}</p></div>
        </div>
      `).join('');
      setupAccordions();
    }
  }

  // Contact
  if (copy.contact) {
    setText('#contact .eyebrow', copy.contact.label);
    setText('#contact h2', copy.contact.title);
    setText('#contact .section-subtitle', copy.contact.intro);
    if (copy.contact.submitLabel) {
      const submitBtn = document.querySelector('.submit-btn');
      if (submitBtn) submitBtn.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i> ' + esc(copy.contact.submitLabel);
    }
  }

  // Footer
  if (copy.footerTagline) setText('.footer-tagline', copy.footerTagline);
}
function updateYear() { const e = document.getElementById('current-year'); if (e) e.textContent = String(new Date().getFullYear()); }

function applyRevealMode() {
  const off = theme.layout?.revealAnimation === false;
  document.body.classList.toggle('no-reveal', off);
  if (off) document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
  else document.querySelectorAll('.reveal').forEach(el => el.classList.remove('active'));
}

let revealVisible = function(){};
function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  revealVisible = () => {
    if (document.body.classList.contains('no-reveal')) return;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      // Activate anything on screen or just below it; the old check missed
      // elements already scrolled past after an instant jump.
      if (r.top < window.innerHeight - 80 && r.bottom > -200) el.classList.add('active');
    });
  };
  revealVisible();
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('resize', revealVisible, { passive: true });
  window.addEventListener('load', revealVisible);
}

function setupEnquiryForm() {
  const form = document.getElementById('enquiry-form');
  if (!form) return;
  form.querySelectorAll('input[required], select[required], textarea[required]').forEach(i => i.addEventListener('blur', () => { i.style.borderColor = i.validity.valid ? '#4caf50' : '#f44336'; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const lines = ['*New Message - JHALAR*','',`*Name:* ${v('name')}`];
    if (v('company')) lines.push(`*Company:* ${v('company')}`);
    lines.push(`*Buyer Type:* ${v('buyer-type')}`,`*Phone:* ${v('phone')}`);
    if (v('email')) lines.push(`*Email:* ${v('email')}`);
    lines.push(`*City/State:* ${v('location')}`,`*Category:* ${v('category')}`);
    if (v('quantity')) lines.push(`*Quantity:* ${v('quantity')}`);
    if (v('date')) lines.push(`*Date Required:* ${v('date')}`);
    if (v('details')) lines.push(`*Details:* ${v('details')}`);
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join('\\n'))}`, '_blank', 'noopener');
    const st = document.getElementById('form-status');
    if (st) { st.textContent = 'WhatsApp is open with your enquiry filled in. Review it and press send there.'; st.classList.add('visible'); }
  });
}

function setupSmoothScroll() {
  // Delegated on document so it keeps working after nav/footer links are re-rendered.
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute('href');
    if (!h || h.length <= 1) return;
    let t = null;
    try { t = document.querySelector(h); } catch(err) { return; }
    if (!t) return;
    e.preventDefault();

    // The page is ~14000px on a phone, so "Contact" was a 11000px smooth
    // scroll: over a second of blurred flight past sections that are still
    // opacity:0, which reads as the page loading and dumping you at the
    // bottom. Animate only short hops; jump instantly for long ones.
    const dist = Math.abs(t.getBoundingClientRect().top);
    const far = dist > window.innerHeight * 2.5;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // NB: 'auto' would defer to CSS scroll-behavior:smooth and still animate.
    const behavior = (far || reduced) ? 'instant' : 'smooth';

    // Reveal anything we are about to land on BEFORE moving, so the section is
    // already painted on arrival instead of fading in afterwards.
    revealNow(t);
    // Show the bar and pause auto-hide: the jump itself is not a user scroll,
    // and scroll-margin-top assumes a visible header.
    const hdr = document.querySelector('.site-header');
    if (hdr) hdr.classList.remove('header-hidden');
    if (window.__headerSuppress) window.__headerSuppress(behavior === 'instant' ? 350 : 900);
    t.scrollIntoView({ behavior: behavior, block: 'start' });
    // Catch reveals that the scroll handler may not fire for on an instant jump.
    requestAnimationFrame(() => { if (typeof revealVisible === 'function') revealVisible(); });
  });
}

// Force a subtree visible immediately (used before a jump).
function revealNow(root) {
  if (!root || document.body.classList.contains('no-reveal')) return;
  if (root.classList && root.classList.contains('reveal')) root.classList.add('active');
  root.querySelectorAll && root.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
}

// ===== JHALAR API =====
window.JHALAR = {
  getProducts: () => products,
  getSettings: () => settings,
  getTheme: () => theme,
  getSections: () => sections,
  getCustomCSS: () => customCSS,
  setSettings: (ns) => { livePushed.settings = true; settings = Object.assign({}, settings, ns); applySiteSettings(); applyNavigation(); applySEO(); try { localStorage.setItem('jhalar_settings', JSON.stringify(settings)); } catch(e){} },
  setTheme: (nt) => {
    livePushed.theme = true;
    if (nt.colors) theme.colors = Object.assign({}, theme.colors, nt.colors);
    if (nt.fonts) theme.fonts = Object.assign({}, theme.fonts, nt.fonts);
    if (nt.layout) theme.layout = Object.assign({}, theme.layout, nt.layout);
    applyTheme();
    try { localStorage.setItem('jhalar_theme', JSON.stringify(theme)); } catch(e){}
  },
  setProducts: (np) => { livePushed.products = true; products = Array.isArray(np) ? np : []; renderProducts(products); setupFilterButtons(); try { localStorage.setItem('jhalar_products', JSON.stringify(products)); } catch(e){} },
  setSections: (ns) => {
    livePushed.sections = true;
    if (ns && ns.sections) { sections = ns.sections; if (Array.isArray(ns.order)) sectionOrder = ns.order; }
    else sections = ns || {};
    applySectionVisibility();
    applySectionOrder();
    try { localStorage.setItem('jhalar_sections', JSON.stringify(sections)); localStorage.setItem('jhalar_section_order', JSON.stringify(sectionOrder)); } catch(e){}
  },
  setCustomCSS: (css) => { livePushed.css = true; customCSS = css || ''; applyCustomCSS(); try { localStorage.setItem('jhalar_custom_css', css); } catch(e){} }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
