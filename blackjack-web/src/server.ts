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

type ForcedCardDto = { suit: 'Cœurs' | 'Carreaux' | 'Trèfles' | 'Piques'; rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' };

function parseForcedCardsText(forcedCardsText: unknown): ForcedCardDto[] {
    if (typeof forcedCardsText !== 'string') return [];

    const raw = forcedCardsText.trim();
    if (!raw) return [];

    // Format accepté : AS,10C,7H (séparateur virgule)
    // - dernier caractère = suit: S/H/D/C
    // - tout ce qui précède = rank: A,2-10,J,Q,K
    const tokens = raw.split(',').map(t => t.trim()).filter(Boolean);

    const allowedSuits = new Map<string, ForcedCardDto['suit']>([
        ['S', 'Piques'],
        ['H', 'Cœurs'],
        ['D', 'Carreaux'],
        ['C', 'Trèfles'],
    ]);

    const allowedRanks = new Set(['2','3','4','5','6','7','8','9','10','J','Q','K','A']);

    const result: ForcedCardDto[] = [];
    for (const tok of tokens) {
        if (tok.length < 2) throw new Error(`Carte invalide: "${tok}"`);
        const suitLetter = tok[tok.length - 1].toUpperCase();
        const rankPart = tok.slice(0, -1).toUpperCase();

        const suit = allowedSuits.get(suitLetter);
        if (!suit) throw new Error(`Suit invalide: "${suitLetter}" (carte: "${tok}")`);

        const rank = rankPart as ForcedCardDto['rank'];
        if (!allowedRanks.has(rankPart)) throw new Error(`Rank invalide: "${rankPart}" (carte: "${tok}")`);

        result.push({ suit, rank });
    }

    return result;
}

// Démarrer une nouvelle partie
app.post('/api/start', (req, res) => {
    try {
        const gameId = Math.random().toString(36).substring(7); // Génère un ID unique simple

        const forcedCardsText = (req.body && (req.body.forcedCardsText ?? req.body.forcedCards)) as unknown;
        const forcedCardsDto = parseForcedCardsText(forcedCardsText);

        if (forcedCardsDto.length > 0) {
            // Refuser les doublons de cartes forcées (impossible avec un deck standard)
            const keySet = new Set<string>();
            for (const c of forcedCardsDto) {
                const key = `${c.suit}-${c.rank}`;
                if (keySet.has(key)) {
                    return res.status(400).json({ error: `Carte forcée dupliquée: ${c.rank} ${c.suit}` });
                }
                keySet.add(key);
            }
        }

        const game = new BlackjackGame(forcedCardsDto);
        games.set(gameId, game);

        res.json({ gameId, state: game.getState() });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de parsing cartes forcées';
        return res.status(400).json({ error: message });
    }
});


// Le joueur tire une carte
app.post('/api/hit/:id', (req: any, res: any) => {
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
