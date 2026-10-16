import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:600,height:600}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const results=[];
const url=process.env.APP_URL||'http://127.0.0.1:5175/';
async function settle(){await page.waitForTimeout(340);}
async function inspect(scene, scale){
  const result=await page.evaluate(()=>{
    const texts=[];const walker=document.createTreeWalker(document.querySelector('#root'),NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;if(!node.textContent.trim())continue;
      const element=node.parentElement, css=getComputedStyle(element);
      const range=document.createRange();range.selectNodeContents(node);const rect=range.getBoundingClientRect();
      if(!rect.width||!rect.height||css.visibility!=='visible')continue;
      let factor=1;
      for(let ancestor=element;ancestor;ancestor=ancestor.parentElement){const transform=getComputedStyle(ancestor).transform;if(transform!=='none'){const matrix=new DOMMatrixReadOnly(transform);factor*=Math.hypot(matrix.a,matrix.b);}}
      texts.push({text:node.textContent.trim(),fontSize:parseFloat(css.fontSize),renderedFontSize:parseFloat(css.fontSize)*factor,inBounds:rect.left>=0&&rect.top>=0&&rect.right<=innerWidth&&rect.bottom<=innerHeight});
    }
    const root=document.querySelector('#root').getBoundingClientRect();
    const info=document.querySelector('.color-info')?.getBoundingClientRect(), hints=document.querySelector('.interaction-hints')?.getBoundingClientRect();
    const content=document.querySelector('.wordmark, .ending-content')?.getBoundingClientRect(), cue=document.querySelector('.screen-cue')?.getBoundingClientRect();
    const cards=[...document.querySelectorAll('.color-card')].map(e=>e.getBoundingClientRect());
    return {texts,stage:{width:root.width,height:root.height},overlap:!!((info&&hints&&info.bottom>hints.top)||(content&&cue&&content.bottom>cue.top)),cardsContained:cards.every(r=>r.left>=root.left&&r.right<=root.right&&r.top>=root.top&&r.bottom<=root.bottom)};
  });
  for(const text of result.texts){assert.ok(text.fontSize>=18,JSON.stringify(text));assert.ok(text.renderedFontSize>=17.95,JSON.stringify(text));assert.equal(text.inBounds,true,JSON.stringify(text));}
  assert.deepEqual(result.stage,{width:600,height:600});assert.equal(result.overlap,false);assert.equal(result.cardsContained,true);
  const minimum=Math.min(...result.texts.map(t=>t.fontSize));
  results.push({scene,scale,minimumFontPx:minimum,passed:true});
  await page.screenshot({path:`.wearables-test/qa-${scene}-${scale}.png`});
}
try {
  await mkdir('.wearables-test',{recursive:true});await page.goto(url);await settle();
  const meta=await page.locator('meta[name="viewport"]').evaluateAll(es=>es.map(e=>e.content));
  assert.equal(meta.length,1);assert.match(meta[0],/(?:^|,)\s*width=600(?:,|$)/);assert.match(meta[0],/(?:^|,)\s*height=600(?:,|$)/);assert.match(meta[0],/initial-scale=1\.0/);assert.ok(!meta[0].includes('device-width'));
  for(const scale of [100,200]){
    await page.goto(url);await page.evaluate(scale=>{document.documentElement.style.fontSize=`${scale}%`;},scale);await settle();
    await inspect('start',scale);await page.keyboard.press('Enter');await settle();await inspect('carousel',scale);
    await page.keyboard.press('Enter');await page.keyboard.press('ArrowUp');await settle();await inspect('selected',scale);
    for(let i=0;i<3;i++){await page.keyboard.press('ArrowLeft');await settle();}
    await inspect('selected-at-edge',scale);
    await page.keyboard.press('Escape');await settle();await inspect('ending',scale);
  }
  // Desktop window changes the surround, not the 600-unit app stage.
  await page.setViewportSize({width:1440,height:900});await page.goto(url);await settle();await inspect('desktop-fixed-stage',100);
  assert.deepEqual(errors,[]);
  await writeFile('.wearables-test/display-qa.json',JSON.stringify({url,viewport:meta[0],results,errors},null,2));
  console.log(JSON.stringify({viewport:meta[0],results,errors},null,2));
}finally{await browser.close();}
