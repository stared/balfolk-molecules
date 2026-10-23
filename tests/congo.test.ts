import test from 'node:test';
import assert from 'node:assert/strict';
import { congoDance, congoFrame } from '../src/dances/congo.ts';

test('Congo stays within a compact walking scale without late sprints or spin bursts',()=>{
  // At 120 BPM each four-count step lasts two seconds; body diameter is 28.
  const dt=0.001;
  for(let t=0;t<16-dt;t+=dt) {
    const a=congoFrame(t), b=congoFrame(t+dt);
    a.dancers.forEach((p,i)=>{
      const q=b.dancers[i]!;
      assert.ok(Math.hypot(q.x-p.x,q.y-p.y)/(2*dt*28)<5,`Sprint at ${t}`);
      assert.ok(Math.abs(q.angle-p.angle)/(2*dt)<365,`Spin burst at ${t}`);
    });
    for(const hand of a.hands.filter(h=>h.reach>0.8)) {
      const [p,q]=hand.dancers.map(i=>a.dancers[i]!);
      assert.ok(Math.hypot(p!.x-q!.x,p!.y-q!.y)<=3*28+0.01,`Overstretched hold at ${t}`);
    }
  }
});

test('Congo keeps four identities and their roles, with no collisions or leaving the floor',()=>{
  for (let t=0;t<=16;t+=0.005) {
    const {dancers}=congoDance.frame(t,3,12);
    assert.deepEqual(dancers.map(d=>[d.id,d.role]),[['A','leader'],['B','follower'],['C','leader'],['D','follower']]);
    for (const [i,a] of dancers.entries()) {
      assert.ok(Number.isFinite(a.angle));
      assert.ok(Math.hypot(a.x,a.y)<177,`Outside floor at ${t}: ${a.id}`);
      // Include room for the rendered body's side-to-side lean.
      for (const b of dancers.slice(i+1)) assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=30,`Overlap ${a.id}/${b.id} at ${t}`);
    }
  }
});

test('Congo closes its cycle and has no position, facing, or support jumps',()=>{
  const before=congoFrame(16), after=congoFrame(0);
  for (const [i,a] of before.dancers.entries()) {
    const b=after.dancers[i]!;
    assert.equal(a.x,b.x);assert.equal(a.y,b.y);assert.equal(a.weight,b.weight);
    assert.ok(Math.abs(Math.sin((a.angle-b.angle)*Math.PI/360))<1e-8);
  }
  assert.deepEqual(before.hands,after.hands);
  for(let t=0;t<16;t+=0.01) {
    const a=congoFrame(t).dancers,b=congoFrame(t+0.00001).dancers;
    a.forEach((p,i)=>{
      assert.ok(Math.hypot(p.x-b[i]!.x,p.y-b[i]!.y)<0.02);
      assert.ok(Math.abs(p.angle-b[i]!.angle)<0.1);
      assert.ok(Math.abs(p.gazeAngle!-b[i]!.gazeAngle!)<0.1);
    });
  }
});

test('Congo exchanges sides twice, with the leader inside first and behind on the return',()=>{
  const at=(t:number)=>congoFrame(t).dancers;
  assert.ok(at(3.45)[0]!.y<at(3.45)[1]!.y);
  assert.ok(at(4)[0]!.x>at(4)[1]!.x);
  assert.ok(at(6.3)[0]!.y>at(6.3)[1]!.y);
  assert.ok(at(7)[0]!.x<at(7)[1]!.x);
  assert.ok(congoFrame(3.45).hands.every(h=>h.arch!>0.9));
});

test('Congo followers clear the diagonal before leaders pass right shoulders',()=>{
  const diagonal=congoFrame(8.65).dancers;
  // B faces NW: D is on B's left (SW), not a head-on crossing.
  assert.ok(diagonal[1]!.x>diagonal[3]!.x);
  assert.ok(diagonal[1]!.y<diagonal[3]!.y);
  const across=congoFrame(9.45).dancers;
  // A faces E: C passes to its right (south).
  assert.ok(across[0]!.y<across[2]!.y);
  assert.ok(across[1]!.y<-50 && across[3]!.y>50);
  const far=congoFrame(11).dancers;
  assert.ok(far[0]!.x>0 && far[0]!.y<0);
  assert.ok(far[1]!.x<0 && far[1]!.y<0);
});

test('Congo followers go behind their original partners during the confrontation and reunite',()=>{
  const play=congoFrame(14.35).dancers;
  assert.ok(play[1]!.y>play[0]!.y+70);
  assert.ok(play[3]!.y<play[2]!.y-70);
  const final=congoFrame(15).dancers;
  assert.equal(final[0]!.x,final[1]!.x);
  assert.ok(final[1]!.y<final[0]!.y);
  assert.deepEqual(congoFrame(15.5).hands.map(h=>h.dancers),[[0,1],[2,3]]);
});

test('Congo followers prepare both diagonals, turn left after the tiroir and only a quarter turn behind the leader',()=>{
  const angle=(t:number)=>congoFrame(t).dancers[1]!.angle;
  const bearing=(t:number)=>(angle(t)%360+360)%360;
  assert.equal(bearing(8),315,'Outward diagonal faces NW');
  assert.equal(bearing(12),135,'Return diagonal faces SE');
  assert.equal(bearing(14),270,'Face west to go behind the partner');
  assert.equal(bearing(15),180,'Finish facing the partner to the south');
  assert.ok(angle(7)<angle(6)-150,'Start the left turn during the tiroir');
  assert.equal(angle(15)-angle(14),-90);
  assert.ok(angle(12)-angle(11)<-270,'Left turn prepares the return diagonal');
});

test('Congo uses the long left support followed by right-left-right, anticipating the retreat',()=>{
  assert.deepEqual(congoDance.contacts,[0,2,2.5,3]);
  for(const [beat,weight] of [[0,-1],[2,1],[2.5,-1],[3,1]])
    assert.equal(congoFrame((beat!+0.23)/4).weight,weight);
  assert.equal(congoFrame(0.45).weight,-1);
  assert.ok(congoFrame(0.95).dancers[0]!.y>congoFrame(0.75).dancers[0]!.y);
});
