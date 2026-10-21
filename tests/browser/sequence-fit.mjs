// Run against pnpm dev with optional REVIEW_ORIGIN, PLAYWRIGHT_MODULE,
// CHROMIUM_EXECUTABLE, and REVIEW_SCREENSHOTS (an existing output directory).
import assert from 'node:assert/strict';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE});
const origin = process.env.REVIEW_ORIGIN ?? 'http://127.0.0.1:5199';
const snapshot = async (page, name) => {
  if (process.env.REVIEW_SCREENSHOTS) await page.screenshot({path:`${process.env.REVIEW_SCREENSHOTS}/${name}.png`});
};
const geometry = page => page.locator('#phrase-score button,.floor-area,.player-bottom').evaluateAll(elements =>
  elements.map(element => element.getBoundingClientRect().toJSON()));
try {
  for (const width of [320,390,768,1440]) {
    const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
    for (const dance of ['drumul-dracului','tzadik-katamar','chapelloise','bourree','waltz','cercle','hanter-dro','an-dro','mazurka','schottische','branle-de-noirmoutier']) {
      await page.goto(`${origin}/?dance=${dance}`, {waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelector('#phrase-score .phrase-label'));
      await page.evaluate(()=>new Promise(requestAnimationFrame));
      const state = await page.evaluate(()=>({
        width:document.querySelector('#timeline-scroll').clientWidth,
        content:document.querySelector('#timeline-scroll').scrollWidth,
        docWidth:document.documentElement.scrollWidth,
        cells:[...document.querySelectorAll('#phrase-score button')].map(button=>({
          name:button.getAttribute('aria-label'), text:button.textContent,
          display:getComputedStyle(button).display,
          cell:button.getBoundingClientRect().toJSON(),
          label:button.querySelector('span').getBoundingClientRect().toJSON(),
        })),
      }));
      assert.ok(state.content<=state.width+1,`${dance} at ${width}: horizontal scrolling`);
      assert.equal(state.docWidth,width);
      for (const cell of state.cells) {
        assert.ok(cell.name && cell.text, 'Every cell retains its full accessible name and visible label');
        assert.notEqual(cell.display,'none',`${dance}: hidden tier`);
        assert.ok(cell.label.left>=cell.cell.left-0.6 && cell.label.right<=cell.cell.right+0.6,`${dance}: ${cell.name} exceeds cell`);
      }
      if (dance==='drumul-dracului') {
        assert.equal(await page.locator('.phrase-group').count(),4);
        assert.equal(await page.locator('.phrase-section').count(),20);
        assert.equal(await page.locator('.phrase-action').count(),0);
      }
      if (dance==='tzadik-katamar') {
        for (const row of ['.phrase-group','.phrase-section','.phrase-action']) {
          const cells=await page.locator(row).evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
          const score=await page.locator('#phrase-score').boundingBox();
          let end=score.x;
          for (const cell of cells) {
            assert.ok(Math.abs(cell.x-end)<0.1,`${row}: gap or overlap in Tzadik`);
            end=cell.right;
          }
          assert.ok(Math.abs(end-score.x-score.width)<0.1,`${row}: incomplete Tzadik cycle`);
        }
      }
    }
    await page.close();
  }
  console.log('PASS complete sequences and contained labels: 11 dances at four widths');

  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.setDefaultTimeout(5000);
  await page.goto(`${origin}/?dance=drumul-dracului`,{waitUntil:'domcontentloaded'});
  const cross = page.locator('.phrase-section').nth(12);
  await page.waitForFunction(()=>document.querySelector('#phrase-score .phrase-label'));
  const stable = await geometry(page);
  await cross.hover();
  const tooltip = page.getByRole('tooltip');
  assert.match(await tooltip.textContent(),/Crossing › Hip/);
  assert.match(await tooltip.textContent(),/Cross · Recover · Open · Recover/);
  assert.deepEqual((await tooltip.textContent()).split('\n'),[
    'Beats 33–36', 'Crossing › Hip', 'Cross · Recover · Open · Recover',
  ]);
  assert.deepEqual(await geometry(page),stable,'Hover must not move the score or animation');
  await snapshot(page,'desktop-hover');
  await page.keyboard.press('Escape');
  assert.equal(await tooltip.isVisible(),false);
  await cross.focus();
  assert.equal(await tooltip.isVisible(),true,'Keyboard focus reveals the full wording');
  await page.keyboard.press('Enter');
  const duration=Number(await page.locator('#scrub').getAttribute('max'));
  assert.equal(Number(await page.locator('#scrub').inputValue()),duration/2,'A compressed cell seeks to its original beat');
  await snapshot(page,'desktop-focus');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(100);
  assert.equal(await tooltip.isVisible(),false,'Resize dismisses the old tooltip position');
  await page.setViewportSize({width:1440,height:900});
  await page.waitForTimeout(100);
  assert.deepEqual(await geometry(page),stable,'Returning to desktop restores the exact geometry');
  await page.close();

  const touch = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  touch.setDefaultTimeout(5000);
  await touch.goto(`${origin}/?dance=drumul-dracului`,{waitUntil:'domcontentloaded'});
  await touch.waitForFunction(()=>document.querySelector('#phrase-score .phrase-label'));
  const before = await geometry(touch);
  // The final movement remains reachable at the right edge, including its bottom
  // pixels: the scrubber must not intercept the movement's touch target.
  const last = touch.locator('.phrase-section').last();
  const box = await last.boundingBox();
  await touch.touchscreen.tap(box.x+box.width/2,box.y+box.height-2);
  assert.match(await touch.getByRole('tooltip').textContent(),/Crossing › Stamps/);
  assert.equal(await touch.getByRole('tooltip').isVisible(),true);
  assert.match(await touch.getByRole('tooltip').textContent(),/Stamp · Stamp · Stamp · Hold/);
  const touchDuration=Number(await touch.locator('#scrub').getAttribute('max'));
  assert.equal(Number(await touch.locator('#scrub').inputValue()),60/64*touchDuration);
  assert.deepEqual(await geometry(touch),before,'Touch inspection must not move the controls');
  const tip = await touch.getByRole('tooltip').boundingBox();
  assert.ok(tip.x>=0 && tip.x+tip.width<=390);
  await snapshot(touch,'mobile-touch-last-movement');
  await touch.locator('h1').tap();
  assert.equal(await touch.getByRole('tooltip').isVisible(),false);
  await touch.close();
  console.log('PASS hover, focus, Escape, touch, final-movement seeking, resize stability');
} finally {
  await browser.close();
}
