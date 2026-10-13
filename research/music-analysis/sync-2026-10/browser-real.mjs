import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}});await page.goto(process.env.REVIEW_ORIGIN??'http://127.0.0.1:5176');await page.waitForFunction(()=>window.YT?.Player,{timeout:25000});
 await page.evaluate(()=>{const Original=window.YT.Player;window.YT.Player=function(el,opts){const ready=opts.events.onReady,error=opts.events.onError;window.playbackReady=false;window.playbackError=null;opts.events.onReady=()=>{window.playbackReady=true;ready();};opts.events.onError=e=>{window.playbackError=e.data;error(e);};const p=new Original(el,opts);window.actualPlayer=p;return p;};});
 const catalog=await page.evaluate(async()=>{const {recordingsByDance}=await import('/src/music/recordings.ts');return recordingsByDance;});
 const old=new Set(['AE2tuIaFmTA','7pzXyRLWiuc','RUpWyj8LFcE','iMQLYCar4WI','sVui_IvFjyQ','jwQukZnz4BQ','qXdZO2gc_uw']);
 for(const [dance,tracks] of Object.entries(catalog))for(const track of tracks){if(old.has(track.videoId)||(process.env.ONLY&&!process.env.ONLY.split(',').includes(track.videoId)))continue;
  await page.locator(`[data-dance="${dance}"]`).click();await page.selectOption('#music-recording',track.videoId);
  const result={dance,id:track.videoId,title:track.title};
  try{await page.waitForFunction(()=>window.playbackReady||window.playbackError,null,{timeout:18000});
   await page.evaluate(t=>{window.actualPlayer.mute();window.actualPlayer.seekTo(t,true);window.actualPlayer.playVideo();},track.beats[0]);
   await page.waitForFunction(()=>window.actualPlayer?.getPlayerState()===1||window.playbackError,null,{timeout:12000});await page.waitForTimeout(700);
   Object.assign(result,await page.evaluate(()=>({state:window.actualPlayer.getPlayerState(),seconds:window.actualPlayer.getCurrentTime(),error:window.playbackError,progress:Number(document.querySelector('#scrub').value),status:document.querySelector('#music-status').textContent})));
   await page.evaluate(()=>window.actualPlayer.pauseVideo());
  }catch(e){result.failure=e.message.split('\n')[0];result.status=await page.locator('#music-status').textContent();}
  results.push(result);console.log(JSON.stringify(result));fs.writeFileSync('/tmp/balfolk-sync/browser-real.json',JSON.stringify(results,null,2));
 }
 await page.locator('[data-dance="schottische"]').click();await page.selectOption('#music-recording','NJUhZDllgc0');await page.waitForTimeout(1000);await page.screenshot({path:'/tmp/balfolk-sync/app-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/balfolk-sync/app-mobile.png',fullPage:true});
 console.log('overflow',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
}finally{await browser.close();}
