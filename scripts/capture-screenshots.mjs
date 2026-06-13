import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const baseUrl = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

async function capture() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, 'dashboard.png'), fullPage: true });

  const addFormButton = page.getByRole('button', { name: /open form/i });
  if (await addFormButton.isVisible()) {
    await addFormButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'add-item-form.png'), fullPage: true });
  }

  const searchInput = page.getByPlaceholder(/search by name/i);
  if (await searchInput.isVisible()) {
    await searchInput.fill('Electronics');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'search-filter.png'), fullPage: true });
  }

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
