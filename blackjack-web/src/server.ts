// src/server.ts

import express from 'express';
import cors from 'cors';
import path from 'path';
import { BlackjackGame } from './game';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Stockage en mémoire des parties actives (idéalement à mettre en base de données)
const games = new Map<string, BlackjackGame>();

// Démarrer une nouvelle partie
app.post('/api/start', (req, res) => {
    const gameId = Math.random().toString(36).substring(7); // Génère un ID unique simple
    const game = new BlackjackGame();
    games.set(gameId, game);
    
    res.json({ gameId, state: game.getState() });
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
    res.json({ state: game.getState() });
});

app.listen(port, () => {
    console.log(`🚀 Serveur Blackjack lancé sur http://localhost:${port}`);
});
