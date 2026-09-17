import test from 'node:test';
import assert from 'node:assert/strict';
import {beatAtTime,timeAtBeat,musicPosition} from '../src/engine/music-time.ts';
import {bourreeRecordings} from '../src/music/recordings.ts';

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
