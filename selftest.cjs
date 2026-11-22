// Run the in-page self-test (?selftest=1) headlessly and print the result.
// Requires `node serve.ts` (port 8080). Exit 0 only when 12/12 pass.
const { chromium } = require('/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/cft-dl/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://localhost:8080/?selftest=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__selftest !== undefined, null, { timeout: 30000 });
  const result = await page.evaluate(() => window.__selftest);
  console.log(JSON.stringify(result, null, 2));
  console.log('PAGEERRORS', JSON.stringify(errors));
  const ok = result.passed === result.total && errors.length === 0;
  console.log(ok ? 'SELFTEST PASS' : 'SELFTEST FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error('SELFTEST_FAIL', e.message); process.exit(1); });
