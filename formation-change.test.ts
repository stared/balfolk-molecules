import test from 'node:test';
import assert from 'node:assert/strict';
import { FormationChange } from './formation-change.ts';
import { dances } from './dances.ts';
import { itemAt } from './indexed.ts';

const outside=(x:number,y:number)=>Math.abs(x)>224 || Math.abs(y)>214;

test('all dance switches start from the current bodies and finish at the new first count',()=>{
  for(const source of dances)for(const target of dances) {
    if(source===target)continue;
    const from=source.frame(source.duration*0.63,2),to=target.frame(0,0);
    const change=new FormationChange(from,to);
    const initial=new Map(change.frame().dancers.map(d=>[d.id,d]));
    for(const dancer of from.dancers) {
      const next=initial.get(dancer.id);
      assert.ok(next);
      assert.equal(next.x,dancer.x);assert.equal(next.y,dancer.y);
      assert.equal(next.angle,dancer.angle);
    }
    const oldIds=new Set(from.dancers.map(d=>d.id));
    for(const d of initial.values())if(!oldIds.has(d.id))assert.ok(outside(d.x,d.y),'New people start beyond the stage');
    change.advance(change.duration-0.01);
    const last=new Map(change.frame().dancers.map(d=>[d.id,d]));
    const newIds=new Set(to.dancers.map(d=>d.id));
    for(const d of last.values())if(!newIds.has(d.id))assert.ok(outside(d.x,d.y),'Departures walk out before being removed');
    for(const d of to.dancers){const previous=last.get(d.id);assert.ok(previous && Math.hypot(previous.x-d.x,previous.y-d.y)<0.001);}
    change.advance(0.01);
    assert.equal(change.done,true);
    assert.deepEqual(change.frame(),to);
  }
});

test('old hands release before walking and the new formation reaches at the end',()=>{
  const from=itemAt(dances,1).frame(0,0),to=itemAt(dances,2).frame(0,0);
  const change=new FormationChange(from,to);
  assert.deepEqual(change.frame().hands,from.hands);
  change.advance(change.duration/2);
  assert.equal(change.frame().hands.length,0);
  change.advance(change.duration/2-300);
  assert.ok(change.frame().hands.some(h=>h.reach>0&&h.reach<1));
});

test('another selection redirects all current walkers without removing any midstage',()=>{
  const first=new FormationChange(itemAt(dances,1).frame(6,1),itemAt(dances,0).frame(0,0));
  first.advance(1400);
  const snapshot=first.frame();
  const second=new FormationChange(snapshot,itemAt(dances,3).frame(0,0));
  const next=new Map(second.frame().dancers.map(d=>[d.id,d]));
  for(const d of snapshot.dancers){const actual=next.get(d.id);assert.ok(actual);assert.equal(actual.x,d.x);assert.equal(actual.y,d.y);assert.equal(actual.angle,d.angle);}
  second.advance(second.duration);
  assert.equal(second.frame().dancers.length,10);
});
