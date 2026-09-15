import test from 'node:test';
import assert from 'node:assert/strict';
import { frame } from './movement.js';
import { rhythmAt, stepTravel, phraseTravel } from './rhythm.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('three alternating weight transfers followed by a sustained interval', () => {
  for (let step = 0; step < 4; step++) {
    const feet = [0.15, 0.4, 0.65].map(phase => rhythmAt((step + phase) / 4).left ? 'L' : 'R').join('');
    assert.equal(feet, step % 2 ? 'RLR' : 'LRL');
  }
  assert.equal(rhythmAt(0.75 / 4).weight, rhythmAt(0.99 / 4).weight);
  assert.ok(stepTravel(0.99) > stepTravel(0.75), 'Body keeps flowing while the support is sustained');
});

test('large and small steps join with continuous velocity', () => {
  const stops = [0, 0.46, 0.5, 0.96, 1];
  const epsilon = 1e-6;
  for (const time of [0.25, 0.5, 0.75]) {
    const before = (phraseTravel(time, stops) - phraseTravel(time - epsilon, stops)) / epsilon;
    const after = (phraseTravel(time + epsilon, stops) - phraseTravel(time, stops)) / epsilon;
    assert.ok(Math.abs(before - after) < 0.0001);
    assert.ok(before > 0, 'No hard stop between steps');
  }
});

test('edge dancers meet with a small second step and face each other', () => {
  const edges = frame(4).dancers.map((d, i) => !d.middle ? i : -1).filter(i => i >= 0);
  for (const i of edges) {
    const a = frame(4).dancers[i];
    const b = frame(4.25).dancers[i];
    const c = frame(4.5).dancers[i];
    assert.ok(distance(a, b) > 8 * distance(b, c));
    const d = frame(4.375).dancers[i];
    const partner = edges.filter(j => j !== i).map(j => frame(4.375).dancers[j]).sort((a, b) => distance(a, d) - distance(b, d))[0];
    const angle = d.angle * Math.PI / 180;
    const alignment = ((partner.x - d.x) * Math.sin(angle) - (partner.y - d.y) * Math.cos(angle)) / distance(d, partner);
    assert.ok(alignment > 0.95);
  }
});

test('steps and repeated cycles preserve dancer positions without teleporting', () => {
  for (let cycle = 0; cycle < 3; cycle++) {
    frame(8, cycle).dancers.forEach((d, i) => assert.ok(distance(d, frame(0, cycle + 1).dancers[i]) < 1e-7));
    for (let time = 0.25; time < 8; time += 0.25) {
      frame(time - 1e-7, cycle).dancers.forEach((d, i) => assert.ok(distance(d, frame(time, cycle).dancers[i]) < 0.001));
    }
  }
});

test('passing paths keep bodies apart and handholds reference existing dancers', () => {
  for (let time = 0; time <= 8; time += 0.002) {
    const state = frame(time);
    for (let i = 0; i < 6; i++) {
      assert.ok([state.dancers[i].x, state.dancers[i].y, state.dancers[i].angle].every(Number.isFinite));
      for (let j = i + 1; j < 6; j++) assert.ok(distance(state.dancers[i], state.dancers[j]) > 28);
    }
    for (const pair of state.hands) assert.ok(pair.every(i => i >= 0 && i < 6));
  }
});
