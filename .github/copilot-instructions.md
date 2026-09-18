# Instructions GitHub Copilot

Les instructions de ce dépôt sont communes à tous les agents et vivent dans
[`../AGENTS.md`](../AGENTS.md). Lire ce fichier avant toute suggestion, puis
[`../docs/INDEX.md`](../docs/INDEX.md).

Points de vigilance pour la complétion automatique :

- Ne jamais suggérer `Math.random()` : utiliser le `Rng` injecté.
- Ne jamais importer `three` depuis `src/core`, `src/rules` ou `src/tactical`.
- Les chaînes affichées au joueur sont en français ; le code et les identifiants en anglais.
- Les difficultés de jets viennent de la constante `DV`, jamais d'un nombre écrit en dur.
