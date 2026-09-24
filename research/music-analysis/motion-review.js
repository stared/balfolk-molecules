import { dances } from '../../src/dances/catalog.ts';
import { renderFloor } from '../../src/ui/dance-floor.ts';
import { drumulRecordings } from '../../src/music/recordings.ts';
import { musicPosition } from '../../src/engine/music-time.ts';

const $=id=>document.getElementById(id);
const choices=[
  {id:'930ea8d366e7d765',name:'Żniwa — Drumul Draculi',dance:'drumul-dracului',map:drumulRecordings[0],checkpoints:[0.44,15.92,74,106]},
  {id:'401714cc08923dd5',name:'Stary Olsa — Drumul Draculi',dance:'drumul-dracului',map:drumulRecordings[1],checkpoints:[44.86,60,110,180]},
  {id:'59b48d8788649805',name:'Accordzéâm — Hotel Califorgna',dance:'schottische',checkpoints:[30,150,300]},
  {id:'572e913afe6f4da2',name:'Accordzéâm — Jottish',dance:'schottische',checkpoints:[30,100,180]},
  {id:'38cc2ff9c42c6aa9',name:'Alambic — La Solitaire',dance:'schottische',checkpoints:[30,150,250]},
];
for(const c of choices)$('recording').add(new Option(c.name,c.id));
for(let i=0;i<8;i++)$('phase').add(new Option(String(i),String(i)));
let selected,dance,beats,offset=0,seconds=0,playing=false,previous=0,blob;
const audio=$('audio');
function draw(){
  const pos=musicPosition(seconds,beats,dance.duration*(dance.countsPerPhrase??4),dance.countsPerPhrase??4,offset);
  renderFloor(dance.frame(pos.progress,pos.cycle),dance.id);
  $('dancers').classList.toggle('hide-support',!$('cues').checked);
  $('seek').value=String(seconds);
  $('readout').textContent=`${seconds.toFixed(2)} s · ${dance.sections[dance.frame(pos.progress,pos.cycle).section].name} · cycle ${pos.cycle+1} · count ${(pos.progress*(dance.countsPerPhrase??4)+1).toFixed(2)}`;
}
function stop(){playing=false;audio.pause();$('play').textContent='Play without audio';}
function seek(value){seconds=Math.max(beats[0],Math.min(beats.at(-1),value));if(blob)audio.currentTime=seconds;draw();}
function load(){
  stop();if(blob)URL.revokeObjectURL(blob);blob=undefined;audio.removeAttribute('src');audio.load();$('file').value='';
  selected=choices.find(c=>c.id===$('recording').value);dance=dances.find(d=>d.id===selected.dance);
  const measured=window.REVIEW_DATA.find(t=>t.id===selected.id);
  // Preserve both possible four-count phases within an eight-count schottische.
  // No peak-strength rule determines which half is the travelling figure.
  beats=selected.map?.beats??measured.beats.filter(t=>t>=measured.downbeats[0]);
  offset=selected.map?.danceOffset??0;$('phase').value='0';$('phase-label').hidden=!!selected.map;
  $('alignment').textContent=selected.map?'Existing app map, including the recording’s figure offset. Musical phrase interpretation retains the uncertainties in the research notes.':'Experimental: model beat timestamps, beginning at its first predicted group start. Try offsets 0 and 4 to compare the two possible figure halves; other offsets expose phase sensitivity. Not a published synchronization preset.';
  $('seek').min=beats[0];$('seek').max=beats.at(-1);
  $('checkpoint').replaceChildren(...selected.checkpoints.map(t=>new Option(`${t.toFixed(2)} s`,String(t))));
  $('audio-note').textContent='Optional audio stays on this computer. No music is bundled or uploaded.';
  seek(selected.checkpoints[0]);
}
$('recording').onchange=load;
$('phase').onchange=()=>{offset=Number($('phase').value);draw();};
$('cues').onchange=draw;
$('seek').oninput=()=>seek(Number($('seek').value));
$('checkpoint').onchange=()=>seek(Number($('checkpoint').value));
$('play').onclick=()=>{if(playing)stop();else{audio.pause();if(seconds>=beats.at(-1))seek(beats[0]);playing=true;previous=performance.now();$('play').textContent='Pause';}};
$('file').onchange=()=>{
  stop();if(blob)URL.revokeObjectURL(blob);const file=$('file').files[0];if(!file)return;
  blob=URL.createObjectURL(file);audio.src=blob;
  audio.onloadedmetadata=()=>{const measured=window.REVIEW_DATA.find(t=>t.id===selected.id);audio.currentTime=seconds;
    $('audio-note').textContent=Math.abs(audio.duration-measured.seconds)>2?'Duration differs from the analysed file. Check the recording/version before judging alignment.':'Duration matches approximately; confirm that this is the same recording/version. Audio remains local.';};
};
audio.onplay=()=>{playing=false;$('play').textContent='Play without audio';if(audio.currentTime<beats[0]||audio.currentTime>=beats.at(-1))audio.currentTime=beats[0];};
audio.onseeked=()=>{seconds=Math.max(beats[0],Math.min(beats.at(-1),audio.currentTime));draw();};
function tick(now){
  if(blob&&!audio.paused){seconds=Math.max(beats[0],Math.min(beats.at(-1),audio.currentTime));if(audio.currentTime>=beats.at(-1))audio.pause();draw();}
  else if(playing){seconds=Math.min(beats.at(-1),seconds+(now-previous)/1000);if(seconds>=beats.at(-1))stop();draw();}
  previous=now;requestAnimationFrame(tick);
}
load();requestAnimationFrame(tick);
