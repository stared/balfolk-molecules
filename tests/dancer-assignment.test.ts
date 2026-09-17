import test from 'node:test';
import assert from 'node:assert/strict';
import { DancerAssignment, minimumAssignment } from '../src/engine/dancer-assignment.ts';
import { dances } from '../src/dances/catalog.ts';
import { itemAt } from '../src/utils/indexed.ts';
import type { LiveFrame } from '../src/model.ts';
const frame=(xs:number[]):LiveFrame=>({dancers:xs.map((x,i)=>({x,y:0,angle:0,id:String.fromCharCode(65+i),slot:i})),hands:[],weight:0,section:0});

test('assignment finds the global minimum where choosing the nearest free place would fail',()=>{
  assert.deepEqual(minimumAssignment([[1,2],[2,100]]),[1,0]);
  assert.deepEqual(minimumAssignment([]),[]);
  const costs=[[8,2,5],[3,9,4],[6,7,1]];
  const result=minimumAssignment(costs);
  assert.equal(result.reduce((sum,col,row)=>sum+itemAt(itemAt(costs,row),col),0),6);
});

test('a shuffled formation keeps people in place instead of sending labels across the floor',()=>{
  const mapping=new DancerAssignment();
  const before=mapping.apply(frame([-100,0,100]));
  const target=frame([100,-100,0]);
  const after=mapping.rearrange(before,target);
  assert.deepEqual(after.dancers.map(d=>d.id),['C','A','B']);
  const previous=new Map(before.dancers.map(d=>[d.id,d]));
  for(const d of after.dancers)assert.equal(d.x,previous.get(d.id)?.x);
  const later=mapping.apply(frame([110,-90,10]));
  assert.deepEqual(later.dancers.map(d=>d.id),['C','A','B'],'Assignment persists once dancing resumes');
});

test('role continuity takes precedence, while chains and Bourrée have no role restriction',()=>{
  const from=frame([-100,100]),to=frame([100,-100]);
  itemAt(from.dancers,0).role='leader';itemAt(from.dancers,1).role='follower';
  itemAt(to.dancers,0).role='leader';itemAt(to.dancers,1).role='follower';
  const mapped=new DancerAssignment().rearrange(from,to);
  assert.deepEqual(mapped.dancers.map(d=>d.id),['A','B']);
  assert.deepEqual(new DancerAssignment().rearrange(from,frame([100,-100])).dancers.map(d=>d.id),['B','A']);
});

test('changing headcount chooses nearby participants and gives arrivals unique identities',()=>{
  const mapping=new DancerAssignment();
  const from=mapping.apply(frame([-160,0,160]));
  const fewer=mapping.rearrange(from,frame([0]));
  assert.equal(itemAt(fewer.dancers,0).id,'B');
  const more=mapping.rearrange(fewer,frame([-160,0,160]));
  assert.equal(itemAt(more.dancers,1).id,'B');
  assert.equal(new Set(more.dancers.map(d=>d.id)).size,3);
  assert.ok(more.dancers.filter(d=>d.id!=='B').every(d=>!['A','C'].includes(d.id)));
});

test('every dance transition keeps the target geometry and valid hand indices',()=>{
  for(const source of dances)for(const target of dances) {
    const mapping=new DancerAssignment();
    const from=mapping.apply(source.frame(source.duration*0.63,2));
    const raw=target.frame(0,0),to=mapping.rearrange(from,raw);
    assert.equal(new Set(to.dancers.map(d=>d.id)).size,to.dancers.length);
    to.dancers.forEach((d,i)=>{assert.equal(d.x,itemAt(raw.dancers,i).x);assert.equal(d.y,itemAt(raw.dancers,i).y);});
    assert.deepEqual(to.hands,raw.hands);
    assert.deepEqual(mapping.apply(target.frame(0,0)),to);
  }
});

test('open-chain switches preserve the complete chain order at every phrase and cycle',()=>{
  const chains=dances.filter(d=>d.formation==='chain');
  for(const source of chains)for(const target of chains)for(let cycle=0;cycle<8;cycle++)for(const time of [0,0.3,1.2,2.7,3.99]) {
    const mapping=new DancerAssignment();
    const from=mapping.apply(source.frame(time,cycle));
    const order=from.dancers.map(d=>d.id);
    const to=mapping.rearrangeChain(from,target.frame(0,0),order);
    assert.deepEqual(to.dancers.map(d=>d.id),order);
    const old=new Map(from.dancers.map(d=>[d.id,d]));
    for(const d of to.dancers) {
      const a=old.get(d.id);assert.ok(a);
      if(source.id!=='drumul-dracului' && target.id!=='drumul-dracului')
        assert.ok(Math.hypot(d.x-a.x,d.y-a.y)<59,'Breton chains only widen/tighten locally');
    }
    assert.deepEqual(mapping.apply(target.frame(0,0)),to,'No reset of chain orientation when playback resumes');
    assert.deepEqual(to.hands.map(h=>h.dancers.map(i=>itemAt(to.dancers,i).id)),from.hands.map(h=>h.dancers.map(i=>itemAt(from.dancers,i).id)));
  }
});

test('redirecting an unfinished chain change preserves neighbours and keeps all bodies apart',async()=>{
  const {FormationChange}=await import('../src/engine/formation-change.ts');
  const a=dances.find(d=>d.id==='hanter-dro'),b=dances.find(d=>d.id==='an-dro');
  assert.ok(a&&b);
  const mapping=new DancerAssignment();
  let current=mapping.apply(a.frame(2.7,4));
  const order=current.dancers.map(d=>d.id);
  for(const dance of [b,a,b,a]) {
    const target=mapping.rearrangeChain(current,dance.frame(0,0),order);
    const transition=new FormationChange(current,target);
    for(let i=0;i<40;i++) {
      transition.advance(transition.duration/80);
      const state=transition.frame();
      state.dancers.forEach((d,i)=>{
        for(let j=i+1;j<state.dancers.length;j++) {
          const other=itemAt(state.dancers,j);
          assert.ok(Math.hypot(d.x-other.x,d.y-other.y)>28,'No bodies cross during tightening or widening');
        }
      });
    }
    current=transition.frame();
    assert.deepEqual(target.dancers.map(d=>d.id),order);
  }
});
