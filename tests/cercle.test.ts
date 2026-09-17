import test from 'node:test';
import assert from 'node:assert/strict';
import { cercleFrame as frame } from '../src/dances/cercle.ts';
import { CircleLive } from '../src/engine/circle-live.ts';
import { itemAt } from '../src/utils/indexed.ts';
import type { Dancer } from '../src/model.ts';
const distance=(a:Dancer,b:Dancer)=>Math.hypot(a.x-b.x,a.y-b.y);
const radius=(d:Dancer)=>Math.hypot(d.x,d.y);
const angleDistance=(a:number,b:number)=>Math.abs(((a-b)%360+540)%360-180);
const handMap=(time:number,cycle:number,pairs:number)=>new Map(frame(time,cycle,pairs).hands.map(h=>[h.dancers.join(':'),h.reach]));

test('64 counts: everyone twice, followers, leaders, swing and promenade',()=>{
  const start=frame(0).dancers;
  for(const t of [1,3])assert.ok(frame(t).dancers.every(d=>Math.abs(radius(d)-115)<1e-8));
  for(const t of [2,4,6])frame(t).dancers.forEach((d,i)=>assert.ok(distance(d,itemAt(start,i))<1e-8));
  frame(5).dancers.forEach(d=>assert.ok(Math.abs(radius(d)-(d.role==='follower'?115:170))<1e-8));
  frame(7).dancers.forEach((d,i)=>{
    assert.ok(Math.abs(radius(d)-(d.role==='leader'?115:170))<1e-8);
    assert.ok(Math.abs(angleDistance(d.angle,itemAt(start,i).angle)-(d.role==='leader'?180:0))<1e-8);
  });
  for(const [time,section] of [[0,0],[4,1],[8,2],[12,3],[16,3]] as const)assert.equal(frame(time).section,section);
});

test('swing partners face each other and share a stationary center; promenade travels anticlockwise',()=>{
  for(let time=8;time<12;time+=0.1){
    const state=frame(time),leader=itemAt(state.dancers,0),partner=itemAt(state.dancers,3);
    const reference=frame(8),a=itemAt(reference.dancers,0),b=itemAt(reference.dancers,3);
    assert.ok(Math.abs(leader.x+partner.x-a.x-b.x)<1e-8);
    assert.ok(Math.abs(leader.y+partner.y-a.y-b.y)<1e-8);
    assert.ok(Math.abs(distance(leader,partner)-44)<1e-8);
    assert.ok(Math.abs(angleDistance(leader.angle,partner.angle)-180)<1e-8);
    assert.ok(leader.weight!==undefined && leader.weight>=0.7,'Right support persists during the swing');
  }
  const a=itemAt(frame(13).dancers,0),b=itemAt(frame(13.1).dancers,0);
  assert.ok(a.x*b.y-a.y*b.x<0);
});

test('every leader meets every follower, and reopening preserves identities, facing and hand connections',()=>{
  for(let pairs=2;pairs<=12;pairs++) {
    const partners=new Set<number>();
    for(let cycle=0;cycle<pairs;cycle++) {
      const swing=frame(9,cycle,pairs).hands.find(h=>h.dancers[0]===0 && h.reach>0.99);
      assert.ok(swing);partners.add(swing.dancers[1]);
      const next=frame(0,cycle+1,pairs);
      frame(16,cycle,pairs).dancers.forEach((d,i)=>{
        const target=itemAt(next.dancers,i);
        assert.equal(d.id,target.id);
        assert.ok(distance(d,target)<1e-8);
        assert.ok(angleDistance(d.angle,target.angle)<1e-8);
      });
      const end=handMap(16,cycle,pairs),start=handMap(0,cycle+1,pairs);
      for(const key of new Set([...end.keys(),...start.keys()]))assert.equal(end.get(key)??0,start.get(key)??0);
    }
    assert.equal(partners.size,pairs);
  }
});

test('body paths, facing, and reaching join continuously and keep space at all supported densities',()=>{
  for(let pairs=2;pairs<=12;pairs++) {
    for(let time=0;time<=16;time+=0.01) {
      const {dancers,hands}=frame(time,0,pairs);
      dancers.forEach((d,i)=>{
        assert.ok([d.x,d.y,d.angle,d.weight].every(Number.isFinite));
        for(let j=i+1;j<dancers.length;j++)assert.ok(distance(d,itemAt(dancers,j))>28,`${pairs} pairs at ${time}`);
      });
      assert.ok(hands.every(h=>h.reach>=0 && h.reach<=1 && h.dancers.every(i=>i>=0&&i<dancers.length)));
    }
    for(let t=1;t<=16;t++) {
      const before=frame(t-1e-7,0,pairs),after=frame(t,0,pairs);
      before.dancers.forEach((d,i)=>{
        assert.ok(distance(d,itemAt(after.dancers,i))<0.001);
        assert.ok(angleDistance(d.angle,itemAt(after.dancers,i).angle)<0.001);
      });
      const a=handMap(t-1e-7,0,pairs),b=handMap(t,0,pairs);
      for(const key of new Set([...a.keys(),...b.keys()]))assert.ok(Math.abs((a.get(key)??0)-(b.get(key)??0))<0.001);
    }
  }
});

test('live Cercle supports repeated additions during later-cycle swings without resetting people',()=>{
  const live=new CircleLive(5,frame,-1);
  for(const action of ['add','add','remove'] as const) {
    const before=live.frame(10,3);
    assert.ok(live.change(action,3,10));
    const after=new Map(live.frame(10,3).dancers.map(d=>[d.id,d]));
    for(const d of before.dancers){const next=after.get(d.id);assert.ok(next && distance(d,next)<1e-8);}
    assert.equal(live.frame(10,3).section,2);
    live.advance(500);
  }
  live.advance(3200);
  assert.equal(live.frame(14,3).dancers.length,12);
  assert.equal(live.frame(14,3).section,3);
});
