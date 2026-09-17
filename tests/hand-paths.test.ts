import test from 'node:test';
import assert from 'node:assert/strict';
import { handPaths } from '../src/ui/hand-paths.ts';
import { tzadikFrame, drumulFrame } from '../src/dances/folk-circles.ts';
import { itemAt } from '../src/utils/indexed.ts';
const numbers=(path:string)=>path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);
test('Tzadik arms attach to shoulders, meet, release and stay continuous across the cycle',()=>{
  for(const t of [0,1,4,5.1,6,11.9]) {
    const state=tzadikFrame(t),hand=itemAt(state.hands,0);
    const a=itemAt(state.dancers,0),b=itemAt(state.dancers,1);
    const [left,right]=handPaths(a,b,hand).map(numbers);
    assert.ok(left&&right);
    assert.ok(Math.abs(Math.hypot(itemAt(left,0)-a.x,itemAt(left,1)-a.y)-12)<1e-8);
    assert.ok(Math.abs(Math.hypot(itemAt(right,0)-b.x,itemAt(right,1)-b.y)-12)<1e-8);
    if(hand.reach===1)assert.ok(Math.hypot(itemAt(left,4)-itemAt(right,4),itemAt(left,5)-itemAt(right,5))<1e-8);
    if(hand.reach===0)assert.deepEqual(left.slice(0,2),left.slice(4,6));
  }
  const paths=(time:number,cycle:number)=>{const s=tzadikFrame(time,cycle);return handPaths(itemAt(s.dancers,0),itemAt(s.dancers,1),itemAt(s.hands,0)).flatMap(numbers);};
  const end=paths(12,0),next=paths(0,1);
  end.forEach((n,i)=>assert.ok(Math.abs(n-itemAt(next,i))<1e-8));
});
test('Drumul keeps both ends open with equally spaced neighbours',()=>{
  for(const time of [0,4,8.25,12,16]) {
    const state=drumulFrame(time);
    assert.equal(state.hands.length,9);
    assert.deepEqual(state.hands.map(h=>h.dancers),Array.from({length:9},(_,i)=>[i,i+1]));
    const distances=state.hands.map(h=>{const a=itemAt(state.dancers,h.dancers[0]),b=itemAt(state.dancers,h.dancers[1]);return Math.hypot(a.x-b.x,a.y-b.y);});
    assert.ok(Math.max(...distances)-Math.min(...distances)<1e-8);
  }
});
