export interface Recording {
  videoId: string;
  title: string;
  artist: string;
  bpm: number;
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
