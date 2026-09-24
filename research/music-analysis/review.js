/* Standalone local research viewer; no dependencies or network requests. */
const $=id=>document.getElementById(id),data=window.REVIEW_DATA;
const colors=['#24718b','#c67929','#76817e'],phaseColors=['#24718b','#c67929','#8171a7','#529168','#c9606e','#665547'];
let track,decoded,blob;
const checkpointMap={
  '930ea8d366e7d765':[[.44,'Opening / existing dance map'],[74,'Detector begins choosing half-time'],[106,'Late stamps and holds']],
  '401714cc08923dd5':[[44.86,'Selected regular passage'],[60,'First tempo transition'],[110,'Faster section']],
  '9df55aca5da6ab0e':[[20,'Triple grouping'],[120,'Middle section'],[260,'Later section']],
  '8d7a87938921a702':[[10,'Clear opening pulse'],[54,'Model switches pulse level'],[90,'Models choose different pulse levels'],[145,'Return toward slower pulse']],
  '59b48d8788649805':[[30,'Bass / bright contrast'],[150,'Later comparison']],
  'dea4f0794d1ae8de':[[20,'Early tempo'],[105,'Later tempo']],
  'c5abdfa2378452ed':[[20,'Early tempo'],[165,'Later tempo']]
};
for(const d of [...new Set(data.flatMap(t=>t.labels))].sort())$('dance').add(new Option(d,d));
function rebuild(preferred){
  const list=data.filter(t=>!$('dance').value||t.labels.includes($('dance').value)).sort((a,b)=>a.name.localeCompare(b.name));
  $('track').replaceChildren(...list.map(t=>new Option(`${t.name}${t.collection==='public-preview'?' [preview]':''}`,t.id)));
  if(list.some(t=>t.id===preferred))$('track').value=preferred;
  load();
}
function load(){
  track=data.find(t=>t.id===$('track').value);
  if(!track)return;
  decoded=track.bands.map(s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)));
  $('name').textContent=track.name;
  $('tags').replaceChildren(...[...track.labels,track.collection,track.status].map(t=>{const s=document.createElement('span');s.className='pill';s.textContent=t;return s;}));
  $('metadata').textContent=`${track.seconds.toFixed(1)} seconds · Beat-model agreement ${Math.round(track.agreement*100)}% · Group-start agreement ${Math.round(track.downbeatAgreement*100)}% · Regular-group coverage ${Math.round(track.coverage*100)}%. `;
  if(track.source.startsWith('https://')){const a=document.createElement('a');a.href=track.source;a.textContent='Recording source';a.target='_blank';a.rel='noreferrer';$('metadata').append(a);}
  $('note').textContent=track.note;
  const keys=Object.keys(track.meters);$('meter').replaceChildren(...keys.map(k=>new Option(k,k)));
  if(keys.length)$('meter').value=keys.reduce((a,b)=>track.meters[a].bass_linear_45ms.bars>track.meters[b].bass_linear_45ms.bars?a:b);
  $('checkpoint').replaceChildren(new Option('Choose a passage',''),...(checkpointMap[track.id]||[]).map(([sec,label])=>new Option(label,sec)));
  $('audio').pause();$('audio').removeAttribute('src');$('audio').load();$('file').value='';if(blob){URL.revokeObjectURL(blob);blob=undefined;}
  $('audio-note').textContent='Audio stays on your computer. Match the recording/version yourself; no music is bundled. Scrubbing the graph does not start playback.';
  setStart(Math.min(20,Math.max(0,track.seconds-Number($('span').value))));drawAll();
}
function setStart(t,seekAudio=false){
  const max=Math.max(0,track.seconds-Number($('span').value));t=Math.max(0,Math.min(max,Number(t)||0));
  $('seek').max=max;$('start').max=max;$('start').value=t.toFixed(1);$('seek').value=t;
  if(seekAudio&&blob)$('audio').currentTime=t;
  drawTimeline();
}
function prepare(id){
  const canvas=$(id),rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);c.font='12px system-ui';c.fillStyle='#626c6d';
  return {c,w:rect.width,h:rect.height};
}
function drawTimeline(){
  if(!track)return;
  const {c,w,h}=prepare('timeline'),a=Number($('start').value),span=Number($('span').value),left=48,right=w-12,x=t=>left+(t-a)/span*(right-left);
  const top=24,bottom=h-79;
  const ticks=w<500?4:8;
  c.strokeStyle='#e7ebe8';for(let i=0;i<=ticks;i++){let xx=x(a+span*i/ticks);c.beginPath();c.moveTo(xx,top);c.lineTo(xx,h-35);c.stroke();c.fillText((a+span*i/ticks).toFixed(1),xx-13,h-15);}
  c.fillText('sec',w-24,h-1);
  for(let band=2;band>=0;band--){c.strokeStyle=colors[band];c.globalAlpha=band===2?.55:.95;c.lineWidth=band===2?1:1.5;c.beginPath();let started=false;
    for(let i=Math.floor(a*track.fps);i<Math.min(decoded[band].length,Math.ceil((a+span)*track.fps));i++){const xx=x(i/track.fps),yy=bottom-decoded[band][i]/255*(bottom-top);if(!started){c.moveTo(xx,yy);started=true;}else c.lineTo(xx,yy);}c.stroke();}
  c.globalAlpha=1;
  for(const [beats,db,y,label,color] of [[track.beats,track.downbeats,h-63,'A','#414b4d'],[track.smallBeats,track.smallDownbeats,h-43,'B','#69847b']]){
    c.fillStyle=color;c.fillText(label,17,y+4);const starts=new Set(db.map(t=>Math.round(t*100)));
    for(const t of beats){if(t<a||t>a+span)continue;const isDown=starts.has(Math.round(t*100));c.strokeStyle=color;c.lineWidth=isDown?2.5:1;c.beginPath();c.moveTo(x(t),y-(isDown?8:4));c.lineTo(x(t),y+(isDown?8:4));c.stroke();}}
  if(blob){let now=$('audio').currentTime;if(now>=a&&now<=a+span){c.strokeStyle='#ab3d4b';c.lineWidth=1.5;c.beginPath();c.moveTo(x(now),top);c.lineTo(x(now),h-30);c.stroke();}}
}
function drawProfile(){
  const {c,w,h}=prepare('profile'),meter=track.meters[$('meter').value];
  if(!meter){c.fillText('Too few regular groups for a profile.',20,35);$('profile-note').textContent='';return;}
  const count=Number($('meter').value),top=20,bottom=h-30,left=40,width=w-left-12;
  const profiles=['bass','high','broad'].map(key=>meter[key+'_linear_45ms']);const max=Math.max(2,...profiles.flatMap(p=>p.profile))*1.05;
  const y=v=>bottom-v/max*(bottom-top);c.strokeStyle='#d2d9d5';c.setLineDash([3,4]);c.beginPath();c.moveTo(left,y(1));c.lineTo(w-10,y(1));c.stroke();c.setLineDash([]);c.fillText('1×',10,y(1)+4);
  for(let i=0;i<count;i++){const group=width/count,start=left+i*group+group*.15,bw=group*.7/3;profiles.forEach((p,b)=>{c.fillStyle=colors[b];c.fillRect(start+b*bw,y(p.profile[i]),Math.max(2,bw-2),bottom-y(p.profile[i]));});c.fillStyle='#626c6d';c.fillText(i+1,left+(i+.5)*group-3,bottom+20);}
  $('profile-note').textContent=`${profiles[0].bars} regular inferred groups. Each group is normalized to mean 1 before averaging. Colours match the timeline; positions are model-relative.`;
}
function drawStability(){
  const {c,w,h}=prepare('stability'),meter=track.meters[$('meter').value],key=$('band').value+'_linear_45ms';
  if(!meter)return;const blocks=meter[key].blocks,left=40,right=w-12,top=20,bottom=h-35,max=Math.max(2,...blocks.flatMap(b=>b.profile))*1.05;
  const x=t=>left+t/track.seconds*(right-left),y=v=>bottom-v/max*(bottom-top);c.strokeStyle='#d2d9d5';c.beginPath();c.moveTo(left,y(1));c.lineTo(right,y(1));c.stroke();c.fillText('1×',10,y(1)+4);
  for(let p=0;p<Number($('meter').value);p++){c.strokeStyle=phaseColors[p];c.lineWidth=1.5;c.beginPath();blocks.forEach((b,i)=>{if(i)c.lineTo(x(b.start),y(b.profile[p]));else c.moveTo(x(b.start),y(b.profile[p]));});c.stroke();c.fillStyle=phaseColors[p];c.fillText(p+1,45+p*25,h-5);}
  c.fillStyle='#626c6d';c.fillText('0 s',left,bottom+18);c.fillText(`${Math.round(track.seconds)} s`,right-38,bottom+18);
  $('stability-note').textContent='Each point averages up to eight successive accepted groups. Rejected intervals can leave gaps in time. Numbers identify model-relative positions.';
}
function drawAll(){drawTimeline();drawProfile();drawStability();}
$('dance').onchange=()=>rebuild();$('track').onchange=load;
$('seek').oninput=()=>setStart($('seek').value,true);$('start').onchange=()=>setStart($('start').value,true);
$('span').onchange=()=>setStart($('start').value);$('back').onclick=()=>setStart(Number($('start').value)-Number($('span').value),true);$('next').onclick=()=>setStart(Number($('start').value)+Number($('span').value),true);
$('checkpoint').onchange=()=>{if($('checkpoint').value)setStart($('checkpoint').value,true);};$('meter').onchange=drawAll;$('band').onchange=drawStability;
$('file').onchange=()=>{const file=$('file').files[0];if(!file)return;if(blob)URL.revokeObjectURL(blob);blob=URL.createObjectURL(file);$('audio').src=blob;$('audio-note').textContent=`Local file: ${file.name}. Confirm this is the same recording/version as the measurements.`;};
$('audio').onloadedmetadata=()=>{$('audio').currentTime=Number($('start').value);if(Math.abs($('audio').duration-track.seconds)>2)$('audio-note').textContent+=' Its duration differs by more than two seconds; alignment may be wrong.';};
$('audio').ontimeupdate=()=>{const t=$('audio').currentTime,a=Number($('start').value),span=Number($('span').value);if(t<a||t>a+span)setStart(Math.floor(t/span)*span);else drawTimeline();};
window.addEventListener('resize',drawAll);rebuild('930ea8d366e7d765');
