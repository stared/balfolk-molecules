import { itemAt } from './indexed.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { frame } from './movement.ts';
import type { Position } from './movement.ts';
import { rhythmAt, stepTravel, phraseTravel } from './rhythm.ts';

const distance = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

test('three alternating weight transfers followed by a sustained interval', () => {
  for (let step = 0; step < 4; step++) {
    const feet = [0.15, 0.4, 0.65].map(phase => rhythmAt((step + phase) / 4).left ? 'L' : 'R').join('');
    assert.equal(feet, step % 2 ? 'RLR' : 'LRL');
  }
  assert.equal(rhythmAt(0.75 / 4).weight, rhythmAt(0.99 / 4).weight);
  assert.ok(stepTravel(0.99) > stepTravel(0.75), 'Body keeps flowing while the support is sustained');
});

test('large and small steps join with continuous velocity', () => {
  const stops = [0, 0.46, 0.5, 0.96, 1] as const;
  const epsilon = 1e-6;
  for (const time of [0.25, 0.5, 0.75]) {
    const before = (phraseTravel(time, stops) - phraseTravel(time - epsilon, stops)) / epsilon;
    const after = (phraseTravel(time + epsilon, stops) - phraseTravel(time, stops)) / epsilon;
    assert.ok(Math.abs(before - after) < 0.0001);
    assert.ok(before > 0, 'No hard stop between steps');
  }
});

test('edge dancers meet with a small second step and face each other', () => {
  const edges = frame(4).dancers.map((d, i) => d.slot !== 1 && d.slot !== 4 ? i : -1).filter(i => i >= 0);
  for (const i of edges) {
    const a = itemAt(frame(4).dancers, i);
    const b = itemAt(frame(4.25).dancers, i);
    const c = itemAt(frame(4.5).dancers, i);
    assert.ok(distance(a, b) > 8 * distance(b, c));
    const d = itemAt(frame(4.375).dancers, i);
    const partner = edges.filter(j => j !== i).map(j => itemAt(frame(4.375).dancers, j)).sort((a, b) => distance(a, d) - distance(b, d))[0];
    assert.ok(partner);
    const angle = d.angle * Math.PI / 180;
    const alignment = ((partner.x - d.x) * Math.sin(angle) - (partner.y - d.y) * Math.cos(angle)) / distance(d, partner);
    assert.ok(alignment > 0.95);
  }
});

test('steps and repeated cycles preserve dancer positions without teleporting', () => {
  for (let cycle = 0; cycle < 3; cycle++) {
    frame(8, cycle).dancers.forEach((d, i) => assert.ok(distance(d, itemAt(frame(0, cycle + 1).dancers, i)) < 1e-7));
    for (let time = 0.25; time < 8; time += 0.25) {
      frame(time - 1e-7, cycle).dancers.forEach((d, i) => assert.ok(distance(d, itemAt(frame(time, cycle).dancers, i)) < 0.001));
    }
  }
});

test('every dancer occupies the middle once across three cycles', () => {
  for (let id = 0; id < 6; id++) {
    const positions = [0, 1, 2].map(cycle => itemAt(frame(4, cycle).dancers, id).slot);
    assert.equal(positions.filter(slot => slot === 1 || slot === 4).length, 1);
    assert.equal(new Set(positions).size, 3);
  }
});

test('passing paths keep bodies apart and handholds reference existing dancers', () => {
  for (let time = 0; time <= 8; time += 0.002) {
    const state = frame(time);
    for (let i = 0; i < 6; i++) {
      assert.ok([itemAt(state.dancers, i).x, itemAt(state.dancers, i).y, itemAt(state.dancers, i).angle].every(Number.isFinite));
      for (let j = i + 1; j < 6; j++) assert.ok(distance(itemAt(state.dancers, i), itemAt(state.dancers, j)) > 28);
    }
    for (const pair of state.hands) assert.ok(pair.every(i => i >= 0 && i < 6));
  }
});
