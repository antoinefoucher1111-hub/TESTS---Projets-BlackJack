// public/app.js

let currentGameId = null;

// Éléments du DOM
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageBoard = document.getElementById('message-board');

const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnNewGame = document.getElementById('btn-new-game');
const forcedCardsInput = document.getElementById('forced-cards-input');

const forcedCardsStorageKey = 'blackjack_forced_cards_input';
if (forcedCardsInput) {
    try {
        forcedCardsInput.value = localStorage.getItem(forcedCardsStorageKey) ?? '';
    } catch (e) {
        // ignore
    }

    forcedCardsInput.addEventListener('input', () => {
        try {
            localStorage.setItem(forcedCardsStorageKey, forcedCardsInput.value);
        } catch (e) {
            // ignore
        }
    });
}




// Symboles pour l'affichage
const suitsSymbols = {
    'Cœurs': '♥',
    'Carreaux': '♦',
    'Trèfles': '♣',
    'Piques': '♠'
};

// --- Appels à l'API Backend ---

async function startNewGame() {
    try {
        const forcedCardsText = forcedCardsInput ? forcedCardsInput.value : '';

        // Si l'utilisateur n'a rien entré, on refuse de lancer (pas de cartes par défaut)
        const trimmed = (forcedCardsText ?? '').trim();
        if (!trimmed) {
            showError('Tu dois choisir les cartes forcées avant de démarrer. Format: AS,10C,7H');
            return;
        }


        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forcedCardsText })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Erreur de validation des cartes forcées');
            return;
        }

        currentGameId = data.gameId;
        updateUI(data.state);

        btnHit.disabled = false;
        btnStand.disabled = false;
        messageBoard.className = 'message hidden';
    } catch (error) {
        console.error("Erreur lors du démarrage du jeu :", error);
    }
}


async function hit() {
    if (!currentGameId) return;
    const response = await fetch(`/api/hit/${currentGameId}`, { method: 'POST' });
    const data = await response.json();
    updateUI(data.state);
}

async function stand() {
    if (!currentGameId) return;
    const response = await fetch(`/api/stand/${currentGameId}`, { method: 'POST' });
    const data = await response.json();
    updateUI(data.state);
}

// --- Mise à jour de l'interface ---

function updateUI(state) {
    // Vider les tables
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';

    // Afficher les cartes du Joueur
    state.playerHand.forEach(card => {
        playerCardsEl.appendChild(createCardElement(card));
    });
    playerScoreEl.textContent = state.playerScore;

    // Afficher les cartes du Croupier
    state.dealerHand.forEach(card => {
        dealerCardsEl.appendChild(createCardElement(card));
    });
    // On n'affiche pas le score exact du croupier tant que la partie est en cours
    dealerScoreEl.textContent = state.status === 'playing' ? '?' : state.dealerScore;

    // Gestion de la fin de partie
    if (state.status !== 'playing') {
        btnHit.disabled = true;
        btnStand.disabled = true;
        showMessage(state.status);
    }
}

function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    
    if (card.hidden) {
        div.classList.add('hidden');
        return div;
    }

    const isRed = card.suit === 'Cœurs' || card.suit === 'Carreaux';
    div.classList.add(isRed ? 'red' : 'black');
    
    div.innerHTML = `${card.rank} <br> ${suitsSymbols[card.suit]}`;
    return div;
}

function showMessage(status) {
    messageBoard.classList.remove('hidden', 'win', 'lose', 'tie', 'error');
    
    if (status === 'playerWon') {
        messageBoard.textContent = "Vous avez gagné ! 🎉";
        messageBoard.classList.add('win');
    } else if (status === 'dealerWon') {
        messageBoard.textContent = "Le croupier a gagné. 💸";
        messageBoard.classList.add('lose');
    } else if (status === 'tie') {
        messageBoard.textContent = "Égalité ! 🤝";
        messageBoard.classList.add('tie');
    }
}

function showError(message) {
    messageBoard.classList.remove('hidden', 'win', 'lose', 'tie');
    messageBoard.classList.add('error');
    messageBoard.textContent = message;
    btnHit.disabled = true;
    btnStand.disabled = true;
}


// Écouteurs d'événements
btnNewGame.addEventListener('click', startNewGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);

// Désactiver hit/stand tant qu'aucune partie n'a été lancée
btnHit.disabled = true;
btnStand.disabled = true;


// Ne pas lancer automatiquement : l'utilisateur doit choisir les cartes et cliquer "Nouvelle Partie".
// startNewGame();

const btnSaveForced = document.getElementById('btn-save-forced');
if (btnSaveForced && forcedCardsInput) {
    btnSaveForced.addEventListener('click', () => {
        try {
            localStorage.setItem(forcedCardsStorageKey, forcedCardsInput.value ?? '');
            showMessage('Choix sauvegardé ✅');
        } catch (e) {
            showError('Impossible de sauvegarder vos choix dans le navigateur.');
        }
    });
}


