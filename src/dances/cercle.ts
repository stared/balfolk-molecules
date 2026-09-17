import { blend } from '../engine/rhythm.ts';
import { defaultPairCount, maxPairCount } from './chapelloise.ts';
import type { Dancer, HandReach, Position } from '../model.ts';

// Olivier Pécheux's 64-count bal-folk version (April 2010).
// Four walking steps for each advance/retreat; swing uses right-foot support.
// Floor distances, swing revolutions and promenade distance are illustrative.
const ring = 170;
const orbit = 22;
const centerRadius = 150;
const degrees = 180/Math.PI;
const polar = (r:number,a:number):Position => ({x:r*Math.cos(a),y:r*Math.sin(a)});
const mix = (a:Position,b:Position,u:number):Position => ({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u});
const turn = (a:number,b:number,u:number) => a+(((b-a)%360+540)%360-180)*u;
const heading = (a:Position,b:Position) => Math.atan2(b.x-a.x,a.y-b.y)*degrees;

// Equal walking strides with brief acceleration/deceleration, not a sine wave.
function travel(count:number,length:number):number {
  const t=Math.max(0,Math.min(length,count)),ramp=0.3;
  const distance=t<ramp?t*t/(2*ramp):t>length-ramp?length-ramp-(length-t)**2/(2*ramp):t-ramp/2;
  return distance/(length-ramp);
}
function walkingWeight(count:number):number {
  const step=Math.floor(count),target=step%2?-1:1;
  return -target+2*target*blend((count-step)/0.22);
}

export function cercleFrame(time:number,cycle=0,pairCount=defaultPairCount) {
  if(!Number.isInteger(pairCount)||pairCount<1||pairCount>maxPairCount)throw new RangeError(`Cercle requires 1–${maxPairCount} pairs`);
  const count=Math.max(0,Math.min(64,time*4));
  const spacing=2*Math.PI/pairCount;
  const mod=(n:number)=>((n%pairCount)+pairCount)%pairCount;
  const rotation=-cycle*spacing/2;
  const dancers:Dancer[]=[],hands:HandReach[]=[];
  const depth=55;
  const excursion=(local:number)=>depth*(local<4?travel(local,4):1-travel(local-4,4));
  for(let identity=0;identity<pairCount*2;identity++) {
    const follower=identity%2===1;
    const pair=mod(Math.floor(identity/2)-(follower?cycle:0));
    const base=pair*spacing+rotation-(follower?spacing/2:0);
    // At the start, a leader swings with the follower on their left.
    const swingPair=follower?mod(pair-1):pair;
    // Use the same unwrapped angle for both members of each swing pair.
    const centerAngle=swingPair*spacing+rotation+spacing/4;
    const center=polar(centerRadius,centerAngle);
    const startOrbit=centerAngle-Math.PI/2+(follower?Math.PI:0);
    const offset=polar(orbit,startOrbit);
    const swingStart={x:center.x+offset.x,y:center.y+offset.y};
    let pose=polar(ring,base),angle=base*degrees-90,weight=walkingWeight(count);
    if(count<16)pose=polar(ring-excursion(count%8),base);
    else if(count<24){
      if(follower)pose=polar(ring-excursion(count-16),base);
      else weight=0;
    } else if(count<28){
      if(!follower){
        pose=polar(ring-depth*travel(count-24,4),base);
        angle-=180*blend(count-27);
      } else weight=0;
    } else if(count<32){
      const start=polar(follower?ring:ring-depth,base);
      const u=travel(count-(follower?30:28),follower?2:4);
      pose=mix(start,swingStart,u);
      const initial=base*degrees-(follower?90:270);
      angle=turn(initial,heading(swingStart,center),blend((count-28)/4));
      if(follower && count<30)weight=0;
    } else if(count<48){
      const sweep=3.5*Math.PI*travel(count-32,16);
      const offset=polar(orbit,startOrbit+sweep);
      pose={x:center.x+offset.x,y:center.y+offset.y};
      angle=heading(pose,center);
      // The right foot remains the pivot; the left pushes every other beat.
      weight=1-0.3*Math.sin(Math.PI*((count-32)%2)/2)**2;
    } else {
      const u=travel(count-48,16),open=blend((count-62)/2);
      const theta=centerAngle-spacing*u+(follower?-1:1)*spacing/4*open;
      const radius=centerRadius+(follower?orbit:-orbit);
      pose=polar(radius+(ring-radius)*open,theta);
      const tangent=(centerAngle-spacing*u)*degrees;
      angle=turn(tangent+(follower?-90:90),tangent,blend(count-48));
      angle=turn(angle,theta*degrees-90,open);
    }
    dancers.push({...pose,angle,weight,slot:pair,id:String.fromCharCode(65+identity),role:follower?'follower':'leader'});
  }
  const connections=new Map<string,HandReach>();
  const connect=(leader:number,follower:number,reach:number)=>{
    const key=`${leader}:${follower}`,old=connections.get(key);
    if(old)old.reach=Math.max(old.reach,reach);
    else connections.set(key,{dancers:[leader,follower],reach});
  };
  for(let leader=0;leader<pairCount;leader++) {
    const right=mod(leader+cycle)*2+1,left=mod(leader+1+cycle)*2+1;
    const circleReach=1-blend(count-15);
    connect(leader*2,right,circleReach);
    connect(leader*2,left,Math.max(circleReach,blend((count-30)/2)));
    // The swing partner becomes the right neighbour; reach to the new left.
    connect(leader*2,mod(leader+2+cycle)*2+1,blend(count-63));
  }
  hands.push(...connections.values());
  return {dancers,hands,weight:0,section:Math.min(3,Math.floor(count/16))};
}
