// Run against pnpm dev. Optional: REVIEW_ORIGIN, PLAYWRIGHT_MODULE,
// CHROMIUM_EXECUTABLE. The mock deliberately does not acknowledge commands
// until the test emits an event, reproducing the asynchronous iframe boundary.
import assert from 'node:assert/strict';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.players = [];
    window.YT = {Player:class {
      constructor(element,options) {
        this.options=options; this.state=2; this.time=options.playerVars.start;
        this.calls=[]; window.player=this; window.players.push(this);
        if(!window.deferReady)setTimeout(()=>options.events.onReady(),0);
      }
      emit(state) {this.state=state; this.options.events.onStateChange({data:state});}
      playVideo() {this.calls.push('play');}
      pauseVideo() {this.calls.push('pause');}
      seekTo(time) {if(window.deferSeek)this.seekTarget=time;else this.time=time;}
      getCurrentTime() {return this.time;}
      getPlayerState() {return this.state;}
      getPlaybackRate() {return 1;}
      destroy() {}
    }};
  });
  await page.goto(`${process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5176'}/?dance=tzadik-katamar`);
  const button=page.locator('#play');
  await page.waitForFunction(()=>!document.querySelector('#play').disabled);
  const label=async text=>assert.equal(await button.textContent(),text);
  const emit=state=>page.evaluate(state=>window.player.emit(state),state);

  await button.click(); await label('Pause');
  await button.click(); await label('Play');
  assert.deepEqual(await page.evaluate(()=>window.player.calls),['play','pause']);
  await emit(1); // The earlier Play arrives after the user has pressed Pause.
  await label('Play');
  assert.equal(await page.evaluate(()=>window.player.calls.at(-1)),'pause');
  await emit(2);

  // Pause must freeze the very first frame, not merely settle after the iframe
  // acknowledges it. Simulate a clock that advances for half a second first.
  await button.click(); await emit(1);
  await page.evaluate(()=>window.player.time=20);
  await page.waitForTimeout(50);
  const immediatePose=await page.locator('#dancers').innerHTML();
  const immediateProgress=await page.locator('#scrub').inputValue();
  await button.click();
  for (const state of [1,3,2,2]) {
    await page.evaluate(state=>{window.player.time+=0.5;window.player.emit(state);},state);
    await page.waitForTimeout(50);
    assert.equal(await page.locator('#scrub').inputValue(),immediateProgress,'Pause must hold the timeline before and after acknowledgement');
    assert.equal(await page.locator('#dancers').innerHTML(),immediatePose,'Pause must hold the dancer pose');
  }
  await button.click(); await emit(1);
  await page.waitForTimeout(50);
  assert.notEqual(await page.locator('#scrub').inputValue(),immediateProgress,'Resume must follow the actual music clock');
  await emit(2);

  await button.click(); await emit(3); await label('Pause');
  await button.click(); await label('Play');
  assert.equal(await page.evaluate(()=>window.player.calls.at(-1)),'pause');
  await emit(2);

  await emit(1); await label('Pause'); // Controls inside the video still work.
  await emit(2); await label('Play');
  await button.click();
  await page.evaluate(()=>window.player.options.events.onAutoplayBlocked());
  await label('Play');
  assert.match(await page.locator('#music-status').textContent(),/blocked/);
  await button.click(); await emit(1); await label('Pause');
  assert.equal(await page.locator('#music-status').isHidden(),true);

  // Restart near the end: PLAYING can arrive before the seek updates time.
  await emit(2);
  await page.evaluate(()=>{window.player.time=999;window.player.calls=[];window.deferSeek=true;});
  await button.click(); await emit(1);
  await page.waitForTimeout(100);
  await label('Pause');
  assert.deepEqual(await page.evaluate(()=>window.player.calls),['play']);
  assert.equal(await page.locator('#scrub').inputValue(),'0');
  await page.evaluate(()=>{window.player.time=window.player.seekTarget;window.deferSeek=false;});
  await page.waitForTimeout(50); await label('Pause');
  await page.locator('#reset').click(); await emit(2); await label('Play');
  await page.locator('#reset').click(); // Already paused: YouTube may send no event.
  await emit(1); await label('Pause'); // Embedded Play must not be suppressed.
  await emit(2);
  await page.selectOption('#music-recording','');
  await button.click(); await label('Pause');
  const before=Number(await page.locator('#scrub').inputValue());
  await page.waitForTimeout(100);
  assert.ok(Number(await page.locator('#scrub').inputValue())>before);
  await button.click(); await label('Play');
  const paused=await page.locator('#scrub').inputValue();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#scrub').inputValue(),paused);

  await page.evaluate(()=>window.deferReady=true);
  await page.locator('[data-dance="drumul-dracului"]').click();
  await label('Pause'); assert.equal(await button.isDisabled(),false);
  // The embedded video can start independently while dancers rearrange.
  await page.evaluate(()=>{window.player.options.events.onReady();window.player.emit(1);window.player.calls=[];});
  await button.click(); await label('Play');
  assert.deepEqual(await page.evaluate(()=>window.player.calls),['pause']);
  await emit(2);
  const stopped=await page.locator('#dancers').innerHTML();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#dancers').innerHTML(),stopped);
  await emit(1); await label('Pause'); // Video starts while the formation is paused.
  await button.click(); await emit(2); await label('Play');
  assert.equal(await page.locator('#dancers').innerHTML(),stopped);
  await button.click(); await label('Pause');
  await page.waitForTimeout(100);
  assert.notEqual(await page.locator('#dancers').innerHTML(),stopped);
  // Readiness and stale events from the previous recording cannot restart it.
  await page.evaluate(()=>{window.players[0].emit(1);window.player.options.events.onReady();});
  await label('Pause');
  await page.waitForFunction(()=>document.querySelector('#dance-status').hidden,{timeout:10000});
  await label('Play');
  assert.deepEqual(errors,[]);
  console.log('Passed: delayed Play/Pause, stale events, buffering cancellation, embedded controls, blocked playback, reset, no music, formation pause/resume, recording switch.');
} finally { await browser.close(); }
