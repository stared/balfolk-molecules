import { createYouTubePlayer } from './ui/youtube-player.ts';
import { bourreeRecordings, recordingsByDance } from './music/recordings.ts';
import { musicPosition, timeAtMusicPosition, tempoAtTime } from './engine/music-time.ts';
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
let selectedRecordingId = '';
const musicToggle = $<HTMLButtonElement>('#music-toggle');
const musicPanel = $('#music-panel');
const musicToggleLabel = musicToggle.querySelector<HTMLElement>('.music-label')!;
let recording = itemAt(bourreeRecordings, 0);
let musicError = '';
let musicEnded = false;
let awaitingMusicRestart = false;
let loadingRecording = false;
const youtube = createYouTubePlayer($('#youtube-player'), musicChanged, message => { musicError = message; });
const selectedRecordings = new Map<string, string>();
let musicDance = '';
function setupMusic() {
  if (musicDance === dance.id) return;
  musicDance = dance.id;
  const tracks = recordingsByDance[dance.id] ?? [];
  selectedRecordingId = selectedRecordings.get(dance.id) ?? '';
  const choices = [{ id: '', label: 'No music', description: 'No music' }, ...tracks.map(track => ({ id: track.videoId, label: track.title, description: `${track.title} (${track.artist})` }))];
  $('#music-recordings').replaceChildren(...choices.map(choice => {
    const button = document.createElement('button');
    button.type = 'button';
    const label = document.createElement('span'); label.className = 'music-label'; label.textContent = choice.label;
    button.append(label); button.title = choice.description;
    button.dataset.recording = choice.id;
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', choice.label);
    button.addEventListener('click', () => {
      closeMusic(); musicToggle.focus();
      void changeRecording(choice.id);
    });
    return button;
  }));
  recording = tracks.find(track => track.videoId === selectedRecordingId) ?? recording;
  musicError = ''; musicEnded = false; awaitingMusicRestart = false;
  closeMusic();
}
function withMusic() { return !!recordingsByDance[dance.id]?.some(track => track.videoId === selectedRecordingId); }
function updateMusicStatus() {
  const status = $('#music-status');
  const message = !withMusic() ? '' : musicError || (!youtube.ready ? 'Loading…' : youtube.state === 3 ? 'Buffering…' : '');
  if (status.textContent !== message) status.textContent = message;
  status.hidden = !message;
  status.title = message;
  $('#music-preview').hidden = !withMusic();
  for (const button of document.querySelectorAll<HTMLButtonElement>('#music-recordings button')) {
    button.setAttribute('aria-checked', String(button.dataset.recording === selectedRecordingId));
  }
  musicToggle.classList.toggle('has-recording', withMusic());
  const musicLabel = `Music: ${withMusic() ? `${recording.title} (${recording.artist})` : 'No music'}`;
  musicToggle.setAttribute('aria-label', musicLabel);
  musicToggle.title = musicLabel;
  updateMusicToggleLabel();
  tempoSlider.disabled = withMusic();
  $<HTMLButtonElement>('#play').disabled = withMusic() && !rearrangement && !youtube.ready;
}
function musicChanged() {
  // A video must not keep playing after its dance has been hidden.
  if (!withMusic()) { if (youtube.state === 1 || youtube.state === 3) youtube.pause(); return; }
  if (withMusic() && !rearrangement && !loadingRecording) {
    playing = youtube.playing && youtube.state === 1;
    if (playing && musicEnded && youtube.time >= recording.beats.at(-1)!) restartMusicClock();
    if (playing) { musicEnded = false; musicError = ''; }
    followMusic(); render();
  } else if (rearrangement) {
    render();
  }
  updateMusicStatus();
}
function restartMusicClock() {
  // seekTo is asynchronous: the old end timestamp may remain visible even
  // after PLAYING arrives. Do not immediately stop that new Play request.
  awaitingMusicRestart = youtube.time >= recording.beats.at(-1)!;
  progress = 0; cycle = 0;
  youtube.seek(recording.beats[0]!);
}
function followMusic() {
  if (awaitingMusicRestart) {
    if (youtube.time >= recording.beats.at(-1)!) return;
    awaitingMusicRestart = false;
  }
  const position = musicPosition(youtube.time, recording.beats, dance.duration * musicalBeatsPerPhrase(dance), musicalBeatsPerPhrase(dance), recording.danceOffset);
  progress = position.progress; cycle = position.cycle;
}
function seekDance(time: number) {
  awaitingMusicRestart = false;
  if (withMusic()) {
    youtube.pause();
    youtube.seek(timeAtMusicPosition(cycle,time,recording.beats,dance.duration*musicalBeatsPerPhrase(dance),musicalBeatsPerPhrase(dance),recording.danceOffset));
  }
  playing = false; progress = time; if (withMusic()) followMusic(); render();
}

