/** Durations use musical beats; grouping describes dance phrases, not a recording. */
export type Phrase = (
  | { kind: 'action'; name: string; beats: number }
  | { kind: 'sequence'; name: string; parts: readonly Phrase[] }
  | { kind: 'repeat'; times: number; phrase: Phrase }
) & { detail?: string };
export interface PhraseSpan { name: string; start: number; beats: number; depth: number; detail: string }
export function phraseBeats(phrase: Phrase): number {
  if (phrase.kind === 'action') return phrase.beats;
  if (phrase.kind === 'repeat') return phrase.times * phraseBeats(phrase.phrase);
  return phrase.parts.reduce((sum, part) => sum + phraseBeats(part), 0);
}
export function phraseSpans(phrase: Phrase, start = 0, depth = 0): PhraseSpan[] {
  if (phrase.kind === 'repeat') return Array.from({length: phrase.times}, (_, i) =>
    phraseSpans(phrase.phrase, start + i * phraseBeats(phrase.phrase), depth)).flat();
  const spans: PhraseSpan[] = [{ name: phrase.name, start, beats: phraseBeats(phrase), depth, detail: phraseDescription(phrase) }];
  if (phrase.kind === 'sequence') for (const part of phrase.parts) {
    spans.push(...phraseSpans(part, start, depth + 1));
    start += phraseBeats(part);
  }
  return spans;
}

export interface PhraseRepeat { name: string; start: number; beats: number; times: number; depth: number }
/** Preserve repetition as a grouping, separately from its expanded occurrences. */
export function phraseRepeats(phrase: Phrase, start = 0, depth = 0): PhraseRepeat[] {
  if (phrase.kind === 'action') return [];
  if (phrase.kind === 'repeat') {
    const beats = phraseBeats(phrase.phrase);
    return [{ name: phrase.phrase.kind === 'repeat' ? 'Repeat' : phrase.phrase.name,
      start, beats: beats * phrase.times, times: phrase.times, depth },
      ...Array.from({length: phrase.times}, (_, i) => phraseRepeats(phrase.phrase, start + i * beats, depth + 1)).flat()];
  }
  const repeats: PhraseRepeat[] = [];
  for (const part of phrase.parts) {
    repeats.push(...phraseRepeats(part, start, depth + 1));
    start += phraseBeats(part);
  }
  return repeats;
}

export function phraseDescription(phrase: Phrase): string {
  if (phrase.detail) return phrase.detail;
  if (phrase.kind === 'action') return `${phrase.name}: ${phrase.beats} beat${phrase.beats === 1 ? '' : 's'}`;
  if (phrase.kind === 'repeat') return `${phraseDescription(phrase.phrase)}; repeat ${phrase.times} times`;
  return phrase.parts.map(phraseDescription).join('; ');
}
