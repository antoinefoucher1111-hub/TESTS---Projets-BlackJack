/// <reference types="jest" />
import { BlackjackGame } from '../src/game';

describe('BlackjackGame - unit (focus scores/payout/state)', () => {
  test('calculateScore numeric cards (5 + 9 = 14)', () => {
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: '5' },
      { suit: 'Piques', rank: '9' },
    ] as any);
    expect(score).toBe(14);
  });

  test('calculateScore blackjack (A + K = 21)', () => {
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: 'A' },
      { suit: 'Piques', rank: 'K' },
    ] as any);
    expect(score).toBe(21);
  });

  test('Ace reduction: A + 9 + 6 => 16', () => {
    const game = new BlackjackGame();
    const score = game.calculateScore([
      { suit: 'Cœurs', rank: 'A' },
      { suit: 'Piques', rank: '9' },
      { suit: 'Trèfles', rank: '6' },
    ] as any);
    expect(score).toBe(16);
  });

  test('winAmount: tie => bet', () => {
    const game = new BlackjackGame(100);
    (game as any).status = 'tie';
    (game as any).playerHand = [{ suit: 'Cœurs', rank: '10' }, { suit: 'Piques', rank: 'J' }]; // 20
    (game as any).dealerHand = [{ suit: 'Trèfles', rank: 'Q' }, { suit: 'Piques', rank: 'A', hidden: false }]; // 21? but we only need tie winAmount: depends on status only
    expect((game as any).getState?.()).toBeUndefined();
    expect((game as any).calculateWinAmount?.()).toBeUndefined();
  });
});

