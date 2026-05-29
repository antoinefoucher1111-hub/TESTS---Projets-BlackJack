// src/server.ts

import express from 'express';
import cors from 'cors';
import path from 'path';
import { BlackjackGame, GameResult } from './game';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

interface LoanState {
    subscribed: boolean;
    principal: number;
}

interface PlayerSession {
    games: BlackjackGame[];
    results: GameResult[];
    balance: number;

    // bonus/malus supprimés: aucun tracking spécifique requis


    loan: LoanState;
    totalGamesSinceLoan: number; // parties jouées depuis souscription
}


const sessions = new Map<string, PlayerSession>();
const games = new Map<string, BlackjackGame>();

function finalizeGameIfNeeded(session: PlayerSession, game: BlackjackGame) {
    if (game.status === 'playing') return;

    if ((game as any).isFinalized) return;
    (game as any).isFinalized = true;

    const state = game.getState();
    const result: GameResult = {
        bet: game.bet,
        result: game.status,
        winAmount: state.winAmount,
        timestamp: Date.now(),
        playerScore: state.playerScore,
        dealerScore: state.dealerScore
    };

    session.results.push(result);
    session.balance += state.winAmount;



    // Tracking remboursement prêt : on compte chaque partie finalisée
    if (session.loan.subscribed) {
        session.totalGamesSinceLoan += 1;
        applyLoanRepaymentIfDue(session);
    }
}


app.post('/api/start', (req, res) => {
    const bet = req.body?.bet || 50;
    let sessionId = req.body?.sessionId;

    if (!sessionId || !sessions.has(sessionId)) {
        sessionId = Math.random().toString(36).substring(7);
        sessions.set(sessionId, {
            games: [],
            results: [],
            balance: 1000,



            loan: { subscribed: false, principal: 0 },
            totalGamesSinceLoan: 0
        });

    }

    const session = sessions.get(sessionId)!;
    
    if (session.balance < bet) {
        return res.status(400).json({ error: 'Solde insuffisant' });
    }

    const gameId = Math.random().toString(36).substring(7);
    const game = new BlackjackGame(bet);
    games.set(gameId, game);

    session.games.push(game);
    session.balance -= bet;

    finalizeGameIfNeeded(session, game);

    res.json({ gameId, sessionId, state: game.getState(), balance: session.balance });
});

app.post('/api/hit/:id', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) return res.status(404).json({ error: 'Partie introuvable' });

    game.hit();
    
    const sessionId = req.body?.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        finalizeGameIfNeeded(session, game);
    }
    
    res.json({ state: game.getState() });
});

app.post('/api/stand/:id', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) return res.status(404).json({ error: 'Partie introuvable' });

    game.stand();
    
    const sessionId = req.body?.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        finalizeGameIfNeeded(session, game);
    }

    res.json({ state: game.getState() });
});

interface LoanState {
    subscribed: boolean;
    principal: number; // capital prêt
}

function applyLoanRepaymentIfDue(session: PlayerSession) {
    if (!session.loan.subscribed) return;

    // Après 10 parties jouées
    if (session.totalGamesSinceLoan >= 10) {
        const interestRate = 0.25;
        const totalToPay = Math.round(session.loan.principal * (1 + interestRate));
        session.balance -= totalToPay;
        session.loan.subscribed = false;
        session.loan.principal = 0;
        session.totalGamesSinceLoan = 0;
    }
}

app.post('/api/loan/confirm', (req, res) => {
    const sessionId = req.body?.sessionId;
    const decision = req.body?.decision;

    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(404).json({ error: 'Session introuvable' });
    }

    const session = sessions.get(sessionId)!;

    if (decision === true) {
        const principal = 1000;
        const newBalance = session.balance + principal;
        // Si le joueur n’a pas assez pour "absorber" le prêt (cas limite), on refuse.
        if (newBalance < 0) {
            return res.status(400).json({ error: 'Solde insuffisant' });
        }

        session.balance = newBalance;
        session.loan = { subscribed: true, principal };
        session.totalGamesSinceLoan = 0;
        return res.json({ balance: session.balance, loan: session.loan });
    }

    if (decision === false) {
        const amount = 10000;
        const newBalance = session.balance - amount;
        // Refuser si ça passe le solde dans le négatif.
        if (newBalance < 0) {
            return res.status(400).json({ error: 'Solde insuffisant' });
        }

        session.balance = newBalance;
        return res.json({ balance: session.balance, loan: session.loan });
    }


    return res.status(400).json({ error: 'Decision invalide' });
});


app.get('/api/stats/:sessionId', (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session introuvable' });


    const stats = {
        balance: session.balance,
        totalGames: session.results.length,
        wins: session.results.filter(r => r.result === 'playerWon').length,
        losses: session.results.filter(r => r.result === 'dealerWon').length,
        ties: session.results.filter(r => r.result === 'tie').length,
        totalWon: session.results.reduce((sum, r) => sum + r.winAmount, 0),
        totalBet: session.results.reduce((sum, r) => sum + r.bet, 0),
        results: session.results.slice(-20)
    };

    res.json(stats);
});






app.listen(port, () => {
    console.log(`🚀 Serveur Blackjack lancé sur http://localhost:${port}`);
});