const letters = $<HTMLInputElement>('#letters');
const navigation = createDanceNavigation(dances, selectDance);
const structure = createPhraseStructure(time => seekDance(time));
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
  setupMusic();
  navigation.setActive(dance.id);
  structure.setup(dance);
  $('#dance-title').textContent = dance.title;
  $('#pairs-control').hidden = !dance.roles;
  $('#chaos-control').hidden = dance.id !== 'bourree';
  document.title = dance.title;
  $('#dance-floor').setAttribute('aria-label', dance.description);
  tempoSlider.value = String(positionAtBpm(tempos.get(dance.id) ?? defaultBpm(dance)));
  showTempo();
  $('#roles').hidden = !dance.roles;
  scrub.max = String(dance.duration);
  $('#guides').innerHTML = dance.guides;
  $('#sections').innerHTML = dance.sections.map((section, i) => `<button type="button" style="flex:${section.duration}" data-section="${i}" title="${section.detail}">${section.name}</button>`).join('');
  const totalBeats = dance.duration * musicalBeatsPerPhrase(dance);
  $('#ticks').innerHTML = timelineTicks(dance).map(tick =>
    `<i class="${tick.kind === 'beat' ? 'step' : tick.kind}" style="left:${tick.beat / totalBeats * 100}%"></i>`
  ).join('');
  scrub.setAttribute('aria-label',`Dance timeline: ${dance.sections.length} sections, ${dance.phrases.length} phrases`);
  if (withMusic()) void youtube.load(recording.videoId, recording.beats[0]!);
  showLetters();
  updateMusicStatus();
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
  renderFloor(state, dance.id, !rearrangement);
  structure.render(progress, !!rearrangement);
  $('#timeline').style.setProperty('--progress', `${progress / dance.duration * 100}%`);
  scrub.value = String(progress);
  const position=Math.min(progress,dance.duration-1e-9),section=sectionAt(position);
  scrub.setAttribute('aria-valuetext', `${section.name}, phrase ${Math.floor(position-section.start)+1}, beat ${Math.floor(position*musicalBeatsPerPhrase(dance))+1}`);
  const pauseAction = withMusic() ? youtube.playing || (!!rearrangement && playing) : playing;
  $('#play').textContent = pauseAction ? 'Pause' : 'Play';
  $('#play').dataset.action = pauseAction ? 'pause' : 'play';
  $('#pair-count').textContent = String(live.count);
  $<HTMLButtonElement>('#add-pair').disabled = live.count >= maxPairCount;
  $<HTMLButtonElement>('#remove-pair').disabled = live.count === 0;
}
$('#sections').addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-section]') : null;
  if (button) seekDance(itemAt(dance.sections, Number(button.dataset.section)).start);
});
$('#play').addEventListener('click', () => {
  // Honour the action displayed on the button. Pause stops both channels,
  // including video started with its own controls during a formation change.
  if ($('#play').dataset.action === 'pause') {
    youtube.pause();
    playing = false;
    if (withMusic() && !rearrangement) followMusic();
  } else if (withMusic() && !rearrangement) {
    if (musicEnded || youtube.time < recording.beats[0]! || youtube.time >= recording.beats.at(-1)!) { restartMusicClock(); musicEnded = false; }
    musicError = '';
    youtube.play();
  } else playing = true;
  render();
});
$('#reset').addEventListener('click', () => { if (withMusic()) { youtube.pause(); youtube.seek(recording.beats[0]!); playing = false; musicEnded = false; } progress = 0; cycle = 0; chaos.reset(); live.restart(); if(withMusic()) followMusic(); if(rearrangement && displayed)rearrangement=new FormationChange(displayed,danceFrame()); render(); });
chaosControl.addEventListener('input', () => {
  chaos.setProbability(Number(chaosControl.value)/100);
  $('#chaos-value').textContent = `${chaosControl.value}%`;
});
function showLetters() { $('#dancers').classList.toggle('hide-letters', !letters.checked); }
letters.addEventListener('change', showLetters);
function updateMusicToggleLabel() {
  const label = withMusic() ? recording.title : 'No music';
  if (musicToggleLabel.textContent !== label) musicToggleLabel.textContent = label;
}
function closeMusic() {
  musicPanel.hidden = true; musicToggle.setAttribute('aria-expanded', 'false');
  // During initial setup, the dance has already been assigned.
  updateMusicToggleLabel();
}
function positionMusicPanel() {
  if (musicPanel.hidden) return;
  const rect = musicToggle.getBoundingClientRect();
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const below = Math.max(0, viewportHeight - rect.bottom - 12);
  const above = Math.max(0, rect.top - 12);
  musicPanel.style.maxHeight = 'none';
  const desired = musicPanel.scrollHeight + 2;
  const upwards = desired > below && above > below;
  musicPanel.classList.toggle('opens-up', upwards);
  musicToggle.classList.toggle('opens-up', upwards);
  musicPanel.style.maxHeight = `${Math.max(38, Math.floor(upwards ? above : below))}px`;
  musicPanel.scrollTop = 0;
}
musicToggle.addEventListener('keydown', event => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  closeSettings(); musicPanel.hidden = false; musicToggle.setAttribute('aria-expanded', 'true');
  updateMusicToggleLabel(); positionMusicPanel();
  musicPanel.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
});
$('#music-recordings').addEventListener('keydown', event => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const choices = Array.from(musicPanel.querySelectorAll<HTMLButtonElement>('[data-recording]'));
  const current = choices.indexOf(document.activeElement as HTMLButtonElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
  choices[next]?.focus();
});
window.addEventListener('resize', positionMusicPanel);
window.addEventListener('scroll', positionMusicPanel, { passive: true });

