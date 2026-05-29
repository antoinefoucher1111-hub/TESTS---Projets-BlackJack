// src/game.ts

export type Suit = 'Cœurs' | 'Carreaux' | 'Trèfles' | 'Piques';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    hidden?: boolean; // Pour la carte face cachée du croupier
}

export type GameStatus = 'playing' | 'playerWon' | 'dealerWon' | 'tie';

export class BlackjackGame {
    public deck: Card[] = [];
    public playerHand: Card[] = [];
    public dealerHand: Card[] = [];
    public status: GameStatus = 'playing';

    private forcedDrawOrder: Card[];

    constructor(forcedCards?: Card[]) {
        this.forcedDrawOrder = forcedCards ? [...forcedCards] : [];
        this.initializeDeck();
        this.dealInitialCards();
    }


    // Crée et mélange le paquet de 52 cartes (en respectant une séquence forcée optionnelle)
    private initializeDeck() {
        const suits: Suit[] = ['Cœurs', 'Carreaux', 'Trèfles', 'Piques'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        const fullDeck: Card[] = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                fullDeck.push({ suit, rank });
            }
        }

        // Retirer du paquet les cartes forcées (pour éviter les doublons impossibles)
        // Comparaison stricte suit+rank.
        const forcedToRemove = [...this.forcedDrawOrder];
        const remainingDeck: Card[] = [];
        for (const card of fullDeck) {
            const idx = forcedToRemove.findIndex(f => f.suit === card.suit && f.rank === card.rank);
            if (idx >= 0) {
                forcedToRemove.splice(idx, 1);
            } else {
                remainingDeck.push(card);
            }
        }

        // Mélanger les cartes restantes
        for (let i = remainingDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [remainingDeck[i], remainingDeck[j]] = [remainingDeck[j], remainingDeck[i]];
        }

        // IMPORTANT : drawCard() fait deck.pop(), donc pour obtenir un ordre exact des tirages,
        // on place les cartes forcées à la fin du tableau dans l'ordre attendu.
        // Exemple : forcedDrawOrder = [tirage1, tirage2] => deck = [...random..., tirage1, tirage2]
        this.deck = [...remainingDeck, ...this.forcedDrawOrder];
    }


    // Distribution initiale : 2 cartes chacun
    private dealInitialCards() {
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());
        
        // La deuxième carte du croupier est cachée
        const hiddenCard = this.drawCard();
        hiddenCard.hidden = true;
        this.dealerHand.push(hiddenCard);

        this.checkBlackjack();
    }

    private drawCard(): Card {
        return this.deck.pop()!;
    }

    // Calcule le score d'une main en gérant la valeur de l'As (1 ou 11)
    public calculateScore(hand: Card[]): number {
        let score = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.hidden) continue; // On ne compte pas la carte cachée

            if (['J', 'Q', 'K'].includes(card.rank)) {
                score += 10;
            } else if (card.rank === 'A') {
                score += 11;
                aces += 1;
            } else {
                score += parseInt(card.rank);
            }
        }

        // Réduction de la valeur des As si le score dépasse 21
        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }

        return score;
    }

    private checkBlackjack() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand.map(c => ({...c, hidden: false})));
        
        if (playerScore === 21) {
            this.revealDealerCard();
            this.status = dealerScore === 21 ? 'tie' : 'playerWon';
        }
    }

    // Le joueur tire une carte (Hit)
    public hit() {
        if (this.status !== 'playing') return;

        this.playerHand.push(this.drawCard());
        const score = this.calculateScore(this.playerHand);

        if (score > 21) {
            this.revealDealerCard();
            this.status = 'dealerWon'; // Le joueur a sauté (Bust)
        }
    }

    // Le joueur s'arrête, le croupier joue (Stand)
    public stand() {
        if (this.status !== 'playing') return;

        this.revealDealerCard();
        
        // Le croupier tire jusqu'à avoir au moins 17
        while (this.calculateScore(this.dealerHand) < 17) {
            this.dealerHand.push(this.drawCard());
        }

        this.determineWinner();
    }

    private revealDealerCard() {
        if (this.dealerHand[1]) {
            this.dealerHand[1].hidden = false;
        }
    }

    private determineWinner() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);

        if (dealerScore > 21 || playerScore > dealerScore) {
            this.status = 'playerWon';
        } else if (dealerScore > playerScore) {
            this.status = 'dealerWon';
        } else {
            this.status = 'tie';
        }
    }

    // Renvoie l'état du jeu pour le frontend
    public getState() {
        return {
            playerHand: this.playerHand,
            dealerHand: this.dealerHand,
            playerScore: this.calculateScore(this.playerHand),
            dealerScore: this.calculateScore(this.dealerHand),
            status: this.status
        };
    }
}
