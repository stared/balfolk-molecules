// Exact-source playback, transport and layout review. Optional TRACK_KEYS selects
// comma-separated tracks.json keys. REVIEW_SCREENSHOTS must be an existing folder.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
const base=new URL('../../research/music-analysis/sync-2026-10/',import.meta.url);
const tracks=JSON.parse(fs.readFileSync(new URL('tracks.json',base)));
const sources=JSON.parse(fs.readFileSync(new URL('sources.json',base)));
const keys=process.env.TRACK_KEYS?.split(',')??Object.keys(tracks).filter(key=>tracks[key].publish&&tracks[key].browserCheck);
const results=[];
try {
 for(const key of keys){
  const dance=tracks[key].browserCheck.dance,id=new URL(sources[key].url).searchParams.get('v');
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   let callback;
   Object.defineProperty(window,'onYouTubeIframeAPIReady',{configurable:true,get:()=>callback,set:fn=>{
    callback=()=>{const Original=window.YT.Player;window.YT.Player=function(el,opts){const ready=opts.events.onReady,error=opts.events.onError;opts.events.onReady=e=>{window.musicReady=true;ready(e);};opts.events.onError=e=>{window.musicError=e.data;error(e);};const p=new Original(el,opts);window.actual=p;return p;};fn();};
   }});
  });
  await page.goto(`${process.env.REVIEW_ORIGIN??'http://127.0.0.1:5199'}/?dance=${dance}`);
  await page.locator('#music-toggle').click();await page.locator(`[data-recording="${id}"]`).click();
  await page.waitForFunction(()=>window.musicReady||window.musicError,null,{timeout:25000});
  assert.equal(await page.evaluate(()=>window.musicError),undefined,`${key}: iframe error`);
  assert.equal(await page.locator('#music-toggle').getAttribute('aria-expanded'),'false');
  await page.evaluate(()=>window.actual.mute());await page.locator('#play').click();
  await page.waitForFunction(()=>window.actual.getPlayerState()===1,null,{timeout:20000});
  await page.waitForTimeout(350);
  await page.locator('#play').click();
  const stopped=await page.locator('#dancers').innerHTML(),progress=await page.locator('#scrub').inputValue();
  await page.waitForTimeout(700);
  assert.equal(await page.locator('#dancers').innerHTML(),stopped,`${key}: pose moved after Pause`);
  assert.equal(await page.locator('#scrub').inputValue(),progress,`${key}: clock moved after Pause`);
  assert.notEqual(await page.evaluate(()=>window.actual.getPlayerState()),1);
  await page.locator('#play').click();await page.waitForFunction(()=>window.actual.getPlayerState()===1);
  // Native controls are meaningful only when the video is visible. A native
  // pause leaves native paused seeking available, unlike the app's held clock.
  await page.locator('#music-toggle').click();await page.evaluate(()=>window.actual.pauseVideo());
  await page.waitForFunction(()=>window.actual.getPlayerState()===2);
  const checks=[];
  for(const t of tracks[key].browserCheck.seconds){
   await page.evaluate(t=>window.actual.seekTo(t,true),t);
   await page.waitForFunction(t=>Math.abs(window.actual.getCurrentTime()-t)<.2,t,{timeout:15000});
   await page.waitForTimeout(120);
   const check=await page.evaluate(async({dance,id,t})=>{
    const {recordingsByDance}=await import('/src/music/recordings.ts');const {dances}=await import('/src/dances/catalog.ts');
    const {musicalBeatsPerPhrase}=await import('/src/engine/timeline.ts');const {musicPosition}=await import('/src/engine/music-time.ts');
    const r=recordingsByDance[dance].find(r=>r.videoId===id),d=dances.find(d=>d.id===dance),phrase=musicalBeatsPerPhrase(d),seconds=window.actual.getCurrentTime();
    return {requested:t,seconds,actual:Number(document.querySelector('#scrub').value),expected:musicPosition(seconds,r.beats,d.duration*phrase,phrase,r.danceOffset).progress};
   },{dance,id,t});
   assert.ok(Math.abs(check.actual-check.expected)<.03,`${key}: ${JSON.stringify(check)}`);checks.push(check);
  }
  await page.locator('#music-toggle').click();await page.locator('#reset').click();
  const start=tracks[key].mapping.start;
  await page.waitForFunction(start=>Math.abs(window.actual.getCurrentTime()-start)<.2,start);
  assert.equal(await page.locator('#play').textContent(),'Play');
  assert.ok(Number(await page.locator('#scrub').inputValue())<.03);
  const layouts=[];
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:width===1440?900:844});await page.waitForTimeout(80);
   const geometry=()=>page.locator('#music-toggle,#play,#reset,#tempo-value,.floor-area,.player-bottom').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().toJSON()));
   const before=await geometry();await page.locator('#music-toggle').click();await page.waitForTimeout(350);
   assert.deepEqual(await geometry(),before,`${key}/${width}: opening changed geometry`);
   const layout=await page.evaluate(()=>{
    const panel=document.querySelector('#music-panel').getBoundingClientRect(),iframe=document.querySelector('#youtube-player iframe').getBoundingClientRect();
    return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,panel:panel.toJSON(),iframe:iframe.toJSON()};
   });
   assert.equal(layout.overflow,false);assert.ok(layout.panel.left>=-1&&layout.panel.right<=width+1);assert.ok(layout.panel.top>=-1&&layout.panel.bottom<=844+(width===1440?56:0)+1);
   assert.ok(layout.iframe.width>0&&layout.iframe.height>0,`${key}/${width}: hidden video`);
   assert.ok(Math.abs(layout.iframe.width/layout.iframe.height-16/9)<.01,`${key}/${width}: distorted video`);
   if(process.env.REVIEW_SCREENSHOTS)await page.screenshot({path:`${process.env.REVIEW_SCREENSHOTS}/${key}-${width}.png`});
   await page.locator('#music-toggle').click();assert.deepEqual(await geometry(),before);
   layouts.push(layout);
  }
  await page.locator('#music-toggle').click();await page.locator('[data-recording=""]').click();
  assert.equal(await page.locator('#tempo').isDisabled(),false);assert.deepEqual(errors,[]);
  results.push({key,id,dance,playing:true,appPause:true,restart:true,noMusic:true,checks,layouts});
  if(process.env.SYNC_REPORT)fs.writeFileSync(process.env.SYNC_REPORT,JSON.stringify(results,null,2)+'\n');
  console.log('PASS',key,`${checks.length} real seeks, pause, restart, No music, three widths`);
  await page.close();
 }
}finally{await browser.close();}
