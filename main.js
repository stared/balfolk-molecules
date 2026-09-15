import { sections, duration, frame } from './movement.js';
const $ = selector => document.querySelector(selector);
$('#guides').innerHTML = `<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>`;
$('#dancers').innerHTML = frame(0).dancers.map((d, i) => `<g class="dancer ${d.middle ? 'middle' : ''}" id="dancer-${i}"><g class="body"><circle r="14"/><path class="facing" d="M 0 -11 V -16"/><path class="support left" d="M -4 7 v 3"/><path class="support right" d="M 4 7 v 3"/></g><text text-anchor="middle" dy="2">${d.id}</text></g>`).join('');
$('#sections').innerHTML = sections.map((section, i) => `<button type="button" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
$('#ticks').innerHTML = Array.from({ length: 31 }, (_, i) => `<i class="${(i + 1) % 16 === 0 ? 'section' : (i + 1) % 4 === 0 ? 'phrase' : 'step'}" style="left:${(i + 1) / 32 * 100}%"></i>`).join('');
$('#phrases').innerHTML = Array.from({ length: 8 }, (_, i) => `<button type="button" data-phrase="${i}" aria-label="${sections[i < 4 ? 0 : 1].name}, phrase ${i % 4 + 1}" title="${i < 4 ? 'Approach, change, retreat' : 'Approach, meet, pass, turn'} · four steps">${i % 4 + 1}</button>`).join('');
const dancers = Array.from({ length: 6 }, (_, i) => ({ group: $(`#dancer-${i}`), body: $(`#dancer-${i} .body`), left: $(`#dancer-${i} .left`), right: $(`#dancer-${i} .right`) }));
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime;
function render() {
  const state = frame(progress, cycle);
  state.dancers.forEach((d, i) => {
    const element = dancers[i];
    element.group.setAttribute('transform', `translate(${d.x} ${d.y})`);
    element.body.setAttribute('transform', `rotate(${d.angle})`);
    element.group.classList.toggle('middle', d.middle);
    element.left.style.opacity = 0.35 + 0.25 * (1 - state.rhythm.weight) / 2;
    element.right.style.opacity = 0.35 + 0.25 * (1 + state.rhythm.weight) / 2;
  });
  $('#hands').innerHTML = state.hands.map(pair => `<polyline points="${pair.map(i => `${state.dancers[i].x},${state.dancers[i].y}`).join(' ')}"/>`).join('');
  $('#timeline').style.setProperty('--progress', `${progress / duration * 100}%`);
  $('#scrub').value = progress;
  $('#scrub').setAttribute('aria-valuetext', `${sections[state.section].name}, phrase ${Math.min(3, Math.floor(progress - state.section * 4)) + 1}, step ${state.rhythm.step + 1}`);
  $('#play').textContent = playing ? 'Pause' : 'Play';
}
$('#sections').addEventListener('click', event => {
  const button = event.target.closest('[data-section]');
  if (button) { progress = sections[Number(button.dataset.section)].start; render(); }
});
$('#phrases').addEventListener('click', event => {
  const button = event.target.closest('[data-phrase]');
  if (button) { progress = Number(button.dataset.phrase); playing = false; render(); }
});
$('#play').addEventListener('click', () => { playing = !playing; render(); });
$('#reset').addEventListener('click', () => { progress = 0; cycle = 0; render(); });
$('#scrub').addEventListener('input', event => { playing = false; progress = Number(event.target.value); render(); });
function animate(time) {
  if (previousTime !== undefined && playing) {
    progress += Math.min(time - previousTime, 100) / 5000 * Number($('#speed').value);
    if (progress >= duration) { progress %= duration; cycle += 1; }
    render();
  }
  previousTime = time;
  requestAnimationFrame(animate);
}
render();
requestAnimationFrame(animate);
