import { zniwaDrumulBeats, staryOlsaDrumulBeats } from './drumul-beats.ts';
import { anDroBeats } from './andro-beats.ts';
import { hanterPianoBeats } from './hanter-piano-beats.ts';
export interface Recording {
  videoId: string;
  title: string;
  artist: string;
  /** Nominal tempo in dance counts per minute; the readout for constant grids. */
  bpm: number;
  /** The beat map is measured, not a grid: the readout follows the local tempo. */
  variableTempo?: boolean;
  /** Dance count at the first mapped recording beat. */
  danceOffset?: number;
  /** Seconds at successive dance counts; first and last bound the synchronized passage. */
  beats: readonly number[];
}
// Analysis notes and uncertainty: docs/music-sync.md. Only timing metadata is
// shipped. YouTube remains the media source; no audio is bundled or proxied.
const grid = (start: number, bpm: number, count: number) =>
  Array.from({length: count + 1}, (_, beat) => start + beat * 60 / bpm);
export const bourreeRecordings: readonly Recording[] = [
  {videoId:'AE2tuIaFmTA',title:'Allez, bourrés',artist:'Accordzéâm',bpm:135,
    beats:grid(40.54,135,384)},
  {videoId:'7pzXyRLWiuc',title:'Experior (Remix)',artist:'AedO',bpm:150,
    beats:grid(25.98,150,512)},
];

// These two maps disagree about the count rate: one step pattern lasts about
// 1.1 s for Barray and 2.25 s for ba.fnu. Unresolved; see docs/music-sync.md.
export const hanterDroRecordings: readonly Recording[] = [
  {videoId:'RUpWyj8LFcE',title:'Hanter Dro',artist:'Valentin Barray',bpm:167,variableTempo:true,
    beats:hanterPianoBeats},
  {videoId:'iMQLYCar4WI',title:'Hanter dro',artist:'ba.fnu',bpm:80,
    beats:grid(25.28,80,360)},
];
export const anDroRecordings: readonly Recording[] = [
  {videoId:'sVui_IvFjyQ',title:"The Devil’s Courtship / An Dro",artist:'Battlefield Band',bpm:100,variableTempo:true,
    beats:anDroBeats},
];
// Recording titles keep the artists' own spelling, “Draculi”.
export const drumulRecordings: readonly Recording[] = [
  {videoId:'jwQukZnz4BQ',title:'Drumul Draculi',artist:'Żniwa',bpm:154,variableTempo:true,danceOffset:32,
    beats:zniwaDrumulBeats},
  {videoId:'qXdZO2gc_uw',title:'Drumul Draculi',artist:'Stary Olsa',bpm:126,variableTempo:true,
    beats:staryOlsaDrumulBeats},
];
export const recordingsByDance: Readonly<Record<string, readonly Recording[]>> = {
  bourree: bourreeRecordings,
  'hanter-dro': hanterDroRecordings,
  'an-dro': anDroRecordings,
  'drumul-dracului': drumulRecordings,
};
