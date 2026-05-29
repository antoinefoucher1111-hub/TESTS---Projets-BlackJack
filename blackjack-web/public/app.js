// public/app.js

let currentGameId = null;
let currentSessionId = null;
let currentBet = 50;
let gameActive = false;

const dealerCardsEl = document.getElementById('dealer-cards');
const playerCardsEl = document.getElementById('player-cards');
const dealerScoreEl = document.getElementById('dealer-score');
const playerScoreEl = document.getElementById('player-score');
const messageBoard = document.getElementById('message-board');
const balanceEl = document.getElementById('balance');
const btnLoan = document.getElementById('btn-loan');
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

const statWins = document.getElementById('stat-wins');
const statLosses = document.getElementById('stat-losses');
const statTies = document.getElementById('stat-ties');
const statWinrate = document.getElementById('stat-winrate');
const statTotalGames = document.getElementById('stat-total-games');
const statTotalBet = document.getElementById('stat-total-bet');
const statTotalWon = document.getElementById('stat-total-won');
const statProfit = document.getElementById('stat-profit');
const resultsHistory = document.getElementById('results-history');

const suitsSymbols = {
    'Cœurs': '♥',
    'Carreaux': '♦',
    'Trèfles': '♣',
    'Piques': '♠'
};

function checkLoanButton() {
    if (!btnLoan) return;
    // Bouton « Prêt » visible en permanence (h24)
    btnLoan.classList.remove('hidden');
}



if (btnLoan) {
    btnLoan.addEventListener('click', async () => {
        try {
            const decision = window.confirm(
                'Le prêt devra être remboursé à Antoine Foucher avec un taux à 25%\n\nOK pour demander le prêt (1000$)\nAnnuler pour refuser et être prélevé (10000$).'
            );

            const response = await fetch('/api/loan/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId, decision })
            });

            const data = await response.json();
            if (data.balance !== undefined) {
                balanceEl.textContent = data.balance;
                checkLoanButton();
            }


            // Messages exactement comme demandé (alignés serveur)
            if (decision === true) {
                window.alert('Prêt demandé : 1000$ (remboursement +25% après 10 parties).');
            } else {
                window.alert('Prêt refusé : prélèvement de 10000$');
            }

        } catch (e) {
            console.error(e);
        }
    });
}


btnPlaceBet.addEventListener('click', () => {
    const bet = parseInt(betInput.value, 10) || 50;
    if (bet < 10 || bet > 5000) {
        alert('La mise doit être entre 10€ et 5000€');
        return;
    }
    currentBet = bet;
    startNewGame(bet);
});

quickBets.forEach(btn => {
    btn.addEventListener('click', () => {
        currentBet = parseInt(btn.dataset.bet, 10);
        startNewGame(currentBet);
    });
});

btnHit.addEventListener('click', hit);
btnStand.addEventListener('click', stand);
btnNewGame.addEventListener('click', () => {
    gameSection.classList.add('game-section-hidden');
    bettingSection.style.display = 'block';
    gameActive = false;
});

async function startNewGame(bet) {
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bet, sessionId: currentSessionId })
        });
        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Erreur inconnue');
            return;
        }

        currentGameId = data.gameId;
        currentSessionId = data.sessionId;
        balanceEl.textContent = data.balance;
        checkLoanButton(data.balance);
        currentBetEl.textContent = bet;

        gameActive = true;
        bettingSection.style.display = 'none';
        gameSection.classList.remove('game-section-hidden');

        updateUI(data.state);
        btnHit.disabled = false;
        btnStand.disabled = false;
        messageBoard.className = 'message hidden';

        // Update stats slightly later so any auto-win shows in history
        setTimeout(loadStats, 400);
    } catch (error) {
        console.error('Erreur lors du démarrage du jeu :', error);
    }
}


