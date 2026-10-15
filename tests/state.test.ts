import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CarouselState, MOTION_MS, SCENE_MS} from '../src/carousel-state.ts';
import {wrapIndex, visibleIndices} from '../src/circular.ts';
import {attachKeyboard} from '../src/input.ts';
import {attachLifecycle} from '../src/lifecycle.ts';
import {palette} from '../src/palette.ts';
import {archLayout, ARCH} from '../src/layout.ts';

test('preserved 21-color data and exactly seven distinct circular neighbors', () => {
  assert.equal(palette.length,21); assert.equal(new Set(palette.map(c=>c.id)).size,21);
  assert.equal(palette[0].hex,'#FF0000');assert.equal(palette[20].hex,'#FF0049');
  for(let i=0;i<21;i++) {const indices=visibleIndices(i,21);assert.equal(new Set(indices).size,7);assert.equal(indices[3],i);}
  assert.equal(wrapIndex(-1,21),20);assert.equal(wrapIndex(21,21),0);
});
test('Figma geometry, depth order and responsive vertical safety', () => {
  assert.deepEqual(ARCH.x.slice(0,4),[0,83,150,204]);assert.deepEqual(ARCH.y.slice(0,4),[0,7,23,43]);
  const center=archLayout(0,600,320);assert.equal(center.width,144);
  for(const [width,height] of [[600,320],[500,180],[500,120]]) {
    let previous=Infinity;
    for(let slot=0;slot<=3;slot++) {const g=archLayout(slot,width,height);assert.ok(g.scale<previous);previous=g.scale;assert.equal(g.zIndex,10-slot);assert.ok(g.centerY+g.y+g.width*1.5*g.scale/2<height);}
  }
});
test('start/carousel/ending transitions lock duplicate activation and preserve selection', t=>{
  t.mock.timers.enable({apis:['setTimeout']});const s=new CarouselState(21);
  s.move(1);s.exit();s.select('red');assert.equal(s.getSnapshot().phase,'start');assert.equal(s.getSnapshot().selectedId,null);
  s.activate('red');s.activate('red');s.move(1);assert.equal(s.getSnapshot().phase,'carousel');assert.equal(s.getSnapshot().selectedId,null);
  t.mock.timers.tick(SCENE_MS);s.select('red');s.exit();s.activate('red');assert.equal(s.getSnapshot().phase,'ending');
  t.mock.timers.tick(SCENE_MS);s.activate('red');s.activate('red');assert.equal(s.getSnapshot().phase,'start');assert.equal(s.getSnapshot().selectedId,'red');
  t.mock.timers.tick(SCENE_MS);s.activate('red');assert.equal(s.getSnapshot().phase,'carousel');s.dispose();
});
test('every queued press advances once, including 65 rapid presses and both wraps', t=>{
  t.mock.timers.enable({apis:['setTimeout']});const s=new CarouselState(21);s.activate('red');t.mock.timers.tick(SCENE_MS);
  s.move(-1);assert.equal(s.getSnapshot().currentIndex,20);s.move(1);t.mock.timers.tick(MOTION_MS);assert.equal(s.getSnapshot().currentIndex,0);
  for(let i=0;i<65;i++)s.move(1);for(let i=0;i<66;i++)t.mock.timers.tick(MOTION_MS);
  assert.equal(s.getSnapshot().currentIndex,2);assert.equal(s.getSnapshot().animating,false);s.dispose();
});
test('selection is idempotent, persists while moving, and is replaced', t=>{
  t.mock.timers.enable({apis:['setTimeout']});const s=new CarouselState(21);s.activate('red');t.mock.timers.tick(SCENE_MS);
  s.select('red');const before=s.getSnapshot();s.select('red');assert.equal(s.getSnapshot(),before);s.move(1);assert.equal(s.getSnapshot().selectedId,'red');s.select('vermilion');assert.equal(s.getSnapshot().selectedId,'vermilion');s.dispose();
});
test('exit fires once and cancels all movement before the ending screen', t=>{
  t.mock.timers.enable({apis:['setTimeout']});let exits=0;const s=new CarouselState(21,()=>exits++);s.activate('red');t.mock.timers.tick(SCENE_MS);
  s.move(1);s.move(1);s.exit();s.exit();s.move(-1);t.mock.timers.tick(5000);
  assert.equal(exits,1);assert.equal(s.getSnapshot().currentIndex,1);assert.equal(s.getSnapshot().phase,'ending');assert.equal(s.getSnapshot().animating,false);s.dispose();
});
test('cancel, unsubscribe and dispose release work and prevent late updates', t=>{
  t.mock.timers.enable({apis:['setTimeout']});const s=new CarouselState(21);s.activate('red');t.mock.timers.tick(SCENE_MS);let calls=0;const off=s.subscribe(()=>calls++);
  s.move(1);s.move(1);off();s.dispose();const before=calls;t.mock.timers.tick(5000);s.move(1);s.activate('red');assert.equal(calls,before);assert.equal(s.getSnapshot().currentIndex,1);
});
test('keyboard phase routing, held/repeat suppression, native click prevention and cleanup',()=>{
  const target=new EventTarget();let phase:'start'|'carousel'|'ending'='start',activated=0,moved=0,exited=0,lightened=0;
  const off=attachKeyboard(target as unknown as Window,{phase:()=>phase,move:d=>moved+=d,lighten:()=>lightened++,activate:()=>activated++,exit:()=>exited++});
  function event(type:string,key:string,repeat=false){const e=new Event(type,{cancelable:true});Object.assign(e,{key,repeat});target.dispatchEvent(e);return e;}
  function press(key:string){const e=event('keydown',key);event('keyup',key);return e;}
  assert.equal(press(' ').defaultPrevented,true);assert.equal(activated,1);press('ArrowLeft');assert.equal(moved,0);
  phase='carousel';event('keydown','Enter');event('keydown','Enter',true);event('keydown','Enter');assert.equal(activated,2);event('keyup','Enter');
  press('ArrowRight');press('ArrowLeft');assert.equal(moved,0);event('keydown','ArrowUp');event('keydown','ArrowUp',true);event('keyup','ArrowUp');assert.equal(lightened,1);press('Escape');assert.equal(exited,1);
  phase='ending';press(' ');assert.equal(activated,2);press('Enter');assert.equal(activated,3);
  off();press('Enter');assert.equal(activated,3);
});
test('standard lifecycle suspends on hide and detaches listeners',()=>{
  const doc=Object.assign(new EventTarget(),{hidden:false});const win=new EventTarget();let suspends=0;
  const off=attachLifecycle(doc as unknown as Document,win as unknown as Window,()=>suspends++);
  doc.dispatchEvent(new Event('visibilitychange'));assert.equal(suspends,0);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));win.dispatchEvent(new Event('pagehide'));assert.equal(suspends,2);
  off();win.dispatchEvent(new Event('pagehide'));doc.dispatchEvent(new Event('visibilitychange'));assert.equal(suspends,2);
});

