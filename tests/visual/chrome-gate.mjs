/* global process,console,document,getComputedStyle,innerWidth,setTimeout,localStorage */
// Chrome contract: pinned pass drives every control; unpinned pass asserts retire, hint, wake, pin.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const base = process.env.BASE_URL || 'http://127.0.0.1:8791/';
const out = process.env.OUT || 'verification/chrome-pixels';
fs.mkdirSync(out, { recursive: true });
const widths = JSON.parse(process.env.WIDTHS || '[390,1365]');
const motions = JSON.parse(process.env.MOTIONS || '["no-preference","reduce"]');

const visible = (p, sel) =>
  p.$eval(sel, (e) => {
    const c = getComputedStyle(e);
    return c.visibility === 'visible' && +c.opacity > 0.5;
  });
const hidden = (p, sel) =>
  p.$eval(sel, (e) => getComputedStyle(e).visibility === 'hidden');

const results = [];
try {
  for (const w of widths) {
    for (const motion of motions) {
      const errors = [];
      // pinned pass
      // Fresh browser per pass: a lingering busy browser starves the next
      // pass under software WebGL (clicks land but React never commits).
      const b = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
      });
      const p = await b.newPage();
      p.on('pageerror', (e) => errors.push(String(e)));
      await p.setViewport({ width: w, height: 844 });
      await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: motion }]);
      await p.evaluateOnNewDocument(() => {
        try {
          localStorage.setItem('windermere-chrome-pin', '1');
        } catch {
          /* ignore */
        }
      });
      await p.goto(base);
      await p.waitForSelector('.veil', { hidden: true, timeout: 20000 });
      await wait(3500);
      assert.equal(await p.$eval('#pin-controls', (e) => e.getAttribute('aria-pressed')), 'true');
      assert.ok(await visible(p, '.time-dock'), 'pinned dock stays');
      assert.ok(await visible(p, '.corner'), 'pinned corner stays');
      assert.ok(await visible(p, 'header'), 'pinned wordmark stays');
      for (let i = 0; i < 3; i++) {
        await p.evaluate((i) => document.querySelectorAll('.time-dock button')[i].click(), i);
        await wait(400);
        assert.equal(
          await p.$eval(`.time-dock button:nth-child(${i + 1})`, (e) => e.getAttribute('aria-pressed')),
          'true'
        );
      }
      await p.screenshot({ path: `${out}/${w}-${motion}-pinned.png` });
      await p.click('[aria-label="Unmute the lake"]');
      assert.equal(
        await p.$eval('[aria-label="Mute the lake"]', (e) => e.getAttribute('aria-pressed')),
        'true'
      );
      await p.click('[aria-label="Mute the lake"]');
      await p.click('[aria-label="Calm settings"]');
      assert.ok(await p.$('.calm-sheet.is-open'));
      await p.screenshot({ path: `${out}/${w}-${motion}-calm.png` });
      await p.click('[aria-label="Calm settings"]');
      await p.click('[aria-label="Reset lake view"]');
      await p.click('#pin-controls');
      assert.equal(await p.$eval('#pin-controls', (e) => e.getAttribute('aria-pressed')), 'false');
      assert.equal(await p.evaluate(() => localStorage.getItem('windermere-chrome-pin')), null);
      const sizes = await p.$$eval('.time-label, .wordmark, .quiet-row span', (els) =>
        els.map((e) => parseFloat(getComputedStyle(e).fontSize))
      );
      assert.ok(Math.min(...sizes) >= 14, `font floor ${sizes}`);
      const taps = await p.$$eval('.time-dock button, .orb', (els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return r.width >= 44 && r.height >= 44;
        })
      );
      assert.ok(taps.every(Boolean), 'tap targets 44');
      assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow');
      assert.deepEqual(errors, []);
      await p.close();
      await b.close();

      // unpinned pass
      // Fresh browser per unpinned pass: the pinned pass warms the shared
      // browser enough that software-WebGL boot outlasts the greeting window.
      const b2 = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
      });
      const q = await b2.newPage();
      q.on('pageerror', (e) => errors.push(String(e)));
      await q.setViewport({ width: w, height: 844 });
      await q.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: motion }]);
      await q.goto(base);
      await q.waitForSelector('.veil', { hidden: true, timeout: 20000 });
      await wait(100);
      // Slow software-WebGL boot can outlast the greeting window; the designed
      // fallback is hint discovery. Either is a correct post-boot state.
      const greeted = await visible(q, '.time-dock');
      const hinted = await visible(q, '.chrome-hint');
      assert.ok(greeted || hinted, 'greeting or hint shows after boot');
      await q.screenshot({ path: `${out}/${w}-${motion}-greeting.png` });
      await wait(6200);
      for (const s of ['.time-dock', 'header', '.corner']) assert.ok(await hidden(q, s), `${s} retired`);
      assert.ok(await visible(q, '.chrome-hint'), 'hint shows');
      await q.screenshot({ path: `${out}/${w}-${motion}-quiet.png` });
      if (w > 500) {
        await q.mouse.move(600, 820);
        await wait(500);
        assert.ok(await visible(q, '.time-dock'), 'bottom edge wakes');
        await q.mouse.move(600, 300);
        await wait(3400);
        assert.ok(await hidden(q, '.time-dock'), 're-retires');
      }
      await q.click('.chrome-hint');
      await wait(500);
      assert.ok(await visible(q, '.time-dock'), 'hint wakes');
      await q.screenshot({ path: `${out}/${w}-${motion}-woken.png` });
      // Re-wake before pinning: p.click does not wait for actionability, and
      // under software WebGL the hint wake's 2.6s window can lapse during the
      // screenshot, leaving chrome hidden (pointer-events:none) at click time.
      await q.evaluate(() => { const h = document.querySelector('.chrome-hint'); if (h) h.click(); });
      await wait(300);
      // Click the pin by coordinates: selector clicks proved unreliable here
      // under software WebGL, coordinate clicks land. Verify and retry once.
      for (let attempt = 0; attempt < 2; attempt++) {
        const pin = await q.$('#pin-controls');
        const bb = await pin.boundingBox();
        await q.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
        try {
          await q.waitForFunction(() => localStorage.getItem('windermere-chrome-pin') === '1', { timeout: 2500, polling: 200 });
          break;
        } catch { if (attempt === 1) throw new Error('pin click never registered'); }
      }
      await wait(3400);
      assert.ok(await visible(q, '.time-dock'), 'pin holds');
      assert.equal(await q.evaluate(() => localStorage.getItem('windermere-chrome-pin')), '1');
      assert.deepEqual(errors, []);
      results.push({ width: w, motion, ok: true });
      await q.close();
      await b2.close();
    }
  }
  fs.writeFileSync(`${out}/proof.json`, JSON.stringify({ base, results }, null, 2));
  console.log('PASS', JSON.stringify(results));
} finally {
}
