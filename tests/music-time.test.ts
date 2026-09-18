import { dances } from '../src/dances/catalog.ts';
import { musicalBeatsPerPhrase } from '../src/engine/timeline.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {beatAtTime,timeAtBeat,musicPosition,tempoAtTime} from '../src/engine/music-time.ts';
import {bourreeRecordings,recordingsByDance} from '../src/music/recordings.ts';

test('music clock interpolates variable beat intervals and clamps intro/outro',()=>{
  const beats=[2,2.5,3.1,3.8];
  assert.equal(beatAtTime(0,beats),0);
  assert.ok(Math.abs(beatAtTime(2.75,beats)-(1+0.25/0.6))<1e-12);
  assert.equal(beatAtTime(20,beats),3);
  assert.equal(timeAtBeat(1.5,beats),2.8);
});
test('Bourrée maps musical beats to two-beat steps and maintains whole-cycle identity',()=>{
  for(const track of bourreeRecordings) {
    for(const beat of [0,2,32,63.5,64,128.25,192]) {
      const position=musicPosition(timeAtBeat(beat,track.beats),track.beats,64,8);
      assert.equal(position.cycle,Math.floor(beat/64));
      assert.ok(Math.abs(position.progress-beat%64/8)<1e-9);
    }
  }
});
test('seeking and resuming derives position from media time, without wall-clock accumulation',()=>{
  const track=bourreeRecordings[1]!;
  const at=musicPosition(60,track.beats,64,8);
  assert.deepEqual(musicPosition(60,track.beats,64,8),at);
  const rewind=musicPosition(10,track.beats,64,8);
  assert.ok(rewind.cycle<at.cycle);
});
test('recordings have distinct timing grids and end on complete dance cycles',()=>{
  assert.equal(bourreeRecordings[0]!.bpm,135);
  assert.equal(bourreeRecordings[1]!.bpm,150);
  for(const track of bourreeRecordings) {
    assert.equal((track.beats.length-1)%64,0);
    assert.ok(track.beats.every((beat,i)=>i===0||beat>track.beats[i-1]!));
  }
});


test('recording intros stay outside the dance cycle',()=>{
  for (const track of bourreeRecordings) {
    const start=track.beats[0]!;
    for (const seconds of [0,0.4,13,start-0.01]) {
      assert.deepEqual(musicPosition(seconds,track.beats,64,8),{cycle:0,progress:0});
    }
    assert.deepEqual(musicPosition(start,track.beats,64,8),{cycle:0,progress:0});
    assert.ok(Math.abs(musicPosition(start+60/track.bpm,track.beats,64,8).progress-0.125)<1e-10);
  }
});

test('dance starts are phrase entries, not first audio attacks or rhythmic lead-ins',()=>{
  const [allez,experior]=bourreeRecordings;
  assert.equal(allez!.beats[0],40.54);
  assert.equal(experior!.beats[0],25.98);
  // First full line/crossing change and full dance cycle at independently
  // checked musical boundaries (20 ms downbeat-estimator resolution).
  for(const [track,half,whole] of [[allez!,54.76,68.98],[experior!,38.78,51.58]] as const) {
    assert.ok(Math.abs(timeAtBeat(32,track.beats)-half)<.025);
    assert.ok(Math.abs(timeAtBeat(64,track.beats)-whole)<.025);
  }
});


test('each recording maps complete cycles in its own dance meter',()=>{
  for (const [dance,tracks] of Object.entries(recordingsByDance)) {
    const choreography=dances.find(d=>d.id===dance)!;
    const beatsPerPhrase=musicalBeatsPerPhrase(choreography);
    const cycleBeats=choreography.duration*beatsPerPhrase;
    for (const track of tracks) {
      assert.equal((track.beats.length-1)%cycleBeats,0);
      assert.ok(track.beats.every((beat,i)=>Number.isFinite(beat)&&(i===0||beat>track.beats[i-1]!)));
      for (const beat of [0,1,cycleBeats+0.5,cycleBeats*2]) {
        const position=musicPosition(timeAtBeat(beat,track.beats),track.beats,cycleBeats,beatsPerPhrase);
        assert.equal(position.cycle,Math.floor(beat/cycleBeats));
        assert.ok(Math.abs(position.progress-beat%cycleBeats/beatsPerPhrase)<1e-8);
      }
    }
  }
});

test('expressive performances follow measured beats instead of drifting with nominal BPM',()=>{
  const piano=recordingsByDance['hanter-dro']![0]!;
  assert.equal(timeAtBeat(24,piano.beats),9.68);
  assert.equal(timeAtBeat(192,piano.beats),71.32);
  assert.ok(Math.abs(timeAtBeat(192,piano.beats)-(piano.beats[0]!+192*60/piano.bpm))>0.1);
  const andro=recordingsByDance['an-dro']![0]!;
  assert.equal(andro.beats[0],101.34);
  assert.equal(andro.beats.at(-1),217.94);
  assert.deepEqual(musicPosition(100,andro.beats,16,4),{cycle:0,progress:0});
});


test('Barray uses three fast pulses per step pattern, rather than six',()=>{
  const piano=recordingsByDance['hanter-dro']![0]!;
  assert.equal(piano.bpm,167);
  assert.equal(piano.beats[0],0.92);
  assert.equal((piano.beats.length-1)/12,44);
  // The bass-accent audit includes intervening pulses, not just alternate ones.
  // Each pair of patterns has two quiet closing beats, at pulse 2 and pulse 5.
  assert.equal(timeAtBeat(2,piano.beats),1.64);
  assert.equal(timeAtBeat(5,piano.beats),2.759);
  for (const beat of [0,12,144,288,432]) {
    const seconds=timeAtBeat(beat+3,piano.beats)-timeAtBeat(beat,piano.beats);
    assert.ok(seconds>1&&seconds<1.2,`One step pattern took ${seconds}s`);
    const next=musicPosition(timeAtBeat(beat+3,piano.beats),piano.beats,12,3);
    assert.ok(Math.abs(next.progress-1)<1e-9);
  }
});


test('Drumul recordings keep 64-count cycles while the tempo accelerates',()=>{
  const [zniwa,olsa]=recordingsByDance['drumul-dracului']!;
  assert.equal(zniwa!.beats[0],0.44);
  assert.equal(olsa!.beats[0],44.86);
  assert.equal((zniwa!.beats.length-1)/64,6);
  assert.equal((olsa!.beats.length-1)/64,5);
  for(const track of [zniwa!,olsa!]) {
    assert.ok(tempoAtTime(track.beats.at(-5)!,track.beats)>tempoAtTime(0,track.beats)+20);
    for(const beat of [32,64,96,128,192,256]) {
      const pos=musicPosition(timeAtBeat(beat,track.beats),track.beats,64,4);
      assert.equal(pos.cycle,Math.floor(beat/64));
      assert.equal(pos.progress,beat%64/4);
    }
  }
});
test('tempo display follows the local count duration, including paused seeks',()=>{
  const beats=[0,.5,1,1.5,2,2.4,2.8,3.2,3.6];
  assert.equal(tempoAtTime(0,beats),120);
  assert.equal(tempoAtTime(2.2,beats),150);
  assert.equal(tempoAtTime(.5,beats),120);
  assert.equal(tempoAtTime(0,[]),0);
});
