const { chromium } = require('playwright');

async function takeScreenshot() {
  console.log('Starting browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Setting viewport...');
  await page.setViewportSize({ width: 1200, height: 800 });

  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log('Waiting for content to load...');
    await page.waitForSelector('.grid.grid-cols-2', { timeout: 10000 });

    console.log('Taking screenshot...');
    await page.screenshot({
      path: './docs/screenshot.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });

    console.log('Screenshot saved to ./docs/screenshot.png');
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot().catch(console.error);