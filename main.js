const $ = (selector) => document.querySelector(selector);
const radius = 160;
const points = [[0, radius], [radius, 0], [0, -radius], [-radius, 0]];
$('#guides').innerHTML = points.map(([x, y], i) => `
  <path class="guide" d="M 0 0 L ${x} ${y}" />
  <circle class="position" cx="${x}" cy="${y}" r="13" />
  <text class="position-label" x="${x * 1.2}" y="${y * 1.2 + 4}">${i + 1}</text>
`).join('');

let progress = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime;

function render() {
  const index = Math.min(3, Math.floor(progress));
  const fraction = progress - index;
  const start = points[index];
  const end = points[(index + 1) % 4];
  let x, y, angle = -index * 90, phase;
  if (fraction < 0.4) {
    const amount = 1 - fraction / 0.4;
    [x, y] = start.map(value => value * amount);
    phase = 'Forward';
  } else if (fraction < 0.6) {
    x = y = 0;
    angle -= (fraction - 0.4) / 0.2 * 90;
    phase = 'Quarter-turn';
  } else {
    const amount = (fraction - 0.6) / 0.4;
    [x, y] = end.map(value => value * amount);
    angle -= 90;
    phase = 'Backward';
  }
  $('#route').setAttribute('d', `M ${start[0]} ${start[1]} L 0 0 L ${end[0]} ${end[1]}`);
  $('#dancer').setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
  $('#phase').textContent = phase;
  $('#stage').textContent = `Stage ${index + 1} / 4`;
  $('#scrub').value = progress;
  $('#play').textContent = playing ? 'Pause' : 'Play';
}

$('#play').addEventListener('click', () => { playing = !playing; render(); });
$('#reset').addEventListener('click', () => { progress = 0; render(); });
$('#scrub').addEventListener('input', event => { playing = false; progress = Number(event.target.value); render(); });

function animate(time) {
  if (previousTime !== undefined && playing) {
    progress = (progress + Math.min(time - previousTime, 100) / 5000 * Number($('#speed').value)) % 4;
    render();
  }
  previousTime = time;
  requestAnimationFrame(animate);
}
render();
requestAnimationFrame(animate);
