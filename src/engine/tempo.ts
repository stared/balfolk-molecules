import type { Dance } from '../model.ts';

export const minimumBpm = 30;
export const maximumBpm = 240;
const logRange = Math.log(maximumBpm / minimumBpm);
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** Equal slider distances represent equal tempo ratios. */
export function bpmAtPosition(position: number): number {
  return Math.round(minimumBpm * Math.exp(logRange * clamp(position, 0, 1000) / 1000));
}
export function positionAtBpm(bpm: number): number {
  return Math.log(clamp(bpm, minimumBpm, maximumBpm) / minimumBpm) / logRange * 1000;
}
export function defaultBpm(dance: Pick<Dance, 'beatsPerPhrase' | 'countsPerPhrase' | 'millisecondsPerPhrase'>): number {
  return (dance.beatsPerPhrase ?? dance.countsPerPhrase ?? 4) * 60000 / dance.millisecondsPerPhrase;
}
