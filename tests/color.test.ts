import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lightenHex, displayColor} from '../src/color.ts';
import {palette} from '../src/palette.ts';
test('HSL lightness steps preserve hue and saturate at white',()=>{
  assert.equal(lightenHex('#FF0000',0),'#FF0000');
  assert.equal(lightenHex('#FF0000',1),'#FF1A1A');
  assert.equal(lightenHex('#0000FF',1),'#1A1AFF');
  assert.equal(lightenHex('#92FF00',2),'#A8FF33');
  assert.equal(lightenHex('#FF0000',10),'#FFFFFF');
  assert.equal(lightenHex('#FF0000',20),'#FFFFFF');
});
test('display color modifies only the selection without mutating the palette',()=>{
  const original=JSON.stringify(palette);const red=palette[0],orange=palette[2];
  assert.equal(displayColor(red,'red',1).hex,'#FF1A1A');
  assert.equal(displayColor(orange,'red',1),orange);
  assert.equal(JSON.stringify(palette),original);
});
