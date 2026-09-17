import { $ } from './dom.ts';
import { handPaths } from './hand-paths.ts';
import { itemAt } from '../utils/indexed.ts';
import type { Dancer } from '../model.ts';
import type { LiveFrame } from '../model.ts';

const dancers = new Map<string,{ group: SVGGElement; body: SVGGElement; left: SVGCircleElement; right: SVGCircleElement }>();
function syncDancers(poses: Dancer[]): void {
  const ids = new Set(poses.map(d=>d.id));
  for(const [id,element] of dancers)if(!ids.has(id)){element.group.remove();dancers.delete(id);}
  for(const d of poses)if(!dancers.has(d.id)){
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');
    group.setAttribute('class','dancer');group.dataset.identity=d.id;
    group.innerHTML=`<g class="body"><circle r="14"/><path class="facing" d="M 0 -11 V -16"/><circle class="support left" cx="-4" cy="8" r="1.8"/><circle class="support right" cx="4" cy="8" r="1.8"/></g><text text-anchor="middle" dy="2">${d.id}</text>`;
    $('#dancers').append(group);
    const body=group.querySelector<SVGGElement>('.body'),left=group.querySelector<SVGCircleElement>('.left'),right=group.querySelector<SVGCircleElement>('.right');
    if(!body||!left||!right)throw new Error('Incomplete dancer');
    dancers.set(d.id,{group,body,left,right});
  }
}
export function renderFloor(state: LiveFrame): void {
  syncDancers(state.dancers);
  state.dancers.forEach(d => {
    const element = dancers.get(d.id);
    if(!element)throw new Error('Missing dancer');
    element.group.classList.toggle('follower', d.role === 'follower');
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle}) scale(${1-0.075*(d.sink??0)})`);
    element.left.style.opacity = String(0.35 + 0.25 * (1 - (d.weight ?? state.weight)) / 2);
    element.right.style.opacity = String(0.35 + 0.25 * (1 + (d.weight ?? state.weight)) / 2);
    element.left.setAttribute('transform', `rotate(${d.hipAngle ?? 0})`);
    element.right.setAttribute('transform', `rotate(${d.hipAngle ?? 0})`);
    element.left.setAttribute('r', String(1.8 + 1.2 * (d.stampLeft ?? 0)));
    element.right.setAttribute('r', String(1.8 + 1.2 * (d.stampRight ?? 0)));
  });
  $('#hands').innerHTML = state.hands.map(hand => {
    const from = itemAt(state.dancers, hand.dancers[0]);
    const to = itemAt(state.dancers, hand.dancers[1]);
    const [first, second] = handPaths(from, to, hand);
    return `<path class="arm ${from.role === 'follower' ? 'follower' : ''}" d="${first}"/><path class="arm ${to.role === 'follower' ? 'follower' : ''}" d="${second}"/>`;
  }).join('');
}
