/** Read-only measurement of the existing renderer's contact trigger semantics. */
import { dances } from '../../../src/dances/catalog.ts';
import { writeFileSync } from 'node:fs';

const out = [];
for (const dance of dances) {
  const duration = dance.duration * dance.millisecondsPerPhrase;
  const dt = 1000 / 120;
  const previous = new Map<string, {weight:number;stamps:number[];last:number[]}>();
  const events: {time:number;id:string;side:number;kind:string}[] = [];
  let activeSum=0, frameCount=0, dancerCount=0;
  for(let time=0;time<2*duration;time+=dt){
    const absolute=time/dance.millisecondsPerPhrase;
    const frame=dance.frame(absolute%dance.duration,Math.floor(absolute/dance.duration),5);
    dancerCount=frame.dancers.length;
    for(const d of frame.dancers){
      const weight=d.weight??frame.weight;
      const stamps=[d.stampLeft??0,d.stampRight??0];
      const old=previous.get(d.id)??{weight,stamps,last:[-Infinity,-Infinity]};
      const hit=(side:number,kind:string)=>{old.last[side]=time;if(time>=duration)events.push({time:(time-duration)/1000,id:d.id,side,kind});};
      if(weight<-.35&&old.weight>=-.35){old.last=[-Infinity,-Infinity];hit(0,'transfer');}
      if(weight>.35&&old.weight<=.35){old.last=[-Infinity,-Infinity];hit(1,'transfer');}
      stamps.forEach((s,i)=>{if(s>.1&&old.stamps[i]!<=.1)hit(i,'stamp');});
      if(time>=duration)activeSum+=old.last.filter(t=>.5*Math.max(0,1-(time-t)/200)**2>.1&&time-t<200).length;
      previous.set(d.id,{weight,stamps,last:old.last});
    }
    if(time>=duration)frameCount++;
  }
  const firstId=events[0]?.id;
  out.push({id:dance.id,title:dance.title,cycle_seconds:duration/1000,dancers:dancerCount,
    total_triggers:events.length,triggers_per_second:events.length/(duration/1000),
    mean_visible_marks:activeSum/frameCount,first_dancer_events:events.filter(e=>e.id===firstId),
    stamps:events.filter(e=>e.kind==='stamp').length});
}
writeFileSync('/tmp/balfolk-deep/animation-audit.json',JSON.stringify(out,null,2));
console.log(out.map(({first_dancer_events,...r})=>r));
