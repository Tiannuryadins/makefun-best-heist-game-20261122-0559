// Interactive play-test for Midnight Vault: load the title screen, click
// MULAI MISI, walk with the keyboard, and report the live state. Exit 0
// only if all checks pass. Requires `node serve.ts` (port 8080).
const { chromium } = require('/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/cft-dl/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:8080/', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const phase0 = await page.evaluate(() => window.__midnightVault.phase);
  await page.click('#overlay-buttons button');
  await page.waitForTimeout(300);
  const phase1 = await page.evaluate(() => window.__midnightVault.phase);
  const x0 = await page.evaluate(() => window.__midnightVault.state.player.x);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.up('ArrowRight');
  const afterKeys = await page.evaluate(() => ({
    x: window.__midnightVault.state.player.x,
    y: window.__midnightVault.state.player.y,
  }));
  // click-to-move: click far right of the canvas
  await page.mouse.click(1100, 400);
  await page.waitForTimeout(600);
  const afterClick = await page.evaluate(() => ({
    x: window.__midnightVault.state.player.x,
    y: window.__midnightVault.state.player.y,
  }));
  const hud = await page.evaluate(() => ({
    level: document.getElementById('level-name').textContent,
    timer: document.getElementById('timer-text').textContent,
    alarm: document.getElementById('alarm-text').textContent,
  }));
  // tools: press Q (smoke) and E (EMP) — counts must drop 2 -> 1
  await page.keyboard.press('q');
  await page.waitForTimeout(200);
  await page.keyboard.press('e');
  await page.waitForTimeout(200);
  const tools = await page.evaluate(() => ({
    smoke: window.__midnightVault.state.smokeLeft,
    emp: window.__midnightVault.state.empLeft,
    smokeUntil: window.__midnightVault.state.smokeUntil,
    empUntil: window.__midnightVault.state.empUntil,
  }));
  console.log(JSON.stringify({ phase0, phase1, x0, afterKeys, afterClick, hud, tools, errors }, null, 2));
  const ok = phase0 === 'title'
    && phase1 === 'playing'
    && afterKeys.x > x0 + 50
    && (afterClick.x > afterKeys.x || afterClick.y < afterKeys.y - 20)
    && tools.smoke === 1 && tools.emp === 1
    && tools.smokeUntil > 0 && tools.empUntil > 0
    && errors.length === 0;
  console.log(ok ? 'PLAYTEST PASS' : 'PLAYTEST FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('PLAYTEST_FAIL', e.message); process.exit(1); });
