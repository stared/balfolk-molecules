import { blend } from '../engine/rhythm.ts';
import { itemAt } from '../utils/indexed.ts';
import type { Dancer, HandReach } from '../model.ts';

// Count structure: Olivier Pécheux, Chapelloise (2012), detailed sheet.
// Positions are schematic body centers, not measured foot placements.
export const defaultPairCount = 5;
export const minPairCount = 1;
export const maxPairCount = 12;
const inner = 108;
const outer = 162;
const polar = (radius: number, angle: number) => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
type Mark = readonly [count: number, value: number];

// Interpolate counted positions with continuous velocity. A repeated value is
// a settling interval; it is not filled with an arbitrary oscillation.
function score(count: number, marks: readonly Mark[]): number {
  const first = itemAt(marks, 0);
  const last = itemAt(marks, marks.length - 1);
  if (count <= first[0]) return first[1];
  if (count >= last[0]) return last[1];
  const index = marks.findIndex((mark, i) => i < marks.length - 1 && count >= mark[0] && count < itemAt(marks, i + 1)[0]);
  const a = itemAt(marks, index), b = itemAt(marks, index + 1);
  const slope = (i: number) => {
    if (i === 0 || i === marks.length - 1) return 0;
    const previous = itemAt(marks, i - 1), current = itemAt(marks, i), next = itemAt(marks, i + 1);
    const left = (current[1] - previous[1]) / (current[0] - previous[0]);
    const right = (next[1] - current[1]) / (next[0] - current[0]);
    return left * right <= 0 ? 0 : 2 * left * right / (left + right);
  };
  const duration = b[0] - a[0], u = (count - a[0]) / duration;
  return (2*u**3-3*u**2+1)*a[1] + (u**3-2*u**2+u)*duration*slope(index)
    + (-2*u**3+3*u**2)*b[1] + (u**3-u**2)*duration*slope(index+1);
}

// Approximately equal strides through each eight-count passage. Only starting,
// reversing direction, and finishing slow down; turning does not stop travel.
function walk(count: number): number {
  const c = Math.max(0, Math.min(8, count));
  const ramp = 0.35;
  const distance = c < ramp ? c*c/(2*ramp) : c > 8-ramp ? 8-ramp-(8-c)**2/(2*ramp) : c-ramp/2;
  return distance * 8 / (8-ramp);
}
function support(count: number, contacts: readonly number[], first: number, previous: number): number {
  let index = contacts.length - 1;
  while (index > 0 && itemAt(contacts, index) > count) index--;
  const target = first * (index % 2 === 0 ? 1 : -1);
  const from = index === 0 ? previous : -target;
  return from + (target-from) * blend((count-itemAt(contacts,index))/0.22);
}
const polkaContacts = [0, 0.5, 1, 2, 2.5, 3];
const exchangeContacts = [0, 1, 2];
const exchangeStops: readonly Mark[] = [[0,0],[1,0.34],[2,0.72],[3,1],[4,1]];
const lateralStops: readonly Mark[] = [[0,0],[0.5,0.55],[1,0.7],[1.5,1],[2,1]];

export function chapelloiseFrame(time: number, cycle = 0, pairCount = defaultPairCount) {
  if (!Number.isInteger(pairCount) || pairCount < minPairCount || pairCount > maxPairCount) {
    throw new RangeError(`Chapelloise requires ${minPairCount}–${maxPairCount} pairs`);
  }
  const coupleCount = pairCount;
  const spacing = Math.PI * 2 / coupleCount;
  const mod = (n: number) => ((n % coupleCount) + coupleCount) % coupleCount;
  const crossingWidth = Math.min(1, spacing / 0.64);
  const count = Math.max(0, Math.min(32, time * 4));
  const dancers: Dancer[] = [];
  const hands: HandReach[] = [];
  const promenade = count < 8 ? -0.2 * walk(count) : count < 16 ? -0.2 * (8-walk(count-8)) : 0;
  const halfTurn = blend(count-3)-blend(count-11);
  const phrase = Math.min(7, Math.floor(count/4));
  const local = count - phrase*4;
  const polka = phrase === 4 || phrase === 6;
  const approach = polka ? 10 * (local < 2 ? score(local,lateralStops) : 1-score(local-2,lateralStops)) : 0;
  const exchange = count < 20 ? 0 : count < 24 ? score(count-20,exchangeStops) : 1;
  const change = count < 28 ? 0 : score(count-28,exchangeStops);

  let leaderWeight: number;
  if(count < 16) leaderWeight = support(count, Array.from({length:16},(_,i)=>i), -1, -1);
  else if(phrase === 4) leaderWeight = support(local,polkaContacts,1,1);
  else if(phrase === 5) leaderWeight = support(local,exchangeContacts,1,-1);
  else if(phrase === 6) leaderWeight = support(local,polkaContacts,-1,1);
  else leaderWeight = support(local,exchangeContacts,-1,1);

  for(let identity=0;identity<coupleCount*2;identity++) {
    const follower = identity%2 === 1;
    const pair = follower ? mod(Math.floor(identity/2)+cycle) : Math.floor(identity/2);
    // Both partners contribute to progression: leaders move toward the pair in
    // front, followers toward the pair behind. The division of distance is schematic.
    const base = pair*spacing-cycle*spacing/2;
    let angle = base+promenade;
    let radius = follower ? outer : inner;
    let facing = angle*180/Math.PI+(follower ? -180 : 180)*halfTurn;
    if(count >= 16) {
      radius = follower ? outer-(outer-inner)*exchange : inner+(outer-inner)*exchange;
      radius += (follower ? -1 : 1)*(phrase === 6 ? -approach : approach);
      if(phrase === 5 && follower) {
        // The follower crosses in front while the leader moves sideways.
        angle += crossingWidth * score(local,[[0,0],[1,-0.32],[2,-0.24],[3,0],[4,0]]);
        facing = angle*180/Math.PI+score(local,[[0,0],[1,-90],[2,-270],[3,-360],[4,-360]]);
      } else if(count >= 28) {
        radius = follower ? inner+(outer-inner)*change : outer-(outer-inner)*change;
        angle += (follower ? 1 : -1)*spacing/2*change;
        facing = angle*180/Math.PI+(follower ? score(local,[[0,0],[1,90],[2,270],[3,360],[4,360]]) : 0);
      } else {
        // Lateral polka steps do not turn the body to face the partner.
        facing = angle*180/Math.PI;
      }
    }
    dancers.push({ ...polar(radius,angle), angle:facing, slot:pair, id:String.fromCharCode(65+identity), role:follower?'follower':'leader', weight:follower?-leaderWeight:leaderWeight });
  }
  for(let follower=0;follower<coupleCount;follower++) {
    const current=mod(follower+cycle), next=mod(current+1), id=follower*2+1;
    const local=count-28;
    hands.push({ dancers:[current*2,id], reach:count<28?1:1-blend((local-1.2)/0.6), arch:count<28?0:score(local,[[0,0],[0.5,28],[1.4,28],[2,0],[4,0]]) });
    if(count>=28) hands.push({ dancers:[next*2,id], reach:blend(local-2) });
  }
  return { dancers,hands,weight:0,section:count<16?0:1 };
}
