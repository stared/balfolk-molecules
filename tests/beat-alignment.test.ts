import test from 'node:test';
import assert from 'node:assert/strict';
import { dances } from '../src/dances/catalog.ts';
import { musicalBeatsPerPhrase } from '../src/engine/timeline.ts';
import { drumulFrame } from '../src/dances/folk-circles.ts';

// Musical counts, not phrase fractions or raw audio onsets. Exercise the
// public dance frames so wrappers cannot accidentally bypass these cues.
for (const [id, contact] of [
  ['bourree', 0.5], ['cercle', 1], ['waltz', 1],
  ['schottische', 0.5], ['mazurka', 2], ['congo-de-captieux', 2],
  ['drumul-dracului', 1], ['tzadik-katamar', 1],
] as const) {
  test(`${id}: support transfer straddles the musical count`, () => {
    const dance = dances.find(d => d.id === id)!;
    const weight = (beat: number) => {
      const frame = dance.frame(beat / musicalBeatsPerPhrase(dance), 0, 5);
      return frame.dancers[0]!.weight ?? frame.weight;
    };
    assert.ok(Math.abs(weight(contact)) < 1e-8);
    assert.ok(weight(contact - 0.05) * weight(contact + 0.05) < 0);
  });
}

test('Drumul stamps prepare before contact and are fully visible on the count', () => {
  for (const beat of [5, 6, 13, 14, 44, 45, 46]) {
    const stamp = (b: number) => {
      const d = drumulFrame(b / 4).dancers[0]!;
      return Math.max(d.stampLeft ?? 0, d.stampRight ?? 0);
    };
    assert.equal(stamp(beat), 1);
    assert.ok(stamp(beat - 0.06) > 0 && stamp(beat - 0.06) < 1);
    assert.equal(stamp(beat + 0.5), 0);
  }
});
