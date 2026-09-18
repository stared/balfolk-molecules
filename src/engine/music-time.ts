/** Recording seconds at successive musical beats, starting with dance beat zero. */
export function beatAtTime(seconds: number, beats: readonly number[]): number {
  if (!Number.isFinite(seconds) || beats.length < 2 || seconds <= beats[0]!) return 0;
  let low = 0, high = beats.length - 1;
  if (seconds >= beats[high]!) return high;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (beats[middle]! <= seconds) low = middle;
    else high = middle;
  }
  return low + (seconds - beats[low]!) / (beats[high]! - beats[low]!);
}
export function timeAtBeat(beat: number, beats: readonly number[]): number {
  const bounded = Math.max(0, Math.min(beats.length - 1, beat));
  const index = Math.floor(bounded), next = Math.min(beats.length - 1, index + 1);
  return beats[index]! + (beats[next]! - beats[index]!) * (bounded - index);
}
export function musicPosition(seconds: number, beats: readonly number[], cycleBeats: number, beatsPerPhrase: number, danceOffset = 0) {
  const beat = beatAtTime(seconds, beats) + danceOffset;
  return {cycle: Math.floor(beat / cycleBeats), progress: (beat % cycleBeats) / beatsPerPhrase};
}

/** Tempo of the current four-count block; stable display while music accelerates. */
export function tempoAtTime(seconds: number, beats: readonly number[]): number {
  if(beats.length<2)return 0;
  const start=Math.min(Math.floor(beatAtTime(seconds,beats)/4)*4,beats.length-2);
  const end=Math.min(start+4,beats.length-1);
  return 60*(end-start)/(beats[end]!-beats[start]!);
}

/** Inverse of musicPosition; choose the first available occurrence if the recording starts mid-cycle. */
export function timeAtMusicPosition(cycle: number, progress: number, beats: readonly number[], cycleBeats: number, beatsPerPhrase: number, danceOffset = 0): number {
  let beat=cycle*cycleBeats+progress*beatsPerPhrase-danceOffset;
  if(beat<0)beat+=Math.ceil(-beat/cycleBeats)*cycleBeats;
  return timeAtBeat(beat,beats);
}
