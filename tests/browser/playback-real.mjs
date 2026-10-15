// Real-network complement to playback.mjs. Requires Playwright and Chromium.
// REVIEW_ORIGIN, PLAYWRIGHT_MODULE and CHROMIUM_EXECUTABLE are optional.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const b=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE});
try{const p=await b.newPage({viewport:{width:1440,height:1200}});await p.addInitScript(()=>{window.log=[];let callback;Object.defineProperty(window,'onYouTubeIframeAPIReady',{configurable:true,get:()=>callback,set:fn=>{callback=()=>{const Original=window.YT.Player;window.YT.Player=function(el,o){for(const name of ['onStateChange','onReady','onError','onAutoplayBlocked']){const cb=o.events[name];o.events[name]=e=>{window.log.push([name,e?.data,performance.now()]);if(name==='onReady'){const player=e.target;for(const method of ['playVideo','pauseVideo','seekTo']){const fn=player[method].bind(player);player[method]=(...args)=>{window.log.push([method,args,performance.now()]);return fn(...args);};}}cb?.(e);};}const player=new Original(el,o);window.actual=player;return player;};fn();};}});});
await p.goto(`${process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5176'}/?dance=tzadik-katamar`);await p.waitForFunction(()=>window.actual?.getPlayerState&& !document.querySelector('#play').disabled,null,{timeout:20000}).catch(async e=>{console.log(await p.evaluate(()=>({log:window.log,yt:!!window.YT,actual:!!window.actual,status:document.querySelector('#music-status').textContent,iframe:document.querySelector('iframe')?.src})));throw e;});
const checkPause=async name=>{
 await p.evaluate(()=>{
   const button=document.querySelector('#play');
   window.pauseFrames=[];
   window.pauseClickedAt=performance.now();
   button.click();
   const snapshot=()=>({progress:document.querySelector('#scrub').value,pose:document.querySelector('#dancers').innerHTML});
   window.pauseSnapshot=snapshot();
   const sample=()=>{
     window.pauseFrames.push(snapshot());
     const acknowledged=window.log.some(([type,state,time])=>type==='onStateChange'&&state===2&&time>=window.pauseClickedAt);
     if(!acknowledged)requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
 });
 await p.waitForFunction(()=>window.log.some(([type,state,time])=>type==='onStateChange'&&state===2&&time>=window.pauseClickedAt),null,{timeout:6000});
 const immediate=await p.evaluate(()=>window.pauseFrames.every(frame=>frame.progress===window.pauseSnapshot.progress&&frame.pose===window.pauseSnapshot.pose));
 if(!immediate)throw Error(`${name} advanced while waiting for YouTube to pause`);
 const before=await p.evaluate(()=>window.actual.getCurrentTime());
 const progress=await p.locator('#scrub').inputValue();
 await p.waitForTimeout(600);
 const after=await p.evaluate(()=>window.actual.getCurrentTime());
 if(Math.abs(after-before)>.05||progress!==await p.locator('#scrub').inputValue())throw Error(`${name} did not stop: ${JSON.stringify({before,after,progress,current:await p.locator('#scrub').inputValue(),log:await p.evaluate(()=>window.log)})}`);
 const acknowledgement=await p.evaluate(()=>{
   const event=window.log.find(([type,state,time])=>type==='onStateChange'&&state===2&&time>=window.pauseClickedAt);
   return event ? Math.round(event[2]-window.pauseClickedAt) : 'already paused';
 });
 console.log('PASS',name,`(YouTube acknowledgement: ${acknowledgement} ms)`);await p.evaluate(()=>window.log=[]);
};
for(const id of ['tzadik-katamar','chapelloise','mazurka']){
 if(id!=='tzadik-katamar'){await p.locator(`[data-dance="${id}"]`).click();await p.waitForFunction(()=>document.querySelector('#dance-status').hidden&&!document.querySelector('#play').disabled,null,{timeout:20000});}
 await p.locator('#play').click();await p.waitForFunction(()=>window.actual.getPlayerState()===1,null,{timeout:15000});await p.waitForTimeout(500);await checkPause(`${id}: ordinary pause`);
 await p.locator('#play').click();await checkPause(`${id}: cancel resume immediately`);
 await p.locator('#play').click();await p.waitForFunction(()=>window.actual.getPlayerState()===1,null,{timeout:15000});
 await p.locator('#reset').click();await p.waitForFunction(()=>window.actual.getPlayerState()===2,null,{timeout:6000});
 await p.locator('#play').click();await p.waitForFunction(()=>window.actual.getPlayerState()===1,null,{timeout:15000});await checkPause(`${id}: pause after restart`);
 // Exercise real clicks inside the iframe as well as the application's button.
 const embeddedPlay=p.frameLocator('#youtube-player iframe').locator('.ytp-play-button:visible, .player-control-play-pause-icon:visible, .ytmCuedOverlayPlayButton:visible').first();
 await embeddedPlay.click({timeout:5000}).catch(async error=>{
   await p.screenshot({path:'/tmp/balfolk-playback.png'}); console.error(JSON.stringify(await Promise.all(p.frames().slice(1).map(async frame=>({url:frame.url(),buttons:await frame.locator('button').evaluateAll(buttons=>buttons.map(button=>({label:button.getAttribute('aria-label'),title:button.title,class:button.className})))})))));
   throw error;
 });
 await p.waitForFunction(()=>window.actual.getPlayerState()===1&&document.querySelector('#play').textContent==='Pause',null,{timeout:15000});
 await checkPause(`${id}: app pause after embedded Play`);
}
}catch(error){console.error(error);throw error;}finally{await b.close();}
