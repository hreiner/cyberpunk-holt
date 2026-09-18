# AGENTS.md — contrat de travail pour tout agent IA

> Ce fichier est le point d'entrée **unique** pour Claude Code, Codex, Cursor, Copilot ou
> tout autre agent qui travaille sur ce dépôt. `CLAUDE.md` et
> `.github/copilot-instructions.md` ne font que pointer ici.
>
> **Le dépôt est autosuffisant.** Tout ce qui est nécessaire pour continuer le projet est
> dans `docs/`. Il n'y a aucun contexte externe à aller chercher, aucune conversation à
> retrouver. Si une information manque, elle doit être **ajoutée à `docs/`**, pas gardée
> en tête.

## 1. Le projet en cinq lignes

Jeu de rôle cyberpunk jouable dans le navigateur, adapté d'une campagne de jeu de rôle sur
table (Cyberpunk RED). Le joueur incarne **Franklyn**, cadet de 17 ans à l'académie de
police HOLT, perdue dans les Badlands de Night City. Le **chapitre 1** couvre le dernier
jour avant la remise des diplômes : examen écrit, exercice tactique, bal de promo.
Projet personnel, non commercial, développé chapitre par chapitre avec une boucle agentique.

Lecture obligatoire avant de coder : [`docs/INDEX.md`](docs/INDEX.md).

## 2. Où l'on en est

| | |
|---|---|
| **Epic en cours** | Epic 1 — socle technique + phase tactique finale |
| **Epic suivant** | Epic 2 — contenu narratif du chapitre 1 |
| **État** | Epic 1 jouable de bout en bout avec des personnages « capsules » |
| **Détail** | [`docs/process/ROADMAP.md`](docs/process/ROADMAP.md) |

## 3. Les huit règles à ne pas enfreindre

1. **Aucun `Math.random()` dans `src/`.** Tout l'aléatoire passe par un `Rng` seedé
   explicitement transmis (`src/core/rng.ts`). C'est ce qui rend les parties rejouables et
   les tests stables. Un test d'architecture le vérifie.
2. **`src/core`, `src/rules` et `src/tactical` n'importent jamais `three` ni le DOM.**
   La logique de jeu doit tourner dans Node, sans navigateur. Vérifié par un test.
3. **Une action illégale ne lève jamais d'exception.** `TacticalCombat.perform()` renvoie
   `{ ok: false, reason }` avec une raison en français affichable telle quelle.
4. **Les valeurs de règles sont des constantes nommées et exportées**, jamais des nombres
   magiques dans une condition. Les DV viennent de `DV` dans `src/rules/attributes.ts`.
5. **Tout texte affiché au joueur est en français**, écrit directement dans les données
   (pas d'i18n, décision assumée — voir ADR 0006). Le code, les identifiants, les noms de
   fichiers et les commits sont en anglais.
6. **Le contenu équilibrable vit en données, pas en code** : `src/data/characters.json`
   pour les fiches, `src/data/yard-map.ts` pour le terrain.
7. **Toute décision structurante donne lieu à un ADR** dans `docs/process/adr/`, numéroté,
   court, avec le contexte et les conséquences.
8. **`npm run verify` doit passer avant tout commit.** Il enchaîne typecheck, lint, tests
   unitaires et build.

## 4. Démarrage

```bash
npm install
npm run dev          # http://localhost:5173
npm run verify       # typecheck + lint + tests + build
npm run test:e2e     # Playwright (lance le build et le serveur de preview)
npx tsx scripts/simulate.ts 200 equilibrage   # 200 combats IA vs IA, statistiques
```

Rejouer une partie précise : `http://localhost:5173/?seed=ma-graine`.
Accélérer l'IA pour les tests : `&ai=0`.

## 5. Carte du code

```
src/
  core/        RNG seedé, sauvegarde, dossier du candidat        — zéro dépendance
  rules/       CPRED-lite : attributs, jets de dés, fiches, notation — zéro dépendance
  tactical/    grille, vue, chemin, moteur de combat, IA         — zéro dépendance
  render/      three.js : caméra iso, décor, rigs de personnages
  ui/          HUD en HTML/CSS posé au-dessus du canvas
  data/        contenu équilibrable (fiches, carte)
  debug/       API `window.__game` pilotée par les tests e2e
  app.ts       seul point où gameplay et rendu se rencontrent
  main.ts      point d'entrée
```

Détail et justification : [`docs/process/ARCHITECTURE.md`](docs/process/ARCHITECTURE.md).

## 6. Comment travailler ici

- **Avant de coder**, lire le document de design concerné dans `docs/design/`. Le code
  suit le design, pas l'inverse. Si le design est faux, corriger le document **dans le
  même commit** que le code.
- **Pas de refonte silencieuse.** Un changement d'architecture passe par un ADR.
- **Tout comportement de règle nouveau s'accompagne d'un test unitaire.** Les tests
  vivent dans `tests/unit/` et sont écrits en français.
- **L'API `window.__game` est un contrat public** : toute évolution se répercute dans
  `docs/process/DEBUG_API.md` et dans `tests/e2e/debug-api.d.ts`.
- **Ne jamais committer de clé, de token ou de secret.** Rien de ce genre n'est nécessaire
  pour ce projet.
- **Assets** : ne pas committer de binaires lourds. `public/assets/` accueille les fichiers
  légers ; au-delà de quelques Mo, voir `docs/art/ART-PIPELINE.md`.

## 7. Le vocabulaire du projet

Utiliser ces termes, en français, partout — y compris dans les logs et les messages d'erreur.

| Terme | Sens |
|---|---|
| cadet | un des six personnages jouables du chapitre 1 |
| équipe bleue / rouge | les deux camps de l'exercice tactique final |
| neutralisé | touché au taser, hors jeu jusqu'à un soin — il n'y a **pas** de morts |
| PM | points de mouvement, un par case |
| DV | difficulté à atteindre lors d'un jet |
| couvert bas / haut | +3 / +5 à la DV du tireur |
| à découvert | a couru à son dernier tour, donc plus facile à toucher |
| dossier du candidat | mémoire persistante du joueur entre les chapitres |
| graine | chaîne qui détermine intégralement l'aléatoire d'une partie |

## 8. Si vous êtes bloqué

Dans l'ordre : `docs/INDEX.md` → le document de design concerné → les ADR →
les tests unitaires (ils documentent le comportement attendu mieux que n'importe quel
texte). Si la réponse n'existe nulle part, c'est une décision à prendre : la prendre,
l'écrire dans un ADR, et continuer.