async function hit() {
    if (!currentGameId || !gameActive) return;

    const response = await fetch(`/api/hit/${currentGameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
    });
    const data = await response.json();
    updateUI(data.state);
    
    if (data.state.status !== 'playing') {
        setTimeout(loadStats, 400);
    }
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
    setTimeout(loadStats, 400);
}


function updateUI(state) {
    dealerCardsEl.innerHTML = '';
    playerCardsEl.innerHTML = '';

    state.playerHand.forEach(card => {
        playerCardsEl.appendChild(createCardElement(card));
    });
    playerScoreEl.textContent = state.playerScore;

    state.dealerHand.forEach(card => {
        dealerCardsEl.appendChild(createCardElement(card));
    });
    dealerScoreEl.textContent = state.status === 'playing' ? '?' : state.dealerScore;

    const potentialWin = state.status === 'playing' ? currentBet * 2 : state.winAmount;
    potentialWinEl.textContent = potentialWin > 0 ? potentialWin : '0';

    if (state.status !== 'playing') {
        btnHit.disabled = true;
        btnStand.disabled = true;
        gameActive = false;
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
        messageBoard.textContent = 'Vous avez gagné ! 🎉';
        messageBoard.classList.add('win');
    } else if (status === 'dealerWon') {
        messageBoard.textContent = 'Le croupier a gagné. 💸';
        messageBoard.classList.add('lose');
    } else if (status === 'tie') {
        messageBoard.textContent = 'Égalité ! 🤝';
        messageBoard.classList.add('tie');
    }
}

async function loadStats() {
    if (!currentSessionId) return;

    try {
        const response = await fetch(`/api/stats/${currentSessionId}`);
        const stats = await response.json();

        balanceEl.textContent = stats.balance;
        checkLoanButton(stats.balance);

        statWins.textContent = stats.wins;
        statLosses.textContent = stats.losses;
        statTies.textContent = stats.ties;

        const winrate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        statWinrate.textContent = `${winrate}%`;
        statTotalGames.textContent = stats.totalGames;
        statTotalBet.textContent = `${stats.totalBet}€`;
        statTotalWon.textContent = `${stats.totalWon}€`;

        const profit = stats.totalWon - stats.totalBet;
        const profitRow = document.querySelector('.stat-row.profit span:first-child');
        
        if (profit >= 0) {
            if (profitRow) profitRow.textContent = 'Bénéfice net:';
            statProfit.textContent = `+${profit}€`;
            statProfit.style.color = '';
        } else {
            if (profitRow) profitRow.textContent = 'Perte nette:';
            statProfit.textContent = `${profit}€`;
            statProfit.style.color = '#e74c3c';
        }

        updateResultsHistory(stats.results);
    } catch (error) {
        console.error('Erreur lors du chargement des stats :', error);
    }
}

function updateResultsHistory(results) {
    resultsHistory.innerHTML = '';

    if (results.length === 0) {
        resultsHistory.innerHTML = '<div class="no-results">Aucune partie encore</div>';
        return;
    }

    results.slice().reverse().forEach(result => {
        const resultEl = document.createElement('div');
        resultEl.className = `result-item ${result.result}`;

        const resultLabel = getResultLabel(result.result);
        const amountDiff = result.winAmount - result.bet;
        const amountClass = amountDiff < 0 ? 'lost' : '';

        resultEl.innerHTML = `
            <div>
                <span class="result-badge ${result.result}">${resultLabel}</span>
                <span style="margin-left: 10px; font-size: 0.85rem; color: #bdc3c7;">
                    ${result.playerScore} vs ${result.dealerScore}
                </span>
            </div>
            <div style="text-align: right;">
                <div class="result-amount ${amountClass}">${amountDiff >= 0 ? '+' : ''}${amountDiff}€</div>
                <div style="font-size: 0.8rem; color: #95a5a6;">Mise: ${result.bet}€</div>
            </div>
        `;

        resultsHistory.appendChild(resultEl);
    });
}

function getResultLabel(status) {
    switch (status) {
        case 'playerWon': return 'Victoire';
        case 'dealerWon': return 'Défaite';
        case 'tie': return 'Égalité';
        default: return 'Indéfini';
    }
}

loadStats();

// Rafraîchissement périodique du solde (pour refléter les prélèvements automatiques)
setInterval(() => {
    if (!currentSessionId) return;
    loadStats();
}, 3000);

