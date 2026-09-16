import { itemAt } from './indexed.ts';
import type { LiveFrame } from './circle-live.ts';

/** Hungarian assignment: each row receives one column, minimizing total cost. */
export function minimumAssignment(costs: readonly (readonly number[])[]): number[] {
  const size=costs.length;
  if(costs.some(row=>row.length!==size || row.some(cost=>!Number.isFinite(cost))))throw new RangeError('Expected a finite square cost matrix');
  const u=Array<number>(size+1).fill(0),v=Array<number>(size+1).fill(0);
  const owner=Array<number>(size+1).fill(0),previous=Array<number>(size+1).fill(0);
  for(let row=1;row<=size;row++) {
    owner[0]=row;
    let column=0;
    const best=Array<number>(size+1).fill(Infinity),used=Array<boolean>(size+1).fill(false);
    do {
      used[column]=true;
      const currentRow=itemAt(owner,column);
      let delta=Infinity,next=0;
      for(let j=1;j<=size;j++)if(!itemAt(used,j)) {
        const cost=itemAt(itemAt(costs,currentRow-1),j-1)-itemAt(u,currentRow)-itemAt(v,j);
        if(cost<itemAt(best,j)){best[j]=cost;previous[j]=column;}
        if(itemAt(best,j)<delta){delta=itemAt(best,j);next=j;}
      }
      for(let j=0;j<=size;j++) {
        if(itemAt(used,j)) {
          const i=itemAt(owner,j);
          u[i]=itemAt(u,i)+delta;v[j]=itemAt(v,j)-delta;
        } else best[j]=itemAt(best,j)-delta;
      }
      column=next;
    } while(itemAt(owner,column)!==0);
    do {
      const next=itemAt(previous,column);
      owner[column]=itemAt(owner,next);column=next;
    } while(column!==0);
  }
  const result=Array<number>(size).fill(-1);
  for(let j=1;j<=size;j++)result[itemAt(owner,j)-1]=j-1;
  return result;
}

/** Choreography slot names are separate from persistent people/letter labels. */
export class DancerAssignment {
  private slots=new Map<string,string>();
  private nextIdentity=0;
  private rotation=0;
  private readonly used=new Set<string>();
  private identity():string {
    let text:string;
    do {
      text='';
      for(let n=++this.nextIdentity;n>0;n=Math.floor((n-1)/26))text=String.fromCharCode(65+(n-1)%26)+text;
    } while(this.used.has(text));
    this.used.add(text);
    return text;
  }
  apply(frame:LiveFrame):LiveFrame {
    return {...frame,dancers:frame.dancers.map(d=>{
      let id=this.slots.get(d.id);
      if(id===undefined){id=this.identity();this.slots.set(d.id,id);}
      const cos=Math.cos(this.rotation),sin=Math.sin(this.rotation);
      return {...d,id,x:d.x*cos-d.y*sin,y:d.x*sin+d.y*cos,angle:d.angle+this.rotation*180/Math.PI};
    })};
  }
  rearrangeChain(from:LiveFrame,to:LiveFrame,order:readonly string[]):LiveFrame {
    const people=new Map(from.dancers.map(d=>[d.id,d]));
    let dot=0,cross=0;
    this.slots=new Map();
    to.dancers.forEach((target,i)=>{
      const id=itemAt(order,i),person=people.get(id);
      if(!person)throw new Error('Missing chain participant');
      this.used.add(id);
      this.slots.set(target.id,id);
      dot+=target.x*person.x+target.y*person.y;
      cross+=target.x*person.y-target.y*person.x;
    });
    // The track has no fixed compass direction. Keep neighbours, then rotate
    // the new arc to fit the chain where it stands, minimizing squared travel.
    this.rotation=Math.atan2(cross,dot);
    return this.apply(to);
  }
  rearrange(from:LiveFrame,to:LiveFrame):LiveFrame {
    this.rotation=0;
    for(const dancer of from.dancers)this.used.add(dancer.id);
    const size=Math.max(from.dancers.length,to.dancers.length);
    const costs=Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>{
      const a=from.dancers[i],b=to.dancers[j];
      if(a&&b) {
        // Preserve leader/follower roles when both dances use them. Among valid
        // assignments, minimize actual walking distance, not identity order.
        const roleCost=a.role&&b.role&&a.role!==b.role?1_000_000:0;
        return Math.hypot(b.x-a.x,b.y-a.y)+roleCost;
      }
      const dancer=a??b;
      return dancer?Math.abs(360-Math.hypot(dancer.x,dancer.y)):0;
    }));
    const columns=minimumAssignment(costs);
    this.slots=new Map();
    columns.forEach((column,row)=>{
      const target=to.dancers[column];
      if(target)this.slots.set(target.id,from.dancers[row]?.id??this.identity());
    });
    return this.apply(to);
  }
}
