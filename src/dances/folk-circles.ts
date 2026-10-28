import { itemAt } from '../utils/indexed.ts';
import { blend } from '../engine/rhythm.ts';
import type { Dancer, HandReach } from '../model.ts';

// Counted body-centre sketches, not foot-placement notation. Distances are
// illustrative; each entry ends one musical count. Positive travel = own right.
interface Pose { travel: number; depth: number; facing: number; weight: -1 | 1; leanX?:number; leanY?:number }
interface Count extends Pose { stamp?: -1 | 1 }
const start: Pose = {travel:0,depth:0,facing:0,weight:-1};
const repeat = <T>(items: readonly T[], times: number): T[] => Array.from({length:times},()=>items).flat();

function tzadikScore(): Count[] {
  const score: Count[]=[];
  let pose: Pose={...start,facing:90};
  const step=(distance:number,depth:number,facing:number,weight:-1|1,leanX=0,leanY=0)=>{
    pose={travel:pose.travel+distance,depth,facing,weight,leanX,leanY}; score.push(pose);
  };
  for(let r=0;r<2;r++) {
    for(let i=0;i<4;i++)step(11,0,i===3?0:90,i%2===0?1:-1);
    for(let i=0;i<4;i++)step(i%2===0?5:-5,0,r===0&&i===3?90:0,i%2===0?1:-1);
  }
  for(let r=0;r<2;r++) {
    const base=r*360;
    // Forward then backward steps keep travelling anticlockwise.
    // The torso swivels through the crossings; angles are illustrative.
    step(8,0,base+75,1); step(8,4,base+45,-1);
    step(8,0,base-60,1); step(8,-4,base-45,-1);
    // Travel on both turning supports, finishing inward. The extra quarter-ish
    // rotation aligns the backward-facing lead-in with the crossing rocks.
    step(10,0,base+135,1); step(10,0,base+360,-1);
    step(8,0,base+360,1); step(0,0,base+378,-1,2,-5);
    step(0,0,base+360,1); step(-8,0,base+360,-1);
    step(0,0,base+342,1,-2,-5); step(0,0,base+360,-1);
    for(let i=0;i<4;i++)step(i%2===0?5:-5,0,base+360+(r===1&&i===3?90:0),i%2===0?1:-1);
  }
  return score;
}
function drumulScore(): Count[] {
  const score:Count[]=[];
  let pose:Pose={...start};
  const add=(distance:number,depth:number,weight:-1|1,stamp?:-1|1,facing=0)=>{
    pose={travel:pose.travel+distance,depth,facing,weight,
      leanX:facing/6,leanY:facing<0?-4:facing>0?2.5:0};
    score.push(stamp===undefined?pose:{...pose,stamp});
  };
  for(let r=0;r<2;r++)for(const direction of [1,-1] as const) {
    for(let i=0;i<5;i++)add(direction*(i%2===0?10:3),0,i%2===0?direction:direction===1?-1:1);
    const free=direction===1?-1:1;
    add(0,0,direction,free); add(0,0,direction,free); add(0,0,direction);
  }
  for(let r=0;r<2;r++) {
    for(let rock=0;rock<3;rock++) {
      // Cross R in front toward the left diagonal, recover on L;
      // open R to the side/back, recover on L. Small centre travel, visible twist.
      // Twist magnitude is illustrative, not a measured hip angle.
      add(-2,1,1,undefined,-18); add(2,0,-1);
      add(2,-1,1,undefined,18); add(-2,0,-1);
    }
    for(let stamp=0;stamp<3;stamp++)add(0,0,-1,1);
    add(0,0,-1);
  }
  return score;
}
const tzadik=tzadikScore();
const drumul=drumulScore();
// Walk through the middle of a count without a stop at every contact.
// Short acceleration/deceleration ramps retain a readable support change.
function stride(t:number):number {
  const ramp=0.18;
  if(t<ramp)return t*t/(2*ramp*(1-ramp));
  if(t>1-ramp)return 1-(1-t)**2/(2*ramp*(1-ramp));
  return (t-ramp/2)/(1-ramp);
}
function countedFrame(kind:'tzadik'|'drumul',time:number,cycle:number) {
  const score=kind==='tzadik'?tzadik:drumul;
  const initial=kind==='tzadik'?{...start,facing:90}:start;
  const beat=Math.max(0,Math.min(score.length,time*4));
  const index=Math.min(score.length-1,Math.floor(beat));
  const phase=beat-index;
  const a=index===0?initial:itemAt(score,index-1), b=itemAt(score,index);
  const mix=(from:number,to:number)=>from+(to-from)*stride(phase);
  const last=itemAt(score,score.length-1);
  const travel=cycle*last.travel+mix(a.travel,b.travel);
  const radius=145-mix(a.depth,b.depth);
  // Centre the transfer on the count; prepare the next support before it.
  // Use the preceding cycle's last support at zero to keep the seam smooth.
  const supportBeat = (beat % score.length) + 0.14;
  const supportIndex = Math.floor(supportBeat) % score.length;
  const supportPhase = supportBeat - Math.floor(supportBeat);
  const fromSupport = itemAt(score,(supportIndex+score.length-1)%score.length).weight;
  const toSupport = itemAt(score,supportIndex).weight;
  const weight=fromSupport+(toSupport-fromSupport)*blend(supportPhase/0.28);
  const facing=mix(a.facing,b.facing);
  const leanPhase=blend(phase);
  const bodyLean={x:(a.leanX??0)+((b.leanX??0)-(a.leanX??0))*leanPhase,
    y:(a.leanY??0)+((b.leanY??0)-(a.leanY??0))*leanPhase};
  // The free foot prepares before contact; the stamp is fully visible ON it.
  const stampPose=phase>=0.88?itemAt(score,(index+1)%score.length):b;
  const stampPhase=phase>=0.88?phase-1:phase;
  const stamp=stampPose.stamp===undefined?0:blend((stampPhase+0.12)/0.12)*(1-blend((stampPhase-0.18)/0.25));
  const dancers:Dancer[]=Array.from({length:10},(_,i)=>{
    // Both selected variants form a closed ring with equal neighbour spacing.
    const spacing=2*Math.PI/10;
    const theta=Math.PI*1.15-i*spacing-travel/145;
    return {id:String.fromCharCode(65+i),slot:i,x:radius*Math.cos(theta),y:radius*Math.sin(theta),angle:theta*180/Math.PI-90+facing,weight,bodyLean,hipAngle:kind==='drumul'?facing*1.5:0,
      stampLeft:stampPose.stamp===-1?stamp:0,stampRight:stampPose.stamp===1?stamp:0};
  });
  let reach=1;
  if(kind==='tzadik'&&beat>=16) {
    const local=(beat-16)%16;
    reach=local<4?1-blend((local-3)/0.7):local<6?0:blend((local-6)/0.7);
  }
  const shoulderHold=beat<16||beat>47?Math.max(0,Math.sin(facing*Math.PI/180)):0;
  const hands:HandReach[]=Array.from({length:10},(_,i)=>({dancers:[i,(i+1)%10],reach,
    ...(kind==='tzadik'?{shoulderHold}:{}),
  }));
  return {dancers,hands,weight,section:kind==='tzadik'?(beat<16?0:1):(beat<32?0:1)};
}
export const tzadikFrame=(time:number,cycle=0)=>countedFrame('tzadik',time,cycle);
export const drumulFrame=(time:number,cycle=0)=>countedFrame('drumul',time,cycle);
export const tzadikPhrases=['Walk R L R L','Sway R L R L','Walk R L R L','Sway R L R L',...repeat(['Forward · forward · backward · backward','Right turn · side · cross','Rock back · side · cross · back','Sway R L R L'],2)];
export const drumulPhrases=[...repeat(['Right · close · right · close','Right · stamp · stamp · hold','Left · close · left · close','Left · stamp · stamp · hold'],2),...repeat(['Cross + twist · recover · open + twist · recover','Cross + twist · recover · open + twist · recover','Cross + twist · recover · open + twist · recover','Stamp · stamp · stamp · hold'],2)];
