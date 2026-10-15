import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('.wearables-test',{recursive:true});
const results=[];
try {
for(const [width,height] of [[600,600],[600,500],[500,600]]) {
 await page.setViewportSize({width,height});await page.goto(process.env.APP_URL||'http://127.0.0.1:5174/');await page.waitForTimeout(500);
 await page.keyboard.press('Enter');await assertSelected('Red');
 await page.keyboard.press('Enter');await assertSelected('Red');
 await page.keyboard.press('ArrowLeft');await page.waitForTimeout(400);await assertCurrent('Rose');
 await page.keyboard.press('Enter');await assertSelected('Rose');
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(400);await assertCurrent('Red');await assertSelected('Rose');
 for(let i=0;i<5;i++) await page.keyboard.press('ArrowRight');
 await page.waitForTimeout(2000);await assertCurrent('Lime');
 await page.getByRole('button',{name:'Lime #92FF00, 선택',exact:true}).click();await assertSelected('Lime');
 await page.keyboard.press('Enter');await assertSelected('Lime');
 const bounds=await page.getByRole('button').evaluateAll(es=>es.map(e=>({label:e.getAttribute('aria-label'),...e.getBoundingClientRect().toJSON()})));
 const fullyVisible=bounds.filter(r=>r.left>=0&&r.right<=width&&r.width>0);
 const partialVisible=bounds.filter(r=>r.right>0&&r.left<width&&r.width>0);
 assert.equal(fullyVisible.length,7); assert.equal(partialVisible.length,7);for(const r of fullyVisible) {assert.ok(r.top>=0&&r.bottom<=height);assert.ok(Math.abs(r.width/r.height-1.5)<.01);}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
 await page.screenshot({path:`.wearables-test/${width}x${height}.png`});
 // Enlarge all authored text via public CSS appearance hooks, preserving the app geometry.
 await page.locator('.color-info > *, .interaction-hints > *').evaluateAll(es => es.forEach(e => {const css=getComputedStyle(e); const size=parseFloat(css.fontSize); const line=parseFloat(css.lineHeight); e.style.fontSize=`${size * 2}px`; if(Number.isFinite(line)) e.style.lineHeight=`${line * 2}px`;}));
 await page.screenshot({path:`.wearables-test/${width}x${height}-text200.png`});
 assert.equal(await page.locator('.color-info > *, .interaction-hints > *').evaluateAll(es=>es.every(e=>e.scrollWidth<=e.clientWidth)), true);
 const text=await page.locator('.color-info').boundingBox();assert.ok(text.x>=0&&text.x+text.width<=width&&text.y+text.height<=height);
 await page.keyboard.press('Escape');await page.getByText('팔레트를 종료했어요').waitFor();
 await page.keyboard.press('ArrowDown');assert.equal(await page.getByRole('button').count(),0);
 results.push({width,height,fullyVisible:fullyVisible.length,intersecting:partialVisible.length,passed:true});
}
assert.deepEqual(errors,[]);await writeFile('.wearables-test/browser-results.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
async function assertCurrent(name){assert.equal(await page.getByRole('heading',{level:1}).textContent(),name);}
async function assertSelected(name){assert.equal(await page.getByText(`선택됨: ${name}`,{exact:true}).count(),1);}
