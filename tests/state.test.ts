import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CarouselState, MOTION_MS} from '../src/carousel-state.ts';
import {wrapIndex, visibleIndices} from '../src/circular.ts';
import {attachKeyboard} from '../src/input.ts';
import {palette} from '../src/palette.ts';

test('21 unique source colors and seven circular neighbors at every index', () => {
  assert.equal(palette.length, 21); assert.equal(new Set(palette.map(c => c.id)).size, 21);
  for (let i = 0; i < 21; i++) {const visible = visibleIndices(i, 21); assert.equal(new Set(visible).size, 7); assert.equal(visible[3], i);}
  assert.equal(wrapIndex(-1, 21), 20); assert.equal(wrapIndex(21, 21), 0);
});
test('every queued press advances exactly once and wraps both ways', t => {
  t.mock.timers.enable({apis: ['setTimeout']}); const state = new CarouselState(21);
  state.move(-1); assert.equal(state.getSnapshot().currentIndex, 20);
  state.move(1); t.mock.timers.tick(MOTION_MS); assert.equal(state.getSnapshot().currentIndex, 0);
  for(let i=0;i<65;i++) state.move(1);
  for(let i=0;i<66;i++) t.mock.timers.tick(MOTION_MS);
  assert.equal(state.getSnapshot().currentIndex, 2); assert.equal(state.getSnapshot().animating, false); state.dispose();
});
test('selection persists through navigation and same selection, then replaces', t => {
  t.mock.timers.enable({apis: ['setTimeout']}); const state = new CarouselState(21);
  state.select('red'); state.select('red'); state.move(1);
  assert.equal(state.getSnapshot().selectedId, 'red'); state.select('vermilion');
  assert.equal(state.getSnapshot().selectedId, 'vermilion'); state.dispose();
});
test('exit occurs once, cancels queue and timer, and blocks future actions', t => {
  t.mock.timers.enable({apis: ['setTimeout']}); let exits=0; const state = new CarouselState(21, () => exits++);
  state.move(1); state.move(1); state.exit(); state.exit(); state.move(-1); state.select('red'); t.mock.timers.tick(5000);
  assert.equal(exits, 1); assert.deepEqual(state.getSnapshot(), {currentIndex:1,selectedId:null,animating:false,exited:true}); state.dispose();
});
test('unsubscribe and dispose release subscribers and pending work', t => {
  t.mock.timers.enable({apis: ['setTimeout']}); const state=new CarouselState(21); let calls=0;
  const off=state.subscribe(()=>calls++); state.move(1); off(); state.move(1); state.dispose(); const before=calls;
  t.mock.timers.tick(5000); assert.equal(calls,before); assert.equal(state.getSnapshot().currentIndex,1);
});
test('keyboard repeat is ignored, Enter selects once, adapter detaches', () => {
  const target=new EventTarget(); let moved=0, selected=0, exited=0;
  const off=attachKeyboard(target as unknown as Window,{move:d=>moved+=d,select:()=>selected++,exit:()=>exited++});
  function key(key:string, repeat=false) {const event=new Event('keydown',{cancelable:true}); Object.assign(event,{key,repeat});target.dispatchEvent(event);}
  key('ArrowRight'); key('ArrowRight',true);key('ArrowLeft'); key('Enter'); key('Enter',true);key('Escape');
  assert.equal(moved,0);assert.equal(selected,1);assert.equal(exited,1);
  off();key('Enter');key('ArrowDown');assert.equal(selected,1);assert.equal(exited,1);
});
