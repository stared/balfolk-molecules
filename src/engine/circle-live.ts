import { chapelloiseFrame, maxPairCount } from '../dances/chapelloise.ts';
import { blend } from './rhythm.ts';
import { itemAt } from '../utils/indexed.ts';
import type { Dancer, HandReach, LiveFrame } from '../model.ts';

interface Formation { leaders: string[]; followers: string[]; rotation: number; origin: number }
interface Transition { from: LiveFrame; to: Formation; elapsed: number; exits: Map<string, Dancer> }

const transitionDuration = 3200;
const mod = (n: number, size: number) => ((n%size)+size)%size;
const turn = (a: number,b: number,u: number) => a+(((b-a)%360+540)%360-180)*u;
const label = (index: number): string => {
  let text='';
  for(let n=index+1;n>0;n=Math.floor((n-1)/26))text=String.fromCharCode(65+(n-1)%26)+text;
  return text;
};

/** The roster owns identity; the choreography only supplies moving places. */
export class CircleLive {
  private formation: Formation;
  private transition: Transition | undefined;
  private nextIdentity = 0;
  private readonly choreography: (time: number, cycle: number, pairs: number) => LiveFrame;
  private readonly progression: 0 | 1 | -1;
  constructor(count: number, choreography: (time: number, cycle: number, pairs: number) => LiveFrame = chapelloiseFrame, progression: 0 | 1 | -1 = 1) {
    this.choreography=choreography;
    this.progression=progression;
    if(!Number.isInteger(count)||count<0||count>maxPairCount)throw new RangeError('Invalid pair count');
    this.formation={leaders:[],followers:[],rotation:0,origin:0};
    for(let i=0;i<count;i++)this.append(this.formation);
  }
  private append(formation: Formation): void {
    formation.leaders.push(label(this.nextIdentity++));
    formation.followers.push(label(this.nextIdentity++));
  }
  get count(): number { return (this.transition?.to ?? this.formation).leaders.length; }
  get moving(): boolean { return this.transition !== undefined; }