test('lightness changes only after selection, caps at white, persists and resets for a new color', t=>{
  t.mock.timers.enable({apis:['setTimeout']});const s=new CarouselState(21);
  s.lighten();assert.equal(s.getSnapshot().lightnessSteps,0);
  s.activate('red');t.mock.timers.tick(SCENE_MS);s.lighten();assert.equal(s.getSnapshot().lightnessSteps,0);
  s.select('red');s.lighten();assert.equal(s.getSnapshot().lightnessSteps,1);
  s.move(1);s.lighten();assert.equal(s.getSnapshot().selectedId,'red');assert.equal(s.getSnapshot().lightnessSteps,2);
  s.select('red');assert.equal(s.getSnapshot().lightnessSteps,2);
  for(let i=0;i<20;i++)s.lighten();assert.equal(s.getSnapshot().lightnessSteps,10);
  const capped=s.getSnapshot();s.lighten();assert.equal(s.getSnapshot(),capped);
  s.exit();s.lighten();assert.equal(s.getSnapshot().lightnessSteps,10);
  t.mock.timers.tick(SCENE_MS);s.activate('red');t.mock.timers.tick(SCENE_MS);s.activate('red');t.mock.timers.tick(SCENE_MS);
  assert.equal(s.getSnapshot().lightnessSteps,10);s.select('vermilion');assert.equal(s.getSnapshot().lightnessSteps,0);s.dispose();
});
