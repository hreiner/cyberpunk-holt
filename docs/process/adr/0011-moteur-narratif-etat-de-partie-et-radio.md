# ADR 0011 — Moteur narratif : routeur de scènes, état de partie et couche radio

**Statut** : accepté · **Date** : 2026-09-19 · **Implémentation** : epic 2, lots 2.1 et 2.2

## Contexte

L'[ADR 0005](0005-dialogues-json-maison.md) a tranché le **format** des dialogues (graphe de
nœuds typé, stocké en JSON). Il restait trois questions ouvertes, explicitement laissées en
suspens dans [`07-DIALOGUE-FORMAT.md`](../../design/07-DIALOGUE-FORMAT.md) :

1. Faut-il des **variables locales** au dialogue, ou les étiquettes du dossier suffisent-elles ?
2. Le **mini-jeu de piratage** de la salle 2 est-il un nœud particulier ou une scène à part ?
3. Comment sont écrites les **interruptions radio** : nœuds insérés, ou couche parallèle ?

S'y ajoute une question que l'epic 2 ne peut pas éviter : **qui enchaîne les neuf scènes**, et
où vit l'état qui les traverse (équipes, objets ramassés, cadets gazés) — sachant que le
dossier est un contrat **inter-chapitres** qu'on ne veut pas polluer avec du volatil.

## Décision

### 1. Deux niveaux d'état, jamais mélangés

| | `Dossier` | `RunState` |
|---|---|---|
| Portée | tous les chapitres | la partie en cours |
| Contenu | étiquettes, affinités, entrées, note | drapeaux de scène, `TeamState`, tempo, scène courante |
| Stockage | `localStorage` `holt.dossier.v1` | `localStorage` `holt.session.v1` (dans `SessionSave`) |
| Rôle | mémoire **narrative** exportée vers le chapitre 2 | mémoire **mécanique** de la traversée |

`RunState.flags` est un `Record<string, string | number | boolean>` : c'est la réponse à la
question 1. **Pas de variables locales au dialogue** — un dialogue qui a besoin de se souvenir
de quelque chose pose un drapeau nommé (`ch1.salle1.chien-abattu`). Un drapeau est volatil ;
si l'information doit survivre au chapitre, elle devient une **étiquette de dossier** en plus.

Conséquence directe : un dialogue est une **fonction pure** de `(graphe, RunState, Dossier, Rng)`.
Rejouable à la graine près, testable dans Node.

### 2. Le piratage est un jet, pas un mini-jeu

Le mini-jeu de piratage de la salle 2 est **un choix à jet ordinaire** (`piratage`, DV nommée),
comme tous les autres. Motif : un mini-jeu est de l'interface, or le pilier « le dé raconte »
exige de toute façon d'afficher la compétence et la chance de réussite. Un mini-jeu en plus du
jet ferait doublon ; à la place du jet, il court-circuiterait la fiche du personnage.

S'il devait revenir un jour, ce serait une **couche d'interface posée sur le même jet** — pas
un type de nœud. Aucune donnée n'est à changer pour ça.

### 3. La radio est une couche parallèle, pas des nœuds

Les répliques de l'instructeur ne sont **pas** dans les graphes de dialogue. Elles vivent dans
une piste séparée (`src/data/radio.ts`), chaque réplique portant un **seuil de tempo** et une
condition facultative. Le routeur de scènes incrémente le tempo à chaque action coûteuse
(forcer l'armoire, s'attarder salle 3) et remonte les répliques échues à l'interface, qui les
affiche par-dessus la scène courante.

Motifs :

- le minuteur est **invisible** ([`03-CHAPTER-1.md`](../../design/03-CHAPTER-1.md)) : le
  coupler au graphe le rendrait lisible dans les données comme dans le jeu ;
- trois salles × N seuils feraient exploser le nombre de nœuds ;
- la progression **hors champ de l'équipe adverse** se raconte par ce même canal, alors qu'elle
  n'appartient à aucun dialogue.

### 4. Un routeur de scènes linéaire et reprenable

`src/narrative/sceneRouter.ts` enchaîne une liste ordonnée de scènes typées
(`dialogue`, `tactical`, `hub`, `debrief`). Le routeur :

- ne connaît **ni le DOM ni `three`** — il expose un état à afficher et reçoit des choix ;
- **sauvegarde après chaque scène**, jamais au milieu d'un dialogue (règle simple, reprise nette) ;
- traite la phase tactique existante comme une scène parmi les autres : elle reçoit un
  `TeamState` en entrée et rend une `ExerciseScore` en sortie.

C'est le lot 2.9 (« brancher le parcours sur la phase tactique ») rendu trivial par construction.

## Conséquences

**Favorables**

- Le dossier reste petit, stable et exportable : aucun drapeau de salle n'y entre.
- Tout le narratif est testable sans navigateur, comme `core`, `rules` et `tactical`.
- Écrire du contenu ne demande plus aucune décision d'architecture : un fichier de dialogue,
  des drapeaux nommés, éventuellement une réplique radio.
- Le validateur de graphes (`validateDialogue`) attrape à la compilation ce que le typage seul
  ne voit pas : `to` pendant, compétence inconnue, DV numérique, `onFailure` manquant.

**Défavorables**

- Deux stockages à garder cohérents. Atténué : `RunState` est jetable, une session illisible
  repart de la scène 1 sans perdre le dossier.
- La radio étant découplée, une réplique peut tomber à un moment maladroit. Atténué par la
  condition facultative portée par chaque réplique.
- Pas de mini-jeu de piratage : la salle 2 est moins spectaculaire que le document de design
  ne le laissait espérer.

## Alternatives écartées

- **Tout dans le dossier** : simple au premier abord, mais le contrat inter-chapitres se
  remplirait de `salle2-armoire-ouverte` sans intérêt pour le chapitre 2.
- **Variables locales au dialogue** : un troisième espace de noms, invisible depuis les autres
  scènes, alors que presque tous les drapeaux du chapitre 1 servent ailleurs que là où ils naissent.
- **Radio en nœuds insérés** : couplage fort entre le rythme et le texte, et un graphe à
  réécrire à chaque réglage du minuteur.