  change(action: 'add'|'remove', cycle: number, time = 0): boolean {
    const old=this.transition?.to ?? this.formation, count=old.leaders.length;
    if(action==='add' && count>=maxPairCount || action!=='add' && count===0)return false;
    const offset=this.progression!==0 && count>1?cycle-old.origin:0;
    // Preserve the pairs at the start of this cycle when rebasing the ring.
    const to: Formation={leaders:[...old.leaders],followers:old.leaders.map((_,i)=>itemAt(old.followers,mod(i-this.progression*offset,count))),rotation:old.rotation-(count>1?offset*Math.PI/count:0),origin:this.progression===0?old.origin:cycle};
    const from=this.frame(time,cycle);
    if(action==='add')this.append(to);
    else {to.leaders.pop();to.followers.pop();}
    const target=this.evaluate(to,time,cycle);
    const currentIds=new Set(from.dancers.map(d=>d.id));
    const targetIds=new Set(target.dancers.map(d=>d.id));
    const arrivals=target.dancers.filter(d=>!currentIds.has(d.id));
    const departures=from.dancers.filter(d=>!targetIds.has(d.id) && !this.transition?.exits.has(d.id));
    // A pair walks side by side along one outward vector, preserving its spacing.
    const outside=(group:Dancer[]):Dancer[]=>{
      const x=group.reduce((sum,d)=>sum+d.x,0),y=group.reduce((sum,d)=>sum+d.y,0);
      const radius=Math.hypot(x,y)||1;
      return group.map(d=>({...d,x:d.x+x/radius*400,y:d.y+y/radius*400}));
    };
    from.dancers.push(...outside(arrivals));
    const exits=new Map(this.transition?.exits);
    for(const d of outside(departures))if(!exits.has(d.id))exits.set(d.id,d);
    this.transition={from,to,elapsed:0,exits};
    return true;
  }
  advance(milliseconds: number): void {
    if(!this.transition)return;
    this.transition.elapsed=Math.min(transitionDuration,this.transition.elapsed+Math.max(0,milliseconds));
    if(this.transition.elapsed===transitionDuration){this.formation=this.transition.to;this.transition=undefined;}
  }
  restart(): void {
    if(this.transition)this.formation=this.transition.to;
    this.transition=undefined;
    this.formation={...this.formation,origin:0,rotation:0};
  }
  private evaluate(formation: Formation,time: number,cycle: number): LiveFrame {
    const count=formation.leaders.length;
    if(count===0)return {dancers:[],hands:[],weight:0,section:this.choreography(time,cycle,2).section};
    // One pair waits for another pair before starting the mixer.
    const waiting=count===1 && this.progression!==0;
    const state=this.choreography(waiting?0:time,waiting?0:cycle-formation.origin,count);
    const cos=Math.cos(formation.rotation),sin=Math.sin(formation.rotation);
    return {...state,dancers:state.dancers.map((d,i)=>({...d,id:itemAt(i%2?formation.followers:formation.leaders,Math.floor(i/2)),x:d.x*cos-d.y*sin,y:d.x*sin+d.y*cos,angle:d.angle+formation.rotation*180/Math.PI}))};
  }
  frame(time: number,cycle: number): LiveFrame {
    if(!this.transition)return this.evaluate(this.formation,time,cycle);
    const transition=this.transition;
    const from=transition.from,to=this.evaluate(transition.to,time,cycle);
    const u=blend(transition.elapsed/transitionDuration);
    const old=new Map(from.dancers.map(d=>[d.id,d]));
    const next=new Map(to.dancers.map(d=>[d.id,d]));
    const ids=[...old.keys(),...next.keys()].filter((id,i,all)=>all.indexOf(id)===i);
    const dancers=ids.map(id=>{
      const a=old.get(id),b=next.get(id);
      const start=a, end=b??transition.exits.get(id);
      if(!start||!end)throw new Error('Missing participant');
      const x=start.x+(end.x-start.x)*u,y=start.y+(end.y-start.y)*u;
      const walkingAngle=Math.atan2(end.x-start.x,start.y-end.y)*180/Math.PI;
      const heading=turn(start.angle,walkingAngle,blend(u*5));
      const angle=b?turn(heading,end.angle,blend((u-0.65)/0.35)):heading;
      const step=transition.elapsed/500,target=Math.floor(step)%2?1:-1;
      const weight=-target+2*target*blend((step%1)/0.3);
      return {...end,x,y,angle,weight,sink:(start.sink??0)*(1-u)+(end.sink??0)*u};
    });
    const indices=new Map(dancers.map((d,i)=>[d.id,i]));
    const joined=new Map<string,HandReach>();
    const addHands=(state:LiveFrame,amount:number) => {
      for(const hand of state.hands){
        const a=itemAt(state.dancers,hand.dancers[0]).id,b=itemAt(state.dancers,hand.dancers[1]).id;
        const ia=indices.get(a),ib=indices.get(b);
        if(ia===undefined||ib===undefined)throw new Error('Missing hand participant');
        const key=[a,b].sort().join('-'),existing=joined.get(key);
        const reach=hand.reach*amount;
        if(existing)existing.reach+=reach;
        else joined.set(key,{...hand,dancers:[ia,ib],reach});
      }
    };
    addHands(from,1-u);addHands(to,u);
    // Newcomers reach only after entering the ring; departures release first.
    for(const hand of joined.values()){
      const pair=hand.dancers.map(i=>itemAt(dancers,i).id);
      if(pair.some(id=>{const d=old.get(id);return d && Math.hypot(d.x,d.y)>280;}))hand.reach*=blend((u-0.75)/0.25);
      if(pair.some(id=>!next.has(id)))hand.reach*=1-blend(u/0.2);
    }
    return {dancers,hands:[...joined.values()],weight:0,section:this.choreography(time,cycle,2).section};
  }
}
