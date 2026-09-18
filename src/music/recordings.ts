import { zniwaDrumulBeats, staryOlsaDrumulBeats } from './drumul-beats.ts';
import { anDroBeats } from './andro-beats.ts';
import { hanterPianoBeats } from './hanter-piano-beats.ts';
export interface Recording {
  videoId: string;
  title: string;
  artist: string;
  bpm: number;
  variableTempo?: boolean;
  beats: readonly number[];
  passage: string;
}
// Analysis notes and uncertainty: docs/music-sync.md. Only timing metadata is
// shipped. YouTube remains the media source; no audio is bundled or proxied.
const grid = (start: number, bpm: number, count: number) =>
  Array.from({length: count + 1}, (_, beat) => start + beat * 60 / bpm);
export const bourreeRecordings: readonly Recording[] = [
  {videoId:'AE2tuIaFmTA',title:'Allez, bourrés',artist:'Accordzéâm',bpm:135,
    beats:grid(40.54,135,384),passage:'Dance passage 0:40.5–3:31.2'},
  {videoId:'7pzXyRLWiuc',title:'Experior (Remix)',artist:'AedO',bpm:150,
    beats:grid(25.98,150,512),passage:'Dance passage 0:26–3:50.8'},
];

export const hanterDroRecordings: readonly Recording[] = [
  {videoId:'RUpWyj8LFcE',title:'Hanter Dro',artist:'Valentin Barray',bpm:167,
    beats:hanterPianoBeats,passage:'Measured passage 0:00.9–3:11.2'},
  {videoId:'iMQLYCar4WI',title:'Hanter dro',artist:'ba.fnu',bpm:80,
    beats:grid(25.28,80,360),passage:'Dance passage 0:25.3–4:55.3'},
];
export const anDroRecordings: readonly Recording[] = [
  {videoId:'sVui_IvFjyQ',title:"The Devil’s Courtship / An Dro",artist:'Battlefield Band',bpm:100,
    beats:anDroBeats,passage:'Measured passage 1:41.3–3:37.9'},
];
export const drumulRecordings: readonly Recording[] = [
  {videoId:'jwQukZnz4BQ',title:'Drumul Draculi',artist:'Żniwa',bpm:154,variableTempo:true,
    beats:zniwaDrumulBeats,passage:'Measured passage 0:00.4–2:34.2'},
  {videoId:'qXdZO2gc_uw',title:'Drumul Draculi',artist:'Stary Olsa',bpm:126,variableTempo:true,
    beats:staryOlsaDrumulBeats,passage:'Measured passage 0:44.9–3:37.3'},
];
export const recordingsByDance: Readonly<Record<string, readonly Recording[]>> = {
  bourree: bourreeRecordings,
  'hanter-dro': hanterDroRecordings,
  'an-dro': anDroRecordings,
  'drumul-dracului': drumulRecordings,
};
