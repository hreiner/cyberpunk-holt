# CLAUDE.md

Les instructions de ce dépôt sont communes à tous les agents et vivent dans
[`AGENTS.md`](AGENTS.md). **Lire ce fichier en premier**, puis
[`docs/INDEX.md`](docs/INDEX.md).

Rappel des règles les plus faciles à enfreindre par inadvertance :

1. Pas de `Math.random()` dans `src/` — tout passe par le `Rng` seedé.
2. `src/core`, `src/rules`, `src/tactical` n'importent ni `three` ni le DOM.
3. Les textes joueur sont en français, le code en anglais.
4. `npm run verify` doit passer avant de committer.
5. Une décision structurante = un ADR dans `docs/process/adr/`.
