import type { Dance, Dancer, HandReach, LiveFrame } from '../model.ts';
import type { Phrase } from '../engine/phrase-structure.ts';
import { blend, countedSupport } from '../engine/rhythm.ts';

// Sixteen rondeau steps, four musical beats each. Route/turn references and
// the choice of finale are documented in docs/congo-de-captieux.md.
// Two facing couples: A/B at the bottom, C/D their half-turn counterparts.
// Angles are deliberately unwrapped: most turns go LEFT, not the shortest way.
type Pose = readonly [time: number, x: number, y: number, angle: number];
const leader: readonly Pose[] = [
  [0,-38,66,0], [.5,-38,38,0], [.75,-38,34,0], [1,-38,40,0],
  [1.5,-38,66,0], [1.75,-38,70,0], [2,-38,63,0],
  [2.5,-38,38,0], [2.75,-42,38,90], [3,-33,38,90],
  [3.45,0,18,90], [3.75,38,42,0], [4,38,34,0],
  [4.5,38,16,-45], [4.75,44,18,-135], [5,44,27,-180],
  [5.5,42,65,-360], [5.75,44,70,-450], [6,34,70,-450],
  [6.5,-32,84,-450], [6.75,-38,64,-450], [7,-38,70,-450],
  [7.5,-40,68,-630], [7.75,-38,64,-720], [8,-38,54,-720],
  [8.25,-56,31,-720], [8.6,-56,-4,-720], [8.8,-56,-4,-630], [9,-32,-8,-630],
  [9.45,0,-16,-630], [9.75,38,3,-630], [10,38,-7,-630],
  [10.5,38,-66,-810], [10.75,38,-70,-810], [11,38,-62,-810],
  [11.5,42,-63,-1080], [11.75,38,-70,-1215], [12,38,-60,-1260],
  // Spread the short-side travel over the long support; no late sprint.
  [12.35,57,-25,-1260], [12.65,57,18,-1260], [12.85,52,13,-1215], [13,30,12,-1215],
  [13.5,-38,65,-1305], [13.75,-43,70,-1305], [14,-34,56,-1305],
  [14.45,-12,14,-1485], [14.65,-11,13,-1485], [15,-38,66,-1440],
  [15.25,-38,66,-1440], [15.6,-32,63,-1395], [15.8,-35,66,-1395], [16,-38,66,-1440],
];
const follower: readonly Pose[] = [
  [0,38,66,0], [.5,38,38,0], [.75,38,34,0], [1,38,40,0],
  [1.5,38,66,0], [1.75,38,70,0], [2,38,63,0],
  [2.5,38,38,0], [2.75,42,38,-90], [3,33,38,-90],
  [3.45,0,58,-225], [3.75,-38,42,-360], [4,-38,34,-360],
  [4.5,-38,16,-405], [4.75,-32,18,-495], [5,-32,27,-540],
  [5.5,-38,60,-540], [5.75,-42,50,-630], [6,-32,46,-630],
  [6.5,32,46,-765], [6.75,38,64,-810], [7,38,70,-810],
  [7.5,42,66,-1035], [7.75,44,70,-1125], [8,38,58,-1125],
  // Followers pass LEFT shoulders and clear the centre before the leaders.
  [8.5,20,-20,-1125], [8.9,-24,-54,-1125], [9.5,-38,-66,-1125],
  [9.75,-38,-70,-1170], [10,-38,-62,-1170],
  [10.5,-38,-29,-1350], [10.75,-38,-25,-1350], [11,-38,-31,-1350],
  [11.5,-42,-33,-1575], [11.75,-44,-37,-1665], [12,-38,-27,-1665],
  [12.5,-17,21,-1665], [12.8,14,44,-1665], [13.1,34,52,-1665], [13.5,38,66,-1800],
  [13.75,44,68,-1890], [14,34,73,-1890],
  // Go BEHIND the original partner while the two leaders play in the middle.
  [14.35,-12,94,-1890], [14.75,-66,47,-1960], [14.9,-54,29,-1980], [15,-38,32,-1980],
  [15.25,-38,30,-1980], [15.6,0,42,-1880], [15.85,32,64,-1810], [16,38,66,-1800],
];

/** Shape-preserving positions and unwrapped headings; continuous velocity at keys. */
function poseAt(path: readonly Pose[], time: number): {x:number;y:number;angle:number} {
  const next = path.findIndex(p => p[0] > time);
  const i = next < 0 ? path.length - 2 : Math.max(0,next - 1);
  const a = path[i]!, b = path[i+1]!, span = b[0]-a[0];
  const u = Math.max(0,Math.min(1,(time-a[0])/span));
  const coordinate = (axis: 1|2|3) => {
    const slope = (index:number) => {
      if (index===0 || index===path.length-1) return 0;
      const p=path[index-1]!, q=path[index]!, r=path[index+1]!;
      const left=(q[axis]-p[axis])/(q[0]-p[0]), right=(r[axis]-q[axis])/(r[0]-q[0]);
      return left*right<=0 ? 0 : 2*left*right/(left+right);
    };
    return (2*u**3-3*u*u+1)*a[axis]+(u**3-2*u*u+u)*span*slope(i)
      +(-2*u**3+3*u*u)*b[axis]+(u**3-u*u)*span*slope(i+1);
  };
  return {x:coordinate(1),y:coordinate(2),angle:coordinate(3)};
}

