import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Deterministic captures: reduced motion disables smooth-scroll stitching
// artifacts and CSS transitions while the page is measured and screenshotted.
test.use({ reducedMotion: 'reduce' });

const viewports = [
  ['320x568',320,568],['390x844',390,844],['430x700',430,700],
  ['768x1024',768,1024],['911x631',911,631],['1024x768',1024,768],
  ['1187x743',1187,743],['1366x768',1366,768],['1440x900',1440,900],
  ['1537x863',1537,863],['1920x1080',1920,1080]
];

// Worker-safe reporting: each viewport writes its own partial; the global
// teardown merges all partials into test-results/layout-report.json.
function writePartial(name,width,height,problems){
  fs.mkdirSync('test-results/report-parts',{recursive:true});
  fs.writeFileSync(`test-results/report-parts/${name}.json`,JSON.stringify({name,width,height,problems},null,2));
}

for(const [name,width,height] of viewports){
  test(`layout safety — ${name}`,async({page,baseURL})=>{
    await page.setViewportSize({width,height});
    await page.goto(baseURL,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts?.ready);
    const problems=await page.evaluate(()=>{
      const vw=document.documentElement.clientWidth, out=[];
      if(document.documentElement.scrollWidth>vw+1)out.push({type:'page-horizontal-overflow',scrollWidth:document.documentElement.scrollWidth,vw});
      const sections=[...document.querySelectorAll('main > section')];
      sections.forEach((el,i)=>{
        const a=el.getBoundingClientRect(), b=sections[i+1]?.getBoundingClientRect();
        if(a.height<2)out.push({type:'collapsed-section',section:el.id||el.className});
        if(b&&a.bottom>b.top+1)out.push({type:'section-overlap',first:el.id||el.className,second:sections[i+1].id||sections[i+1].className,pixels:Math.round(a.bottom-b.top)});
      });
      // An element inside a clipping ancestor (overflow-x hidden/auto/scroll/clip)
      // that itself sits within the viewport cannot visually escape the screen —
      // e.g. off-screen items in a horizontal chip rail. Only page-level clips
      // (body/html) do not count, so real breaks are never concealed.
      const isClippedInView=(el)=>{
        for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
          const o=getComputedStyle(p).overflowX;
          if(o==='hidden'||o==='auto'||o==='scroll'||o==='clip'){
            const pr=p.getBoundingClientRect();
            if(pr.left>=-2&&pr.right<=vw+2)return true;
          }
        }
        return false;
      };
      for(const el of document.querySelectorAll('body *')){
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        if(s.display==='none'||s.visibility==='hidden'||s.position==='fixed'||r.width<2||r.height<2)continue;
        if((r.left<-2||r.right>vw+2)&&!isClippedInView(el))out.push({type:'element-escapes-viewport',tag:el.tagName,className:el.className,left:Math.round(r.left),right:Math.round(r.right),vw});
      }
      return out;
    });
    writePartial(name,width,height,problems);
    await page.screenshot({path:`test-results/layout-${name}.png`,fullPage:true});
    expect(problems,JSON.stringify(problems.slice(0,30),null,2)).toEqual([]);
  });
}
