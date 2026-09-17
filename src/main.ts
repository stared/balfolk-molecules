import { musicalBeatsPerPhrase, timelineTicks } from './engine/timeline.ts';
import { createPhraseStructure } from './ui/phrase-structure.ts';
import { bpmAtPosition, positionAtBpm, defaultBpm } from './engine/tempo.ts';
import { $ } from './ui/dom.ts';
import { createDanceNavigation } from './ui/dance-navigation.ts';
import { renderFloor } from './ui/dance-floor.ts';
import { itemAt } from './utils/indexed.ts';
import { dances } from './dances/catalog.ts';
import { defaultPairCount, maxPairCount } from './dances/chapelloise.ts';
import { BourreeChaos } from './dances/bourree-chaos.ts';
import { CircleLive } from './engine/circle-live.ts';
import type { LiveFrame } from './model.ts';
import { FormationChange } from './engine/formation-change.ts';
import { DancerAssignment } from './engine/dancer-assignment.ts';
const scrub = $<HTMLInputElement>('#scrub');
const tempoSlider = $<HTMLInputElement>('#tempo');
const tempos = new Map<string, number>();
const letters = $<HTMLInputElement>('#letters');
const navigation = createDanceNavigation(dances, selectDance);
const structure = createPhraseStructure(time => { progress = time; render(); });
const chaos = new BourreeChaos();
const chaosControl = $<HTMLInputElement>('#chaos');
const pairParameter = new URLSearchParams(location.search).get('pairs');
const requestedPairs = pairParameter === null ? NaN : Number(pairParameter);
const initialPairCount = Number.isInteger(requestedPairs) && requestedPairs > 0 && requestedPairs <= maxPairCount ? requestedPairs : defaultPairCount;
let dance = dances.find(d => d.id === new URLSearchParams(location.search).get('dance')) ?? itemAt(dances, 1);
const circles = new Map(dances.filter(d=>d.roles).map(d=>[d.id,new CircleLive(initialPairCount,d.frame,d.progression)]));
function activeCircle(): CircleLive {
  const circle=circles.get(dance.id) ?? circles.get('chapelloise');
  if(!circle)throw new Error('Missing circle');
  return circle;
}
let live=activeCircle();
function sectionAt(time:number) {
  return dance.sections.find(section=>time<section.start+section.duration) ?? itemAt(dance.sections,dance.sections.length-1);
}
function setup() {
  navigation.setActive(dance.id);
  structure.setup(dance);
  $('#dance-title').textContent = dance.title;
  $('#pairs-control').hidden = !dance.roles;
  $('#chaos-control').hidden = dance.id !== 'bourree';
  document.title = dance.title;
  $('#dance-floor').setAttribute('aria-label', dance.description);
  tempoSlider.value = String(positionAtBpm(tempos.get(dance.id) ?? defaultBpm(dance)));
  showTempo();
  $('#dance-names').textContent = dance.title;
  $('#dance-aliases').textContent = (dance.aliases ?? []).join(', ');
  $('#dance-aliases').hidden = !dance.aliases?.length;
  $('#dance-origin').hidden = !dance.origin;
  $('#dance-origin').textContent = dance.origin ?? '';
  const sourceDocument = new DOMParser().parseFromString(dance.sources, 'text/html');
  const materials = $('#dance-materials');
  materials.replaceChildren();
  for (const link of sourceDocument.querySelectorAll('a')) {
    materials.append(link.cloneNode(true));
  }
  for (const material of dance.materials ?? []) {
    const link = document.createElement('a');
    link.href = material.url; link.textContent = material.name;
    link.target = '_blank'; link.rel = 'noreferrer'; materials.append(link);
  }
  const source = sourceDocument.querySelector('a');
  const reference = $<HTMLAnchorElement>('#source-reference');
  reference.hidden = !source;
  if (source) reference.href = source.href;
  $('#roles').hidden = !dance.roles;
  scrub.max = String(dance.duration);
  $('#guides').innerHTML = dance.guides;
  $('#sections').innerHTML = dance.sections.map((section, i) => `<button type="button" style="flex:${section.duration}" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
  const totalBeats = dance.duration * musicalBeatsPerPhrase(dance);
  $('#ticks').innerHTML = timelineTicks(dance).map(tick =>
    `<i class="${tick.kind === 'beat' ? 'step' : tick.kind}" style="left:${tick.beat / totalBeats * 100}%"></i>`
  ).join('');
  scrub.setAttribute('aria-label',`Dance timeline: ${dance.sections.length} sections, ${dance.phrases.length} phrases`);
  showLetters();
}
let progress = 0;
let cycle = 0;
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousTime: number | undefined;
let rearrangement: FormationChange | undefined;
let displayed: LiveFrame | undefined;
const identities=new DancerAssignment();
function rawDanceFrame(): LiveFrame {
  const improvised = dance.id === 'bourree' ? chaos.frame(progress, cycle) : undefined;
  return improvised ? {...improvised,weight:improvised.rhythm.weight} : dance.roles ? live.frame(progress, cycle) : dance.frame(progress, cycle);
}
function danceFrame(): LiveFrame {return identities.apply(rawDanceFrame());}
function render() {
  const state = rearrangement?.frame() ?? danceFrame();
  displayed=state;
  $('#dance-status').hidden = !rearrangement;
  scrub.disabled=!!rearrangement;
  for(const button of document.querySelectorAll<HTMLButtonElement>('#sections button'))button.disabled=!!rearrangement;
  renderFloor(state);
  structure.render(progress, !!rearrangement);
  $('#timeline').style.setProperty('--progress', `${progress / dance.duration * 100}%`);
  scrub.value = String(progress);
  const position=Math.min(progress,dance.duration-1e-9),section=sectionAt(position);
  scrub.setAttribute('aria-valuetext', `${section.name}, phrase ${Math.floor(position-section.start)+1}, beat ${Math.floor(position*musicalBeatsPerPhrase(dance))+1}`);
  $('#play').textContent = playing ? 'Pause' : 'Play';
  $('#pair-count').textContent = String(live.count);
  $<HTMLButtonElement>('#add-pair').disabled = live.count >= maxPairCount;
  $<HTMLButtonElement>('#remove-pair').disabled = live.count === 0;
}
$('#sections').addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-section]') : null;
  if (button) { progress = itemAt(dance.sections, Number(button.dataset.section)).start; render(); }
});
$('#play').addEventListener('click', () => { playing = !playing; render(); });
$('#reset').addEventListener('click', () => { progress = 0; cycle = 0; chaos.reset(); live.restart(); if(rearrangement && displayed)rearrangement=new FormationChange(displayed,danceFrame()); render(); });
chaosControl.addEventListener('input', () => {
  chaos.setProbability(Number(chaosControl.value)/100);
  $('#chaos-value').textContent = `${chaosControl.value}%`;
});
function showLetters() { $('#dancers').classList.toggle('hide-letters', !letters.checked); }
letters.addEventListener('change', showLetters);
const settings = $('#settings-panel');
const settingsToggle = $('#settings-toggle');
function closeSettings() { settings.hidden = true; settingsToggle.setAttribute('aria-expanded', 'false'); }
settingsToggle.addEventListener('click', () => {
  settings.hidden = !settings.hidden;
  settingsToggle.setAttribute('aria-expanded', String(!settings.hidden));
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && !event.target.closest('.view-settings')) closeSettings();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !settings.hidden) { closeSettings(); settingsToggle.focus(); }
});
$('#show-steps').addEventListener('change', event => {
  $('#dancers').classList.toggle('hide-support', !(event.target as HTMLInputElement).checked);
});
$('#show-structure').addEventListener('change', event => {
  document.body.classList.toggle('hide-structure', !(event.target as HTMLInputElement).checked);
});

scrub.addEventListener('input', () => { playing = false; progress = Number(scrub.value); render(); });
function showTempo(): void {
  const bpm = tempos.get(dance.id) ?? defaultBpm(dance);
  $('#tempo-value').textContent = String(bpm);
  tempoSlider.setAttribute('aria-valuetext', `${bpm} BPM`);
}
tempoSlider.addEventListener('input', () => {
  tempos.set(dance.id, bpmAtPosition(Number(tempoSlider.value)));
  showTempo();
});
function animate(time: number) {
  if (!playing) {
    previousTime = time;
    requestAnimationFrame(animate);
    return;
  }
  const elapsed=previousTime===undefined?0:Math.min(time-previousTime,100)*(tempos.get(dance.id) ?? defaultBpm(dance))/defaultBpm(dance);
  const entering=dance.roles&&live.moving;
  if(rearrangement) {
    rearrangement.advance(elapsed);
    if(rearrangement.done)rearrangement=undefined;
    render();
    previousTime=time;
    requestAnimationFrame(animate);
    return;
  }
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
function selectDance(id: string): void {
  if (id === dance.id) return;
  const from=displayed ?? danceFrame();
  const chainOrder=dance.formation==='chain'?danceFrame().dancers.map(d=>d.id):undefined;
  dance = dances.find(d => d.id === id) ?? itemAt(dances, 0);
  progress = 0; cycle = 0;
  live=activeCircle();
  live.restart();
  chaos.reset();
  const target=chainOrder && dance.formation==='chain'
    ? identities.rearrangeChain(from,rawDanceFrame(),chainOrder)
    : identities.rearrange(from,rawDanceFrame());
  rearrangement=new FormationChange(from,target);
  playing=true;
  const url = new URL(location.href); url.searchParams.set('dance', dance.id);
  if(dance.roles)url.searchParams.set('pairs',String(live.count));
  history.replaceState(null, '', url);
  setup(); render();
}
function changePairs(action:'add'|'remove'): void {
  const from=displayed ?? danceFrame();
  if(!live.change(action,cycle,progress))return;
  if(rearrangement){live.restart();rearrangement=new FormationChange(from,danceFrame());}
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
