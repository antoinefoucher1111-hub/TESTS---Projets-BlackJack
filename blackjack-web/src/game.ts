// src/game.ts

export type Suit = 'Cœurs' | 'Carreaux' | 'Trèfles' | 'Piques';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    hidden?: boolean; // Pour la carte face cachée du croupier
}

export type GameStatus = 'playing' | 'playerWon' | 'dealerWon' | 'tie';

export interface GameResult {
    bet: number;
    result: GameStatus;
    winAmount: number;
    timestamp: number;
    playerScore: number;
    dealerScore: number;
}

export class BlackjackGame {
    public deck: Card[] = [];
    public playerHand: Card[] = [];
    public dealerHand: Card[] = [];
    public status: GameStatus = 'playing';
    public bet: number = 0;

    constructor(bet: number = 0) {
        this.bet = bet;
        this.initializeDeck();
        this.dealInitialCards();
    }

    private initializeDeck() {
        const suits: Suit[] = ['Cœurs', 'Carreaux', 'Trèfles', 'Piques'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        for (const suit of suits) {
            for (const rank of ranks) {
                this.deck.push({ suit, rank });
            }
        }

        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    private dealInitialCards() {
        this.playerHand.push(this.drawCard());
        this.dealerHand.push(this.drawCard());
        this.playerHand.push(this.drawCard());

        const hiddenCard = this.drawCard();
        hiddenCard.hidden = true;
        this.dealerHand.push(hiddenCard);

        this.checkBlackjack();
    }

    private drawCard(): Card {
        return this.deck.pop()!;
    }

    public calculateScore(hand: Card[]): number {
        let score = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.hidden) continue;

            if (['J', 'Q', 'K'].includes(card.rank)) {
                score += 10;
            } else if (card.rank === 'A') {
                score += 11;
                aces += 1;
            } else {
                score += parseInt(card.rank, 10);
            }
        }

        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }

        return score;
    }

    private checkBlackjack() {
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand.map(c => ({ ...c, hidden: false })));

        if (playerScore === 21) {
            this.revealDealerCard();
            this.status = dealerScore === 21 ? 'tie' : 'playerWon';
        }
    }

    public hit() {
        if (this.status !== 'playing') return;

        // triche optionnelle : si un endpoint backend force un comportement,
        // on laisse le backend décider via l’état des cartes.
        this.playerHand.push(this.drawCard());
        const score = this.calculateScore(this.playerHand);

        if (score > 21) {
            this.revealDealerCard();
            this.status = 'dealerWon';
        }
    }


    public stand() {
        if (this.status !== 'playing') return;

        this.revealDealerCard();

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

    public getState() {
        return {
            playerHand: this.playerHand,
            dealerHand: this.dealerHand,
            playerScore: this.calculateScore(this.playerHand),
            dealerScore: this.calculateScore(this.dealerHand),
            status: this.status,
            bet: this.bet,
            winAmount: this.calculateWinAmount()
        };
    }

    private calculateWinAmount(): number {
        if (this.status === 'playing') return 0;

        const playerScore = this.calculateScore(this.playerHand);

        if (this.status === 'playerWon') {
            // Blackjack naturel : 2 cartes et score 21 => 2.5x (mise récupérée + 1.5x profit)
            if (this.playerHand.length === 2 && playerScore === 21) {
                return Math.round(this.bet * 2.5);
            }
            return this.bet * 2;
        }

        if (this.status === 'tie') {
            return this.bet;
        }

        // dealerWon => 0
        return 0;
    }
}

