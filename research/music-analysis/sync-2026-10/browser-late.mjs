import fs from 'node:fs';import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});const results=[];
try{const page=await browser.newPage();await page.goto(process.env.REVIEW_ORIGIN??'http://127.0.0.1:5176');await page.waitForFunction(()=>window.YT?.Player);
 await page.evaluate(()=>{const Old=window.YT.Player;window.YT.Player=function(el,o){window.ready=false;const cb=o.events.onReady;o.events.onReady=()=>{window.ready=true;cb();};window.p=new Old(el,o);return window.p;};});
 const tracks=JSON.parse(fs.readFileSync(new URL('./tracks.json',import.meta.url),'utf8'));
 const sources=JSON.parse(fs.readFileSync(new URL('./sources.json',import.meta.url),'utf8'));
 const cases=process.env.SYNC_CASES?JSON.parse(process.env.SYNC_CASES):Object.entries(tracks).filter(([,track])=>track.browserCheck).map(([name,track])=>[track.browserCheck.dance,new URL(sources[name].url).searchParams.get('v'),track.browserCheck.seconds]);
 for(const [dance,id,times] of cases){
  await page.locator(`[data-dance="${dance}"]`).click();await page.selectOption('#music-recording',id);await page.waitForFunction(()=>window.ready);
  await page.evaluate(()=>{window.p.mute();window.p.playVideo();});await page.waitForFunction(()=>window.p.getPlayerState()===1);await page.evaluate(()=>window.p.pauseVideo());
  for(const t of times){await page.evaluate(t=>window.p.seekTo(t,true),t);await page.waitForFunction(t=>Math.abs(window.p.getCurrentTime()-t)<.2,t,{timeout:15000});await page.waitForTimeout(100);const check=await page.evaluate(async({dance,id,t})=>{const {recordingsByDance}=await import('/src/music/recordings.ts');const {dances}=await import('/src/dances/catalog.ts');const {musicalBeatsPerPhrase}=await import('/src/engine/timeline.ts');const {musicPosition}=await import('/src/engine/music-time.ts');const r=recordingsByDance[dance].find(x=>x.videoId===id),d=dances.find(x=>x.id===dance),phrase=musicalBeatsPerPhrase(d),seconds=window.p.getCurrentTime();return {dance,id,requested:t,seconds,actual:Number(document.querySelector('#scrub').value),expected:musicPosition(seconds,r.beats,d.duration*phrase,phrase).progress,state:window.p.getPlayerState()};},{dance,id,t});assert.ok(Math.abs(check.seconds-t)<.2,JSON.stringify(check));assert.ok(Math.abs(check.actual-check.expected)<.03,JSON.stringify(check));results.push(check);}
 }
 console.log('Real paused seeks at',results.length,'positions matched the dance clock');const output=process.env.SYNC_REPORT??new URL('./browser-late.json',import.meta.url);
 const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):[];
 const tested=new Set(results.map(result=>result.id));
 fs.writeFileSync(output,JSON.stringify([...previous.filter(result=>!tested.has(result.id)),...results],null,2)+'\n');
}finally{await browser.close();}
