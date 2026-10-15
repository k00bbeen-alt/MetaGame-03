import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('.wearables-test',{recursive:true});const results=[];
const url=process.env.APP_URL||'http://127.0.0.1:5175/';
const settle=()=>page.waitForTimeout(210);
async function phase(expected){assert.equal(await page.locator('#root').getAttribute('data-phase'),expected);}
async function current(name){assert.equal(await page.locator('.color-info h1').textContent(),name);}
async function selected(name){assert.ok((await page.locator('.selection-label').textContent()).includes(name));}
async function seven(){
 assert.equal(await page.locator('.color-card').count(),7);
 const bounds=await page.locator('.color-card').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),css=getComputedStyle(e);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:parseFloat(css.width),height:parseFloat(css.height),opacity:css.opacity,display:css.display,z:css.zIndex,disabled:e.disabled};}));
 const viewport=page.viewportSize();
 for(const r of bounds){assert.ok(r.x>=0&&r.y>=0&&r.right<=viewport.width&&r.bottom<=viewport.height,JSON.stringify(r));assert.ok(Math.abs(r.width/r.height-2/3)<.001);assert.equal(r.opacity,'1');assert.notEqual(r.display,'none');}
 assert.equal(bounds.filter(r=>!r.disabled).length,1);
 assert.equal(await page.locator('.color-card[data-slot="0"]').evaluate(e=>getComputedStyle(e).zIndex),'10');
}
async function sampleMotion(duration){
 return page.evaluate(duration=>new Promise(resolve=>{
  const started=performance.now();let frames=0,failures=[];
  function sample(){
   const cards=[...document.querySelectorAll('.color-card')];
   if(document.querySelector('#root').dataset.phase==='carousel'){
    if(cards.length!==7)failures.push(`count=${cards.length}`);
    for(const card of cards){const r=card.getBoundingClientRect();if(r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight)failures.push('card outside viewport');if(getComputedStyle(card).opacity!=='1')failures.push('invisible card');
     let exposed=false;
     for(let gx=0;gx<5&&!exposed;gx++)for(let gy=0;gy<5&&!exposed;gy++){
       const hit=document.elementFromPoint(r.left+r.width*(gx+.5)/5,r.top+r.height*(gy+.5)/5);
       if(hit?.closest('.color-card')===card)exposed=true;
     }
     if(!exposed)failures.push(`fully occluded ${card.dataset.colorId}`);}
    frames++;
   }
   if(performance.now()-started<duration)requestAnimationFrame(sample);else resolve({frames,failures});
  }sample();
 }),duration);
}
async function screenshot(name){await page.screenshot({path:`.wearables-test/${name}.png`});}
async function textFits(){assert.equal(await page.locator('.wordmark, .wordmark-number, .wordmark-label, .color-info, .color-info > *, .ending-content, .ending-content > *, .screen-cue, .interaction-hints').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width===0||(r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1);})),true);}
try {
 for(const [width,height] of [[600,600],[600,500],[500,600]]) {
  await page.setViewportSize({width,height});await page.goto(url);await settle();await phase('start');
  assert.equal(await page.locator('.wordmark-number').textContent(),'21');assert.equal(await page.locator('.wordmark-label').textContent(),'color card');
  await textFits();await screenshot(`${width}x${height}-start`);
  // Held key stays one activation across the state transition.
  await page.keyboard.down('Enter');await settle();await page.keyboard.down('Enter');await page.keyboard.up('Enter');await phase('carousel');
  assert.equal(await page.locator('.selection-label.has-selection').count(),0);await current('Red');await seven();await screenshot(`${width}x${height}-carousel`);
  await page.keyboard.press('Enter');assert.equal(await page.locator('.color-card.is-selected').count(),1);await page.keyboard.press('Enter');assert.equal(await page.locator('.color-card.is-selected').count(),1);
  await page.keyboard.press('ArrowLeft');const motion=await sampleMotion(360);assert.deepEqual(motion.failures,[]);await current('Rose');await seven();await selected('Red');
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(330);await current('Red');await seven();
  for(let i=0;i<5;i++)await page.keyboard.press('ArrowRight');const rapid=await sampleMotion(1600);assert.deepEqual(rapid.failures,[]);await current('Lime');await seven();
  await page.locator('.color-card[data-slot="0"]').click();assert.equal(await page.locator('.color-card.is-selected').getAttribute('data-color-id'),'lime');
  await page.keyboard.press('ArrowDown');await phase('ending');await page.keyboard.press('Enter');await phase('ending');await settle();await textFits();await screenshot(`${width}x${height}-ending`);
  assert.ok((await page.locator('.ending-color').textContent()).includes('Lime'));
  await page.keyboard.press('Enter');await phase('start');await settle();
  // Space starts; a touch elsewhere on the screen also starts after returning.
  await page.keyboard.press(' ');await phase('carousel');await settle();await page.keyboard.press('Escape');await settle();
  await page.locator('.scene-ending').click();await phase('start');await settle();
  await page.mouse.click(1,1);await phase('carousel');await settle();await seven();
  // Exact 200% root text size; preserve viewport geometry.
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.waitForTimeout(200);await seven();await textFits();await screenshot(`${width}x${height}-carousel-text200`);
  await page.keyboard.press('Escape');await settle();await textFits();await screenshot(`${width}x${height}-ending-text200`);
  await page.keyboard.press('Enter');await settle();await textFits();
  const mark=await page.locator('.wordmark').boundingBox(), cue=await page.locator('.screen-cue').boundingBox();assert.ok(mark.y+mark.height<=cue.y);
  await screenshot(`${width}x${height}-start-text200`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(0, 0, 0)');
  results.push({width,height,passed:true,sevenCardsDuringMotionFrames:motion.frames+rapid.frames,textScale:200,scenes:['start','carousel','ending']});
 }
 // All 21 positions and both wrap seams, with reduced motion.
 await page.setViewportSize({width:600,height:600});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(url);await page.keyboard.press(' ');await settle();
 for(let index=0;index<21;index++){await seven();await page.keyboard.press('ArrowRight');await page.waitForTimeout(310);}
 await current('Red');await seven();
 // Background suspension drops pending inputs instead of resuming stale work.
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.waitForTimeout(700);await current('Vermilion');
 const touchContext=await browser.newContext({viewport:{width:600,height:500},hasTouch:true});const touchPage=await touchContext.newPage();await touchPage.goto(url);await touchPage.touchscreen.tap(10,10);await touchPage.waitForTimeout(210);assert.equal(await touchPage.locator('#root').getAttribute('data-phase'),'carousel');await touchPage.keyboard.press('Escape');await touchPage.waitForTimeout(210);await touchPage.touchscreen.tap(300,250);assert.equal(await touchPage.locator('#root').getAttribute('data-phase'),'start');await touchContext.close();
 assert.deepEqual(errors,[]);await writeFile('.wearables-test/browser-results.json',JSON.stringify({url,results,fullCycle:true,backgroundCancellation:true,errors},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
