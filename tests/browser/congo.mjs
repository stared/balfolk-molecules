// Run against pnpm dev; same environment overrides as sequence-fit.mjs.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
const origin=process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5199';
const snapshot=async(page,name)=>{
  if(process.env.REVIEW_SCREENSHOTS)await page.screenshot({path:`${process.env.REVIEW_SCREENSHOTS}/${name}.png`});
};
const seek=async(page,time)=>page.locator('#scrub').evaluate((input,time)=>{
  input.value=String(time);input.dispatchEvent(new Event('input',{bubbles:true}));
},time);
try {
  for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<900});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${origin}/?dance=congo-de-captieux&pairs=12`,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.phrase-section');
    assert.equal(await page.locator('#dancers .dancer').count(),4);
    assert.equal(await page.locator('#pairs-control').isVisible(),false);
    assert.equal(await page.locator('#roles').isVisible(),true);
    assert.equal(await page.locator('.phrase-group').count(),4);
    assert.equal(await page.locator('.phrase-section').count(),16);
    const layout=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,
      height:document.documentElement.scrollHeight,
      timeline:document.querySelector('#timeline-scroll').clientWidth,
      content:document.querySelector('#timeline-scroll').scrollWidth,
      bottom:document.querySelector('.player-bottom').getBoundingClientRect().bottom,
      cells:[...document.querySelectorAll('#phrase-score button')].map(b=>({
        cell:b.getBoundingClientRect().toJSON(),label:b.querySelector('span').getBoundingClientRect().toJSON(),
      })),
    }));
    assert.equal(layout.width,width);
    assert.ok(layout.content<=layout.timeline+1);
    assert.ok(layout.bottom<=height,`Controls below viewport at ${width}×${height}`);
    for(const {cell,label} of layout.cells)assert.ok(label.left>=cell.left-0.6&&label.right<=cell.right+0.6);
    await seek(page,9.45);
    await snapshot(page,`congo-${width}x${height}-crossing`);
    const before=await page.locator('.floor-area').boundingBox();
    await page.locator('.phrase-section').nth(9).click();
    const tip=page.getByRole('tooltip');
    assert.match(await tip.textContent(),/right shoulders behind/);
    assert.equal((await tip.textContent()).split('\n').length,3);
    assert.equal(Number(await page.locator('#scrub').inputValue()),9);
    const box=await tip.boundingBox();
    assert.ok(box.x>=0&&box.x+box.width<=width);
    assert.deepEqual(await page.locator('.floor-area').boundingBox(),before);
    await snapshot(page,`congo-${width}x${height}-detail`);
    await page.keyboard.press('Escape');
    await page.locator('h1').click();
    if(width===1440) {
      await page.locator('#settings-toggle').click();
      await page.locator('#letters').check();
      await page.locator('#settings-toggle').click();
      for(const [name,time] of [['pastourelle',3.45],['diagonal',8.65],['crossing',9.45],['chase',10.5],['play',14.5],['reunite',15.3]]) {
        await seek(page,time);await snapshot(page,`congo-desktop-${name}`);
      }
      await page.locator('#reset').click();
      if(await page.locator('#play').textContent()==='Play')await page.locator('#play').click();
      await page.waitForFunction(()=>Number(document.querySelector('#scrub').value)>0.05);
      await page.locator('#play').click();
      const paused=await page.locator('#scrub').inputValue();
      await page.waitForTimeout(120);
      assert.equal(await page.locator('#scrub').inputValue(),paused);
      await page.locator('[data-dance="chapelloise"]').click();
      await page.waitForFunction(()=>document.querySelector('#dance-status').hidden);
      assert.equal(await page.locator('#pairs-control').isVisible(),true);
      assert.equal(await page.locator('#dancers .dancer').count(),24);
      await page.locator('[data-dance="congo-de-captieux"]').click();
      await page.waitForFunction(()=>document.querySelector('#dance-status').hidden);
      assert.equal(await page.locator('#dancers .dancer').count(),4);
      assert.equal(await page.locator('#pairs-control').isVisible(),false);
      assert.ok(!new URL(page.url()).searchParams.has('pairs'));
      await page.locator('#reset').click();
    }
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log('PASS Congo: five viewports, complete timeline, hover/tap, fixed set, playback, and dance transitions');
} finally {await browser.close();}
