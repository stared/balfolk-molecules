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
export function musicPosition(seconds: number, beats: readonly number[], cycleBeats: number, beatsPerPhrase: number) {
  const beat = beatAtTime(seconds, beats);
  return {cycle: Math.floor(beat / cycleBeats), progress: (beat % cycleBeats) / beatsPerPhrase};
}
