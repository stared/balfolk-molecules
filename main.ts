import { itemAt } from './indexed.ts';
import { sections, duration, frame } from './movement.ts';
function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const scrub = $<HTMLInputElement>('#scrub');
const speed = $<HTMLSelectElement>('#speed');
const letters = $<HTMLInputElement>('#letters');
$('#guides').innerHTML = `<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>`;
$('#dancers').innerHTML = frame(0).dancers.map((d, i) => `<g class="dancer" id="dancer-${i}"><g class="body"><circle r="14"/><path class="facing" d="M 0 -11 V -16"/><circle class="support left" cx="-4" cy="8" r="1.8"/><circle class="support right" cx="4" cy="8" r="1.8"/></g><text text-anchor="middle" dy="2">${d.id}</text></g>`).join('');
$('#sections').innerHTML = sections.map((section, i) => `<button type="button" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
$('#ticks').innerHTML = Array.from({ length: 31 }, (_, i) => `<i class="${(i + 1) % 16 === 0 ? 'section' : (i + 1) % 4 === 0 ? 'phrase' : 'step'}" style="left:${(i + 1) / 32 * 100}%"></i>`).join('');
$('#phrases').innerHTML = Array.from({ length: 8 }, (_, i) => `<button type="button" data-phrase="${i}" aria-label="${itemAt(sections, i < 4 ? 0 : 1).name}, phrase ${i % 4 + 1}" title="${i < 4 ? 'Approach, change, retreat' : 'Approach, meet, pass, turn'} · four steps">${i % 4 + 1}</button>`).join('');
const dancers = Array.from({ length: 6 }, (_, i) => ({ group: $<SVGGElement>(`#dancer-${i}`), body: $<SVGGElement>(`#dancer-${i} .body`), left: $<SVGCircleElement>(`#dancer-${i} .left`), right: $<SVGCircleElement>(`#dancer-${i} .right`) }));
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime: number | undefined;
function render() {
  const state = frame(progress, cycle);
  state.dancers.forEach((d, i) => {
    const element = itemAt(dancers, i);
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle})`);
    element.left.style.opacity = String(0.35 + 0.25 * (1 - state.rhythm.weight) / 2);
    element.right.style.opacity = String(0.35 + 0.25 * (1 + state.rhythm.weight) / 2);
  });
  $('#hands').innerHTML = state.hands.map(({ dancers: [a, b], reach }) => {
    const from = itemAt(state.dancers, a);
    const to = itemAt(state.dancers, b);
    const dx = (to.x - from.x) * reach / 2;
    const dy = (to.y - from.y) * reach / 2;
    return `<path d="M ${from.x} ${from.y} l ${dx} ${dy} M ${to.x} ${to.y} l ${-dx} ${-dy}"/>`;
  }).join('');
  $('#timeline').style.setProperty('--progress', `${progress / duration * 100}%`);
  scrub.value = String(progress);
  scrub.setAttribute('aria-valuetext', `${itemAt(sections, state.section).name}, phrase ${Math.min(3, Math.floor(progress - state.section * 4)) + 1}, step ${state.rhythm.step + 1}`);
  $('#play').textContent = playing ? 'Pause' : 'Play';
}
$('#sections').addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-section]') : null;
  if (button) { progress = itemAt(sections, Number(button.dataset.section)).start; render(); }
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
    progress += Math.min(time - previousTime, 100) / 5000 * Number(speed.value);
    if (progress >= duration) { progress %= duration; cycle += 1; }
    render();
  }
  previousTime = time;
  requestAnimationFrame(animate);
}
showLetters();
render();
requestAnimationFrame(animate);