export const congoContacts = [0,2,2.5,3] as const;
export function congoFrame(time: number): LiveFrame {
  const t=Math.max(0,Math.min(16,time)), count=(t%1)*4;
  const contact=count<2?0:count<2.5?1:count<3?2:3;
  const weight=countedSupport(count,congoContacts,4,0.22,-1);
  const sink=0.45*(1-blend((count-congoContacts[contact]!)/0.65));
  const dancers: Dancer[] = [leader,follower,leader,follower].map((path,i)=>{
    const p=poseAt(path,t), opposite=i>=2;
    return {...p,x:p.x*(opposite?-1:1),y:p.y*(opposite?-1:1),angle:p.angle+(opposite?180:0),
      id:'ABCD'[i]!,slot:i,role:i%2===0?'leader':'follower',weight,sink};
  });
  // A glance keeps the counterpartner involved during the sideways chase.
  const glance=(blend((t-6.5)/0.25)*(1-blend((t-7.1)/0.3))
    +blend((t-9.6)/0.25)*(1-blend((t-11)/0.4)));
  for (const [i,j] of [[0,3],[1,2],[2,1],[3,0]] as const) {
    const a=dancers[i]!, b=dancers[j]!;
    const toward=Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI;
    // Return the gaze through centre when the partner moves behind the body;
    // clamping a wrapped angle would snap from one shoulder to the other.
    a.gazeAngle=65*Math.sin((toward-a.angle)*Math.PI/180)*glance;
  }
  const hands: HandReach[]=[];
  const partnered=t<4 ? 1-blend((t-3.6)/0.35) : t>15 ? blend((t-15)/0.2) : 0;
  if (partnered>0) for (const pair of [[0,1],[2,3]] as [number,number][])
    hands.push({dancers:pair,reach:partnered,arch:t<4?28*blend((t-2.8)/0.3)*(1-blend((t-3.65)/0.3)):0});
  const touch=blend((t-4.2)/0.22)*(1-blend((t-4.55)/0.25));
  if (touch>0) for (const pair of [[0,3],[1,2]] as [number,number][])
    hands.push({dancers:pair,reach:touch});
  return {dancers,hands,weight,section:Math.min(3,Math.floor(t/4))};
}

const movements = [
  ['Forward','Approach the opposite couple; prepare to retreat.'],
  ['Backward','Retreat together; prepare to approach.'],
  ['Forward','Approach, then face your partner.'],
  ['Pastourelle','Exchange sides: leader inside, follower under the raised arm outside.'],
  ['Meet','Meet the counterpartner; a light palm touch.'],
  ['Out','Turn left outwards, then face your own partner.'],
  ['Tiroir','Exchange sides back; the leader passes behind the follower.'],
  ['Turn','Turn left; followers prepare the diagonal.'],
  ['Crossing','Followers cross the diagonal, left shoulders; leaders take the short side.'],
  ['Pass','Followers clear the centre; leaders cross right shoulders behind them.'],
  ['Chase','Counterpartners travel along the side, turning left and exchanging glances.'],
  ['Turn','Turn left; followers prepare the return diagonal.'],
  ['Return','Followers return diagonally; leaders first take the short side.'],
  ['Home','Leaders return diagonally, followers finish their crossing.'],
  ['Play','Leaders meet right sides in the centre; followers go behind their own partner.'],
  ['Reunite','Face your own partner, touch hands, then return to the original places.'],
] as const;
const groups=['Partners','Counterpartners','Outward','Return'];
const phrase: Phrase={kind:'sequence',name:'Congo de Captieux',parts:groups.map((name,i)=>({
  kind:'sequence',name,parts:movements.slice(i*4,i*4+4).map(([name,detail])=>({
    kind:'sequence',name,detail,parts:[
      {kind:'action',name:'Left',beats:2}, {kind:'action',name:'Right',beats:0.5},
      {kind:'action',name:'Close',beats:0.5}, {kind:'action',name:'Prepare',beats:1},
    ],
  })),
}))};
export const congoDance: Dance={
  id:'congo-de-captieux',title:'Congo de Captieux',category:'set',roles:true,
  origin:'Captieux, Gascony, France',aliases:['Congo'],
  description:'Two facing couples tease, exchange places and cross on different routes before reuniting.',
  duration:16,millisecondsPerPhrase:2000,contacts:congoContacts,
  sections:groups.map((name,i)=>({name,start:i*4,duration:4,detail:movements.slice(i*4,i*4+4).map(m=>m[0]).join(' · ')})),
  phrases:movements.map(m=>m[1]),
  structure:{phrase,note:'Sixteen rondeau steps, four beats each. Left, then right–left–right; the last step prepares the next direction.'},
  guides:'<path class="guide" d="M -38 -66 H 38 V 66 H -38 Z"/>',
  viewBox:'-130 -135 260 270',
  note:'Two couples · 64 beats · Sixteen rondeau steps.',
  sources:'<a href="https://www.dansetrad.fr/fiches/fiches_pdf/Congo_de_Captieux.pdf" target="_blank" rel="noreferrer">Notation: Olivier Pécheux</a> · <a href="https://www.youtube.com/watch?v=M0vr8fQoyCQ" target="_blank" rel="noreferrer">Demo: Frisse Folk</a> · <a href="https://www.youtube.com/watch?v=ZHovppdfZBk" target="_blank" rel="noreferrer">Gennetines workshop</a> · Sixteen-step version. Routes, spacing, gaze and timing within a step are schematic. The finale shows the assisted return in floor projection; vertical lift and hand grip are omitted.',
  frame:congoFrame,
};
