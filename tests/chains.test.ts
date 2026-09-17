import test from 'node:test';
import assert from 'node:assert/strict';
import { chainFrame, chainBeats, chainContacts } from '../src/dances/chains.ts';
import type { ChainDance } from '../src/dances/chains.ts';
import { itemAt } from '../src/utils/indexed.ts';
const kinds: readonly ChainDance[]=['hanter-dro','an-dro'];

test('distinct step rhythms keep the left/right support and sustained intervals',()=>{
  for(const kind of kinds) {
    const frame=(beat:number)=>chainFrame(kind,beat/chainBeats(kind));
    for(const [beat,weight] of [[0.22,-1],[0.72,1],[1.22,-1],[1.9,-1],[2.22,1]] as const)
      assert.equal(itemAt(frame(beat).dancers,0).weight,weight);
    if(kind==='an-dro') {
      assert.equal(itemAt(frame(2.72).dancers,0).weight,-1);
      assert.equal(itemAt(frame(3.22).dancers,0).weight,1);
    } else assert.equal(itemAt(frame(2.72).dancers,0).weight,1);
  }
  assert.equal(chainBeats('hanter-dro'),3);
  assert.equal(chainBeats('an-dro'),4);
  assert.deepEqual(chainContacts('hanter-dro'),[0,0.5,1,2]);
  assert.deepEqual(chainContacts('an-dro'),[0,0.5,1,2,2.5,3]);
});

test('travel goes left during 1 & 2 and settles while feet continue on the spot',()=>{
  for(const kind of kinds) {
    const a=itemAt(chainFrame(kind,0).dancers,0);
    const b=itemAt(chainFrame(kind,2/chainBeats(kind)).dancers,0);
    assert.ok(a.x*b.y-a.y*b.x>0,'Clockwise is left while facing inward');
    for(const beat of [2.1,2.5,2.9]) {
      const d=itemAt(chainFrame(kind,beat/chainBeats(kind)).dancers,0);
      assert.ok(Math.hypot(d.x-b.x,d.y-b.y)<1e-8);
    }
  }
});

test('open chains retain neighbours, spacing and facing without invented partner roles',()=>{
  for(const kind of kinds)for(let time=0;time<4;time+=0.025) {
    const state=chainFrame(kind,time,2);
    assert.equal(state.dancers.length,10);
    assert.equal(state.hands.length,9);
    state.dancers.forEach((d,i)=>{
      assert.equal(d.role,undefined);
      assert.ok(Math.abs(Math.hypot(d.x,d.y)-145)<1e-8);
      const angle=d.angle*Math.PI/180;
      assert.ok(d.x*Math.sin(angle)-d.y*Math.cos(angle)<0,'Face inward');
      for(let j=i+1;j<10;j++) {
        const other=itemAt(state.dancers,j);
        assert.ok(Math.hypot(d.x-other.x,d.y-other.y)>28);
      }
    });
    state.hands.forEach((h,i)=>{assert.deepEqual(h.dancers,[i,i+1]);assert.equal(h.reach,1);});
  }
});

test('repeats and complete cycles preserve position, facing, support and hand curvature',()=>{
  for(const kind of kinds)for(let cycle=0;cycle<5;cycle++)for(let t=1;t<=4;t++) {
    const before=chainFrame(kind,t-1e-7,cycle);
    const after=t===4?chainFrame(kind,0,cycle+1):chainFrame(kind,t,cycle);
    before.dancers.forEach((d,i)=>{
      const next=itemAt(after.dancers,i);
      assert.equal(d.id,next.id);
      assert.ok(Math.hypot(d.x-next.x,d.y-next.y)<0.001);
      assert.ok(Math.abs(d.angle-next.angle)<0.001);
      assert.ok(Math.abs((d.weight??0)-(next.weight??0))<0.001);
    });
    before.hands.forEach((h,i)=>assert.ok(Math.abs((h.arch??0)-(itemAt(after.hands,i).arch??0))<0.001));
  }
});

test('Hanter-dro keeps its close hold while An dro projects an arm movement',()=>{
  const arch=(kind:ChainDance,time:number)=>itemAt(chainFrame(kind,time).hands,0).arch;
  assert.equal(arch('hanter-dro',0),arch('hanter-dro',0.5));
  assert.notEqual(arch('an-dro',0),arch('an-dro',0.5));
  assert.equal(arch('an-dro',0),arch('an-dro',1));
});
