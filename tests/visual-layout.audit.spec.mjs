import { test, expect } from '@playwright/test';

const viewports = [
  ['320x568',320,568], ['390x844',390,844], ['430x700',430,700],
  ['768x1024',768,1024], ['911x631',911,631], ['1024x768',1024,768],
  ['1187x743',1187,743], ['1366x768',1366,768], ['1440x900',1440,900],
  ['1537x863',1537,863], ['1920x1080',1920,1080]
];

for (const [name,width,height] of viewports) {
  test(`layout safety — ${name}`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height });
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);

    const result = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sections = [...document.querySelectorAll('main > section')];
      const problems = [];

      if (document.documentElement.scrollWidth > vw + 1) problems.push({
        type: 'page-horizontal-overflow',
        scrollWidth: document.documentElement.scrollWidth, vw
      });

      for (let i=0;i<sections.length;i++) {
        const a = sections[i].getBoundingClientRect();
        if (a.height < 2) problems.push({ type:'collapsed-section', section:sections[i].id || sections[i].className });
        const b = sections[i+1]?.getBoundingClientRect();
        if (b && a.bottom > b.top + 1) problems.push({
          type:'section-overlap',
          first:sections[i].id || sections[i].className,
          second:sections[i+1].id || sections[i+1].className,
          pixels:Math.round(a.bottom-b.top)
        });
      }

      for (const el of document.querySelectorAll('body *')) {
        const s=getComputedStyle(el), r=el.getBoundingClientRect();
        if (s.display==='none'||s.visibility==='hidden'||s.position==='fixed'||r.width<2||r.height<2) continue;
        if (r.left < -2 || r.right > vw+2) problems.push({
          type:'element-escapes-viewport', tag:el.tagName, className:el.className,
          left:Math.round(r.left), right:Math.round(r.right), vw
        });
      }
      return problems;
    });

    expect(result, JSON.stringify(result.slice(0,30), null, 2)).toEqual([]);
    await page.screenshot({ path: `test-results/layout-${name}.png`, fullPage:true });
  });
}

test('product popup stays inside viewport', async ({ page, baseURL }) => {
  await page.setViewportSize({ width:1366, height:768 });
  await page.goto(baseURL,{waitUntil:'networkidle'});
  const card=page.locator('.product-card').first();
  if (await card.count()) {
    await card.click();
    const box=await page.locator('.modal-card').evaluate(el=>{
      const r=el.getBoundingClientRect();
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,vw:innerWidth,vh:innerHeight};
    });
    expect(box.left).toBeGreaterThanOrEqual(-1);
    expect(box.top).toBeGreaterThanOrEqual(-1);
    expect(box.right).toBeLessThanOrEqual(box.vw+1);
    expect(box.bottom).toBeLessThanOrEqual(box.vh+1);
  }
});
