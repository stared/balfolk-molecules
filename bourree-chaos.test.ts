import test from 'node:test';
import assert from 'node:assert/strict';
import {BourreeChaos} from './bourree-chaos.ts';
import {frame} from './movement.ts';
import {itemAt} from './indexed.ts';
const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

test('zero chaos preserves the original dance',()=>{
 const chaos=new BourreeChaos(()=>0.5);
 for(let cycle=0;cycle<3;cycle++)for(let time=0;time<=8;time+=.1)assert.deepEqual(chaos.frame(time,cycle),frame(time,cycle));
});
test('bounce pairs return instead of passing, and decisions survive scrubbing',()=>{
 let calls=0;const chaos=new BourreeChaos(()=>{calls++;return .2;});chaos.setProbability(1);
 const initial=chaos.frame(4),end=chaos.frame(5);
 initial.dancers.forEach((d,i)=>{if(d.slot!==1&&d.slot!==4)assert.ok(distance(d,itemAt(end.dancers,i))<1e-8);});
 const before=chaos.frame(4.7);const samples=calls;
 chaos.setProbability(0);assert.deepEqual(chaos.frame(4.7),before);assert.equal(calls,samples);
});
test('mixed bounces preserve identities and continuity across phrases and cycles',()=>{
 let sample=0;const chaos=new BourreeChaos(()=>++sample%2?0.1:0.9);chaos.setProbability(.5);
 for(let cycle=0;cycle<4;cycle++) {
  for(let boundary=1;boundary<=8;boundary++) {
   const before=chaos.frame(boundary-1e-7,cycle);
   const after=boundary===8?chaos.frame(0,cycle+1):chaos.frame(boundary,cycle);
   before.dancers.forEach((d,i)=>{assert.equal(d.id,itemAt(after.dancers,i).id);assert.ok(distance(d,itemAt(after.dancers,i))<.001);});
  }
  for(let time=0;time<=8;time+=.02){const state=chaos.frame(time,cycle);state.dancers.forEach((d,i)=>{for(let j=i+1;j<6;j++)assert.ok(distance(d,itemAt(state.dancers,j))>28);});}
 }
});
