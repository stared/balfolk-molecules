import { frame, type DanceFrame } from './movement.ts';
import { itemAt } from './indexed.ts';
import { blend } from './rhythm.ts';

type Pair = readonly [number, number];
interface Encounter { before: number[]; after: number[]; bounces: Pair[] }
const angleBetween = (from: number, to: number, amount: number) => from + (((to-from+540)%360)-180)*amount;

/** Improvised encounters, sampled once and retained when scrubbing/replaying. */
export class BourreeChaos {
  private encounters: Encounter[] = [];
  private probability = 0;
  private readonly random: () => number;
  constructor(random: () => number = Math.random) { this.random = random; }

  setProbability(value: number): void { this.probability = Math.max(0, Math.min(1, value)); }
  reset(): void { this.encounters = []; }

  private encounter(index: number): Encounter {
    while (this.encounters.length <= index) {
      const current = this.encounters.length;
      const cycle = Math.floor(current/4), step = current%4;
      const before = current === 0 ? [0,1,2,3,4,5] : [...itemAt(this.encounters,current-1).after];
      const after = [...before];
      const start = frame(4+step,cycle), end = frame(5+step,cycle);
      const initial = frame(4,cycle);
      const edgeIds = initial.dancers.flatMap((d,i)=>d.slot === 1 || d.slot === 4 ? [] : [i]);
      const bounces: Pair[] = [];
      for (const a of edgeIds) {
        const target = itemAt(end.dancers,a);
        const b = edgeIds.find(i=>i !== a && Math.hypot(itemAt(start.dancers,i).x-target.x,itemAt(start.dancers,i).y-target.y)<0.001);
        if (b === undefined || a > b) continue;
        if (this.random() < this.probability) {
          bounces.push([a,b]);
          // Returning to the original side means taking the other trajectory
          // next time. Keep that identity permutation into subsequent cycles.
          after[a] = itemAt(before,b);
          after[b] = itemAt(before,a);
        }
      }
      this.encounters.push({before,after,bounces});
    }
    return itemAt(this.encounters,index);
  }

  frame(time: number, cycle = 0): DanceFrame {
    const base = frame(time,cycle);
    const step = Math.min(3,Math.floor(Math.max(0,time-4)));
    const active = time >= 4 ? this.encounter(cycle*4+step) : undefined;
    const mapping = active?.before ?? (cycle > 0 ? this.encounter(cycle*4-1).after : [0,1,2,3,4,5]);
    const poses = [...base.dancers];
    if (active) {
      const local = time-4-step;
      const reflected = local <= 0.5 ? local : 1-local;
      const u = (reflected-0.25)/0.25;
      const eased = reflected <= 0.25 ? reflected : 0.25+0.25*(u+u*u-u*u*u);
      const returning = frame(4+step+eased,cycle);
      const beginning = frame(4+step,cycle);
      const end = frame(5+step,cycle);
      const meeting = frame(4+step+0.5,cycle);
      for (const [a,b] of active.bounces) for (const [id,other] of [[a,b],[b,a]] as const) {
        const pose = {...itemAt(returning.dancers,id)};
        if(local > 0.5) {
          // Yield toward the outside while returning, leaving the middle
          // dancers' outward route open instead of backing into them.
          const start = itemAt(beginning.dancers,id), target = itemAt(end.dancers,id);
          const nx = start.x+target.x, ny = start.y+target.y;
          const length = Math.hypot(nx,ny);
          const room = 48*Math.sin((local-0.5)*2*Math.PI)**2;
          pose.x += nx/length*room;
          pose.y += ny/length*room;
          const inward = itemAt(beginning.dancers,id).angle;
          pose.angle = local < 0.75
            ? angleBetween(itemAt(meeting.dancers,id).angle,inward,blend((local-0.5)*4))
            : angleBetween(inward,itemAt(end.dancers,other).angle,blend((local-0.75)*4));
        }
        poses[id] = pose;
      }
    }
    const dancers = [...base.dancers];
    poses.forEach((pose,canonical)=> {
      const identity = itemAt(mapping,canonical);
      dancers[identity] = {...pose,id:itemAt(base.dancers,identity).id};
    });
    return {...base,dancers,hands:base.hands.map(hand=>({...hand,dancers:[itemAt(mapping,hand.dancers[0]),itemAt(mapping,hand.dancers[1])]}))};
  }
}
