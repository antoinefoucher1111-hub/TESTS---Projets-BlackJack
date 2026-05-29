// public/app.js

let currentGameId = null;
let currentSessionId = null;
let currentBet = 50;
let gameActive = false;

// Éléments du DOM
const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageBoard = document.getElementById('message-board');
const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet');
const potentialWinEl = document.getElementById('potential-win');

const bettingSection = document.getElementById('betting-section');
const gameSection = document.getElementById('game-section');
const betInput = document.getElementById('bet-input');
const btnPlaceBet = document.getElementById('btn-place-bet');
const quickBets = document.querySelectorAll('.quick-bet');

const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const btnNewGame = document.getElementById('btn-new-game');

// Statistiques
const statWins = document.getElementById('stat-wins');
const statLosses = document.getElementById('stat-losses');
const statTies = document.getElementById('stat-ties');
const statWinrate = document.getElementById('stat-winrate');
const statTotalGames = document.getElementById('stat-total-games');
const statTotalBet = document.getElementById('stat-total-bet');
const statTotalWon = document.getElementById('stat-total-won');
const statProfit = document.getElementById('stat-profit');
const resultsHistory = document.getElementById('results-history');

// Symboles pour l'affichage
const suitsSymbols = {
    'Cœurs': '♥',
    'Carreaux': '♦',
    'Trèfles': '♣',
    'Piques': '♠'
};

// --- Gestion des mises ---

btnPlaceBet.addEventListener('click', () => {
    const bet = parseInt(betInput.value) || 50;
    if (bet < 10 || bet > 5000) {
        alert('La mise doit être entre 10€ et 5000€');
        return;
    }
    currentBet = bet;
    startNewGame(bet);
});

quickBets.forEach(btn => {
    btn.addEventListener('click', () => {
        currentBet = parseInt(btn.dataset.bet);
        startNewGame(currentBet);
    });
});

// --- Appels à l'API Backend ---

async function startNewGame(bet) {
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet, sessionId: currentSessionId })
        });
        const data = await response.json();
        
        currentGameId = data.gameId;
        currentSessionId = data.sessionId;
        
        balanceEl.textContent = data.balance;
        currentBetEl.textContent = bet;
        
        gameActive = true;
        bettingSection.style.display = 'none';
        gameSection.classList.remove('game-section-hidden');
        
        updateUI(data.state);
        
        btnHit.disabled = false;
        btnStand.disabled = false;
        messageBoard.className = 'message hidden';
    } catch (error) {
        console.error("Erreur lors du démarrage du jeu :", error);
    }
}

async function hit() {
    if (!currentGameId || !gameActive) return;
    const response = await fetch(`/api/hit/${currentGameId}`, { method: 'POST' });
    const data = await response.json();
    updateUI(data.state);
}

async function stand() {
    if (!currentGameId || !gameActive) return;
    const response = await fetch(`/api/stand/${currentGameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
    });
    const data = await response.json();
    updateUI(data.state);
    
    // Charger les statistiques après la fin de la partie
    setTimeout(loadStats, 500);
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
    dealerScoreEl.textContent = state.status === 'playing' ? '?' : state.dealerScore;

    // Afficher le gain potentiel
    if (state.winAmount > 0) {
        potentialWinEl.textContent = state.winAmount;
    } else {
        potentialWinEl.textContent = '0';
    }

    // Gestion de la fin de partie
    if (state.status !== 'playing') {
        btnHit.disabled = true;
        btnStand.disabled = true;
        gameActive = false;
        
        // Afficher le message de fin
        showMessage(state.status);
        
        // Afficher le résultat avec le montant
        setTimeout(() => {
            displayGameResult(state);
        }, 1000);
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
        messageBoard.textContent = "Le croupier a gagné.  💸";
        messageBoard.classList.add('lose');
    } else if (status === 'tie') {
        messageBoard.textContent = "Égalité ! 🤝";
        messageBoard.classList.add('tie');
    }
}

function displayGameResult(state) {
    let resultText = '';
    let resultClass = 'tie';
    
    if (state.status === 'playerWon') {
        resultText = `Vous avez remporté ${state.winAmount}€ !`;
        resultClass = 'win';
    } else if (state.status === 'dealerWon') {
        resultText = `Vous avez perdu ${currentBet}€.`;
        resultClass = 'lose';
    } else if (state.status === 'tie') {
        resultText = `Égalité : Remboursement de ${currentBet}€.`;
        resultClass = 'tie';
    }
    
    console.log(resultText);
}

// --- Statistiques ---

async function loadStats() {
    if (!currentSessionId) return;
    
    try {
        const response = await fetch(`/api/stats/${currentSessionId}`);
        const stats = await response.json();
        
        // Mettre à jour les statistiques
        statWins.textContent = stats.wins;
        statLosses.textContent = stats.losses;
        statTies.textContent = stats.ties;
        
        const winrate = stats.totalGames > 0 
            ? Math.round((stats.wins / stats.totalGames) * 100)
            : 0;
        statWinrate.textContent = winrate + '%';
        
        statTotalGames.textContent = stats.totalGames;
        statTotalBet.textContent = stats.totalBet + '€';
        statTotalWon.textContent = stats.totalWon + '€';
        
        const profit = stats.totalWon - stats.totalBet;
        statProfit.textContent = (profit >= 0 ? '+' : '') + profit + '€';
        
        // Mettre à jour l'historique
        updateResultsHistory(stats.results);
    } catch (error) {
        console.error("Erreur lors du chargement des stats :", error);
    }
}

function updateResultsHistory(results) {
    resultsHistory.innerHTML = '';
    
    if (results.length === 0) {
        resultsHistory.innerHTML = '<div class="no-results">Aucune partie encore</div>';
        return;
    }
    
    // Afficher les résultats en ordre inverse (plus récents en haut)
    results.reverse().forEach(result => {
        const resultEl = document.createElement('div');
        resultEl.className = `result-item ${result.result}`;
        
        const resultLabel = getResultLabel(result.result);
        const amountClass = result.winAmount > result.bet ? '' : 'lost';
        const amountDiff = result.winAmount - result.bet;
        
        resultEl.innerHTML = `
            <div>
                <span class="result-badge ${result.result}">${resultLabel}</span>
                <span style="margin-left: 10px; font-size: 0.85rem;">
                    ${result.playerScore} vs ${result.dealerScore}
                </span>
            </div>
            <div style="text-align: right;">
                <div class="result-amount ${amountClass}">
                    ${amountDiff >= 0 ? '+' : ''}${amountDiff}€
                </div>
                <div style="font-size: 0.8rem; color: #95a5a6;">Mise: ${result.bet}€</div>
            </div>
        `;
        
        resultsHistory.appendChild(resultEl);
    });
}

function getResultLabel(status) {
    switch(status) {
        case 'playerWon': return 'Victoire';
        case 'dealerWon': return 'Défaite';
        case 'tie': return 'Égalité';
        default: return 'Indéfini';
    }
}

// Écouteurs d'événements
btnNewGame.addEventListener('click', () => {
    gameSection.classList.add('game-section-hidden');
    bettingSection.style.display = 'block';
    gameActive = false;
});

btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);

// Initialisation
loadStats();
