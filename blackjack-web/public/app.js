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
        const response = await fetch('/api/start', { method: 'POST' });
        const data = await response.json();
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
    messageBoard.classList.remove('hidden', 'win', 'lose', 'tie');
    
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

// Écouteurs d'événements
btnNewGame.addEventListener('click', startNewGame);
btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);

// Lancer une partie au chargement initial
startNewGame();
