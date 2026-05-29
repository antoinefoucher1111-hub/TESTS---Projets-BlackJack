// src/server.ts

import express from 'express';
import cors from 'cors';
import path from 'path';
import { BlackjackGame, GameResult } from './game';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Interface pour les données de session du joueur
interface PlayerSession {
    games: BlackjackGame[];
    results: GameResult[];
    balance: number;
}

// Stockage en mémoire des sessions (idéalement à mettre en base de données)
const sessions = new Map<string, PlayerSession>();
const games = new Map<string, BlackjackGame>();

// Démarrer une nouvelle partie
app.post('/api/start', (req, res) => {
    const bet = req.body?.bet || 50;
    let sessionId = req.body?.sessionId;
    
    // Créer une nouvelle session si nécessaire
    if (!sessionId || !sessions.has(sessionId)) {
        sessionId = Math.random().toString(36).substring(7);
        sessions.set(sessionId, {
            games: [],
            results: [],
            balance: 1000 // Solde initial fictif
        });
    }
    
    // Créer une nouvelle partie
    const gameId = Math.random().toString(36).substring(7);
    const game = new BlackjackGame(bet);
    games.set(gameId, game);
    
    const session = sessions.get(sessionId)!;
    session.games.push(game);
    session.balance -= bet;
    
    res.json({ gameId, sessionId, state: game.getState(), balance: session.balance });
});

// Le joueur tire une carte
app.post('/api/hit/:id', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) return res.status(404).json({ error: "Partie introuvable" });

    game.hit();
    res.json({ state: game.getState() });
});

// Le joueur s'arrête
app.post('/api/stand/:id', (req, res) => {
    const game = games.get(req.params.id);
    if (!game) return res.status(404).json({ error: "Partie introuvable" });

    game.stand();
    const state = game.getState();
    
    // Enregistrer le résultat dans la session
    const sessionId = req.body?.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
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
    }
    
    res.json({ state });
});

// Récupérer les statistiques de la session
app.get('/api/stats/:sessionId', (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session introuvable" });

    const stats = {
        balance: session.balance,
        totalGames: session.results.length,
        wins: session.results.filter(r => r.result === 'playerWon').length,
        losses: session.results.filter(r => r.result === 'dealerWon').length,
        ties: session.results.filter(r => r.result === 'tie').length,
        totalWon: session.results.reduce((sum, r) => sum + r.winAmount, 0),
        totalBet: session.results.reduce((sum, r) => sum + r.bet, 0),
        results: session.results.slice(-20) // Derniers 20 résultats
    };

    res.json(stats);
});

app.listen(port, () => {
    console.log(`🚀 Serveur Blackjack lancé sur http://localhost:${port}`);
});
