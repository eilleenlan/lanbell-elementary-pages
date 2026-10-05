const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const base = path.resolve(__dirname, '../..');
const server = http.createServer((req,res) => {
  const file = path.join(base, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file,(error,buffer)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(buffer);});
});
(async()=>{
  await new Promise(resolve=>server.listen(8175,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,channel:"msedge"});
  const page = await browser.newPage();
  const results=[];
  try {
    for(const width of [320,375,1280]) {
      await page.setViewportSize({width,height:900});
      for(const route of ['/','/overview','/calendar','/book-covers']) {
        await page.goto('http://127.0.0.1:8175/#'+route);
        await page.locator('.school-level-switch').waitFor();
        const info=await page.evaluate(()=>{
          const sw=document.querySelector('.school-level-switch');
          const current=sw.querySelector('[aria-current="true"]');
          const link=sw.querySelector('a');
          return {overflow:sw.scrollWidth>sw.clientWidth, pageOverflow:document.documentElement.scrollWidth>innerWidth,current:current.textContent,currentTag:current.tagName,href:link.href,height:link.getBoundingClientRect().height,currentHeight:current.getBoundingClientRect().height,position:getComputedStyle(sw).position,target:link.target};
        });
        assert.equal(info.overflow,false);assert.equal(info.pageOverflow,false);
        assert.equal(info.current,'🔔 小學鈴噹你在這裡');assert.equal(info.currentTag,'SPAN');
        assert.equal(info.href,'https://eilleenlan.github.io/lanbell/#/');assert.equal(info.target,'');
        assert.ok(info.height>=52&&info.currentHeight>=52);assert.equal(info.position,'static');
        if(width<900){await page.locator('.menu-button').click();assert.ok(await page.locator('nav').evaluate(el=>el.classList.contains('open')));assert.ok(await page.locator('.school-level-switch').isVisible());await page.locator('.menu-button').click();}
        results.push({width,route,...info});
      }
      await page.goto('http://127.0.0.1:8175/#/');
      await page.locator('.school-level-switch').waitFor();
      await page.locator('.school-level-current').evaluate(el=>el.previousElementSibling); // current remains a noninteractive span
      await page.locator('.brand').focus();
      let reached=false;
      for(let i=0;i<8;i++){await page.keyboard.press('Tab');if(await page.locator('.school-level-switch > a').evaluate(el=>el===document.activeElement)){reached=true;break;}}
      assert.ok(reached);
      assert.equal(await page.locator('.school-level-switch > a').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
      await page.screenshot({path:path.join(__dirname,width+'.png'),fullPage:false});
    }
    if (process.env.CHECK_LIVE) try {
      await page.locator('.school-level-switch > a').click();
      await page.waitForURL('https://eilleenlan.github.io/lanbell/#/');
      await page.goBack();
      await page.locator('.school-level-switch').waitFor();
      results.push({localToJuniorAndBack:'passed'});
      await page.goto('https://eilleenlan.github.io/lanbell-elementary-pages/#/');
      results.push({publishedElementarySwitch:await page.locator('.school-level-switch').count()});
      await page.goto('https://eilleenlan.github.io/lanbell/#/');
      results.push({publishedJuniorElementaryLinks:await page.locator('a[href="https://eilleenlan.github.io/lanbell-elementary-pages/#/"]').count()});
    } catch(error) {results.push({liveNavigationError:error.message});}
    fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

