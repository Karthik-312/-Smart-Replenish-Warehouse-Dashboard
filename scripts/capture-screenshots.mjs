import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs', 'screenshots');
const baseUrl =
  process.env.SCREENSHOT_URL ?? 'https://smart-replenish-warehouse-dashboard.vercel.app';

async function capture() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(8000);

  await page.screenshot({
    path: path.join(outDir, 'dashboard-overview.png'),
    fullPage: false,
  });

  await page.evaluate(() => {
    document.getElementById('section-charts')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outDir, 'dashboard-charts.png'),
    fullPage: false,
  });

  await page.evaluate(() => {
    document.getElementById('section-inventory')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outDir, 'inventory-list.png'),
    fullPage: false,
  });

  const allProducts = page.getByRole('button', { name: 'All products' });
  if (await allProducts.isVisible().catch(() => false)) {
    await allProducts.click();
    await page.waitForTimeout(1500);
  }

  await page.screenshot({
    path: path.join(outDir, 'inventory-filters.png'),
    fullPage: false,
  });

  await page.evaluate(() => {
    document.getElementById('section-overview')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(outDir, 'dashboard.png'),
    fullPage: true,
  });

  const addFormButton = page.getByRole('button', { name: /open form/i });
  if (await addFormButton.isVisible().catch(() => false)) {
    await addFormButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'add-item-form.png'), fullPage: false });
  }

  const searchInput = page.getByPlaceholder(/search by name/i);
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill('Furniture');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, 'search-filter.png'), fullPage: false });
  }

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
