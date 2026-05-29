import { test, expect } from '@playwright/test';

const logPath = 'katalium/logs/playwright.txt';
function writeLog(line: string) {
  // Évite les soucis de types Node quand Jest/TS ne sont pas configurés pareil.
  // Playwright tourne dans un environnement Node.
  const fs = require('fs') as typeof import('fs');
  fs.mkdirSync('katalium/logs', { recursive: true });
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${line}\n`);
}

test.describe('Blackjack UI E2E', () => {
  test('should load the game and allow placing a bet', async ({ page }) => {
    writeLog('Checking basic game load and bet');

    await page.goto('http://localhost:3000/');

    // Start a game via placing a bet
    await page.fill('#bet-input', '50');
    await page.click('#btn-place-bet');

    // Hit should be enabled after start
    await expect(page.locator('#btn-hit')).toBeEnabled();
    await expect(page.locator('#player-score')).toBeVisible();
  });
});
