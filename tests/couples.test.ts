import test from 'node:test';
import assert from 'node:assert/strict';
import { coupleDances, coupleFrame } from '../src/dances/couples.ts';
import { CircleLive } from '../src/engine/circle-live.ts';

for (const dance of coupleDances) {
  test(`${dance.id}: couples remain connected, separated and on the floor at every supported count`, () => {
    for (let pairs=1;pairs<=12;pairs++) for (let time=0;time<=dance.duration;time+=0.05) {
      const state=dance.frame(time,2,pairs);
      assert.equal(state.dancers.length,2*pairs);
      assert.equal(state.hands.length,pairs);
      for (const hand of state.hands) {
        const a=state.dancers[hand.dancers[0]]!, b=state.dancers[hand.dancers[1]]!;
        assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-(dance.id==='mazurka'?29:38))<1e-8);
        assert.equal(a.weight,-b.weight!);
      }
      for (const [i,a] of state.dancers.entries()) {
        assert.ok(Number.isFinite(a.angle));
        assert.ok(Math.hypot(a.x,a.y)<180);
        for (const b of state.dancers.slice(i+1)) assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>28);
      }
    }
  });
  test(`${dance.id}: cycle boundaries are continuous`, () => {
    for (let cycle=0;cycle<4;cycle++) {
      const end=dance.frame(dance.duration,cycle,5), next=dance.frame(0,cycle+1,5);
      for (const [i,a] of end.dancers.entries()) {
        const b=next.dancers[i]!;
        assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-8);
        assert.ok(Math.abs(Math.sin((a.angle-b.angle)*Math.PI/180))<1e-8);
        assert.equal(a.weight,b.weight);
      }
    }
  });
  test(`${dance.id}: one couple dances; adding and removing preserve partners and cycle phase`, () => {
    const single=new CircleLive(1,dance.frame,0);
    assert.notDeepEqual(single.frame(0,0).dancers,single.frame(0.5,0).dancers);
    const live=new CircleLive(5,dance.frame,0);
    const partners=(time:number,cycle:number)=>live.frame(time,cycle).hands.map(h=>h.dancers.map(i=>live.frame(time,cycle).dancers[i]!.id).join('-'));
    const original=partners(0,0);
    live.change('add',3,1);
    live.advance(3200);
    assert.deepEqual(partners(1,3).slice(0,5),original);
    const expected=dance.frame(1,3,6);
    for (const [i,a] of live.frame(1,3).dancers.entries()) {
      assert.ok(Math.hypot(a.x-expected.dancers[i]!.x,a.y-expected.dancers[i]!.y)<1e-8);
    }
    live.change('remove',4,1);
    live.advance(3200);
    assert.deepEqual(partners(1,4),original);
  });
}
test('mazurka stays on one support through ONE–TWO, then transfers on three', () => {
  assert.equal(coupleFrame('mazurka',0.8/3).dancers[0]!.weight,-1);
  assert.equal(coupleFrame('mazurka',1.8/3).dancers[0]!.weight,-1);
  assert.equal(coupleFrame('mazurka',2.8/3).dancers[0]!.weight,1);
  assert.equal(coupleFrame('waltz',2.8/3).dancers[0]!.weight,-1);
  assert.equal(coupleFrame('mazurka',8.8/3).dancers[0]!.weight,-1);
});
test('Scottish changes support on the offbeat only during side steps', () => {
  assert.equal(coupleFrame('schottische',0.8/2).dancers[0]!.weight,1);
  assert.equal(coupleFrame('schottische',4.8/2).dancers[0]!.weight,-1);
});

const centre = (kind: 'waltz'|'schottische'|'mazurka', time: number) => {
  const [a,b] = coupleFrame(kind,time).dancers;
  return {x:(a!.x+b!.x)/2,y:(a!.y+b!.y)/2};
};
const distance = (kind: 'waltz'|'schottische'|'mazurka', from: number, to: number) => {
  const a=centre(kind,from),b=centre(kind,to);
  return Math.hypot(a.x-b.x,a.y-b.y);
};
const angle = (kind: 'waltz'|'schottische'|'mazurka', time: number, cycle=0) => coupleFrame(kind,time,cycle).dancers[0]!.angle;

