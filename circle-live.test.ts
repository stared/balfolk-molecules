import test from 'node:test';
import assert from 'node:assert/strict';
import { CircleLive } from './circle-live.ts';

const poses = (live: CircleLive, time = 5.5, cycle = 2) =>
  new Map(live.frame(time, cycle).dancers.map(d => [d.id, d]));

test('repeated additions take effect immediately without moving existing people abruptly', () => {
  const live = new CircleLive(8);
  for (let count = 9; count <= 12; count++) {
    const before = poses(live);
    assert.ok(live.change('add', 2, 5.5));
    assert.equal(live.count, count);
    const after = poses(live);
    for (const [id, dancer] of before) {
      assert.equal(after.get(id)?.x, dancer.x);
      assert.equal(after.get(id)?.y, dancer.y);
      assert.equal(after.get(id)?.angle, dancer.angle);
    }
    live.advance(400);
  }
  assert.equal(live.change('add', 2, 5.5), false);
  live.advance(3200);
  assert.equal(live.frame(5.5, 2).dancers.length, 24);
  assert.equal(live.moving, false);
});

test('remove and add can interrupt each other; departures retain their identities until offstage', () => {
  const live = new CircleLive(8);
  const original = poses(live);
  live.change('remove', 2, 5.5);
  live.advance(600);
  const before = poses(live);
  assert.ok(live.change('add', 2, 5.5));
  const after = poses(live);
  for (const [id, dancer] of before) assert.deepEqual([after.get(id)?.x, after.get(id)?.y], [dancer.x, dancer.y]);
  live.advance(3199);
  const ending = poses(live);
  live.advance(1);
  const complete = poses(live);
  assert.equal(complete.size, 16);
  for (const id of original.keys()) {
    if (!complete.has(id)) {
      const dancer = ending.get(id);
      assert.ok(dancer && Math.hypot(dancer.x, dancer.y) > 280);
    }
  }
});

test('empty ring accepts arrivals and a single pair waits for company', () => {
  const live = new CircleLive(0);
  assert.equal(live.change('remove', 0), false);
  assert.ok(live.change('add', 0, 3));
  assert.ok(live.frame(3, 0).dancers.every(d => Math.hypot(d.x, d.y) > 280));
  live.advance(3200);
  assert.equal(live.frame(3, 0).dancers.length, 2);
  assert.deepEqual(live.frame(3, 0).dancers, live.frame(7, 4).dancers);
  assert.ok(live.change('add', 4, 7));
  live.advance(3200);
  assert.equal(live.frame(7, 4).dancers.length, 4);
});

test('transitions end continuously at the active dance phase, including cycle boundaries', () => {
  for (const action of ['add', 'remove'] as const) for (const time of [0, 4.5, 5.5, 7.9]) {
    const live = new CircleLive(8);
    live.change(action, 2, time);
    live.advance(3199.99);
    const before = poses(live, 0.2, 3);
    live.advance(0.01);
    for (const [id, dancer] of poses(live, 0.2, 3)) {
      const previous = before.get(id);
      assert.ok(previous && Math.hypot(dancer.x-previous.x, dancer.y-previous.y) < 0.001);
    }
    for (const hand of live.frame(0.2, 3).hands) {
      assert.ok(hand.dancers.every(index => index >= 0 && index < live.count*2));
    }
  }
});
