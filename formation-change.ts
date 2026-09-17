import { blend } from './rhythm.ts';
import { itemAt } from './indexed.ts';
import type { Dancer, HandReach } from './movement.ts';
import type { LiveFrame } from './circle-live.ts';

const turn=(a:number,b:number,u:number)=>a+(((b-a)%360+540)%360-180)*u;
const outside=(d:Dancer):Dancer=>{
  const angle=Math.atan2(d.y,d.x);
  return {...d,x:360*Math.cos(angle),y:360*Math.sin(angle)};
};

/** A stopped dance, a walk to new places, then a new first count. */
export class FormationChange {
  private readonly from: LiveFrame;
  private readonly to: LiveFrame;
  private readonly starts: Map<string,Dancer>;
  private readonly ends: Map<string,Dancer>;
  private readonly ids: string[];
  private elapsed=0;
  readonly duration: number;

  constructor(from:LiveFrame,to:LiveFrame) {
    this.from=from;
    this.to=to;
    this.starts=new Map(from.dancers.map(d=>[d.id,d]));
    this.ends=new Map(to.dancers.map(d=>[d.id,d]));
    this.ids=[...new Set([...this.starts.keys(),...this.ends.keys()])];
    let longest=0;
    for(const id of this.ids) {
      const a=this.starts.get(id),b=this.ends.get(id);
      if(!a&&b)this.starts.set(id,outside(b));
      if(!b&&a)this.ends.set(id,outside(a));
      const start=this.starts.get(id),end=this.ends.get(id);
      if(start&&end)longest=Math.max(longest,Math.hypot(end.x-start.x,end.y-start.y));
    }
    this.duration=Math.max(1400,longest/75*1000+1000);
  }
  get done():boolean {return this.elapsed>=this.duration;}
  advance(milliseconds:number):void {this.elapsed=Math.min(this.duration,this.elapsed+Math.max(0,milliseconds));}
  frame():LiveFrame {
    if(this.done)return this.to;
    const travel=blend((this.elapsed-350)/(this.duration-1000));
    const dancers=this.ids.map(id=>{
      const start=this.starts.get(id),end=this.ends.get(id);
      if(!start||!end)throw new Error('Missing formation participant');
      const dx=end.x-start.x,dy=end.y-start.y,length=Math.hypot(dx,dy);
      const x=start.x+dx*travel,y=start.y+dy*travel;
      const walkAngle=length>1?Math.atan2(dx,-dy)*180/Math.PI:end.angle;
      const facing=turn(start.angle,walkAngle,blend(this.elapsed/450));
      const angle=turn(facing,end.angle,blend((this.elapsed-(this.duration-900))/900));
      const step=Math.max(0,this.elapsed-350)/500,target=Math.floor(step)%2?-1:1;
      const walking=length>1?-target+2*target*blend((step%1)/0.25):(start.weight??this.from.weight);
      const begin=blend(this.elapsed/400),finish=blend((this.elapsed-(this.duration-650))/650);
      const weight=(start.weight??this.from.weight)+(walking-(start.weight??this.from.weight))*begin;
      return {...end,x,y,angle,sink:(start.sink??0)*(1-begin)+(end.sink??0)*finish,weight:weight+((end.weight??this.to.weight)-weight)*finish};
    });
    const indices=new Map(dancers.map((d,i)=>[d.id,i]));
    const hands:HandReach[]=[];
    const add=(state:LiveFrame,reach:number)=>{
      if(reach<=0)return;
      for(const hand of state.hands) {
        const a=indices.get(itemAt(state.dancers,hand.dancers[0]).id),b=indices.get(itemAt(state.dancers,hand.dancers[1]).id);
        if(a===undefined||b===undefined)throw new Error('Missing hand participant');
        hands.push({...hand,dancers:[a,b],reach:hand.reach*reach});
      }
    };
    add(this.from,1-blend(this.elapsed/350));
    add(this.to,blend((this.elapsed-(this.duration-650))/650));
    return {dancers,hands,weight:0,section:this.to.section};
  }
}
