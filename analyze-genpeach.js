const { chromium } = require('playwright');

async function analyzeGenPeach() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to GenPeach.ai...');
    await page.goto('https://genpeach.ai/', { waitUntil: 'networkidle' });

    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Capture HTML structure
    console.log('Analyzing page structure...');
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);

    // Look for canvas elements
    const canvasInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map(canvas => ({
        id: canvas.id,
        className: canvas.className,
        width: canvas.width,
        height: canvas.height,
        style: canvas.style.cssText
      }));
    });

    console.log('Canvas elements found:', canvasInfo);

    // Look for script tags that might contain fluid simulation
    const scripts = await page.evaluate(() => {
      const scriptTags = Array.from(document.querySelectorAll('script'));
      return scriptTags.map(script => ({
        src: script.src,
        hasContent: script.innerHTML.length > 0,
        containsFluid: script.innerHTML.includes('fluid') || script.innerHTML.includes('simulation') || script.innerHTML.includes('webgl')
      }));
    });

    console.log('Scripts analysis:', scripts.filter(s => s.containsFluid || s.src.includes('fluid') || s.src.includes('simulation')));

    // Test mouse interaction
    console.log('Testing mouse interaction...');
    await page.mouse.move(300, 300);
    await page.waitForTimeout(1000);
    await page.mouse.move(600, 400);
    await page.waitForTimeout(1000);
    await page.mouse.move(200, 500);
    await page.waitForTimeout(1000);

    // Take screenshot
    await page.screenshot({ path: './genpeach-analysis.png' });
    console.log('Screenshot saved to genpeach-analysis.png');

    // Check console logs
    page.on('console', msg => console.log('Browser console:', msg.text()));

  } catch (error) {
    console.error('Error analyzing GenPeach:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeGenPeach().catch(console.error);