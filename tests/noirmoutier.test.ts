import test from 'node:test';
import assert from 'node:assert/strict';
import { noirmoutierFrame as frame } from '../src/dances/noirmoutier.ts';

const lower = (beat: number) => frame(beat / 4).dancers[0]!;
test('Noirmoutier: opposite fronts travel together with a four-count phase offset', () => {
  for (let beat = 0; beat <= 32; beat += 0.125) {
    const state = frame(beat / 4);
    assert.equal(state.dancers.length, 10);
    assert.equal(state.hands.length, 8);
    const upper = state.dancers[5]!;
    const shifted = lower(beat + 4);
    assert.equal(upper.y, -shifted.y);
    assert.equal(upper.weight, shifted.weight);
    for (const [i, dancer] of state.dancers.entries()) {
      assert.ok(Math.abs(dancer.x) < 180 && Math.abs(dancer.y) < 180);
      for (const other of state.dancers.slice(i + 1))
        assert.ok(Math.hypot(dancer.x - other.x, dancer.y - other.y) > 28);
    }
  }
});
test('Noirmoutier: holds and hops retain support, each released turn is a full left turn', () => {
  for (const [beat, weight] of [[0.4,-1],[0.9,1],[1.4,-1],[2.4,1],[3.8,1],[4.4,-1],[5.8,-1],[6.4,1],[7.8,1]])
    assert.equal(lower(beat!).weight, weight);
  assert.equal(lower(3).y, lower(4).y);
  for (const beat of [20,28]) {
    assert.equal(lower(beat+4).angle-lower(beat).angle,-360);
    assert.ok(frame((beat+2)/4).hands.slice(0,4).every(h=>h.reach===0));
  }
  assert.equal(lower(0).angle, lower(16).angle);
});
test('Noirmoutier: positions, facing, support and connections are continuous across cycles', () => {
  assert.deepEqual(frame(8,0),frame(0,1));
  const before=frame(8-1e-6),after=frame(0,1);
  before.dancers.forEach((d,i)=>{
    const next=after.dancers[i]!;
    assert.ok(Math.hypot(d.x-next.x,d.y-next.y)<0.001);
    assert.ok(Math.abs(d.angle-next.angle)<0.001);
  });
});
