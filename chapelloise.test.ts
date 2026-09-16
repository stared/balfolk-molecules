import test from 'node:test';
import assert from 'node:assert/strict';
import { chapelloiseFrame as frame, coupleCount } from './chapelloise.ts';
import { itemAt } from './indexed.ts';
const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x-b.x,a.y-b.y);

test('promenade alternates forward and backward travel, returning to its start', () => {
  for (const [time, sign] of [[0.5,1],[1.5,-1],[2.5,1],[3.5,-1]] as const) {
    const a=itemAt(frame(time).dancers,0), b=itemAt(frame(time+0.001).dancers,0);
    const angle=a.angle*Math.PI/180;
    const dot=(b.x-a.x)*Math.sin(angle)-(b.y-a.y)*Math.cos(angle);
    assert.ok(dot*sign>0);
  }
  frame(4).dancers.forEach((d,i)=>assert.ok(distance(d,itemAt(frame(0).dancers,i))<1e-8));
});

test('partners exchange sides then the traveler joins the couple behind', () => {
  assert.equal(Math.hypot(itemAt(frame(6).dancers,0).x,itemAt(frame(6).dancers,0).y),162);
  assert.equal(Math.hypot(itemAt(frame(6).dancers,1).x,itemAt(frame(6).dancers,1).y),108);
  const end=frame(8);
  assert.deepEqual(end.hands.filter(h=>h.reach===1).map(h=>h.dancers),[[2,1],[4,3],[6,5],[0,7]]);
  for(let cycle=0;cycle<coupleCount;cycle++) {
    frame(8,cycle).dancers.forEach((d,i)=> {
      const next=itemAt(frame(0,cycle+1).dancers,i);
      assert.ok(distance(d,next)<1e-8);
      assert.ok(Math.abs(Math.sin((d.angle-next.angle)*Math.PI/360))<1e-8);
      assert.equal(d.id,next.id);
    });
  }
  assert.equal(new Set(Array.from({length:coupleCount},(_,c)=>itemAt(frame(0,c).hands,0).dancers[0])).size,coupleCount);
});

test('phrases join continuously and paths keep dancers apart', () => {
  for(let t=1;t<8;t++)frame(t-1e-7).dancers.forEach((d,i)=>assert.ok(distance(d,itemAt(frame(t).dancers,i))<.001));
  for(let t=0;t<=8;t+=.005){
    const state=frame(t);
    assert.equal(state.dancers.length,8);
    state.dancers.forEach((d,i)=>{
      assert.ok([d.x,d.y,d.angle,d.weight].every(Number.isFinite));
      for(let j=i+1;j<8;j++) assert.ok(distance(d,itemAt(state.dancers,j))>28);
    });
    for(const hand of state.hands)assert.ok(hand.reach>=0&&hand.reach<=1);
  }
});
