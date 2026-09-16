import { itemAt } from './indexed.ts';
import { dances } from './dances.ts';
import { defaultPairCount, minPairCount, maxPairCount } from './chapelloise.ts';
function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const scrub = $<HTMLInputElement>('#scrub');
const speed = $<HTMLSelectElement>('#speed');
const letters = $<HTMLInputElement>('#letters');
const selector = $<HTMLSelectElement>('#dance');
const pairs = $<HTMLSelectElement>('#pairs');
const requestedPairs = Number(new URLSearchParams(location.search).get('pairs'));
let pairCount = Number.isInteger(requestedPairs) && requestedPairs >= minPairCount && requestedPairs <= maxPairCount ? requestedPairs : defaultPairCount;
pairs.innerHTML = Array.from({ length: maxPairCount - minPairCount + 1 }, (_, i) => `<option value="${i + minPairCount}">${i + minPairCount}</option>`).join('');
let dance = dances.find(d => d.id === new URLSearchParams(location.search).get('dance')) ?? itemAt(dances, 1);
let dancers: { group: SVGGElement; body: SVGGElement; left: SVGCircleElement; right: SVGCircleElement }[] = [];
function setup() {
  selector.value = dance.id;
  pairs.value = String(pairCount);
  $('#pairs-control').hidden = dance.id !== 'chapelloise';
  document.title = dance.title;
  $('svg').setAttribute('aria-label', dance.description);
  $('#dance-note').textContent = dance.note;
  $('#sources').innerHTML = dance.sources;
  $('#roles').hidden = !dance.roles;
  scrub.max = String(dance.duration);
  $('#guides').innerHTML = dance.guides;
  $('#dancers').innerHTML = dance.frame(0, 0, pairCount).dancers.map((d, i) => `<g class="dancer" id="dancer-${i}"><g class="body"><circle r="14"/><path class="facing" d="M 0 -11 V -16"/><circle class="support left" cx="-4" cy="8" r="1.8"/><circle class="support right" cx="4" cy="8" r="1.8"/></g><text text-anchor="middle" dy="2">${d.id}</text></g>`).join('');
  $('#sections').innerHTML = dance.sections.map((section, i) => `<button type="button" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
  $('#ticks').innerHTML = Array.from({ length: 31 }, (_, i) => `<i class="${(i + 1) % 16 === 0 ? 'section' : (i + 1) % 4 === 0 ? 'phrase' : 'step'}" style="left:${(i + 1) / 32 * 100}%"></i>`).join('');
  $('#phrases').innerHTML = Array.from({ length: 8 }, (_, i) => `<button type="button" data-phrase="${i}" aria-label="${itemAt(dance.sections, i < 4 ? 0 : 1).name}, phrase ${i % 4 + 1}" title="${itemAt(dance.phrases, i)}">${i % 4 + 1}</button>`).join('');
  dancers = Array.from({ length: dance.frame(0, 0, pairCount).dancers.length }, (_, i) => ({ group: $<SVGGElement>(`#dancer-${i}`), body: $<SVGGElement>(`#dancer-${i} .body`), left: $<SVGCircleElement>(`#dancer-${i} .left`), right: $<SVGCircleElement>(`#dancer-${i} .right`) }));
  showLetters();
}
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime: number | undefined;
function render() {
  const state = dance.frame(progress, cycle, pairCount);
  state.dancers.forEach((d, i) => {
    const element = itemAt(dancers, i);
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
$('#reset').addEventListener('click', () => { progress = 0; cycle = 0; render(); });
function showLetters() { $('#dancers').classList.toggle('hide-letters', !letters.checked); }
letters.addEventListener('change', showLetters);
scrub.addEventListener('input', () => { playing = false; progress = Number(scrub.value); render(); });
function animate(time: number) {
  if (previousTime !== undefined && playing) {
    progress += Math.min(time - previousTime, 100) / dance.millisecondsPerPhrase * Number(speed.value);
    if (progress >= dance.duration) { progress %= dance.duration; cycle += 1; }
    render();
  }
  previousTime = time;
  requestAnimationFrame(animate);
}
selector.addEventListener('change', () => {
  dance = dances.find(d => d.id === selector.value) ?? itemAt(dances, 0);
  progress = 0; cycle = 0;
  const url = new URL(location.href); url.searchParams.set('dance', dance.id);
  history.replaceState(null, '', url);
  setup(); render();
});
pairs.addEventListener('change', () => {
  pairCount = Number(pairs.value);
  progress = 0; cycle = 0;
  const url = new URL(location.href);
  url.searchParams.set('dance', dance.id);
  url.searchParams.set('pairs', String(pairCount));
  history.replaceState(null, '', url);
  setup(); render();
});
setup();
render();
requestAnimationFrame(animate);
