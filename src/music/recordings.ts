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

// Trial following dance feedback: Barray's detected pulses are subdivisions.
// Keep alternate timestamps so a complete step pattern spans six raw pulses.
// Preserve the measured tempo changes; musical interpretation awaits review.
export const hanterDroRecordings: readonly Recording[] = [
  {videoId:'RUpWyj8LFcE',title:'Hanter Dro',artist:'Valentin Barray',bpm:83.5,variableTempo:true,
    beats:hanterPianoBeats.filter((_, index) => index % 2 === 0)},
  {videoId:'iMQLYCar4WI',title:'Hanter dro',artist:'ba.fnu',bpm:80,
    beats:grid(25.28,80,360)},
  {videoId:'t9A3Gqhr7sw',title:'Calimero',artist:'Naragonia',...repertoireMaps.calimero},
];
export const anDroRecordings: readonly Recording[] = [
  {videoId:'sVui_IvFjyQ',title:"The Devil’s Courtship / An Dro",artist:'Battlefield Band',bpm:100,variableTempo:true,
    beats:anDroBeats},
  {videoId:'nsaP4H9ryyk',title:'Burning Andro',artist:'Żniwa',...repertoireMaps.burning},
  {videoId:'hKk7_49fTTU',title:'Ma flanedenn',artist:'Arvest',...repertoireMaps['arvest-live']},
];
export const drumulRecordings: readonly Recording[] = [
  // These recording titles keep the artists' own spelling, “Draculi”.
  // The recording opens on Crossing. Practice begins at the first Travel
  // figure, preserving its musical phase and five complete 64-count cycles.
  {videoId:'jwQukZnz4BQ',title:'Drumul Draculi',artist:'Żniwa',bpm:154,variableTempo:true,
    beats:zniwaDrumulBeats.slice(32,353)},
  {videoId:'qXdZO2gc_uw',title:'Drumul Draculi',artist:'Stary Olsa',bpm:126,variableTempo:true,
    beats:staryOlsaDrumulBeats},
  {videoId:'2rXDxHWpjlI',title:'Drumul Dracului / Ördög útja',artist:'ViatoreS',
    ...repertoireMaps['drumul-viatores']},
];
export const recordingsByDance: Readonly<Record<string, readonly Recording[]>> = {
  bourree: bourreeRecordings,
  'hanter-dro': hanterDroRecordings,
  'an-dro': anDroRecordings,
  'drumul-dracului': drumulRecordings,
  'congo-de-captieux': [
    {videoId:'Rhf-BfRGURE',title:'Pris entre Captieux',artist:'Bargainatt',...repertoireMaps['congo-bargainatt']},
    {videoId:'iROwlBHoAyU',title:'Congò de M. Lagardère',artist:'Trencadit',...repertoireMaps['congo-trencadit-album']},
    {videoId:'FqqQUn081W0',title:'Congo de Captieux (Eurre 2012)',artist:'Duo Brotto Lopez',...repertoireMaps['congo-brotto-lopez']},
  ],
  chapelloise: [
    {videoId:'NqeNjJuqVLQ',title:'Jsem já synek',artist:'ba.fnu feat. Beat Bouet Trio',...repertoireMaps.synek},
    {videoId:'WRsnS1X_giw',title:'Jopelloise',artist:'Accordzéâm',...repertoireMaps.jopelloise},
    {videoId:'G_92bfkQbBQ',title:'Ticket Restaurant',artist:'Lyradanz',...repertoireMaps.ticket},
  ],
  cercle: [
    {videoId:'JsT6Mz4lbEY',title:'Starwars',artist:'Accordzéâm',...repertoireMaps.starwars},
    {videoId:'eEArcahXX8g',title:'Ça Dégénère',artist:'Beat Bouet Trio',...repertoireMaps.degenere},
    {videoId:'STbN-opaqfE',title:'Un salto nel vuoto / Desgarbuglies!',artist:'Lyradanz',...repertoireMaps['lyra-cercle']},
  ],
  'branle-de-noirmoutier': [
    {videoId:'n6ryuNSjmHo',title:'Branle des chevaliers',artist:'Bargainatt',...repertoireMaps.branle},
    {videoId:'A5haP6-bPRE',title:'Suite de Bransles',artist:'Ciac Boum',...repertoireMaps.ciac},
    {videoId:'H_6dl1q4OvY',title:'Les gens qui sont riches',artist:'Arbadétorne',...repertoireMaps.riches},
  ],
  waltz: [
    {videoId:'WdZhlntuf3s',title:'Lora Luna',artist:'AedO',...repertoireMaps['lora-alt']},
    {videoId:'9X1NAyDcNlw',title:'Po powrocie do domu',artist:'Balsam',...repertoireMaps['balsam-waltz']},
    {videoId:'XxFa31Du6Ws',title:'Valse du port Galland',artist:'Ballsy Swing',...repertoireMaps.galland},
  ],
  schottische: [
    {videoId:'NJUhZDllgc0',title:'Scottish (YFK~2016)',artist:'ba.fnu & Yann-Fañch Kemener',...repertoireMaps.yfk},
    {videoId:'Xr9g4gRTl7c',title:'Jottish',artist:'Accordzéâm',...repertoireMaps.jottish},
    {videoId:'8ehWd9yc1k0',title:'Dina and her musical house / Thanks, Pien!',artist:'Folk Knock',...repertoireMaps['folk-scottish']},
  ],
  mazurka: [
    {videoId:'_Zj8kWGUxp0',title:'Alio (Tandem)',artist:'Naragonia',...repertoireMaps.alio},
    {videoId:'OkT2h14eO6A',title:'Mazurská',artist:'ba.fnu',...repertoireMaps.mazurska},
    {videoId:'DLb8aH3CSAY',title:'Šapito perdu',artist:'Folk Knock',...repertoireMaps['folk-mazurka']},
  ],
  'tzadik-katamar': [
    {videoId:'DkSRycdK1b8',title:'Tzadik Katamar (live)',artist:'Muscat',...repertoireMaps['tzadik-muscat-live']},
    {videoId:'xQsk9nYWm64',title:'Tzadik Katamar',artist:'Cobla La Mitja Lluna',...repertoireMaps['tzadik-cobla']},
    {videoId:'DTiK8DishCM',title:'Tzadik Katamar',artist:'Bill Woodgate',...repertoireMaps['tzadik-dance']},
  ],
};
