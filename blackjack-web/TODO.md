# TODO - Blackjack (Prêts & Pénalités)

- [ ] Comprendre où brancher la logique de prêt (popup client + endpoint serveur)
- [ ] Modifier `public/app.js` : popup confirmation avant appel de prêt
- [ ] Modifier `src/server.ts` : remplacer `/api/loan` par un endpoint acceptant la décision
- [ ] Modifier `src/server.ts` : ajouter tracking `consecutiveWins`, `penaltyRoundsRemaining` et application périodique -50
- [ ] Ajouter rafraîchissement solde côté client (poll sur `/api/stats/:sessionId`) pour refléter prélèvements auto
- [ ] Ajouter logique remboursement : après 10 parties jouées, si prêt souscrit => retirer (capital + intérêt 25%)
- [ ] Ajouter tests UI/UX (Playwright) pour les popups “Oui/Non” (via mock confirm si possible)

- [ ] Vérifier compilation et lancer les tests

