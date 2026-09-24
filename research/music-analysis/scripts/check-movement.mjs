// Start pnpm dev first. PLAYWRIGHT_MODULE may name an external installed module.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1000,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5173'}/research/music-analysis/motion-review.html`);
 const check=await page.evaluate(async()=>{
  const {renderFloor}=await import('/src/ui/dance-floor.ts');
  const {dances}=await import('/src/dances/catalog.ts');
  const {drumulRecordings}=await import('/src/music/recordings.ts');
  const {musicPosition,timeAtBeat}=await import('/src/engine/music-time.ts');
  const snap=()=>[...document.querySelectorAll('#dancers .dancer')].map(d=>[d.querySelector('.lean').getAttribute('transform'),...Array.from(d.querySelectorAll('.support circle'),c=>c.style.opacity)]);
  const d=dances.find(d=>d.id==='drumul-dracului');const result=[];
  for(const track of drumulRecordings){
   let stamps=0,holds=0;
   const frameAt=(k,phase)=>{const p=musicPosition(timeAtBeat(k+phase,track.beats),track.beats,64,4,track.danceOffset);return d.frame(p.progress,p.cycle);};
   for(let k=0;k<track.beats.length-1;k++){
    const count=(k+(track.danceOffset??0))%64;
    const isStamp=count<32?[5,6].includes(count%8):[12,13,14].includes((count-32)%16);
    const isHold=count<32?count%8===7:(count-32)%16===15;
    const f=frameAt(k,.15);renderFloor(f,d.id);const before=JSON.stringify(snap());
    const marks=[...document.querySelectorAll('.support circle')].map(c=>Number(c.style.opacity));
    if(isStamp){stamps++;if(marks.filter(x=>x>.49).length!==10)throw Error('Stamp missing '+track.artist+' '+k);}
    else if(marks.some(x=>x!==0))throw Error('Invented stamp '+k);
    if(isHold)holds++;
    renderFloor(frameAt(Math.max(0,k-5),.9),d.id);renderFloor(f,d.id);
    if(JSON.stringify(snap())!==before)throw Error('Seek changes cue');
    renderFloor(f,d.id,false);
    if([...document.querySelectorAll('.support circle')].some(c=>Number(c.style.opacity)!==0))throw Error('Transition stamps');
   }
   result.push({artist:track.artist,counts:track.beats.length-1,stampCounts:stamps,holdCounts:holds,seekInvariant:true});
  }
  const families=[];
  for(const dance of dances){let maxLean=0;
   for(let t=0;t<dance.duration;t+=.025){renderFloor(dance.frame(t,0),dance.id);
    for(const el of document.querySelectorAll('.lean')){const angle=Number(el.getAttribute('transform').match(/rotate\(([^ ]+)/)[1]);maxLean=Math.max(maxLean,Math.abs(angle));}
    if(dance.id!==d.id&&[...document.querySelectorAll('.support circle')].some(c=>Number(c.style.opacity)>0))throw Error('Ordinary contact flash');
   }families.push({dance:dance.id,maxLean});
  }
  return {drumul:result,dances:families};
 });
 const ids=await page.locator('#recording option').evaluateAll(os=>os.map(o=>o.value));
 for(const id of ids){await page.selectOption('#recording',id);await page.click('#play');await page.waitForTimeout(180);await page.click('#play');
  await page.locator('#seek').evaluate(e=>{e.value=Number(e.min)+8;e.dispatchEvent(new Event('input'));});
 }
 await page.selectOption('#recording',ids[2]);await page.selectOption('#phase','4');await page.uncheck('#cues');
 const hidden=await page.locator('.lean').first().evaluate(e=>getComputedStyle(e).transform);if(hidden!=='none')throw Error('Hide cues fails');
 await page.check('#cues');await page.screenshot({path:'/tmp/movement-review-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/movement-review-mobile.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(process.env.ZNIWA_AUDIO){
 await page.selectOption('#recording',ids[0]);await page.setInputFiles('#file',process.env.ZNIWA_AUDIO);
 await page.locator('#audio').evaluate(a=>new Promise(resolve=>{a.muted=true;if(a.readyState>=1)resolve();else a.onloadeddata=resolve;}));
 await page.locator('#audio').evaluate(async a=>{a.currentTime=20;await a.play();});await page.waitForTimeout(250);await page.locator('#audio').evaluate(a=>a.pause());
 if(!/20\./.test(await page.locator('#readout').textContent()))throw Error('Audio clock not followed');
 }
 if(errors.length)throw Error(errors.join('\n'));
 const output={...check,viewerTracks:ids.length,localAudio:!!process.env.ZNIWA_AUDIO,mobileOverflow:false,errors};
 writeFileSync('/tmp/balfolk-movement-validation.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
}finally{await browser.close();}
