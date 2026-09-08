/* JHALAR footer brand film — "From Space to Celebration"
   A seamless ~7.6 s loop rendered into the site footer. It has no controls:
   it starts on its own when the footer scrolls into view and rests while
   the footer is off-screen or the tab is hidden. Static, no build step. */
(function(){
  'use strict';
  const host = document.querySelector('[data-brand-film]');
  if (!host || !('requestAnimationFrame' in window)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- scene ---------- */
  const SCENE = `<defs>
  <!-- warm empty-space wash -->
  <linearGradient id="jf-bg-wash" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFDF8"/>
    <stop offset=".55" stop-color="#FBF3E4"/>
    <stop offset="1" stop-color="#F3E6CF"/>
  </linearGradient>
  <radialGradient id="jf-top-glow" cx=".5" cy=".12" r=".75">
    <stop offset="0" stop-color="#F6D8A0" stop-opacity=".65"/>
    <stop offset=".55" stop-color="#F6D8A0" stop-opacity=".18"/>
    <stop offset="1" stop-color="#F6D8A0" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="jf-floor-glow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#E8B46B" stop-opacity=".55"/>
    <stop offset="1" stop-color="#E8B46B" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="jf-logo-glow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#FFF6E6" stop-opacity=".95"/>
    <stop offset=".6" stop-color="#FBEDD6" stop-opacity=".55"/>
    <stop offset="1" stop-color="#FBEDD6" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="jf-vignette" cx=".5" cy=".42" r=".75">
    <stop offset=".72" stop-color="#622331" stop-opacity="0"/>
    <stop offset="1" stop-color="#622331" stop-opacity=".07"/>
  </radialGradient>
  <linearGradient id="jf-beam-wood" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#C08B52"/>
    <stop offset=".45" stop-color="#9C6A36"/>
    <stop offset="1" stop-color="#7E5226"/>
  </linearGradient>

  <!-- marigold bloom variants -->
  <g id="jf-mari-a">
    <g fill="#E48A2C">
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(36)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(72)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(108)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(144)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(180)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(216)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(252)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(288)"/>
      <ellipse cx="0" cy="-5.6" rx="2.6" ry="3.9" transform="rotate(324)"/>
    </g>
    <g fill="#F6B749">
      <circle cx="0" cy="-3.1" r="2"/>
      <circle cx="0" cy="-3.1" r="2" transform="rotate(60)"/>
      <circle cx="0" cy="-3.1" r="2" transform="rotate(120)"/>
      <circle cx="0" cy="-3.1" r="2" transform="rotate(180)"/>
      <circle cx="0" cy="-3.1" r="2" transform="rotate(240)"/>
      <circle cx="0" cy="-3.1" r="2" transform="rotate(300)"/>
    </g>
    <circle r="3.1" fill="#EFA63A"/>
    <circle r="1.5" fill="#B95E13"/>
  </g>
  <g id="jf-mari-b">
    <g fill="#EE9E34">
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(40)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(80)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(120)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(160)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(200)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(240)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(280)"/>
      <ellipse cx="0" cy="-6.4" rx="2.9" ry="4.3" transform="rotate(320)"/>
    </g>
    <g fill="#F9C762">
      <circle cx="0" cy="-3.5" r="2.2"/>
      <circle cx="0" cy="-3.5" r="2.2" transform="rotate(72)"/>
      <circle cx="0" cy="-3.5" r="2.2" transform="rotate(144)"/>
      <circle cx="0" cy="-3.5" r="2.2" transform="rotate(216)"/>
      <circle cx="0" cy="-3.5" r="2.2" transform="rotate(288)"/>
    </g>
    <circle r="3.5" fill="#F3A838"/>
    <circle r="1.6" fill="#C56A14"/>
  </g>
  <g id="jf-mari-c">
    <g fill="#F2AB3E">
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(45)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(90)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(135)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(180)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(225)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(270)"/>
      <ellipse cx="0" cy="-4.9" rx="2.3" ry="3.4" transform="rotate(315)"/>
    </g>
    <g fill="#FBD07E">
      <circle cx="0" cy="-2.7" r="1.7"/>
      <circle cx="0" cy="-2.7" r="1.7" transform="rotate(90)"/>
      <circle cx="0" cy="-2.7" r="1.7" transform="rotate(180)"/>
      <circle cx="0" cy="-2.7" r="1.7" transform="rotate(270)"/>
    </g>
    <circle r="2.6" fill="#ED9D2F"/>
    <circle r="1.2" fill="#B95E13"/>
  </g>

  <!-- magenta bougainvillea-like blooms -->
  <g id="jf-mag-a">
    <g fill="#C82039">
      <ellipse cx="0" cy="-4.6" rx="3.2" ry="2.8"/>
      <ellipse cx="0" cy="-4.6" rx="3.2" ry="2.8" transform="rotate(72)"/>
      <ellipse cx="0" cy="-4.6" rx="3.2" ry="2.8" transform="rotate(144)"/>
      <ellipse cx="0" cy="-4.6" rx="3.2" ry="2.8" transform="rotate(216)"/>
      <ellipse cx="0" cy="-4.6" rx="3.2" ry="2.8" transform="rotate(288)"/>
    </g>
    <g fill="#E0526A">
      <ellipse cx="0" cy="-2.9" rx="2.3" ry="1.9"/>
      <ellipse cx="0" cy="-2.9" rx="2.3" ry="1.9" transform="rotate(72)"/>
      <ellipse cx="0" cy="-2.9" rx="2.3" ry="1.9" transform="rotate(144)"/>
      <ellipse cx="0" cy="-2.9" rx="2.3" ry="1.9" transform="rotate(216)"/>
      <ellipse cx="0" cy="-2.9" rx="2.3" ry="1.9" transform="rotate(288)"/>
    </g>
    <circle r="1.7" fill="#F3D9A4"/>
  </g>
  <g id="jf-mag-b">
    <g fill="#A8152F">
      <ellipse cx="0" cy="-4.2" rx="2.9" ry="2.6"/>
      <ellipse cx="0" cy="-4.2" rx="2.9" ry="2.6" transform="rotate(72)"/>
      <ellipse cx="0" cy="-4.2" rx="2.9" ry="2.6" transform="rotate(144)"/>
      <ellipse cx="0" cy="-4.2" rx="2.9" ry="2.6" transform="rotate(216)"/>
      <ellipse cx="0" cy="-4.2" rx="2.9" ry="2.6" transform="rotate(288)"/>
    </g>
    <g fill="#CD3A58">
      <ellipse cx="0" cy="-2.6" rx="2" ry="1.7"/>
      <ellipse cx="0" cy="-2.6" rx="2" ry="1.7" transform="rotate(72)"/>
      <ellipse cx="0" cy="-2.6" rx="2" ry="1.7" transform="rotate(144)"/>
      <ellipse cx="0" cy="-2.6" rx="2" ry="1.7" transform="rotate(216)"/>
      <ellipse cx="0" cy="-2.6" rx="2" ry="1.7" transform="rotate(288)"/>
    </g>
    <circle r="1.5" fill="#EFCB8E"/>
  </g>
  <g id="jf-mag-c">
    <g fill="#D23A55">
      <ellipse cx="0" cy="-5" rx="3.4" ry="2.9"/>
      <ellipse cx="0" cy="-5" rx="3.4" ry="2.9" transform="rotate(72)"/>
      <ellipse cx="0" cy="-5" rx="3.4" ry="2.9" transform="rotate(144)"/>
      <ellipse cx="0" cy="-5" rx="3.4" ry="2.9" transform="rotate(216)"/>
      <ellipse cx="0" cy="-5" rx="3.4" ry="2.9" transform="rotate(288)"/>
    </g>
    <g fill="#EC7185">
      <ellipse cx="0" cy="-3" rx="2.4" ry="1.9"/>
      <ellipse cx="0" cy="-3" rx="2.4" ry="1.9" transform="rotate(72)"/>
      <ellipse cx="0" cy="-3" rx="2.4" ry="1.9" transform="rotate(144)"/>
      <ellipse cx="0" cy="-3" rx="2.4" ry="1.9" transform="rotate(216)"/>
      <ellipse cx="0" cy="-3" rx="2.4" ry="1.9" transform="rotate(288)"/>
    </g>
    <circle r="1.8" fill="#F3D9A4"/>
  </g>

  <!-- jasmine star bud -->
  <g id="jf-jasmine">
    <g fill="#FDFBF3" stroke="#E7DCC2" stroke-width=".45">
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35"/>
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35" transform="rotate(60)"/>
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35" transform="rotate(120)"/>
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35" transform="rotate(180)"/>
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35" transform="rotate(240)"/>
      <ellipse cx="0" cy="-2.5" rx="1.35" ry="2.35" transform="rotate(300)"/>
    </g>
    <circle r="1.05" fill="#EBC874"/>
  </g>

  <!-- white tuberose-style bud + bead -->
  <g id="jf-bud">
    <circle cx="0" cy="-7.2" r="1.25" fill="#F3E9D3"/>
    <path d="M0,5.6 C-2.5,1.8 -2.5,-3.2 0,-5.8 C2.5,-3.2 2.5,1.8 0,5.6 Z" fill="#FBF6EA"/>
    <path d="M0,4.4 C-1.2,1.4 -1.2,-2.4 0,-4.6" fill="none" stroke="#E7DCC4" stroke-width=".5"/>
  </g>

  <!-- marigold tassel end -->
  <g id="jf-tassel">
    <path d="M0,2 C-5,8 -7,17 -5.5,27" fill="none" stroke="#E48A2C" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M0,2 C-1.8,9 -2.2,19 -1,29" fill="none" stroke="#F2AB3E" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M0,2 C1.8,9 2.2,19 1,29" fill="none" stroke="#EE9E34" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M0,2 C5,8 7,17 5.5,27" fill="none" stroke="#E48A2C" stroke-width="2.6" stroke-linecap="round"/>
    <use href="#jf-mari-c" transform="scale(1.15)"/>
  </g>
</defs>

<!-- Scene 01: the empty space -->
<rect width="1200" height="675" fill="url(#jf-bg-wash)"/>
<rect width="1200" height="675" fill="url(#jf-top-glow)"/>
<ellipse id="jf-floor-glow" cx="600" cy="636" rx="470" ry="66" fill="url(#jf-floor-glow)" opacity="0"/>

<!-- hanging world: populated by JS -->
<g id="jf-back-layer"></g>
<g id="jf-front-layer"></g>

<!-- the beam a decorator hangs from -->
<g id="jf-beam">
  <rect x="24" y="30" width="1152" height="22" rx="7" fill="url(#jf-beam-wood)"/>
  <rect x="24" y="34" width="1152" height="2.6" rx="1.3" fill="#D7A066" opacity=".55"/>
  <g id="jf-hooks" stroke="#5E3D1C" stroke-width="2.4" fill="none" stroke-linecap="round"></g>
</g>

<!-- floating warmth dust -->
<g id="jf-motes"></g>

<!-- brand reveal -->
<circle id="jf-logo-glow" cx="600" cy="344" r="250" fill="url(#jf-logo-glow)" opacity="0"/>
<g id="jf-logo-anim" transform="translate(600 344)" opacity="0">
  <g transform="translate(-150.9 -51.8) scale(2.95)">
    <g id="jf-logo-art">
    <path class="st1" d="M11.1,0h-4.1c-.8,0-1.5.6-1.6,1.4s.6,1.7,1.5,1.7h2.5v8c0,3.5-2.5,6.1-4.7,4.8-.5-.3-.8-1.4-1.2-1.8-.8-.8-2.3-.4-2.7,0-2.5,2.7.3,4.7.9,5.2,2.1,1.6,11.9,3.2,10.9-7.5V1.8C12.8.8,12.1,0,11.1,0Z"/>
    <path class="st1" d="M29.2.3c-.5,0-.9.2-1.2.5-.3.3-.5.8-.5,1.2v6.8h-10.1V2c0-.9-.8-1.7-1.7-1.7s-1.7.8-1.7,1.7v16.7c0,.9.7,1.7,1.7,1.7s1.7-.8,1.7-1.7v-6.8h10.1v6.8c0,.5.2.9.5,1.2.3.3.7.5,1.2.5s.9-.2,1.2-.5c.3-.3.5-.8.5-1.2V2c0-.4-.2-.9-.5-1.2-.3-.3-.7-.5-1.2-.5Z"/>
    <path class="st1" d="M40.5,10.2c-.2,0-.3,0-.5,0-1,.4-1.6,5.2-1.7,8.1,0,.6.1,1.1.5,1.5.4.4.9.6,1.4.6s1.1-.3,1.5-.6c.4-.4.6-1,.5-1.5-.2-2.9-.8-7.7-1.7-8.1Z"/>
    <path class="st1" d="M40.9.5c-.2-.1-.4-.2-.6-.2s-.4,0-.7.2c-2.9,1.2-7.3,8.7-7.8,18.3,0,.4.1.9.4,1.2.4.4.8.5,1.3.5.9,0,1.6-.7,1.6-1.6.4-7.1,3-13.1,5.1-14.8,2.1,1.7,4.8,7.8,5.1,14.8,0,1,.8,1.6,1.8,1.6s1.6-.8,1.6-1.7c-.5-9.6-4.9-17-7.8-18.3Z"/>
    <path class="st1" d="M65.2,17.3h-7.8V2.5c0-.9-.7-1.7-1.7-1.7s-1.7.8-1.7,1.7v16.2c0,1,.7,1.7,1.7,1.8h9.4c.9,0,1.5-.7,1.5-1.6s-.7-1.6-1.5-1.6Z"/>
    <path class="st1" d="M76.4,10.2c-.2,0-.3,0-.5,0-1,.4-1.6,5.2-1.7,8.1,0,.6.1,1.1.5,1.5.4.4.9.6,1.4.6s1.1-.3,1.5-.6c.4-.4.6-1,.5-1.5-.2-2.9-.8-7.7-1.7-8.1Z"/>
    <path class="st1" d="M76.8.5c-.2-.1-.4-.2-.6-.2s-.4,0-.7.2c-2.9,1.2-7.3,8.7-7.8,18.3,0,.4.1.9.4,1.2.4.4.8.5,1.3.5.9,0,1.6-.7,1.6-1.6.4-7.1,3-13.1,5.1-14.8,2.1,1.7,4.8,7.8,5.1,14.8,0,1,.8,1.6,1.8,1.6s1.6-.8,1.6-1.7c-.5-9.6-4.9-17-7.8-18.3Z"/>
    <path class="st1" d="M102,18c-1-1.7-2.4-3.9-3.3-5.4,5.2-2.7,4.2-11.9-3.2-11.9h-6.9s0,0,0,0,0,0,0,0h-.1c-.9,0-1.5.7-1.5,1.6s0,0,0,0c0,0,0,0,0,0v16.2h0c0,1,.7,1.8,1.7,1.8,0,0,0,0,0,0h0c.9,0,1.7-.8,1.7-1.7v-1.4h0v-4h5c1.3,2.1,3.1,5,3.9,6.4.3.5.8.8,1.4.8h0c.6,0,1.1-.3,1.4-.9.3-.5.2-1.1,0-1.7ZM95.9,10.2h-5.6V3.9h5.6c3.6,0,3.6,6.3,0,6.3Z"/>
    <path class="st1" d="M21.4,30c0,0-.2-.2-.4-.2h-3.7v-3.1l-1.4,1.4v4.5l1.4,1.4v-3.1h3.7c.2,0,.3-.1.4-.2,0,0,.1-.2.1-.4,0-.2,0-.3-.1-.4Z"/>
    <path class="st1" d="M12.2,29.9s0,0,0,0c-.6-.5-1.1-.8-1.6-.8,0,0-.1,0-.2,0-.7.2-1.3.8-1.7,1.3.4.5,1,1.1,1.7,1.3,0,0,.1,0,.2,0,.5,0,1-.2,1.6-.8,0,0,0,0,0,0l-.5-.5.5-.5Z"/>
    <path class="st1" d="M15.9,28.2v-2l-3.2,3.2-.5.5h0c0,.2,0,.3.1.5,0,.2,0,.4-.1.5h0c0,0,.5.5.5.5l3.2,3.2v-2l-2.2-2.2,2.2-2.2Z"/>
    <path class="st1" d="M80.9,30c0,0,.2-.2.4-.2h3.7v-3.1l1.4,1.4v4.5l-1.4,1.4v-3.1h-3.7c-.2,0-.3-.1-.4-.2,0,0-.1-.2-.1-.4,0-.2,0-.3.1-.4Z"/>
    <path class="st1" d="M90.1,29.9s0,0,0,0c.6-.5,1.1-.8,1.6-.8,0,0,.1,0,.2,0,.7.2,1.3.8,1.7,1.3-.4.5-1,1.1-1.7,1.3,0,0-.1,0-.2,0-.5,0-1-.2-1.6-.8,0,0,0,0,0,0l.5-.5-.5-.5Z"/>
    <path class="st1" d="M86.4,28.2v-2l3.2,3.2.5.5h0c0,.2,0,.3-.1.5,0,.2,0,.4.1.5h0c0,0-.5.5-.5.5l-3.2,3.2v-2l2.2-2.2-2.2-2.2Z"/>
    <text class="st0" transform="translate(24.9 33.1) scale(1 1)"><tspan x="0" y="0">hanging decor</tspan></text>
  </g>
  </g>
</g>

<rect width="1200" height="675" fill="url(#jf-vignette)" pointer-events="none"/>`;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1200 675');
  svg.setAttribute('class', 'brand-film-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = SCENE;
  host.appendChild(svg);
  host.classList.add('is-live');

  function el(tag, attrs){
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- decor library ---------- */
  const TYPES = {
    marigold: { syms:['mari-a','mari-b','mari-c'], spacing:15.5, tassel:true,  string:'rgba(122,80,32,.55)' },
    magenta:  { syms:['mag-a','mag-b','mag-c'],  spacing:17,   tassel:false, string:'rgba(110,72,36,.5)' },
    redgold:  { syms:['mag-b','mag-a'],          spacing:14.5, tassel:false, string:'rgba(122,80,32,.55)', jasmine:true },
    bud:      { syms:['bud'],                    spacing:13.5, tassel:false, string:'rgba(150,128,86,.45)' }
  };

  const FRONT = [
    {x:120,  type:'marigold', len:612, enter:1.88, dur:.72, weight:1.35, amp:.95, side:-1, ring:3, part:3.6, op:.42, ph:8},
    {x:215,  type:'bud',      len:470, enter:1.52, dur:.58, weight:.72,  amp:1.3, side:-1, ring:2, part:6.2, op:.34, ph:6},
    {x:285,  type:'magenta',  len:452, enter:1.22, dur:.64, weight:1.0,  amp:1.1, side:-1, ring:2, part:6.2, op:.34, ph:12},
    {x:340,  type:'marigold', len:560, enter:.85,  dur:.66, weight:1.25, amp:1.0, side:-1, ring:1, part:9,   op:.22, ph:4},
    {x:420,  type:'bud',      len:380, enter:.60,  dur:.55, weight:.7,   amp:1.25,side:-1, ring:1, part:9,   op:.22, ph:11},
    {x:470,  type:'magenta',  len:428, enter:.30,  dur:.62, weight:1.0,  amp:1.2, side:-1, ring:0, part:11,  op:0,   ph:2},
    {x:600,  type:'redgold',  len:355, enter:0,    dur:.58, weight:1.15, amp:1.15,side:1,  ring:0, part:0,   op:0,   ph:1},
    {x:735,  type:'magenta',  len:452, enter:.42,  dur:.60, weight:1.05, amp:1.15,side:1,  ring:0, part:11,  op:0,   ph:3},
    {x:795,  type:'bud',      len:395, enter:.70,  dur:.56, weight:.7,   amp:1.25,side:1,  ring:1, part:9,   op:.22, ph:7},
    {x:858,  type:'marigold', len:584, enter:.97,  dur:.68, weight:1.3,  amp:.95, side:1,  ring:1, part:9,   op:.22, ph:5},
    {x:930,  type:'magenta',  len:446, enter:1.34, dur:.63, weight:1.0,  amp:1.1, side:1,  ring:2, part:6.2, op:.34, ph:9},
    {x:985,  type:'bud',      len:456, enter:1.62, dur:.57, weight:.72,  amp:1.3, side:1,  ring:2, part:6.2, op:.34, ph:13},
    {x:1075, type:'marigold', len:598, enter:2.02, dur:.72, weight:1.35, amp:.9,  side:1,  ring:3, part:3.6, op:.42, ph:10}
  ];
  const BACK = [
    {x:165,  type:'marigold', len:560, enter:1.30, dur:.68, weight:1.2, amp:1.0, side:-1, ring:2, part:5, op:.10, ph:14},
    {x:520,  type:'bud',      len:505, enter:.95,  dur:.6,  weight:.7,  amp:1.2, side:-1, ring:0, part:8, op:.10, ph:15},
    {x:690,  type:'redgold',  len:485, enter:1.10, dur:.62, weight:1.1, amp:1.1, side:1,  ring:0, part:8, op:.10, ph:16},
    {x:1040, type:'marigold', len:545, enter:1.55, dur:.7,  weight:1.2, amp:1.0, side:1,  ring:2, part:5, op:.10, ph:17}
  ];

  const BEAM_Y = 52;
  const backLayer = svg.querySelector('#jf-back-layer');
  const frontLayer = svg.querySelector('#jf-front-layer');
  const hooks = svg.querySelector('#jf-hooks');
  const filterDef = el('filter',{id:'jf-soft-blur',x:'-20%',y:'-20%',width:'140%',height:'140%'});
  filterDef.appendChild(el('feGaussianBlur',{stdDeviation:'3.2'}));
  svg.querySelector('defs').appendChild(filterDef);
  backLayer.setAttribute('filter','url(#jf-soft-blur)');

  function buildGarland(spec, back){
    const t = TYPES[spec.type];
    const scale = back ? .78 : 1;
    const wrapper = el('g', {
      transform:'translate('+spec.x+' '+BEAM_Y+') scale('+scale+')',
      opacity: back ? .5 : 1
    });
    const g = el('g', {});
    wrapper.appendChild(g);
    g.appendChild(el('line',{x1:0,y1:0,x2:0,y2:spec.len, stroke:t.string, 'stroke-width': back ? 1 : 1.3}));
    let y = 11, i = 0;
    while (y < spec.len - (t.tassel ? 30 : 9)){
      const sym = t.syms[(i + spec.ph) % t.syms.length];
      const sc = .9 + (((i*7 + spec.ph*13) % 5) * .045);
      const rot = (((i*37 + spec.ph*53) % 7) - 3);
      const jx = (((i*53 + spec.ph*29) % 9) - 4) * .4;
      const use = el('use',{href:'#jf-'+sym});
      use.setAttribute('transform','translate('+jx.toFixed(2)+' '+y.toFixed(1)+') rotate('+rot+') scale('+sc.toFixed(3)+')');
      g.appendChild(use);
      if (t.jasmine && i % 3 === 2){
        const j = el('use',{href:'#jf-jasmine'});
        const jx2 = (i % 2 ? 5.2 : -5.2);
        j.setAttribute('transform','translate('+jx2+' '+(y+3).toFixed(1)+') scale(.9)');
        g.appendChild(j);
      }
      y += t.spacing; i++;
    }
    if (t.tassel){
      const tas = el('use',{href:'#jf-tassel'});
      tas.setAttribute('transform','translate(0 '+spec.len+')');
      g.appendChild(tas);
    } else {
      const end = el('use',{href:'#jf-'+t.syms[0]});
      end.setAttribute('transform','translate(0 '+ (spec.len-2) +') scale(1.2)');
      g.appendChild(end);
    }
    (back ? backLayer : frontLayer).appendChild(wrapper);
    spec._g = g; spec._wrap = wrapper; spec._back = back;
    spec._period = 1.5 + .32*spec.weight + ((spec.ph % 4) * .07);
    spec._damp = 1.05 + (spec.ph % 3) * .08;
    spec._amp0 = (4.6 + 1.5*spec.weight) * spec.amp;

    // hook on the beam
    if (!back){
      hooks.appendChild(el('path',{
        d:'M0,0 v4.2 a4.4,4.4 0 0 0 4.4,4.4',
        transform:'translate('+spec.x+' '+BEAM_Y+')'
      }));
    }
  }
  FRONT.forEach(s => buildGarland(s,false));
  BACK.forEach(s => buildGarland(s,true));

  /* ---------- timeline (seconds) ----------
     0.00        empty warm space; the beam eases in
     0.85–2.90   garlands lowered in, staggered, swinging, settling
     3.55        the composition parts to make way for the brand
     3.98        the JHALAR logo resolves, then holds perfectly still
     6.20–7.17   soft dissolve: decor, then logo, then beam return to the empty space
     7.17–7.60   the empty space breathes
     7.60        LOOP point — the frame is identical to frame 0, so the
                 film cycles without a visible seam                      */
  const PART_T = 3.55, PART_DUR = .68;
  const LOGO_T = 3.98, LOGO_DUR = .62;
  const OUT_T = 6.20,  DECOR_OUT = .65;   // hold ends; remaining decor dissolves
  const LOGO_OUT_T = 6.40, LOGO_OUT = .70; // the brand is the last thing to go
  const BEAM_OUT_T = 6.72, BEAM_OUT = .45; // the beam lifts away, mirroring its entry
  const LOOP = 7.60;
  const HOLD_FRAME = 5.40;                 // still frame used for reduced motion
  const TAU = Math.PI*2;

  /* ---------- warmth motes ----------
     Every mote's motion is an exact function of (t / LOOP), so the dust
     drifts straight through the loop point without a jump. Each mote
     fades in at the bottom of its rise and out at the top. */
  const motesLayer = svg.querySelector('#jf-motes');
  const motes = [];
  for (let m=0; m<16; m++){
    const c = el('circle',{r:(1.3 + (m%3)*.7).toFixed(1),
      fill: m%4===0 ? 'rgba(200,32,57,.5)' : (m%3===0 ? 'rgba(255,250,241,.9)' : 'rgba(232,175,90,.7)')});
    motesLayer.appendChild(c);
    motes.push({el:c,
      x: 60 + (m*79.3 % 1080),
      y: 150 + (m*131.7 % 400),
      rise: 80 + (m%5)*26,          // px travelled per loop (≈11–25 px/s)
      drift: 14 + (m%4)*7,
      u0: (m*.618) % 1,             // where in its rise this mote starts
      ph: m*1.618
    });
  }

  /* ---------- animation ---------- */
  const beam = svg.querySelector('#jf-beam');
  const floorGlow = svg.querySelector('#jf-floor-glow');
  const logoAnim = svg.querySelector('#jf-logo-anim');
  const logoGlow = svg.querySelector('#jf-logo-glow');

  const clamp = (v,a,b) => Math.min(b, Math.max(a,v));
  const lerp = (a,b,t) => a+(b-a)*t;
  const easeOut = t => 1-Math.pow(1-t,3);
  const easeInOut = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
  // 1 → 0 dissolve envelope starting at t0 lasting d
  const fadeOut = (t,t0,d) => 1 - easeInOut(clamp((t-t0)/d,0,1));

  function frame(t){
    // beam: eases down + fades in at the start, lifts away + fades at the end
    let beamIn = easeOut(clamp(t/.55,0,1));
    let beamOp = clamp((t-.05)/.4,0,1);
    if (t > BEAM_OUT_T){
      const q = fadeOut(t,BEAM_OUT_T,BEAM_OUT);
      beamIn = q; beamOp = Math.min(beamOp,q);
    }
    beam.setAttribute('opacity', beamOp.toFixed(3));
    beam.setAttribute('transform','translate(0 '+(-14*(1-beamIn)).toFixed(2)+')');

    // floor warmth
    floorGlow.setAttribute('opacity', (0.5*clamp((t-.3)/1.1,0,1)*fadeOut(t,OUT_T+.1,.8)).toFixed(3));

    // garlands
    const all = FRONT.concat(BACK);
    for (const s of all){
      const dropStart = .85 + s.enter;
      let y = -(s.len + 70), rot = 0, op = 0;
      if (t >= dropStart){
        const dp = clamp((t-dropStart)/s.dur, 0, 1);
        const e = easeOut(dp);
        y *= (1-e);
        if (dp < 1){
          rot += Math.sin(dp*Math.PI) * s.side * 1.5 * (1 - dp*.35);
        }
        const ts = t - (dropStart + s.dur);
        if (ts >= 0){
          const decay = Math.exp(-ts/s._damp);
          const sway = Math.sin(ts*2*Math.PI/s._period + s.ph*1.7) * s._amp0 * decay;
          // extremely subtle ambient sway on the survivors — settles, never bounces
          const micro = Math.sin(t*.9 + s.ph) * .16 * (1 - decay*.75);
          rot += sway + micro;
        }
        op = s._back ? .5 : 1;
        op *= clamp((t-dropStart)/.32, 0, 1);
      }
      // part toward the edges / make way for the brand
      if (t > PART_T){
        const pp = easeInOut(clamp((t-PART_T)/PART_DUR,0,1));
        rot += s.side * s.part * pp;
        const baseTarget = s._back ? .10 : s.op;
        op = lerp(op, baseTarget, pp);
        if (s._back) op *= .55;
        if (s.ring === 0) y -= 30*pp;
      }
      // the remaining hint of decor dissolves before the loop restarts,
      // outer strands first so the frame empties from the edges inward
      if (t > OUT_T){
        op *= fadeOut(t, OUT_T + (3 - s.ring)*.05, DECOR_OUT);
      }
      s._g.setAttribute('transform','translate(0 '+y.toFixed(2)+') rotate('+rot.toFixed(3)+')');
      s._g.setAttribute('opacity', clamp(op,0,1).toFixed(3));
    }

    // motes — loop-periodic: identical at t=0 and t=LOOP
    const u = t/LOOP;
    // dust quietens while the brand holds, then breathes back before the loop point
    const moteDim = 1 - .9*easeInOut(clamp((t-4.05)/.7,0,1))*fadeOut(t, OUT_T+.2, LOOP-OUT_T-.35);
    for (const m of motes){
      const p = (u + m.u0) % 1;                    // progress along this mote's rise
      const cy = m.y - (p - .5)*m.rise;
      const cx = m.x + Math.sin(u*TAU + m.ph)*m.drift;
      const tw = .55 + .45*Math.sin(u*TAU*2 + m.ph*2);
      const life = Math.sin(p*Math.PI);            // 0 at birth, 1 mid-rise, 0 at end
      m.el.setAttribute('transform','translate('+cx.toFixed(1)+' '+cy.toFixed(1)+')');
      m.el.setAttribute('opacity', (tw*life*moteDim).toFixed(3));
    }

    // brand reveal → still hold → gentle dissolve (the logo never moves while fading)
    if (t < LOGO_T){
      logoAnim.setAttribute('opacity','0');
      logoGlow.setAttribute('opacity','0');
    } else {
      const lp = clamp((t-LOGO_T)/LOGO_DUR,0,1);
      const e = easeOut(lp);
      const out = fadeOut(t, LOGO_OUT_T, LOGO_OUT);
      logoAnim.setAttribute('opacity', (clamp((t-LOGO_T)/.4,0,1)*out).toFixed(3));
      const ty = 16*(1-e), sc = .965 + .035*e;
      logoAnim.setAttribute('transform','translate(600 '+(344+ty).toFixed(2)+') scale('+sc.toFixed(4)+')');
      const glowIn = .6*easeInOut(clamp((t-(LOGO_T-.1))/.7,0,1));
      logoGlow.setAttribute('opacity', (glowIn*fadeOut(t, LOGO_OUT_T-.05, LOGO_OUT+.2)).toFixed(3));
    }
  }

  /* ---------- playback: auto, no controls ----------
     The loop runs only while the footer is on screen and the tab is visible.
     Time is measured from the moment it (re)starts, so every time the footer
     scrolls into view the film begins again from the empty space. */
  let raf = null, origin = null, inView = false;

  function tick(now){
    if (origin === null) origin = now;
    frame(((now - origin)/1000) % LOOP);
    raf = requestAnimationFrame(tick);
  }
  function start(){
    if (raf !== null) return;
    origin = null;
    raf = requestAnimationFrame(tick);
  }
  function stop(){
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
  }
  function sync(){
    if (reduced.matches){ stop(); frame(HOLD_FRAME); return; }
    if (inView && !document.hidden) start(); else stop();
  }

  // opening frame until the footer arrives
  frame(reduced.matches ? HOLD_FRAME : 0);

  // Trigger: the site footer itself. As soon as a slice of the footer is on
  // screen the film starts from the empty room; when the footer leaves, it rests.
  const trigger = host.closest('footer') || host;
  if ('IntersectionObserver' in window){
    new IntersectionObserver(entries => {
      inView = entries.some(e => e.isIntersecting);
      sync();
    }, { threshold: .1 }).observe(trigger);
  } else {
    inView = true; sync();
  }
  document.addEventListener('visibilitychange', sync);
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
})();
