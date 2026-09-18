# HOLT Academy — chapitre 1

Jeu de rôle cyberpunk jouable dans le navigateur, adapté d'une campagne de jeu de rôle sur
table dans l'univers de Cyberpunk RED. Projet personnel, non commercial.

Le joueur incarne **Franklyn**, cadet de 17 ans à l'académie de police HOLT, isolée dans
les Badlands de Night City. Le chapitre 1 se déroule sur une seule journée : le dernier
jour avant la remise des diplômes.

> **Vous êtes un agent IA ?** Commencez par [`AGENTS.md`](AGENTS.md).
> **Vous cherchez la documentation ?** Tout est dans [`docs/INDEX.md`](docs/INDEX.md).

## Ce qui est jouable aujourd'hui

L'**affrontement tactique final** du chapitre 1 : deux équipes de trois cadets s'opposent
au taser dans une cour de containers, au tour par tour, en vue isométrique. Le joueur
contrôle les trois membres de l'équipe bleue ; l'équipe rouge est jouée par l'IA.

Les personnages sont pour l'instant des capsules colorées : le pipeline art arrive plus
tard et ne demandera aucune modification du gameplay (voir
[`docs/art/ART-PIPELINE.md`](docs/art/ART-PIPELINE.md)).

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173.

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run verify` | typecheck + lint + tests unitaires + build |
| `npm run test` | tests unitaires (Vitest) |
| `npm run test:e2e` | tests end-to-end (Playwright) |
| `npx tsx scripts/simulate.ts 200 seed` | 200 combats IA contre IA, statistiques d'équilibrage |

### Paramètres d'URL

| Paramètre | Effet |
|---|---|
| `?seed=xxx` | rejoue exactement la même partie |
| `?ai=0` | supprime le délai entre les actions de l'IA (tests) |

## Commandes en jeu

| Entrée | Action |
|---|---|
| clic sur une case bleutée | déplacement |
| clic sur un adversaire | tir au taser, ou corps à corps si au contact |
| `Courir` puis clic | double le déplacement, mais laisse à découvert |
| `A` / `E` | pivoter la caméra d'un quart de tour |
| molette | zoom |
| espace | fin du tour |

## Pile technique

| | |
|---|---|
| Rendu | Three.js, caméra orthographique isométrique |
| Langage | TypeScript strict, build Vite |
| Interface | HTML/CSS au-dessus du canvas |
| Tests | Vitest (logique) + Playwright (bout en bout, via `window.__game`) |
| Cible | 60 fps en 1080p sur une GTX 1070 |

La logique de jeu (`src/core`, `src/rules`, `src/tactical`) n'a **aucune dépendance** :
elle tourne dans Node, se teste sans navigateur, et se rejoue à l'identique à partir d'une
graine.

## État du projet

Le développement du chapitre 1 est découpé en deux epics.

- **Epic 1 — socle et tactique** : fondations, moteur de dés CPRED-lite, sauvegarde,
  affrontement final. *En place.*
- **Epic 2 — contenu narratif** : discours du directeur, examen écrit, hub de dialogue,
  trajet en fourgon, salles 1 à 3, notation complète, bal de promo. *À venir.*

Détail : [`docs/process/ROADMAP.md`](docs/process/ROADMAP.md).

## Licence et univers

Projet privé, à usage personnel. L'univers Cyberpunk et Night City appartiennent à leurs
ayants droit ; rien ici n'est destiné à être distribué ou vendu.
