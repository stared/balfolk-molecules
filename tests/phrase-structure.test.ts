import test from 'node:test';
import assert from 'node:assert/strict';
import { phraseBeats, phraseSpans, phraseRepeats } from '../src/engine/phrase-structure.ts';
import { dances } from '../src/dances/catalog.ts';

test('nested dance structures cover the playback duration at every displayed level', () => {
  for (const dance of dances) {
    if (!dance.structure) continue;
    const total = dance.duration * (dance.beatsPerPhrase ?? dance.countsPerPhrase ?? 4);
    assert.equal(phraseBeats(dance.structure.phrase), total);
    const spans = phraseSpans(dance.structure.phrase);
    for (const depth of new Set(spans.map(span => span.depth))) {
      let end = 0;
      for (const span of spans.filter(span => span.depth === depth)) {
        assert.equal(span.start, end);
        assert.ok(span.beats > 0);
        end += span.beats;
      }
      assert.equal(end, total);
    }
    assert.deepEqual(spans.filter(span => span.depth === 1).map(span => span.start), [0,8,16,24]);
  }
});

test('Noirmoutier preserves the two repeat groups above the four occurrences', () => {
  const dance = dances.find(d => d.id === 'branle-de-noirmoutier')!;
  assert.deepEqual(phraseRepeats(dance.structure!.phrase).map(({start,beats,times}) => ({start,beats,times})), [
    {start:0,beats:16,times:2}, {start:16,beats:16,times:2},
  ]);
});
