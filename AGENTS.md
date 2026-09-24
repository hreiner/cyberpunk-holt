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
| **Epic en cours** | Epic 3 — le chapitre 1 devient un CRPG explorable, puis sa refonte visuelle |
| **Epic suivant** | rien de planifié — voir « Après le chapitre 1 » dans la feuille de route |
| **État** | Epics 1 et 2 clos. Epic 3 : les lots 3.1 à 3.7 sont livrés — on traverse l'académie et le centre d'examen à pied, les scènes se déclenchent sur place, le combat suit le portail. Reste 3.8 (revue de bout en bout). En parallèle, la refonte visuelle : habillage déclaratif (ADR 0017), composition des pièces, matières et lumières locales (ADR 0018), vrais personnages en combat. Restent de l'epic 2 : les portraits et la musique (2.11), l'export du dossier au joueur (2.12) |
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
  vivent dans `tests/unit/` et sont écrits en français. Un test se justifie par ce qu'il
  attrape — voir « L'économie des tests » ci-dessous.
- **L'API `window.__game` est un contrat public** : toute évolution se répercute dans
  `docs/process/DEBUG_API.md` et dans `tests/e2e/debug-api.d.ts`.
- **Ne jamais committer de clé, de token ou de secret.** Rien de ce genre n'est nécessaire
  pour ce projet.
- **Assets** : ne pas committer de binaires lourds. `public/assets/` accueille les fichiers
  légers ; au-delà de quelques Mo, voir `docs/art/ART-PIPELINE.md`. **Une seule exception,
  décidée par le propriétaire du projet** : `docs/art/Reference_pictures/` (26 Mo) est
  versionné, parce que ces images sont la source d'inspiration de toute la production
  graphique et que les briefs de `docs/art/image-generation/` les référencent par chemin.
  Elles ne sont ni servies ni importées par le jeu. Les masters générés, eux, restent hors
  dépôt (`art-masters/`).

### L'économie des tests

Vérifier est indispensable ; ce projet doit plusieurs vrais défauts à une vérification
faite pour de bon plutôt qu'à un rapport optimiste. Mais **un test a un coût** : à écrire,
à lire, à maintenir quand le code bouge — et, pour tout ce qui passe par un navigateur, un
coût en temps et en jetons qui se paie sur le budget de la session. Le bon réflexe n'est
donc pas « le plus de tests possible », c'est **le test qui attrape le plus pour ce qu'il
coûte**.

**Règle générale** : un test qui ne peut pas échouer pour une raison réaliste est à
supprimer. Il ne prouve rien et il faudra le réparer au prochain remaniement.

**Tests unitaires** (`tests/unit/`, Vitest) — le meilleur rapport, à privilégier :

- Un test par **comportement de règle**, pas un par fonction. Dix tests qui déclinent le
  même mécanisme valent moins qu'un seul qui balaie ses cas dans une table.
- Ne pas tester ce que le typage garantit déjà, ni retester le moteur depuis un test de
  contenu : le contenu se teste sur **ce qu'il produit** (une étiquette posée, une
  composition qui ne bloque pas), pas sur la mécanique qui le porte.
- Les tests qui gardent une propriété globale — pas de cul-de-sac, vocabulaire fermé
  respecté, toutes les compositions jouables — valent plusieurs tests ponctuels : ils
  attrapent ce que personne n'a pensé à vérifier.

**Vérification au navigateur** (captures d'écran pendant un lot) — de loin la plus chère,
donc la plus à cadrer :

- **Ne pas capturer pour vérifier une logique.** L'état du jeu se lit par l'API de debug
  (`window.__game`, [`docs/process/DEBUG_API.md`](docs/process/DEBUG_API.md)) ou en
  déroulant les données dans Node : c'est immédiat, exact et quasi gratuit. Une capture
  d'écran ne sert qu'à juger **ce que seul l'œil juge** : mise en page, lisibilité,
  couleur, cadrage, rendu 3D.
- **Une manche de captures par lot**, sur les quelques vues décisives, pas une capture à
  chaque itération. Corriger d'abord, capturer ensuite.
- Préférer, quand c'est possible, la lecture du texte de la page ou une assertion sur le
  DOM à une image : même certitude, coût sans commune mesure.

**Tests de bout en bout** (`tests/e2e/`, Playwright) — réservés aux **parcours complets**
qui prouvent que le jeu est jouable (le chapitre s'enchaîne, une partie se termine et
produit une note), jamais une spécification par bouton. Une douzaine de scénarios est le
bon ordre de grandeur ; au-delà, c'est que des tests unitaires auraient fait le travail.

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
