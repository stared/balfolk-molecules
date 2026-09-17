import test from 'node:test';
import assert from 'node:assert/strict';
import { bpmAtPosition, positionAtBpm, defaultBpm } from './tempo.ts';
import { dances } from './dances.ts';

test('logarithmic tempo slider doubles BPM over equal distances', () => {
  assert.equal(bpmAtPosition(0),30);
  assert.equal(bpmAtPosition(1000/3),60);
  assert.equal(bpmAtPosition(2000/3),120);
  assert.equal(bpmAtPosition(1000),240);
  for (let bpm=30;bpm<=240;bpm++) assert.equal(bpmAtPosition(positionAtBpm(bpm)),bpm);
});
test('each dance uses musical beats, including the two-beat bourrée step', () => {
  const expected: Record<string,number>={bourree:96,chapelloise:96,cercle:96,'hanter-dro':90,'an-dro':96,waltz:100,scottish:96,mazurka:90,'tzadik-katamar':120,'drumul-dracului':160};
  for(const dance of dances)assert.equal(defaultBpm(dance),expected[dance.id],dance.id);
});
