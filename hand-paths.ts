import type { Dancer, HandReach, Position } from './movement.ts';

const lerp=(a:Position,b:Position,t:number):Position=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const local=(d:Dancer,x:number,y:number):Position=>{
  const angle=d.angle*Math.PI/180;
  return {x:d.x+x*Math.cos(angle)-y*Math.sin(angle),y:d.y+x*Math.sin(angle)+y*Math.cos(angle)};
};
function curve(start:Position,control:Position,end:Position,t:number):string {
  const c=lerp(start,control,t),p=lerp(c,lerp(control,end,t),t);
  return `M ${start.x} ${start.y} Q ${c.x} ${c.y} ${p.x} ${p.y}`;
}
/** Two coloured arms, each growing from its own dancer to a shared hand. */
export function handPaths(from:Dancer,to:Dancer,hand:HandReach):[string,string] {
  if(hand.shoulderHold!==undefined) {
    const right=local(from,12,0),left=local(to,-12,0);
    const joined=lerp(right,left,0.5+hand.shoulderHold*0.5);
    const elbow=(d:Dancer,start:Position)=>{
      const middle=lerp(start,joined,0.5),forward=local(d,0,-5);
      return {x:middle.x+forward.x-d.x,y:middle.y+forward.y-d.y};
    };
    return [curve(right,elbow(from,right),joined,hand.reach),curve(left,elbow(to,left),joined,hand.reach)];
  }
  const distance=Math.hypot(to.x-from.x,to.y-from.y)||1,arch=hand.arch??0;
  const control={x:(from.x+to.x)/2-(to.y-from.y)/distance*arch,y:(from.y+to.y)/2+(to.x-from.x)/distance*arch};
  return [curve(from,control,to,hand.reach/2),curve(to,control,from,hand.reach/2)];
}
