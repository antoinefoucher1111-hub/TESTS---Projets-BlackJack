/*/// <reference types="jest" />
import { BlackjackGame } from './game';
import fs from 'fs';

const logPath = 'katalium/logs/jest-tests.txt';
function writeLog(line: string) {
  fs.mkdirSync('katalium/logs', { recursive: true });
  fs.appendFileSync(logPath, `${new Date().toISOString()} - ${line}\n`);
}

describe('BlackjackGame (unit)', () => {
  test('calculates numeric cards', () => {
    writeLog('Start test: numeric cards');
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: '5' },
      { suit: 'Piques', rank: '9' }
    ] as any);

    writeLog(`Scores: ${score}`);
    expect(score).toBe(14);
    writeLog('End test: numeric cards');
  });

  test('TU-03 Ace reduction (intentional bug should fail)', () => {
    writeLog('Start test: TU-03 Ace reduction');
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: 'A' },
      { suit: 'Piques', rank: '9' },
      { suit: 'Trèfles', rank: '6' }
    ] as any);

    writeLog(`Calculated score: ${score} (expected 16)`);
    expect(score).toBe(16);
    writeLog('End test: TU-03');
  });

  test('blackjack detection', () => {
    writeLog('Start test: blackjack detection');
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: 'A' },
      { suit: 'Piques', rank: 'K' }
    ] as any);

    writeLog(`Blackjack score: ${score}`);
    expect(score).toBe(21);
    writeLog('End test: blackjack detection');
  });
});
*/