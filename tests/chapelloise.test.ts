import test from 'node:test';
import assert from 'node:assert/strict';
import { chapelloiseFrame, defaultPairCount, minPairCount, maxPairCount } from '../src/dances/chapelloise.ts';
const coupleCount = 4;
const frame = (time: number, cycle = 0) => chapelloiseFrame(time, cycle, coupleCount);
import { itemAt } from '../src/utils/indexed.ts';
const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x-b.x,a.y-b.y);

test('pair count controls formation, partner progression, and spacing', () => {
  assert.equal(defaultPairCount, 5);
  assert.equal(chapelloiseFrame(0).dancers.length, 10);
  for (let pairs = minPairCount; pairs <= maxPairCount; pairs++) {
    const seen = new Set<number>();
    for (let cycle = 0; cycle < pairs; cycle++) {
      const start = chapelloiseFrame(0, cycle, pairs);
      assert.equal(start.dancers.length, pairs * 2);
      seen.add(itemAt(start.hands, 0).dancers[0]);
      const next = chapelloiseFrame(0, cycle + 1, pairs);
      chapelloiseFrame(8, cycle, pairs).dancers.forEach((d, i) => assert.ok(distance(d, itemAt(next.dancers, i)) < 1e-8));
    }
    assert.equal(seen.size, pairs);
    for (let time = 0; time <= 8; time += 0.01) {
      const state = chapelloiseFrame(time, 0, pairs);
      state.dancers.forEach((d, i) => {
        for (let j = i + 1; j < state.dancers.length; j++) assert.ok(distance(d, itemAt(state.dancers, j)) > 28, `${pairs} pairs at ${time}`);
      });
    }
  }
  for (const invalid of [0, -1, 13, 8.5, NaN, Infinity]) assert.throws(() => chapelloiseFrame(0, 0, invalid), RangeError);
});

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

test('walking strides stay even instead of easing across the whole passage', () => {
  for (const dancer of [0, 1]) {
    const strides = Array.from({length: 5}, (_, i) => distance(
      itemAt(frame((i+1)/4).dancers,dancer), itemAt(frame((i+2)/4).dancers,dancer),
    ));
    assert.ok(Math.max(...strides)-Math.min(...strides)<1e-8);
  }
});

test('polka uses half-count contacts and exchanges settle on the fourth count', () => {
  const leaderWeight = (count:number) => itemAt(frame(count/4).dancers,0).weight;
  assert.equal(leaderWeight(16.25),1);
  assert.equal(leaderWeight(16.75),-1);
  assert.equal(leaderWeight(17.25),1);
  assert.equal(leaderWeight(17.9),1);
  for(const start of [20,28]) {
    const settled=frame((start+3)/4);
    frame((start+3.8)/4).dancers.forEach((d,i)=> {
      const previous=itemAt(settled.dancers,i);
      assert.ok(distance(d,previous)<1e-8);
      assert.equal(d.angle,previous.angle);
    });
  }
});

test('roles stay with identities across side exchanges and changing partners', () => {
  for(let cycle=0;cycle<4;cycle++) for(const time of [0,5.5,6,7.5,8]) {
    frame(time,cycle).dancers.forEach((d,i)=>assert.equal(d.role,i%2?'follower':'leader'));
  }
  assert.ok(distance(itemAt(frame(7).dancers,0),itemAt(frame(8).dancers,0))>50,'Leader also travels toward the next partner');
});
