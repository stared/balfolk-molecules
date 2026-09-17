import test from 'node:test';
import assert from 'node:assert/strict';
import { tzadikFrame, drumulFrame, tzadikPhrases, drumulPhrases } from '../src/dances/folk-circles.ts';
import { itemAt } from '../src/utils/indexed.ts';

for(const [name,frame,duration,links] of [['Tzadik',tzadikFrame,12,10],['Drumul',drumulFrame,16,9]] as const) {
  test(`${name}: whole score preserves neighbours, spacing and cycle continuity`,()=>{
    for(let t=0;t<=duration;t+=0.025) {
      const state=frame(t);
      assert.equal(state.dancers.length,10);
      assert.equal(state.hands.length,links);
      for(const [i,d] of state.dancers.entries()) {
        assert.equal(d.role,undefined);
        assert.ok(Number.isFinite(d.angle));
        for(const other of state.dancers.slice(i+1))assert.ok(Math.hypot(d.x-other.x,d.y-other.y)>28);
      }
    }
    const end=frame(duration), next=frame(0,1);
    end.dancers.forEach((d,i)=>{
      const n=itemAt(next.dancers,i);
      assert.ok(Math.hypot(d.x-n.x,d.y-n.y)<1e-8);
      assert.ok(Math.abs(Math.sin((d.angle-n.angle)*Math.PI/360))<1e-8);
      assert.equal(d.weight,n.weight);
    });
  });
}
test('Drumul stamps the free foot without travel or weight transfer; holds are quiet',()=>{
  for(const [beat,foot,weight] of [[5,-1,1],[6,-1,1],[13,1,-1],[14,1,-1],[44,1,-1],[45,1,-1],[46,1,-1]] as const) {
    const a=itemAt(drumulFrame(beat/4).dancers,0);
    const b=itemAt(drumulFrame((beat+0.15)/4).dancers,0);
    assert.equal(b.weight,weight);
    assert.ok((foot===-1?b.stampLeft:b.stampRight)!>0.9);
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);
  }
  for(const beat of [7,15,47,63]) {
    const d=itemAt(drumulFrame((beat+0.2)/4).dancers,0);
    assert.equal(d.stampLeft,0);assert.equal(d.stampRight,0);
  }
});
test('Tzadik travels anticlockwise, makes a complete clockwise turn with hands released',()=>{
  const a=itemAt(tzadikFrame(0).dancers,0), b=itemAt(tzadikFrame(0.75).dancers,0);
  assert.ok(a.x*b.y-a.y*b.x<0);
  const before=itemAt(tzadikFrame(5).dancers,0), after=itemAt(tzadikFrame(5.5).dancers,0);
  assert.ok(Math.abs(after.angle-before.angle-360)<1e-8);
  assert.ok(tzadikFrame(5.25).hands.every(h=>h.reach===0));
  assert.ok(tzadikFrame(6).hands.every(h=>h.reach===1));
  assert.equal(tzadikPhrases.length,12);assert.equal(drumulPhrases.length,16);
});

test('Drumul crosses and opens on opposite diagonals, twisting the hips more than the facing',()=>{
  for(const start of [32,36,40,48,52,56]) {
    const pose=(beat:number)=>itemAt(drumulFrame(beat/4).dancers,0);
    const home=pose(start),cross=pose(start+1),recover=pose(start+2),open=pose(start+3),end=pose(start+4);
    const twist=(d:typeof home)=>d.angle-(Math.atan2(d.y,d.x)*180/Math.PI-90);
    const normalized=(angle:number)=>((angle+180)%360+360)%360-180;
    assert.ok(normalized(twist(cross))<0);
    assert.ok(normalized(twist(open))>0);
    assert.ok((cross.hipAngle??0)<-20 && (open.hipAngle??0)>20);
    assert.ok(home.x*cross.y-home.y*cross.x>0,'Cross toward own left');
    assert.ok(home.x*open.y-home.y*open.x<0,'Open toward own right');
    for(const d of [recover,end]) {
      assert.ok(Math.hypot(d.x-home.x,d.y-home.y)<1e-8);
      assert.equal(d.hipAngle,0);
    }
  }
});
