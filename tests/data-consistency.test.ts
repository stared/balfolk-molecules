import test from 'node:test';
import assert from 'node:assert/strict';
import { dances } from '../src/dances/catalog.ts';
import { recordingsByDance } from '../src/music/recordings.ts';
import { phraseSpans } from '../src/engine/phrase-structure.ts';
import { musicalBeatsPerPhrase } from '../src/engine/timeline.ts';
import { coupleFrame } from '../src/dances/couples.ts';

for (const dance of dances) test(`${dance.title}: sections, phrases, structure and contacts agree`,()=>{
  assert.equal(dance.phrases.length, dance.duration);
  let end = 0;
  for (const section of dance.sections) { assert.equal(section.start, end); end += section.duration; }
  assert.equal(end, dance.duration);
  const beats = musicalBeatsPerPhrase(dance), spans = phraseSpans(dance.structure!.phrase);
  const boundaries = new Set(spans.map(span=>span.start));
  for (const section of dance.sections) {
    assert.ok(boundaries.has(section.start*beats), `${section.name} starts inside a movement`);
    // One name must not describe two different extents; repeats count as one run.
    let run = 0;
    for (const span of spans.filter(span=>span.depth===1 && span.name===section.name && span.start>=section.start*beats))
      if (span.start===section.start*beats+run && run<section.duration*beats) run += span.beats;
    if (run) assert.equal(run, section.duration*beats, `${section.name} spans differ`);
  }
  for (let t=0.01;t<dance.duration;t+=0.25)
    assert.equal(dance.frame(t,0).section, dance.sections.findIndex(s=>t>=s.start&&t<s.start+s.duration));
  const counts = dance.countsPerPhrase ?? 4;
  if (dance.phraseContacts) assert.equal(dance.phraseContacts.length, dance.duration);
  for (const contact of [...dance.contacts ?? [], ...(dance.phraseContacts ?? []).flat()])
    assert.ok(contact>=0 && contact<counts, `contact ${contact} outside its phrase`);
});

test('couple timelines show the contacts that drive the animation',()=>{
  for (const kind of ['waltz','scottish','mazurka'] as const) {
    const dance = dances.find(d=>d.id===kind)!, counts = dance.countsPerPhrase!;
    for (const [phrase, contacts] of dance.phraseContacts!.entries()) for (const contact of contacts) {
      // Support crosses to the other foot at each listed contact, never before it.
      const at = (count:number) => coupleFrame(kind,(phrase+count/counts+dance.duration)%dance.duration).weight;
      const before = at(contact-0.01), after = at(contact+0.9*(kind==='mazurka'?0.6:0.22));
      assert.ok(before*after<0, `${kind} phrase ${phrase} contact ${contact}`);
    }
  }
});

test('every recording belongs to a dance and its tempo flag matches its beat map',()=>{
  const ids = new Set<string>();
  for (const [id, recordings] of Object.entries(recordingsByDance)) {
    assert.ok(dances.some(dance=>dance.id===id), id);
    for (const recording of recordings) {
      assert.ok(!ids.has(recording.videoId)); ids.add(recording.videoId);
      const beats = recording.beats, intervals = beats.slice(1).map((beat,i)=>beat-beats[i]!);
      assert.ok(intervals.every(interval=>interval>0));
      // Four-count blocks, as in the tempo readout.
      const tempos = []; for (let i=0;i+4<beats.length;i+=4) tempos.push(240/(beats[i+4]!-beats[i]!));
      const spread = Math.max(...tempos)/Math.min(...tempos);
      assert.equal(!!recording.variableTempo, spread>1.02, `${recording.artist}: tempo spread ${spread.toFixed(3)}`);
      const sorted = [...intervals].sort((a,b)=>a-b), median = 60/sorted[Math.floor(sorted.length/2)]!;
      assert.ok(Math.abs(median/recording.bpm-1)<0.03, `${recording.artist}: nominal ${recording.bpm}, median ${median.toFixed(1)}`);
    }
  }
});
