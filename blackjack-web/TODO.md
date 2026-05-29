# TODO - Blackjack forced cards

- [ ] Modifier `src/game.ts` pour accepter une séquence optionnelle de cartes forcées lors de l’initialisation.
- [ ] Ajouter un parseur côté serveur pour convertir une string `AS,10C,7H` en cartes.
- [ ] Modifier `src/server.ts` endpoint `POST /api/start` pour recevoir et appliquer les cartes forcées.
- [ ] Modifier `public/index.html` pour ajouter un champ texte “Prochaines cartes”.
- [ ] Modifier `public/app.js` pour envoyer la string au backend lors de `Nouvelle Partie`.
- [ ] Ajouter un message UI en cas de saisie invalide.
- [ ] Tester manuellement : séquence respectée dans l’ordre, y compris carte cachée + Hit/Stand.

