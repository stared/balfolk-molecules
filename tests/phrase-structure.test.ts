import test from 'node:test';
import assert from 'node:assert/strict';
import { phraseBeats, phraseSpans, phraseRepeats } from '../src/engine/phrase-structure.ts';
import type { Phrase } from '../src/engine/phrase-structure.ts';
import { dances } from '../src/dances/catalog.ts';
import { timelineTicks, musicalBeatsPerPhrase } from '../src/engine/timeline.ts';

const expected = {
  bourree: {beats:64, starts:[0,8,16,24,32,40,48,56]},
  chapelloise: {beats:32, starts:[0,8,16,24]},
  cercle: {beats:64, starts:[0,8,16,24,32]},
  'branle-de-noirmoutier': {beats:32, starts:[0,8,16,24]},
  waltz: {beats:6, starts:[0,3]},
  scottish: {beats:8, starts:[0,4]},
  mazurka: {beats:12, starts:[0,6]},
  'hanter-dro': {beats:12, starts:[0,3,6,9]},
  'an-dro': {beats:16, starts:[0,4,8,12]},
  'tzadik-katamar': {beats:48, starts:[0,8,16,32]},
  'drumul-dracului': {beats:64, starts:[0,16,32,48]},
};
for (const dance of dances) test(`${dance.title}: audited duration and phrase boundaries`,()=>{
  assert.ok(dance.structure, 'Every catalog entry must have a structure');
  assert.ok(dance.origin);
  const score = dance.structure.phrase;
  const reference = expected[dance.id as keyof typeof expected];
  assert.ok(reference);
  assert.equal(phraseBeats(score), reference.beats);
  assert.equal(phraseBeats(score), dance.duration * musicalBeatsPerPhrase(dance));
  const spans = phraseSpans(score);
  assert.deepEqual(spans.filter(span=>span.depth===1).map(span=>span.start),reference.starts);
  for (const depth of [1,2]) {
    let end=0;
    for (const span of spans.filter(span=>span.depth===depth)) {
      assert.equal(span.start,end, 'No gaps or overlaps in either displayed row');
      assert.ok(span.beats>0);
      assert.ok(!/[+×]/.test(span.name),'Titles name phrases, not expressions');
      end+=span.beats;
    }
    assert.equal(end,reference.beats);
  }
  for (const repeat of phraseRepeats(score)) {
    assert.ok(Number.isInteger(repeat.times) && repeat.times>1);
    assert.ok(repeat.start>=0 && repeat.start+repeat.beats<=reference.beats);
  }
});

test('nested repetition retains inner groups without overlapping the outer display tier',()=>{
  const dance=dances.find(d=>d.id==='drumul-dracului')!;
  const repeats=phraseRepeats(dance.structure!.phrase);
  assert.deepEqual(repeats.filter(r=>r.depth===1).map(r=>[r.start,r.beats,r.times]),[[0,32,2],[32,32,2]]);
  assert.ok(repeats.some(r=>r.start===32 && r.beats===12 && r.times===3));
  assert.ok(repeats.some(r=>r.start===48 && r.beats===12 && r.times===3));
});

test('mirrored starting feet are not marked as identical repeated phrases',()=>{
  for (const id of ['waltz','mazurka']) {
    const dance=dances.find(d=>d.id===id)!;
    assert.deepEqual(phraseRepeats(dance.structure!.phrase),[]);
    assert.deepEqual(phraseSpans(dance.structure!.phrase).filter(s=>s.depth===1).map(s=>s.name),['Left lead','Right lead']);
  }
});

test('Bourrée ruler distinguishes musical beats, steps, and half-beat contacts',()=>{
  const dance=dances.find(d=>d.id==='bourree')!;
  const ticks=timelineTicks(dance);
  assert.equal(ticks.filter(t=>Number.isInteger(t.beat)).length,63);
  assert.equal(ticks.find(t=>t.beat===1)!.time,0.125);
  assert.equal(ticks.find(t=>t.beat===0.5)!.time,0.0625);
  assert.equal(ticks.find(t=>t.beat===32)!.kind,'section');
});

test('every contact tick maps to its original animation time',()=>{
  for (const dance of dances) {
    const beats=musicalBeatsPerPhrase(dance);
    for (const tick of timelineTicks(dance)) {
      assert.equal(tick.time*beats,tick.beat);
      assert.ok(tick.time>0 && tick.time<dance.duration);
    }
  }
});

function leaves(phrase: Phrase): {name:string;beats:number}[] {
  if (phrase.kind==='action') return [phrase];
  if (phrase.kind==='repeat') return Array.from({length:phrase.times},()=>leaves(phrase.phrase)).flat();
  return phrase.parts.flatMap(leaves);
}
test('Mazurka preserves two-beat lowering, third-beat transfer, and three walking supports',()=>{
  const dance=dances.find(d=>d.id==='mazurka')!;
  assert.deepEqual(leaves(dance.structure!.phrase).map(a=>[a.name,a.beats]),[
    ['Lower',2],['Transfer',1],['Left',1],['Right',1],['Left',1],
    ['Lower',2],['Transfer',1],['Right',1],['Left',1],['Right',1],
  ]);
});
