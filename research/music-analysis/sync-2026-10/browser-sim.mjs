import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
try{const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.YT={Player:class{constructor(el,o){this.o=o;this.t=o.playerVars.start;this.s=2;this.rate=1;this.dead=false;el.textContent=o.videoId;window.mock=this;setTimeout(()=>o.events.onReady(),0);}getCurrentTime(){return this.t;}getPlayerState(){return this.s;}getPlaybackRate(){return this.rate;}playVideo(){this.s=1;this.o.events.onStateChange({data:1});}pauseVideo(){this.s=2;this.o.events.onStateChange({data:2});}seekTo(t){this.t=t;}destroy(){this.dead=true;}}};});
 await page.goto(process.env.REVIEW_ORIGIN??'http://127.0.0.1:5199');
 const selectRecording=async id=>{await page.locator('#music-toggle').click();await page.locator(`[data-recording="${id}"]`).click();};
 const data=await page.evaluate(async()=>{const {recordingsByDance}=await import('/src/music/recordings.ts');const {dances}=await import('/src/dances/catalog.ts');const {musicalBeatsPerPhrase}=await import('/src/engine/timeline.ts');return dances.map(d=>({id:d.id,duration:d.duration,phrase:musicalBeatsPerPhrase(d),tracks:recordingsByDance[d.id]??[]}));});let recordings=0,checks=0;
 for(const d of data){await page.locator(`[data-dance="${d.id}"]`).click();await page.waitForFunction(()=>document.querySelector('#dance-status').hidden);for(const r of d.tracks){await selectRecording(r.videoId);await page.waitForTimeout(30);const cycle=d.duration*d.phrase;
  for(const count of [0,.5,cycle/2,cycle+1.25,r.beats.length-2,cycle/3]){const i=Math.floor(count),t=r.beats[i]+(r.beats[i+1]-r.beats[i])*(count-i);await page.evaluate(t=>{window.mock.t=t;window.mock.s=2;window.mock.o.events.onStateChange({data:2});},t);await page.waitForTimeout(25);const got=Number(await page.locator('#scrub').inputValue()),expected=(count+(r.danceOffset??0))%cycle/d.phrase;assert.ok(Math.abs(got-expected)<.002,`${d.id}/${r.title} ${count}: ${got} vs ${expected}`);assert.ok(!/NaN|Infinity/.test(await page.locator('#dance-floor').innerHTML()));checks++;}
  await page.click('#reset');assert.ok(Math.abs(await page.evaluate(()=>window.mock.t)-r.beats[0])<1e-7);await page.click('#play');assert.equal(await page.evaluate(()=>window.mock.s),1);await page.click('#play');assert.equal(await page.evaluate(()=>window.mock.s),2);
  await page.evaluate(()=>{window.mock.rate=.75;window.mock.o.events.onStateChange({data:2});});await page.waitForTimeout(25);const bpm=Number(await page.locator('#tempo-value').textContent());assert.ok(bpm>0&&bpm<r.bpm*.9);
  await page.evaluate(end=>{window.mock.t=end+.01;window.mock.s=1;window.mock.o.events.onStateChange({data:1});},r.beats.at(-1));await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>window.mock.s),2);recordings++;
 }
 await selectRecording('');assert.equal(await page.locator('#tempo').isDisabled(),false);
 }
 await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);const result={recordings,seekChecks:checks,transport:['restart','play','pause','rate','end','no music'],finiteGeometry:true,mobileOverflow:false};fs.writeFileSync('/tmp/balfolk-sync/browser-sim.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