musicToggle.addEventListener('click', () => {
  closeSettings();
  musicPanel.hidden = !musicPanel.hidden;
  musicToggle.setAttribute('aria-expanded', String(!musicPanel.hidden));
  updateMusicToggleLabel(); positionMusicPanel();
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && !event.target.closest('.music-picker')) closeMusic();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !musicPanel.hidden) { closeMusic(); musicToggle.focus(); }
});
const settings = $('#settings-panel');
const settingsToggle = $('#settings-toggle');
function closeSettings() { settings.hidden = true; settingsToggle.setAttribute('aria-expanded', 'false'); }
settingsToggle.addEventListener('click', () => {
  closeMusic();
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

scrub.addEventListener('input', () => seekDance(Number(scrub.value)));

async function changeRecording(id: string) {
  if (id === selectedRecordingId) return;
  selectedRecordingId = id;
  loadingRecording = true; youtube.pause(); playing = false;
  previousTime = undefined; rearrangement = undefined;
  selectedRecordings.set(dance.id, selectedRecordingId);
  const selected = recordingsByDance[dance.id]?.find(track => track.videoId === selectedRecordingId);
  if (selected) recording = selected;
  musicError = ''; musicEnded = false; awaitingMusicRestart = false; progress = 0; cycle = 0; chaos.reset();
  updateMusicStatus(); showTempo(); render();
  if (selected) await youtube.load(recording.videoId, recording.beats[0]!);
  loadingRecording = false; updateMusicStatus(); showTempo(); render();
}
function showTempo(): void {
  const bpm = withMusic() ? Math.round((recording.variableTempo ? tempoAtTime(youtube.time, recording.beats) : recording.bpm) * youtube.rate) : tempos.get(dance.id) ?? defaultBpm(dance);
  $('#tempo-value').textContent = String(bpm);
  $('#tempo-value').title = withMusic() ? (recording.variableTempo ? 'Measured from the recording.' : 'Tempo of the recording.') : dance.tempoNote ?? 'Practice tempo.';
  tempoSlider.setAttribute('aria-valuetext', `${bpm} BPM`);
}
tempoSlider.addEventListener('input', () => {
  tempos.set(dance.id, bpmAtPosition(Number(tempoSlider.value)));
  showTempo();
});
function animate(time: number) {
  if (withMusic() && !rearrangement) {
    playing = youtube.playing && youtube.state === 1;
    if (youtube.ready) {
      followMusic();
      if (playing && !awaitingMusicRestart && youtube.time >= recording.beats.at(-1)!) {
        youtube.pause(); playing = false; musicEnded = true;
      }
    }
    render(); showTempo(); updateMusicStatus();
    previousTime = time;
    requestAnimationFrame(animate);
    return;
  }
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
  youtube.pause();
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
