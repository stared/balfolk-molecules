import { zniwaDrumulBeats, staryOlsaDrumulBeats } from './drumul-beats.ts';
import { anDroBeats } from './andro-beats.ts';
import { hanterPianoBeats } from './hanter-piano-beats.ts';
import { repertoireMaps } from './repertoire-beats.ts';
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
  {videoId:'CtXFR4k0hCg',title:'Modelina’s Advice / Mitora',artist:'Balsam',
    ...repertoireMaps['balsam-bourree']},
];

// These two maps disagree about the count rate: one step pattern lasts about
// 1.1 s for Barray and 2.25 s for ba.fnu. Unresolved; see docs/music-sync.md.
export const hanterDroRecordings: readonly Recording[] = [
  {videoId:'RUpWyj8LFcE',title:'Hanter Dro',artist:'Valentin Barray',bpm:167,variableTempo:true,
    beats:hanterPianoBeats},
  {videoId:'iMQLYCar4WI',title:'Hanter dro',artist:'ba.fnu',bpm:80,
    beats:grid(25.28,80,360)},
  {videoId:'t9A3Gqhr7sw',title:'Calimero',artist:'Naragonia',...repertoireMaps.calimero},
  {videoId:'9eSaBX8N58o',title:'Noctivagate',artist:'Folk Knock',...repertoireMaps['folk-hanter']},
];
export const anDroRecordings: readonly Recording[] = [
  {videoId:'sVui_IvFjyQ',title:"The Devil’s Courtship / An Dro",artist:'Battlefield Band',bpm:100,variableTempo:true,
    beats:anDroBeats},
  {videoId:'nsaP4H9ryyk',title:'Burning Andro',artist:'Żniwa',...repertoireMaps.burning},
];
// Recording titles keep the artists' own spelling, “Draculi”.
export const drumulRecordings: readonly Recording[] = [
  // The recording opens on Crossing. Practice begins at the first Travel
  // figure, preserving its musical phase and five complete 64-count cycles.
  {videoId:'jwQukZnz4BQ',title:'Drumul Draculi',artist:'Żniwa',bpm:154,variableTempo:true,
    beats:zniwaDrumulBeats.slice(32,353)},
  {videoId:'qXdZO2gc_uw',title:'Drumul Draculi',artist:'Stary Olsa',bpm:126,variableTempo:true,
    beats:staryOlsaDrumulBeats},
];
export const recordingsByDance: Readonly<Record<string, readonly Recording[]>> = {
  bourree: bourreeRecordings,
  'hanter-dro': hanterDroRecordings,
  'an-dro': anDroRecordings,
  'drumul-dracului': drumulRecordings,
  chapelloise: [
    {videoId:'WRsnS1X_giw',title:'Jopelloise',artist:'Accordzéâm',...repertoireMaps.jopelloise},
    {videoId:'NqeNjJuqVLQ',title:'Jsem já synek',artist:'ba.fnu feat. Beat Bouet Trio',...repertoireMaps.synek},
  ],
  cercle: [
    {videoId:'JsT6Mz4lbEY',title:'Starwars',artist:'Accordzéâm',...repertoireMaps.starwars},
  ],
  'branle-de-noirmoutier': [
    {videoId:'n6ryuNSjmHo',title:'Branle des chevaliers',artist:'Bargainatt',...repertoireMaps.branle},
  ],
  waltz: [
    {videoId:'WdZhlntuf3s',title:'Lora Luna',artist:'AedO',...repertoireMaps['lora-alt']},
    {videoId:'9X1NAyDcNlw',title:'Po powrocie do domu',artist:'Balsam',...repertoireMaps['balsam-waltz']},
  ],
  schottische: [
    {videoId:'NJUhZDllgc0',title:'Scottish (YFK~2016)',artist:'ba.fnu & Yann-Fañch Kemener',...repertoireMaps.yfk},
    {videoId:'Xr9g4gRTl7c',title:'Jottish',artist:'Accordzéâm',...repertoireMaps.jottish},
    {videoId:'8ehWd9yc1k0',title:'Dina and her musical house / Thanks, Pien!',artist:'Folk Knock',...repertoireMaps['folk-scottish']},
  ],
  mazurka: [
    {videoId:'_Zj8kWGUxp0',title:'Alio (Tandem)',artist:'Naragonia',...repertoireMaps.alio},
    {videoId:'DLb8aH3CSAY',title:'Šapito perdu',artist:'Folk Knock',...repertoireMaps['folk-mazurka']},
  ],
  'tzadik-katamar': [
    {videoId:'DTiK8DishCM',title:'Tzadik Katamar',artist:'Bill Woodgate',...repertoireMaps['tzadik-dance']},
  ],
};
