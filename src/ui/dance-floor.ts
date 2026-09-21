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
  left: SVGCircleElement;
  right: SVGCircleElement;
  weight: number;
  stamps: [number, number];
  contacts: [number, number];
}
const dancers = new Map<string, DancerElement>();
let previousTime = NaN;
let previousDance = '';
const thudDuration = 200;

function renderThud(mark: SVGCircleElement, age: number): void {
  const phase = Math.max(0, Math.min(1, age / thudDuration));
  mark.style.opacity = String(0.5 * (1 - phase) ** 2);
  // Small contact circles overlap the body edge and sit behind its silhouette.
}
function syncDancers(poses: Dancer[]): void {
  const ids = new Set(poses.map(d=>d.id));
  for(const [id,element] of dancers)if(!ids.has(id)){element.group.remove();dancers.delete(id);}
  for(const d of poses)if(!dancers.has(d.id)){
    const group=document.createElementNS('http://www.w3.org/2000/svg','g');
    group.setAttribute('class','dancer');group.dataset.identity=d.id;
    group.innerHTML=`<g class="body"><g class="support"><circle class="left" cx="-5" cy="13.5" r="2.2"/><circle class="right" cx="5" cy="13.5" r="2.2"/></g><circle class="silhouette" r="14"/><g class="eyes"><circle cx="-4" cy="-9" r="2.5"/><circle cx="4" cy="-9" r="2.5"/><circle class="pupil" cx="-4" cy="-9.8" r="1.2"/><circle class="pupil" cx="4" cy="-9.8" r="1.2"/></g></g><text text-anchor="middle" dy="4">${d.id}</text>`;
    $('#dancers').append(group);
    const body=group.querySelector<SVGGElement>('.body'),feet=group.querySelector<SVGGElement>('.support'),left=group.querySelector<SVGCircleElement>('.left'),right=group.querySelector<SVGCircleElement>('.right');
    if(!body||!feet||!left||!right)throw new Error('Incomplete dancer');
    dancers.set(d.id,{group,body,feet,left,right,weight:NaN,stamps:[0,0],contacts:[-Infinity,-Infinity]});
  }
}
export function renderFloor(state: LiveFrame, time: number, danceId: string, showContacts = true): void {
  // Use dance time so thuds freeze on pause and follow the tempo slider.
  // Clear old contacts on a seek, a dance change, or a delayed frame.
  const reset = !showContacts || danceId !== previousDance || !Number.isFinite(previousTime) || time < previousTime || time - previousTime > 250;
  previousTime = time;
  previousDance = danceId;
  syncDancers(state.dancers);
  state.dancers.forEach(d => {
    const element = dancers.get(d.id);
    if(!element)throw new Error('Missing dancer');
    element.group.classList.toggle('follower', d.role === 'follower' || d.front === 1);
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle}) scale(${1-0.075*(d.sink??0)})`);
    const weight = d.weight ?? state.weight;
    const stamps: [number, number] = [d.stampLeft ?? 0, d.stampRight ?? 0];
    if (reset || !Number.isFinite(element.weight)) {
      element.contacts = [-Infinity, -Infinity];
      element.weight = weight;
      element.stamps = stamps;
    }
    // A transfer lands once it passes the centre; explicit stamps also count
    // when the supporting foot stays the same (e.g. Drumul's repeated stamps).
    if (weight < -0.35 && element.weight >= -0.35) element.contacts = [time, -Infinity];
    if (weight > 0.35 && element.weight <= 0.35) element.contacts = [-Infinity, time];
    stamps.forEach((stamp, side) => {
      if (stamp > 0.1 && element.stamps[side]! <= 0.1) element.contacts[side] = time;
    });
    element.weight = weight;
    element.stamps = stamps;
    element.feet.setAttribute('transform', `rotate(${d.hipAngle ?? 0})`);
    renderThud(element.left, time - element.contacts[0]);
    renderThud(element.right, time - element.contacts[1]);
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