test('waltz visibly drives both travel and rotation on one, then coasts without stopping', () => {
  const first=angle('waltz',1/3)-angle('waltz',0);
  const last=angle('waltz',1)-angle('waltz',2/3);
  assert.ok(first > last*1.3 && first < last*2, 'a mild first-beat accent');
  assert.ok(distance('waltz',0,1/3)>distance('waltz',2/3,1)*1.3);
  for(let t=0;t<2;t+=0.01)assert.ok(angle('waltz',t+0.001)>angle('waltz',t));
  const epsilon=1e-5;
  const before=(angle('waltz',2)-angle('waltz',2-epsilon))/epsilon;
  const after=(angle('waltz',epsilon,1)-angle('waltz',0,1))/epsilon;
  assert.ok(Math.abs(before-after)<0.02, 'no abrupt velocity change at the repeat');
});
test('Scottish keeps side travel restrained and flows through all four turning supports', () => {
  assert.ok(distance('schottische',0,1)>10);
  assert.ok(distance('schottische',0,1)<18);
  assert.ok(distance('schottische',0,2)<1e-8);
  // A transfer is not a stop: retain travel and angular velocity on both sides.
  for (let t=2.2;t<3.9;t+=0.025) {
    assert.ok(distance('schottische',t,t+0.001)>0.001);
    assert.ok(angle('schottische',t+0.001)-angle('schottische',t)>0.02);
  }
  const beatWeights=[4.8,5.8,6.8,7.8].map(beat=>coupleFrame('schottische',beat/2).dancers[0]!.weight);
  assert.deepEqual(beatWeights,[-1,1,-1,1]);
});
test('mazurka opens with a small sinking weight shift; travel belongs to the following three steps', () => {
  for (const start of [0,2]) {
    for(let t=0;t<=1;t+=0.025) assert.ok(distance('mazurka',start,start+t)<3.5);
    assert.ok(distance('mazurka',start,start+1)<1e-8, 'weight shift returns rather than advances');
    assert.ok(coupleFrame('mazurka',start+0.5).dancers[0]!.sink!>0.9);
    assert.ok(coupleFrame('mazurka',start+1).dancers[0]!.sink!<1e-8);
    assert.ok(distance('mazurka',start+1,start+2)>8);
    assert.ok(distance('mazurka',start+1,start+2)<14, 'three small steps');
    const redirection=angle('mazurka',start+2)-angle('mazurka',start+1);
    assert.ok(redirection>0 && redirection<30, 'gentle redirection, not a half-turn');
    for(let t=start+1.1;t<start+1.9;t+=0.025) {
      assert.ok(distance('mazurka',t,t+0.001)>0.001);
      assert.ok(angle('mazurka',t+0.001)-angle('mazurka',t)>0.005);
    }
  }
});
test('couple movement and sinking stay continuous across phrases and repeats', () => {
  const epsilon=1e-6;
  for(const dance of coupleDances) for(let t=1;t<=dance.duration;t++) {
    const before=dance.frame(t-epsilon,0,5).dancers;
    const at=dance.frame(t,0,5).dancers;
    const after=dance.frame(t===dance.duration?epsilon:t+epsilon,t===dance.duration?1:0,5).dancers;
    for(let i=0;i<at.length;i++) {
      const a=before[i]!,b=at[i]!,c=after[i]!;
      assert.ok(Math.hypot(c.x-a.x,c.y-a.y)<0.001);
      assert.ok(Math.abs((c.sink??0)-(a.sink??0))<0.001);
      const vxBefore=(b.x-a.x)/epsilon,vyBefore=(b.y-a.y)/epsilon;
      const vxAfter=(c.x-b.x)/epsilon,vyAfter=(c.y-b.y)/epsilon;
      assert.ok(Math.hypot(vxAfter-vxBefore,vyAfter-vyBefore)<0.01);
    }
  }
});
