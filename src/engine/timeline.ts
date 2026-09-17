import type { Dance } from '../model.ts';
export const musicalBeatsPerPhrase = (dance: Pick<Dance,'beatsPerPhrase'|'countsPerPhrase'>): number =>
  dance.beatsPerPhrase ?? dance.countsPerPhrase ?? 4;
export interface TimelineTick { beat: number; time: number; kind: 'beat'|'phrase'|'section'|'contact' }
export function timelineTicks(dance: Dance): TimelineTick[] {
  const beats = musicalBeatsPerPhrase(dance), counts = dance.countsPerPhrase ?? 4;
  const total = dance.duration * beats;
  const ticks = new Set(Array.from({length:Math.ceil(total)-1},(_,i)=>i+1));
  for (let phrase=0;phrase<dance.duration;phrase++) {
    for (const contact of dance.phraseContacts?.[phrase] ?? dance.contacts ?? []) {
      const beat = phrase*beats + contact*beats/counts;
      if (beat>0 && beat<total) ticks.add(beat);
    }
  }
  return [...ticks].sort((a,b)=>a-b).map(beat=>{
    const time=beat/beats;
    return {beat,time,kind:dance.sections.some(section=>section.start===time)?'section'
      :Number.isInteger(time)?'phrase':Number.isInteger(beat)?'beat':'contact'};
  });
}
