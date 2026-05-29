import type { Card, Rank } from './game';

export type CheatMode =
  | 'none'
  | 'alwaysHitTo17Plus' // vise 17+ pour le joueur
  | 'alwaysWin' // force victoire (joueur >= 20, dealer <= 16)
  | 'forceBlackjack'; // force blackjack naturel

function rankToValue(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function scoreWithHiddenAces(hand: Card[]): number {
  // Ici les cartes ne sont pas hidden (on ne gère pas le croupier caché côté triche)
  let score = 0;
  let aces = 0;
  for (const c of hand) {
    const v = rankToValue(c.rank);
    if (c.rank === 'A') {
      score += 11;
      aces += 1;
    } else {
      score += v;
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  return score;
}

function makeCard(rank: Rank, suit: Card['suit']): Card {
  return { suit, rank };
}

export function applyCheat(
  mode: CheatMode,
  playerHand: Card[],
  dealerHand: Card[],
  bet: number,
  _seed?: string
): void {
  if (mode === 'none') return;

  // Remplace les mains par des valeurs compatibles avec Blackjack.
  // (Objectif: le joueur gagne quasi systématiquement.)
  const suits: Card['suit'][] = ['Cœurs', 'Carreaux', 'Trèfles', 'Piques'];
  const suit = suits[0];

  if (mode === 'forceBlackjack') {
    // Blackjack naturel: A + 10
    playerHand.length = 0;
    dealerHand.length = 0;

    playerHand.push(makeCard('A', suit));
    playerHand.push(makeCard('K', suit));

    // Dealer: 9 + 6 = 15, pas de 17+.
    dealerHand.push(makeCard('9', suit));
    dealerHand.push(makeCard('6', suit));
    return;
  }

  if (mode === 'alwaysWin') {
    // Joueur: 10 + 9 = 19 (ou 18/20 selon), dealer: 8 + 7 = 15.
    playerHand.length = 0;
    dealerHand.length = 0;

    playerHand.push(makeCard('10', suit));
    playerHand.push(makeCard('9', suit));

    dealerHand.push(makeCard('8', suit));
    // Variante dealer plus/moins agressive n'importe : on fixe une main faible
    dealerHand.push(makeCard('7', suit));


    return;
  }

  if (mode === 'alwaysHitTo17Plus') {
    // Laisse le gameplay mais pousse vers 17+ en pré-remplissant.
    // Joueur: 6 + 6 + (on considère que hit ajoute 5/7 via jeu, mais ici on force directement)
    playerHand.length = 0;
    dealerHand.length = 0;

    playerHand.push(makeCard('6', suit));
    playerHand.push(makeCard('6', suit));

    dealerHand.push(makeCard('8', suit));
    dealerHand.push(makeCard('7', suit));

    // Option: si le joueur est déjà à >=17, dealer suffisamment faible.
    const ps = scoreWithHiddenAces(playerHand);
    if (ps < 17) {
      // pousse à 17-20
      playerHand.push(makeCard('5', suit));
    }

    return;
  }
}

