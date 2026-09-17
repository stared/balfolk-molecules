import { blend } from '../engine/rhythm.ts';
import type { Dancer, HandReach } from '../model.ts';

export type ChainDance = 'hanter-dro' | 'an-dro';
export const chainDancerCount = 10;
export const chainRepeats = 4;

interface Step { beat: number; foot: -1 | 1; distance: number; duration: number }
// Negative support = left. Musical beats, not the doubled teaching count.
// Hanter-dro: 1 & 2, 3. An dro: 1 & 2, 3 & 4.
// Distances describe body travel, not foot placement; closing steps are smaller.
const leftSteps: readonly Step[] = [
  {beat:0,foot:-1,distance:8,duration:0.45},
  {beat:0.5,foot:1,distance:3,duration:0.45},
  {beat:1,foot:-1,distance:7,duration:0.8},
];
const steps: Record<ChainDance, readonly Step[]> = {
  'hanter-dro': [...leftSteps,{beat:2,foot:1,distance:0,duration:0.8}],
  'an-dro': [...leftSteps,{beat:2,foot:1,distance:0,duration:0.45},{beat:2.5,foot:-1,distance:0,duration:0.45},{beat:3,foot:1,distance:0,duration:0.8}],
};
export const chainBeats = (kind: ChainDance): number => kind === 'hanter-dro' ? 3 : 4;
export const chainContacts = (kind: ChainDance): readonly number[] => steps[kind].map(step=>step.beat);

export function chainFrame(kind: ChainDance, time: number, cycle = 0) {
  const bounded=Math.max(0,Math.min(chainRepeats,time));
  const repeat=Math.min(chainRepeats-1,Math.floor(bounded));
  const beat=(bounded-repeat)*chainBeats(kind);
  let travel=0,weight=1;
  for(const step of steps[kind]) {
    travel+=step.distance*blend((beat-step.beat)/step.duration);
    if(beat>=step.beat)weight=-step.foot+2*step.foot*blend((beat-step.beat)/0.18);
  }
  const total=(cycle*chainRepeats+repeat)*18+travel;
  const radius=145;
  const spacing=kind==='hanter-dro'?0.27:0.36;
  // Index 0 leads at the left end; all travel to their own left (clockwise).
  // A circular track isolates the shared step; free-form leading is not modeled.
  const head=Math.PI*1.15+total/radius;
  const dancers:Dancer[]=Array.from({length:chainDancerCount},(_,i)=>{
    const theta=head-i*spacing;
    return {x:radius*Math.cos(theta),y:radius*Math.sin(theta),angle:theta*180/Math.PI-90,id:String.fromCharCode(65+i),slot:i,weight};
  });
  // Top-down projection only: An dro hands move forward then return, while
  // Hanter-dro's bent armhold stays close. Height and elbow rolling are omitted.
  const curl=kind==='an-dro'?(beat<2?blend(beat/2):1-blend((beat-2)/2)):0;
  const arch=kind==='an-dro'?-4-24*curl:-8;
  const hands:HandReach[]=Array.from({length:chainDancerCount-1},(_,i)=>({dancers:[i,i+1],reach:1,arch}));
  return {dancers,hands,weight,section:0};
}
export const hanterDroFrame=(time:number,cycle=0)=>chainFrame('hanter-dro',time,cycle);
export const anDroFrame=(time:number,cycle=0)=>chainFrame('an-dro',time,cycle);
