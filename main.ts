import { itemAt } from './indexed.ts';
import { dances } from './dances.ts';
import { defaultPairCount, maxPairCount } from './chapelloise.ts';
import { BourreeChaos } from './bourree-chaos.ts';
import { ChapelloiseLive } from './chapelloise-live.ts';
import type { Dancer } from './movement.ts';
function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const scrub = $<HTMLInputElement>('#scrub');
const speed = $<HTMLSelectElement>('#speed');
const letters = $<HTMLInputElement>('#letters');
const selector = $<HTMLSelectElement>('#dance');
const chaos = new BourreeChaos();
const chaosControl = $<HTMLInputElement>('#chaos');
const pairParameter = new URLSearchParams(location.search).get('pairs');
const requestedPairs = pairParameter === null ? NaN : Number(pairParameter);
const initialPairCount = Number.isInteger(requestedPairs) && requestedPairs > 0 && requestedPairs <= maxPairCount ? requestedPairs : defaultPairCount;
const live = new ChapelloiseLive(initialPairCount);
let dance = dances.find(d => d.id === new URLSearchParams(location.search).get('dance')) ?? itemAt(dances, 1);
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
function setup() {
  selector.value = dance.id;
  $('#pairs-control').hidden = dance.id !== 'chapelloise';
  $('#chaos-control').hidden = dance.id !== 'bourree';
  document.title = dance.title;
  $('svg').setAttribute('aria-label', dance.description);
  $('#dance-note').textContent = dance.note;
  $('#sources').innerHTML = dance.sources;
  $('#roles').hidden = !dance.roles;
  scrub.max = String(dance.duration);
  $('#guides').innerHTML = dance.guides;
  $('#sections').innerHTML = dance.sections.map((section, i) => `<button type="button" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
  $('#ticks').innerHTML = Array.from({ length: 31 }, (_, i) => `<i class="${(i + 1) % 16 === 0 ? 'section' : (i + 1) % 4 === 0 ? 'phrase' : 'step'}" style="left:${(i + 1) / 32 * 100}%"></i>`).join('');
  $('#phrases').innerHTML = Array.from({ length: 8 }, (_, i) => `<button type="button" data-phrase="${i}" aria-label="${itemAt(dance.sections, i < 4 ? 0 : 1).name}, phrase ${i % 4 + 1}" title="${itemAt(dance.phrases, i)}">${i % 4 + 1}</button>`).join('');
  showLetters();
}
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime: number | undefined;
function render() {
  const improvised = dance.id === 'bourree' ? chaos.frame(progress, cycle) : undefined;
  const state = improvised ? {...improvised,weight:improvised.rhythm.weight} : live.frame(progress, cycle);
  syncDancers(state.dancers);
  state.dancers.forEach(d => {
    const element = dancers.get(d.id);
    if(!element)throw new Error('Missing dancer');
    element.group.classList.toggle('follower', d.role === 'follower');
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle})`);
    element.left.style.opacity = String(0.35 + 0.25 * (1 - (d.weight ?? state.weight)) / 2);
    element.right.style.opacity = String(0.35 + 0.25 * (1 + (d.weight ?? state.weight)) / 2);
  });
  $('#hands').innerHTML = state.hands.map(({ dancers: [a, b], reach, arch = 0 }) => {
    const from = itemAt(state.dancers, a);
    const to = itemAt(state.dancers, b);
    const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const control = { x: (from.x + to.x) / 2 - (to.y - from.y) / distance * arch, y: (from.y + to.y) / 2 + (to.x - from.x) / distance * arch };
    const u = reach / 2;
    const arm = (start: typeof from, end: typeof to) => {
      const x = (1-u)**2 * start.x + 2*(1-u)*u*control.x + u*u*end.x;
      const y = (1-u)**2 * start.y + 2*(1-u)*u*control.y + u*u*end.y;
      return `M ${start.x} ${start.y} Q ${start.x+(control.x-start.x)*u} ${start.y+(control.y-start.y)*u} ${x} ${y}`;
    };
    return `<path class="arm ${from.role === 'follower' ? 'follower' : ''}" d="${arm(from, to)}"/><path class="arm ${to.role === 'follower' ? 'follower' : ''}" d="${arm(to, from)}"/>`;
  }).join('');
  $('#timeline').style.setProperty('--progress', `${progress / dance.duration * 100}%`);
  scrub.value = String(progress);
  scrub.setAttribute('aria-valuetext', `${itemAt(dance.sections, state.section).name}, phrase ${Math.min(3, Math.floor(progress - state.section * 4)) + 1}, step ${Math.min(3, Math.floor((progress % 1) * 4)) + 1}`);
  $('#play').textContent = playing ? 'Pause' : 'Play';
  $('#pair-count').textContent = String(live.count);
  $<HTMLButtonElement>('#add-pair').disabled = live.count >= maxPairCount;
  $<HTMLButtonElement>('#remove-pair').disabled = live.count === 0;
}
$('#sections').addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-section]') : null;
  if (button) { progress = itemAt(dance.sections, Number(button.dataset.section)).start; render(); }
});
$('#phrases').addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-phrase]') : null;
  if (button) { progress = Number(button.dataset.phrase); playing = false; render(); }
});
$('#play').addEventListener('click', () => { playing = !playing; render(); });
$('#reset').addEventListener('click', () => { progress = 0; cycle = 0; chaos.reset(); live.restart(); render(); });
chaosControl.addEventListener('input', () => {
  chaos.setProbability(Number(chaosControl.value)/100);
  $('#chaos-value').textContent = `${chaosControl.value}%`;
});
function showLetters() { $('#dancers').classList.toggle('hide-letters', !letters.checked); }
letters.addEventListener('change', showLetters);
scrub.addEventListener('input', () => { playing = false; progress = Number(scrub.value); render(); });
function animate(time: number) {
  const elapsed=previousTime===undefined?0:Math.min(time-previousTime,100)*Number(speed.value);
  const entering=dance.id==='chapelloise'&&live.moving;
  if(entering)live.advance(elapsed);
  if (previousTime !== undefined && playing) {
    progress += elapsed / dance.millisecondsPerPhrase;
    if (progress >= dance.duration) { progress %= dance.duration; cycle += 1; }
    render();
  }
  else if(entering)render();
  previousTime = time;
  requestAnimationFrame(animate);
}
selector.addEventListener('change', () => {
  dance = dances.find(d => d.id === selector.value) ?? itemAt(dances, 0);
  progress = 0; cycle = 0;
  live.restart();
  const url = new URL(location.href); url.searchParams.set('dance', dance.id);
  history.replaceState(null, '', url);
  setup(); render();
});
function changePairs(action:'add'|'remove'): void {
  if(!live.change(action,cycle,progress))return;
  const url = new URL(location.href);
  url.searchParams.set('dance', dance.id);
  url.searchParams.set('pairs', String(live.count));
  history.replaceState(null, '', url);
  render();
}
$('#add-pair').addEventListener('click',()=>changePairs('add'));
$('#remove-pair').addEventListener('click',()=>changePairs('remove'));
setup();
render();
requestAnimationFrame(animate);
