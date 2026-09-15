import { sections, duration, frame } from './movement.js';
const $ = selector => document.querySelector(selector);
$('#guides').innerHTML = `<path class="guide" d="M -120 -120 H 120 V 120 H -120 Z M 0 -120 V 120 M -120 0 H 120"/>`;
$('#dancers').innerHTML = frame(0).dancers.map((d, i) => `<g class="dancer ${d.middle ? 'middle' : ''}" id="dancer-${i}"><g class="body"><circle r="14"/><path d="M 0 -11 V -26 m -4 5 4 -5 4 5"/></g><text text-anchor="middle" dy="4">${d.id}</text></g>`).join('');
$('#sections').innerHTML = sections.map((section, i) => `<button type="button" data-section="${i}" style="flex:${section.duration}">${section.name}</button>`).join('');
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime;
function render() {
  const state = frame(progress, cycle);
  state.dancers.forEach((d, i) => {
    $(`#dancer-${i}`).setAttribute('transform', `translate(${d.x} ${d.y})`);
    $(`#dancer-${i} .body`).setAttribute('transform', `rotate(${d.angle})`);
    $(`#dancer-${i}`).classList.toggle('middle', d.middle);
  });
  $('#hands').innerHTML = state.hands.map(pair => `<polyline points="${pair.map(i => `${state.dancers[i].x},${state.dancers[i].y}`).join(' ')}"/>`).join('');
  $('#phase').textContent = state.label;
  $('#stage').textContent = sections[state.section].name;
  $('#detail').textContent = sections[state.section].detail;
  document.querySelectorAll('[data-section]').forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === state.section));
    const section = sections[i];
    button.style.setProperty('--fill', `${Math.max(0, Math.min(1, (progress - section.start) / section.duration)) * 100}%`);
  });
  $('#scrub').value = progress;
  $('#play').textContent = playing ? 'Pause' : 'Play';
}
$('#sections').addEventListener('click', event => {
  const button = event.target.closest('[data-section]');
  if (button) { progress = sections[Number(button.dataset.section)].start; render(); }
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
