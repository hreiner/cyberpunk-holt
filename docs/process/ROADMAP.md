# Feuille de route

Le chapitre 1 est découpé en **trois epics**, menés l'un après l'autre.

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

## Epic 3 — le chapitre 1 devient un CRPG

**Objectif** : on vit la journée au lieu de la lire. Franklyn se déplace dans l'académie
HOLT (d'après le plan du MJ) puis dans le centre d'examen ; les scènes se déclenchent sur
place ; il **choisit ses coéquipiers** au tirage ; l'examen écrit devient un moment de
décisions et de paris.

Références : [`08-EXPLORATION.md`](../design/08-EXPLORATION.md),
[`09-MAPS-CHAPTER-1.md`](../design/09-MAPS-CHAPTER-1.md), scènes 3 à 5 de
[`03-CHAPTER-1.md`](../design/03-CHAPTER-1.md), ADR
[0013](adr/0013-exploration-temps-reel-sur-grille.md),
[0014](adr/0014-tirage-franklyn-capitaine-equipes-dynamiques.md),
[0015](adr/0015-concentration-chance-et-triche.md),
[0016](adr/0016-vue-tactique-ecran-separe.md).

| Lot | Contenu | Dépend de | État |
|---|---|---|---|
| 3.1 | **Moteur narratif, extensions** : alias `equipier1`/`equipier2`, gabarits `{equipier1}`, `startNode` choisi par l'appelant, réflexion facultative avec coût (`insight.cost`), état `awaitingLuck` + `spendLuck` / `acceptRoll`, API de debug | — | fait |
| 3.2 | **Le tirage** : équipes dans le `RunState`, choix d'Abigail, affinités et étiquettes, fin de `DEFAULT_BLUE`/`DEFAULT_RED` hors tests, parcours hors champ et notation sur les vraies équipes, écran de tirage, simulateur d'équilibre sur les cinq compositions atteignables (voir ADR 0014, "Correctif lot 3.2") | 3.1 | fait |
| 3.3 | **L'examen vivant** : concentration, Chance au dé (« dépenser N Chance ? »), triche et vigilance du surveillant, contenu `ch1.exam`, étiquettes `tricheur` / `pris-a-tricher` lues au bal ; DV variable pilotée par un compteur (`dvByCounter`) | 3.1 | fait |
| 3.4 | **Coéquipiers variables dans le contenu** : fourgon, salles, conversations, bal réécrits avec les alias et des variantes par cadet ; dispute Zachary/Grover ; le test « aucun cul-de-sac » tire aussi les compositions ; condition `teammate` | 3.2 | fait |
| 3.5 | **Socle d'exploration** : couche `src/explore/` (cartes, entités, déclencheurs, objectifs), format `MapDef` et validateur, rendu des lieux (murs en coupe, portes, mobilier en blocs), clic pour se déplacer, caméra libre (flèches, molette, `C`), survol et étiquettes, encart d'objectif, API de debug ; une carte d'essai | 3.1 | fait |
| 3.6 | **L'académie HOLT** : la carte (52 × 64), les étapes 1 à 6 en exploration, figurants et répliques brèves, cadets placés au temps libre, groupe qui suit après le tirage ; la liste du hub disparaît, on aborde les cadets sur la carte | 3.2, 3.5 | fait |
| 3.7 | **Le centre d'examen** : la carte (3.7a), les salles découpées en entités jouées pour de bon, tampon « CONTACT » et coupure vers l'écran tactique (même terrain des deux côtés, ADR 0016), retour au procès-verbal (3.7b) | 3.4, 3.6 | fait |
| 3.8 | **Revue de bout en bout** : partie complète jouée à la souris, captures, performances (cible GTX 1070), tests e2e du parcours complet | tout | à faire |

Ordre de passage : 3.1 seul ; puis 3.2 et 3.5 en parallèle (fichiers disjoints) ; puis 3.3
et 3.4 ; puis 3.6 ; puis 3.7 ; enfin 3.8.

---

## Epic 4 — la refonte visuelle

Le chapitre 1 est jouable de bout en bout ; il ne ressemble pas encore à grand-chose.
Cette epic ne touche pas au gameplay : elle habille ce qui existe. Décisions :
[ADR 0017](adr/0017-habillage-exploration-declaratif.md),
[ADR 0018](adr/0018-lumieres-locales-luminaires-et-matieres-procedurales.md).
Références : [`../art/EXPLORATION-VISUAL-DESIGN.md`](../art/EXPLORATION-VISUAL-DESIGN.md),
[`../art/ROOM-COMPOSITION.md`](../art/ROOM-COMPOSITION.md).

| Passe | Contenu | État |
|---|---|---|
| A | **Cohérence du décor** : un document d'usage par pièce, les dix-sept pièces recomposées dessus ; catalogue de modèles avec emprise déclarée et test d'accord avec la carte de collision | fait |
| B | **Personnages en combat** : les humanoïdes animés de l'exploration remplacent les capsules ; couleur d'équipe aux épaulettes, émissif sur l'unité active, échelle et éclairage revus | fait |
| C | **Matières et lumières locales** : murs distincts des sols, linoléum des pièces propres, les luminaires du décor éclairent vraiment | fait |
| D | **Matières photo** : textures CC0 pour les grandes surfaces, échelle et répétition traitées | fait |
| E | **La cour tactique** : conteneurs et terrain, palette désaturée conforme à la direction artistique | fait |
| F | **Le mobilier manquant** : les pièces qui n'avaient aucun siège, aucun poste de travail | fait |
| G | **Performance et simplification** : murs et décor répétitif fusionnés en instances, accessoires réduits, personnages assis posés sur leur siège, balise sur ce qui fait avancer l'histoire | fait |
| H | **Revue visuelle de bout en bout** : une partie complète regardée écran par écran, performances sur la cible | à faire |

Mesures de la passe G (mêmes conditions que la mesure de départ) : salle 1 461 → 132 appels de
dessin, dortoir 493 → 151. Le seuil de [`../art/EXPLORATION-VISUAL-DESIGN.md`](../art/EXPLORATION-VISUAL-DESIGN.md)
§5 est de 250.

Point ouvert : la photo de béton des sols (`concrete-diff-1k.jpg`) reste le maillon faible de
l'académie — trop marquée pour être étirée sur une pièce, trop directionnelle pour être répétée.
La remplacer suppose de télécharger un asset externe, ce que certains agents refusent sans une
autorisation donnée directement par le propriétaire du projet.

Ce qui reste hors de cette epic et attend toujours : les portraits et la musique (lot 2.11),
l'export du dossier au joueur (lot 2.12).

## Epic 5 — le chapitre 2, la nuit du bal

**Objectif** : le soir du bal, l'académie tombe ; Franklyn fuit avec sa bande par les
conduits, perd Zachary et finit la nuit chez un charcudoc. Onze scènes, environ 75 minutes,
sans combat. Le chapitre 1 reste jouable et vert à chaque lot.

Références : [`../chapters/ch2/GAME-DESIGN.md`](../chapters/ch2/GAME-DESIGN.md),
[`../chapters/ch2/TECH-DESIGN.md`](../chapters/ch2/TECH-DESIGN.md) (chaque lot y a sa section :
à lire, à toucher, preuve de fin). ADR acceptés :
[0021](adr/0021-plusieurs-chapitres-chapterdef.md),
[0022](adr/0022-dossier-entre-chapitres-archive-et-profils.md),
[0023](adr/0023-format-dialogue-decor-bruitage-tempo-locuteurs.md),
[0024](adr/0024-exploration-fuite-zones-pression-suiveurs.md),
[0025](adr/0025-jauges-et-bilan-de-chapitre-en-donnees.md).

| Lot | Contenu | Dépend de | État |
|---|---|---|---|
| 5.1 | **Le chapitre 2 se lance** : `ChapterDef` et registre des chapitres, `RunState.chapter`, clés par chapitre (étape, Chance, entrées), `?chapter=2`, `startChapter` ; 14 scènes en dialogues squelettes, profil Neutre, bilan provisoire ; `ch1.bal` harmonisé (Smith, Zachary) | — | à faire |
| 5.2 | **Le dossier passe** : archive en fin de chapitre 1, « Chapitre 2 » depuis l'écran de fin et l'écran titre, trois profils de départ | 5.1 | à faire |
| 5.3 | **Format de dialogue étendu** : décor et bruitage par nœud, compteur borné, condition `tempo`, six locuteurs, registre des décors | 5.1 | à faire |
| 5.4 | **Jauge et bilan** : état de Letitia visible, bilan déclaré en données avec la photo souvenir | 5.3 | à faire |
| 5.5 | **Scènes dites** : photo, slow et rafale en suite d'images, égouts, adieu à Zachary | 5.3, 5.4 | à faire |
| 5.6 | **Décharges et charcudoc** : relais de garde, adieux, bilan rempli ; simulateur de la nuit et ajustement des DV | 5.4, 5.5 | à faire |
| 5.7 | **L'exploration sait fuir** : habillage par registre, zones à effets, pression en exploration, suiveurs par scène, profil `enfant` ; mesure de cinq suiveurs | 5.1, 5.3 | à faire |
| 5.8 | **Le bal et la fuite** : carte `holt-nuit`, conversations du bal et leurs échos, fuite sous tempo jusqu'à la grille | 5.5, 5.7 | à faire |
| 5.9 | **Conduits et cantine** : carte `conduits`, détour chez Smith, ventilateur, l'enfant, la cantine en feu | 5.7, 5.8 | à faire |
| 5.10 | **Le campement** : carte `campement`, insignes, matériel, qui tue Murano | 5.5, 5.7 | à faire |
| 5.A | **Illustrations** : décors et six portraits du chapitre 2 inscrits au manifeste de génération, avec des substituts `.webp` en attendant la passe du propriétaire | 5.3 | à faire |
| 5.11 | **Revue de bout en bout** : une nuit par profil et depuis une vraie archive, performances, `CH2-LEGACY.md`, `CAPABILITIES.md` | tout | à faire |
| 5.12 | *(facultatif)* **Musique du slow**, coupée par la rafale | 5.5, la piste | à faire |

Ordre de passage (décision du propriétaire, un lot à la fois) : 5.1, 5.2, 5.3, 5.A, 5.7, 5.4,
5.5, 5.6, 5.8, 5.10, 5.9, 5.11.

## Après le chapitre 2

Le chapitre 3 se conçoit selon [`../chapters/README.md`](../chapters/README.md), à partir de
`CH2-LEGACY.md` (écrit au lot 5.11). Le dossier passe d'un chapitre à l'autre par l'archive
locale de l'ADR 0022. L'export du dossier sous forme de fichier (lot 2.12) reste ouvert.
