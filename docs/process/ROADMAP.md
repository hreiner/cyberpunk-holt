# Feuille de route

Le chapitre 1 est découpé en **deux epics**, menés l'un après l'autre.

L'ordre est délibéré : l'epic 1 traite d'abord le système le plus risqué (le combat
tactique) et pose les fondations dont tout le reste dépend. L'epic 2 remplit le chapitre de
contenu narratif sur un moteur déjà stable.

---

## Epic 1 — socle technique et phase tactique

**État : clos.** Le jeu démarre, l'affrontement final se joue de bout en bout, une note
est calculée. Déplacements animés, matériel lisible, retours visuels et sonores du tir.

| Lot | Contenu | État |
|---|---|---|
| 1.1 | Projet : Vite, TypeScript strict, ESLint, Prettier, structure | fait |
| 1.2 | RNG déterministe, moteur de dés CPRED-lite, fiches en JSON | fait |
| 1.3 | Dossier du candidat, sauvegarde tolérante aux pannes | fait |
| 1.4 | Grille, ligne de vue, couvert, recherche de chemin | fait |
| 1.5 | Moteur de combat : initiative, actions, taser, mine, soins | fait |
| 1.6 | IA de l'équipe adverse | fait |
| 1.7 | Barème de l'examen pratique | fait |
| 1.8 | Rendu isométrique, décor procédural, rigs de remplacement | fait |
| 1.9 | HUD : bandeau, ordre d'initiative, fiche, actions, journal de dés | fait |
| 1.10 | API `window.__game`, tests unitaires et e2e, simulateur d'équilibrage | fait |
| 1.11 | Déplacements animés, matériel visible, silhouettes derrière les décors ([ADR 0009](adr/0009-animation-des-deplacements-et-equipement-visible.md)) | fait |
| 1.12 | Retours du tir (trait, impact, chute) et bruitages ([ADR 0010](adr/0010-evenements-de-combat-et-bruitages-synthetises.md)) | fait |

### Clôture de l'epic 1

- [x] Retours visuels du tir : trait de tir, impact, réaction à la neutralisation.
- [x] Bruitages minimaux (tir, chute, clic d'interface).

Reportés, sans bloquer la clôture :

- [ ] Capture de référence Playwright à valider sur la machine de développement
      (`npx playwright install` puis `npm run test:e2e`).
- [ ] Première passe de `GltfRig`, à faire quand les modèles seront prêts (epic 2, lot art).
- [ ] Relecture de l'équilibrage sur 1 000 simulations (`npx tsx scripts/simulate.ts 1000 equilibrage`).

---

## Epic 2 — contenu narratif du chapitre 1

**État : quasi clos.** Les neuf scènes du chapitre 1 s'enchaînent de bout en bout,
`npm run verify` est vert. Spécifications complètes dans
[`../design/03-CHAPTER-1.md`](../design/03-CHAPTER-1.md).

| Lot | Contenu | État |
|---|---|---|
| 2.1 | Routeur de scènes : enchaîner les scènes, passer l'état, sauvegarder entre elles | fait |
| 2.2 | Moteur de dialogue selon [`07-DIALOGUE-FORMAT.md`](../design/07-DIALOGUE-FORMAT.md), plus l'interface associée | fait |
| 2.3 | Scènes 1 et 2 : introduction et discours du directeur | fait |
| 2.4 | Scène 3 : examen écrit, entrées au dossier | fait |
| 2.5 | Scènes 4 et 5 : tirage des équipes et hub de dialogue, affinités | fait |
| 2.6 | Scène 6 : trajet en fourgon | fait |
| 2.7 | Scène 7 : les trois salles, objets, dilemmes, état d'équipe | fait |
| 2.8 | Résolution hors champ de l'équipe adverse, remarques radio, minuteur invisible | fait |
| 2.9 | Branchement de l'état du parcours sur la phase tactique | fait |
| 2.10 | Scène 9 : bal de promo, conséquences, note complète | fait |
| 2.11 | Portraits 2D, ambiance sonore, musique | à faire |
| 2.12 | Export du dossier pour le chapitre 2 | à faire |

### Dépendances entre lots

```
2.1 ──▶ 2.2 ──▶ 2.3 ──▶ 2.4 ──▶ 2.5 ──▶ 2.6 ──▶ 2.7 ──▶ 2.8 ──▶ 2.9 ──▶ 2.10 ──▶ 2.12
                                                                             │
                                                                     2.11 ───┘
```

Le lot 2.9 est celui qui referme la boucle : à partir de là, une partie complète du
chapitre 1 se joue d'un bout à l'autre. C'est chose faite.

### Clôture de l'epic 2

- [x] Neuf scènes enchaînées, sauvegarde et reprise entre chacune.
- [x] Parcours intérieur (scène 7) : trois salles, dilemmes, état d'équipe réellement
      transmis à l'affrontement final — y compris le parcours hors champ de l'équipe
      adverse (`resolveOffscreenRun`), désormais effectivement appelé et dont le
      résultat conditionne la vidéo de la salle 3 et l'équipe rouge du combat.
- [x] Notation complète : combat + parcours intérieur, sur les seules actions du joueur.

Reportés, sans bloquer la clôture :

- [ ] **2.11 — Portraits 2D, ambiance sonore, musique.** Rien de commencé ; la vue
      narrative (`NarrativeView`) reste volontairement du texte pur pour l'instant
      (voir son commentaire d'en-tête, « première passe d'UX »).
- [ ] **2.12 — Export du dossier pour le chapitre 2.** `exportDossier()` existe déjà
      dans [`src/core/save.ts`](../../src/core/save.ts) (JSON lisible, prêt à être relu
      par le chapitre 2) mais n'est appelée nulle part : aucun bouton, aucune commande
      ne la déclenche pour le joueur. Reste à l'exposer (écran de fin de chapitre,
      ou export manuel depuis le débrief du bal).
- [ ] Capture de référence Playwright à valider sur la machine de développement, comme
      pour l'epic 1 (`npx playwright install` puis `npm run test:e2e`).

---

## Après le chapitre 1

Rien n'est décidé, et c'est volontaire. Les questions qui se poseront :

- Le chapitre 2 reprend-il le dossier exporté, ou faut-il un format de sauvegarde commun ?
- L'exploration à la troisième personne devient-elle nécessaire (et donc Rapier, ADR 0007) ?
- Le système de règles tient-il pour des scènes hors examen, avec de vrais enjeux vitaux ?

Chacune fera l'objet d'un ADR le moment venu.
