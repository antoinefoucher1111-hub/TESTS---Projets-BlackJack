// Ce fichier était utilisé pour Playwright, mais ne doit pas être exécuté via Jest.
// Déplacé dans : tests/ui-ux-blackjack.e2e.spec.ts
import { test, expect } from '@playwright/test';

import fs from 'fs';

const logPath = 'katalium/logs/playwright.txt';
function writeLog(line: string) {
  fs.mkdirSync('katalium/logs', { recursive: true });
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${line}\n`);
}

test.describe('Blackjack UI E2E', () => {
  test('should show dashboard modal when clicking dashboard button', async ({ page }) => {
    writeLog('Starting playwright test: dashboard visibility');
    await page.goto('http://localhost:3000/');
    await page.click('#btn-open-dashboard');
    await expect(page.locator('#dashboard-modal')).toBeVisible();
    writeLog('dashboard modal visible');
  });

  test('TU-03 presence on dashboard', async ({ page }) => {
    writeLog('Checking TU-03 label');
    await page.goto('http://localhost:3000/');
    await page.click('#btn-open-dashboard');
    await expect(page.locator('text=Post-Mortem TU-03')).toBeVisible();
    writeLog('TU-03 label found');
  });
});
