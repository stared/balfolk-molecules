import { $ } from './dom.ts';
import { handPaths } from './hand-paths.ts';
import { itemAt } from '../utils/indexed.ts';
import type { Dancer } from '../model.ts';
import type { LiveFrame } from '../model.ts';

const arms: SVGPathElement[] = [];
interface DancerElement {
  group: SVGGElement;
  body: SVGGElement;
  feet: SVGGElement;
  lean: SVGGElement;
  left: SVGCircleElement;
  right: SVGCircleElement;
}
const dancers = new Map<string, DancerElement>();
function syncDancers(poses: Dancer[]): void {
  const ids = new Set(poses.map(d=>d.id));
  for(const [id,element] of dancers)if(!ids.has(id)){element.group.remove();dancers.delete(id);}
  for(const d of poses)if(!dancers.has(d.id)){
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');
    group.setAttribute('class','dancer');group.dataset.identity=d.id;
    group.innerHTML=`<g class="body"><g class="support"><circle class="left" cx="-5" cy="13.5" r="2.2"/><circle class="right" cx="5" cy="13.5" r="2.2"/></g><g class="lean"><circle class="silhouette" r="14"/><g class="eyes"><circle cx="-4" cy="-9" r="2.5"/><circle cx="4" cy="-9" r="2.5"/><circle class="pupil" cx="-4" cy="-9.8" r="1.2"/><circle class="pupil" cx="4" cy="-9.8" r="1.2"/></g></g></g><text text-anchor="middle" dy="4">${d.id}</text>`;
    $('#dancers').append(group);
    const body=group.querySelector<SVGGElement>('.body'),feet=group.querySelector<SVGGElement>('.support'),lean=group.querySelector<SVGGElement>('.lean'),left=group.querySelector<SVGCircleElement>('.left'),right=group.querySelector<SVGCircleElement>('.right');
    if(!body||!feet||!lean||!left||!right)throw new Error('Incomplete dancer');
    dancers.set(d.id,{group,body,feet,lean,left,right});
  }
}
export function renderFloor(state: LiveFrame, danceId: string, showContacts = true): void {
  syncDancers(state.dancers);
  state.dancers.forEach(d => {
    const element = dancers.get(d.id);
    if(!element)throw new Error('Missing dancer');
    element.group.classList.toggle('follower', d.role === 'follower' || d.front === 1);
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle}) scale(${1-0.075*(d.sink??0)})`);
    const weight = Math.max(-1, Math.min(1, d.weight ?? state.weight));
    // Rock around the lower body: a circle alone cannot show rotation about
    // its centre. Eyes follow the lean; facing, hands and travel stay intact.
    const amplitude = danceId === 'drumul-dracului' ? 5 : danceId === 'schottische' ? 2 : 3;
    element.lean.setAttribute('transform', `rotate(${showContacts ? weight * amplitude : 0} 0 12)`);
    // Sample the choreography itself: stamps stay on the same foot without
    // transferring weight, and pause/seek/frame skips cannot invent a contact.
    element.feet.setAttribute('transform', `rotate(${d.hipAngle ?? 0})`);
    element.left.style.opacity = String(showContacts ? 0.5 * Math.max(0, Math.min(1, d.stampLeft ?? 0)) : 0);
    element.right.style.opacity = String(showContacts ? 0.5 * Math.max(0, Math.min(1, d.stampRight ?? 0)) : 0);
  });
  const armCount = state.hands.length * 2;
  while (arms.length > armCount) arms.pop()!.remove();
  while (arms.length < armCount) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    $('#hands').append(path); arms.push(path);
  }
  state.hands.forEach((hand, i) => {
    const from = itemAt(state.dancers, hand.dancers[0]);
    const to = itemAt(state.dancers, hand.dancers[1]);
    const paths = handPaths(from, to, hand);
    for (const [side, dancer] of [from, to].entries()) {
      const path = arms[i * 2 + side]!;
      path.setAttribute('class', `arm ${dancer.role === 'follower' || dancer.front === 1 ? 'follower' : ''}`);
      path.setAttribute('d', paths[side]!);
    }
  });
}
