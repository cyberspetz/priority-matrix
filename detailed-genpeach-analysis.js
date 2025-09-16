const { chromium } = require('playwright');

async function analyzeGenPeachDetailed() {
  console.log('Starting detailed analysis...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to GenPeach.ai...');
    await page.goto('https://genpeach.ai/', { waitUntil: 'networkidle' });

    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Extract all JavaScript content related to fluid simulation
    const fluidCode = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      let fluidScript = '';

      scripts.forEach(script => {
        const content = script.innerHTML;
        if (content.includes('smoke') || content.includes('fluid') || content.includes('simulation') ||
            content.includes('canvas') || content.includes('webgl') || content.includes('gl') ||
            content.includes('shader') || content.includes('mouse')) {
          fluidScript += '--- SCRIPT SECTION ---\n' + content + '\n\n';
        }
      });

      return fluidScript;
    });

    console.log('Fluid simulation code found:');
    console.log(fluidCode.substring(0, 2000) + '...');

    // Get CSS related to canvas/simulation
    const canvasCSS = await page.evaluate(() => {
      const canvas = document.getElementById('smoke-sim');
      if (canvas) {
        const computedStyle = window.getComputedStyle(canvas);
        return {
          position: computedStyle.position,
          zIndex: computedStyle.zIndex,
          width: computedStyle.width,
          height: computedStyle.height,
          opacity: computedStyle.opacity,
          pointerEvents: computedStyle.pointerEvents,
          mixBlendMode: computedStyle.mixBlendMode,
          background: computedStyle.background
        };
      }
      return null;
    });

    console.log('Canvas CSS properties:', canvasCSS);

    // Test mouse interaction and record behavior
    console.log('Testing mouse interaction patterns...');

    // Move mouse slowly
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.mouse.move(200, 150);
    await page.waitForTimeout(500);

    // Move mouse quickly
    await page.mouse.move(400, 300);
    await page.waitForTimeout(100);
    await page.mouse.move(600, 400);
    await page.waitForTimeout(100);

    // Stop and observe fade
    await page.waitForTimeout(2000);

    // Check if there are any external libraries loaded
    const externalScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => script.src).filter(src =>
        src.includes('fluid') || src.includes('simulation') || src.includes('three') ||
        src.includes('webgl') || src.includes('particles')
      );
    });

    console.log('External fluid-related scripts:', externalScripts);

    await page.screenshot({ path: './genpeach-detailed.png' });

  } catch (error) {
    console.error('Error in detailed analysis:', error.message);
  } finally {
    await browser.close();
  }
}

analyzeGenPeachDetailed().catch(console.error);