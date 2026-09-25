# Chapitre 2 — design technique

> Phase 2 ([`../README.md`](../README.md)). Entrée : [`GAME-DESIGN.md`](GAME-DESIGN.md) validé.
> Un agent de phase 3 lit **la section 1**, **la section de son lot** (§6) et les documents
> que ce lot cite — rien d'autre.

**Statut** : en revue
**Game design** : [`GAME-DESIGN.md`](GAME-DESIGN.md), version du 2026-09-25 (décisions §11
comprises, dont les quatre leviers ajoutés en phase 2)
**Epic** : n° 5 dans [`../../process/ROADMAP.md`](../../process/ROADMAP.md)

## 1. Vue d'ensemble

Le chapitre 2 est **surtout du contenu** : onze scènes en dialogue et en exploration, sans
combat, sur le moteur existant. Le moteur change à quatre endroits, chacun décidé par un ADR :

1. **Plusieurs chapitres** (ADR 0021) : une `ChapterDef` par chapitre (scènes, drapeau
   d'étape, Chance, radio, jauges, bilan) ; `RunState.chapter` ; `?chapter=2`. Le chapitre 1
   devient la première `ChapterDef` **sans changer de comportement** : ses cas particuliers
   (tirage, examen, procès-verbal, hors champ) restent dans `chapter.ts`, déclenchés par ses
   seuls identifiants de scène.
2. **Le dossier passe d'un chapitre à l'autre** (ADR 0022) : archive locale à la fin d'un
   chapitre, suite directe depuis l'écran de fin, et trois **profils de départ** pour qui
   commence au chapitre 2.
3. **Le format de dialogue s'étend** (ADR 0023) : décor par nœud (la suite d'images),
   bruitage par nœud, compteur borné, condition sur le tempo, six locuteurs nouveaux.
4. **L'exploration sait fuir** (ADR 0024), et **l'état se lit à l'écran** (ADR 0025) :
   - fuite : zones qui font avancer le tempo, répliques de pression avec bruitages, suiveurs
     déclarés par scène (jusqu'à cinq, dont l'enfant), habillage choisi par registre ;
   - lecture : jauge de l'état de Letitia, bilan de fin déclaré en données, avec la photo
     souvenir.

```
main.ts ──(?chapter, ?profile, écran titre)──▶ ChapterApp(ChapterDef)
                                                  │ scenes, etapeFlag, luck, radio, gauges, end
                     src/data/chapters/{ch1,ch2}.ts ┘   (registre CHAPTERS)
core/save.ts : holt.dossier.v1 (en cours) + holt.archive.ch1.v1 (fin du chapitre 1)
```

### Invariants rappelés

Les huit règles d'AGENTS.md §3 valent pour chaque lot. En particulier : **le chapitre 1 reste
jouable et vert à chaque lot** (ses tests unitaires et son parcours e2e ne changent pas,
sauf l'harmonisation de texte du lot 5.1) ; aucun `Math.random()` ; `core`/`rules`/`tactical`
sans `three` ni DOM ; texte joueur en français dans les données ; les identifiants de scène
du chapitre 1 ne bougent pas (sauvegardes, `?scene=`, e2e).

### Réponses aux questions ouvertes (GAME-DESIGN §10)

| # | Question | Réponse |
|---|---|---|
| 1 | Un cadet mort ? | Le moteur le tolère sans changement : sans tirage ni combat, rien ne suppose six vivants. `ch2.zachary = mort` est une entrée. Une garde de contenu (lot 5.5) vérifie qu'aucun dialogue après `ch2.egouts` ne fait parler Zachary ni ne lui fait lancer un jet. |
| 2 | Raccord avec le bal du chapitre 1 ? | Aucun nœud à déplacer : le nœud `fin` de `ch1.bal` est la passerelle. Il faut en revanche **harmoniser** `ch1.bal.json` avec les décisions du propriétaire : Smith au féminin, « Zacharie » → « Zachary » (lot 5.1). |
| 3 | Salle du bal et dortoir sur la carte ? | Oui, tous deux sur `holt` (salles d'entraînement, dortoirs). Le bal et la fuite se jouent sur une variante de nuit `holt-nuit`, qui reprend le plan ASCII de `holt` avec ses propres entités et un habillage enrichi. Le pilote du dortoir (ADR 0020) est une page de développement : on ne s'en sert pas. |
| 4 | Cinq suiveurs à 60 fps sur GTX 1070 ? | Probable : le dortoir mesure 151 appels de dessin, pour un seuil de 250. Le lot 5.7 mesure avec cinq suiveurs et fixe la parade si besoin (un suiveur de moins visible, le reste en narration : la variante 🟢 de B9). |
| 5 | Smith sous `instructeur` ? | Non : `instructeur` s'affiche « L'instructeur », au masculin, et c'est une voix radio au chapitre 1. Smith devient un locuteur à part entière, `smith`. |
| 6 | Rester éveillé ? | La compétence **Résistance** (CORPS) existe. La garde se joue donc en Résistance ; Perception reste la compétence pour les insignes et les premiers coups. |
| 7 | Dossier du chapitre 1 relu ? | Décidé par le propriétaire (ADR 0022) : suite locale plus profils de départ. |

## 2. Couplages soldés

| Couplage ([`../ENGINE-COUPLING.md`](../ENGINE-COUPLING.md)) | Décision | Lot |
|---|---|---|
| `CHAPTER_1_SCENES` constante unique | **généraliser** : registre `CHAPTERS` de `ChapterDef` ; `CHAPTER_1_SCENES` garde son nom et son contenu | 5.1 |
| `Ch1Etape` / `CH1_ETAPE_FLAG` | **généraliser** : `SceneDef.etape: string`, drapeau porté par `ChapterDef.etapeFlag` ; chaque chapitre exporte son union (`Ch1Etape`, `Ch2Etape`) | 5.1 |
| `INITIAL_SCENE_ID` | **généraliser** : `createRunState(seed, start)` reçoit scène initiale et Chance du chapitre | 5.1 |
| `ChapterApp` orchestrateur du chapitre 1 | **laisser** les cas particuliers (tirage, examen, procès-verbal, hors champ), inertes hors de leurs identifiants de scène ; **généraliser** ce qui est commun (liste de scènes, radio, suiveurs, écran de fin) | 5.1 |
| Numéros de scène (`SCENE_NUMBERS`) | **généraliser** : `SceneDef.number` ; la table du chapitre 1 reste en repli | 5.1 |
| Décor par dialogue (`sceneChrome.ts`), `SceneZone` | **généraliser** : `backdrop` dans le format (fichier, puis nœud) et registre `src/data/backdrops.ts` ; la table du chapitre 1 reste en repli. Nouvelles zones `nuit` et `ville` | 5.3 |
| Encarts de l'examen | **laisser** : la jauge générique (ADR 0025) les rendrait migrables, mais le chapitre 2 n'en a pas besoin | — |
| Chance sous `ch1.chance` | **généraliser** : `ch<N>.chance`, `ch<N>.chance.total` d'après `run.chapter` | 5.1 |
| `INITIAL_LUCK` | **généraliser** : `ChapterDef.initialLuck` (3 au chapitre 2) | 5.1 |
| Équipe par défaut, `redCaptain` | **laisser** : le roster par défaut ne gêne pas ; le chapitre 2 n'utilise ni alias d'équipe ni `teammate` | — |
| `TeamState`, barème, hors champ | **laisser** (sans objet) | — |
| Le dossier ne traverse pas les chapitres | **généraliser** (ADR 0022) : archive, suite, profils | 5.2 |
| « Nouvelle partie = dossier vierge » | **généraliser** : une nouvelle partie du chapitre 1 part d'un dossier vierge ; le chapitre 2 part de l'archive ou d'un profil ; les archives survivent à une nouvelle partie | 5.2 |
| `CharacterId` fermé | **laisser** : aucun personnage jouable nouveau | — |
| `SpeakerId` fermé | **étendre** (ADR 0023) : `smith`, `enfant`, `murano`, `guide`, `charcudoc`, `ganger` | 5.3 |
| Alias `equipier1/2`, `rivale` | **laisser** : le chapitre 2 nomme ses cadets directement | — |
| Combat (5 lignes) | **laisser** (aucun combat) | — |
| `window.__game` nomme le chapitre 1 | **étendre** : `startChapter`, champ `chapter` du cliché d'état | 5.1, 5.2 |
| Test « aucun cul-de-sac » propre au chapitre 1 | **dupliquer** pour le chapitre 2, balayé sur les trois profils | 5.1 |
| `?scene=` propre au chapitre 1 | **généraliser** : l'identifiant désigne son chapitre (`ch2.*`) ; `?chapter=` pour un départ au début | 5.1 |

**Couplages découverts en phase 2**, à inscrire dans `ENGINE-COUPLING.md` au lot qui les solde :

| Couplage nouveau | Où | Décision | Lot |
|---|---|---|---|
| L'habillage et plusieurs réglages de rendu sont choisis par `def.id` en dur (`'holt'`, `'centre-examen'`) | `src/render/exploreView.ts` | **généraliser** : registre `EXPLORE_VISUALS` et champs de thème (ADR 0024) | 5.7 |
| `NARRATIVE_CHAPTER` fixe le chapitre des entrées de dossier | `src/narrative/effects.ts` | **généraliser** : `run.chapter` | 5.1 |
| Les suiveurs sont « l'équipe bleue après le tirage » | `exploreFollowerIds` (`sceneRouter.ts`) | **généraliser** : `SceneDef.followers`, repli sur la règle actuelle | 5.7 |
| Une zone ne peut qu'afficher une bulle ; une condition ne lit pas le tempo | `src/explore/types.ts`, `src/narrative/types.ts` | **étendre** (ADR 0023, 0024) | 5.3, 5.7 |
| L'écran de fin est celui du chapitre 1 | `ReportView.renderChapterEnd` | **généraliser** : `ChapterDef.end` (ADR 0025) | 5.4 |

## 3. Réponse aux besoins

| Besoin | Solution | Fichiers | Contrat touché | ADR | Lot |
|---|---|---|---|---|---|
| B1 | `ChapterDef` ch2, 15 `SceneDef` (§4.4), `?chapter=2` ; squelette de dialogues courts d'abord | `src/narrative/chapter.ts` (nouveau), `src/data/chapters/`, `chapter.ts`, `main.ts`, `runState.ts` | `RunState`, `__game` | 0021 | 5.1 |
| B2 | Trois profils de départ (Loyal à la bande, Solitaire, Neutre) ; archive du chapitre 1 prioritaire | `src/data/chapters/ch2Profiles.ts`, `core/save.ts`, `ui/titleView.ts`, `ui/reportView.ts` | `Dossier` (stockage, pas la forme) | 0022 | 5.1 (Neutre), 5.2 |
| B3 | `ch2.photo` : 3 répliques, décor `photo-souvenir` | `ch2.photo.json`, `data/backdrops.ts` | aucun | — | 5.5 |
| B4 | Carte `holt-nuit` : ASCII de `holt`, entités du bal et de la fuite, habillage `holt` enrichi (ballons, guirlandes, gâteaux, tables renversées) | `src/data/maps/holt-nuit.ts`, `src/data/exploreVisuals/holtNuit.ts` | aucun (nouvelle carte) | 0024 | 5.8 |
| B5 | Cinq conversations annexes du bal, **avec les échos** (§4.6) | `ch2.bal.<cadet>.json` | aucun | — | 5.8 |
| B6 | Suite d'images : `backdrop` par nœud, coupe franche | `types.ts`, `validate.ts`, `narrativeView.ts`, `sceneChrome.ts` ; contenu `ch2.slow.json` | format dialogue | 0023 | 5.3, 5.5 |
| B7 | Musique : **plus tard**. Emplacement `sound.music` réservé dans l'ADR, non typé ; texte et bruitages en attendant | — | — | 0023 | 5.12 (facultatif) |
| B8 | `sound.sfx` sur un nœud, qui réemploie les bruitages synthétisés (rafale, tir lointain, coupure) | `types.ts`, `src/audio/sfx.ts`, `narrativeView.ts` | format dialogue | 0023 | 5.3 |
| B9 | `SceneDef.followers` explicite ; file de 3 à 5 ; mesure de performance | `sceneRouter.ts`, `chapter.ts`, `exploreSession.ts` | `SceneDef` | 0024 | 5.7 |
| B10 | Répliques de **pression** (`RadioCue.channel = 'pression'`) avec bruitage ; vérifiées aussi en exploration, affichées en ligne de narration | `radio.ts`, `data/chapters/ch2Radio.ts`, `chapter.ts` | aucun public | 0024 | 5.7 |
| B11 | Portes fermées (`locked` + `lockedLine`), zones à effets (`tempo`) aux seuils | `explore/types.ts`, `validateMap.ts`, `exploreState.ts`, `chapter.ts` | `MapDef` | 0024 | 5.7 |
| B12 | Figurants `ganger` (profil de rig sombre, armé, statique) | `characterProfiles.ts`, cartes | aucun | — | 5.8 |
| B13 | Carte `conduits` : conduits étroits, bifurcation, ventilateur, quartier des petits, cantine en fin de carte | `src/data/maps/conduits.ts`, habillage | aucun | — | 5.9 |
| B14 | Smith dans son labo : entité `npc` facultative, conversation annexe `ch2.smith` ; locuteur `smith` | carte `conduits`, `ch2.smith.json` | format dialogue (locuteur) | 0023 | 5.3, 5.9 |
| B15 | L'enfant : profil de rig `enfant` (échelle 0,7), PNJ puis suiveur ; locuteur `enfant` | `characterProfiles.ts`, `exploreView.ts` | `SceneDef.followers` | 0024 | 5.7, 5.9 |
| B16 | Cantine en feu : étape `cantine` de la carte `conduits`, lumière rouge et narration (variante 🟢) | carte `conduits` | aucun | — | 5.9 |
| B17 | Décors plein cadre : égouts, désert, décharges, clinique, rue | `public/assets/backdrops/`, `data/backdrops.ts` | aucun | — | 5.A |
| B18 | Compteur `ch2.letitia.etat` **borné** (0 à 3) ; **jauge visible** ; entrée finale écrite par quatre branches silencieuses | `types.ts` (bornes), `ui/gaugeView.ts`, contenu | format dialogue, `ChapterDef` | 0023, 0025 | 5.3, 5.4 |
| B19 | Zachary mort : entrée `ch2.zachary`, suiveurs sans lui après `ch2.egouts`, garde de contenu | données, `ch2Content.test.ts` | aucun | — | 5.5 |
| B20 | Carte `campement` (petite) | `src/data/maps/campement.ts`, habillage | aucun | — | 5.10 |
| B21 | Six locuteurs ; portrait de repli à l'initiale en attendant l'art | `types.ts`, `ui/portraits.ts` | format dialogue | 0023 | 5.3 |
| B22 | **Relais de garde** (§4.6) : ordre des veilleurs, joker de l'enfant | `ch2.decharges.json` | aucun | — | 5.6 |
| B23 | Bilan déclaré en données, **avec la photo** (§4.6) | `narrative/chapterEnd.ts`, `ui/reportView.ts`, `data/chapters/ch2.ts` | `ChapterDef` | 0025 | 5.4, 5.6 |
| B24 | 7 étiquettes, 7 entrées : vocabulaire fermé, test | `docs/design/06-SCORING-DOSSIER.md`, `ch2Content.test.ts` | vocabulaire du dossier | — | 5.1 (liste), 5.5+ |
| B25 | Chance du chapitre : 3, réserve pleine, non héritée | `data/chapters/ch2.ts` | — | 0021 | 5.1 |
| B26, B27 | Écartés : variantes 🟢 retenues (B9 à B12) | — | — | — | — |

## 4. Contrats de données nouveaux ou modifiés

### 4.1 Chapitres (ADR 0021)

```ts
// src/narrative/chapter.ts — pur, sans DOM
export type ChapterId = 1 | 2;
export interface ChapterDef {
  id: ChapterId;
  title: string;                 // « La nuit du bal »
  scenes: SceneDef[];
  etapeFlag: string;             // 'ch1.etape' | 'ch2.etape'
  initialLuck: number;
  radio: RadioCue[];
  gauges?: GaugeDef[];           // ADR 0025
  end: 'ch1-report' | ChapterEndDef; // ADR 0025
}
// src/data/chapters/index.ts
export const CHAPTERS: Record<ChapterId, ChapterDef>;
export function chapterOfScene(sceneId: string): ChapterId | null;

// SceneDef (sceneRouter.ts) : champs ajoutés ou élargis
etape?: string;                  // était Ch1Etape
number?: number;                 // numéro affiché (plusieurs SceneDef peuvent partager un numéro)
followers?: FollowerId[];        // ADR 0024 ; absent = règle du chapitre 1
// SceneRouter reçoit le drapeau d'étape : new SceneRouter(scenes, ctx, etapeFlag)

// RunState : champ ajouté ; migrateRunState → 1 si absent
chapter: ChapterId;
export function createRunState(seed: string, start?: { chapter: ChapterId; sceneId: string; luck: number }): RunState;
```

`ChapterOptions` gagne `chapter?: ChapterId` et `profile?: ProfileId`. URL : `?chapter=2`,
`?chapter=2&profile=solitaire`, `?scene=ch2.fuite` (le chapitre se déduit de la scène).

### 4.2 Dossier et sauvegarde (ADR 0022)

La forme du `Dossier` ne change pas (`DOSSIER_VERSION` reste 2). Le stockage s'enrichit :

```ts
// core/save.ts
export function archiveDossier(chapter: number, dossier: Dossier): boolean; // clé holt.archive.ch<N>.v1
export function loadArchivedDossier(chapter: number): Dossier | null;       // migrateDossier, null si absent
// src/data/chapters/ch2Profiles.ts
export type ProfileId = 'loyal' | 'solitaire' | 'neutre';
export interface DossierProfile { id: ProfileId; title: string; summary: string; build(): Dossier }
```

Profils (valeurs à affiner au lot 5.2, dans l'esprit suivant) :

| Profil | Étiquettes | Affinités | Pensé pour |
|---|---|---|---|
| Loyal à la bande | `loyal-bande`, `equipe-bande`, `vainqueur-exercice`, `sauveteur` | bande +2, Letitia +1 | voir la bande porter Franklyn |
| Solitaire | `solitaire`, `equipe-tactique`, `defaite-exercice`, `bluffeur`, `tricheur` | bande 0, Letitia +2 | voir les options froides |
| Neutre | `equipe-tactique`, `vainqueur-exercice` | valeurs de départ des fiches | B2 : le dossier moyen |

### 4.3 Format de dialogue (ADR 0023)

```ts
type SpeakerId = CharacterId | 'narrateur' | 'directeur' | 'instructeur' | 'otage' | 'radio'
  | 'smith' | 'enfant' | 'murano' | 'guide' | 'charcudoc' | 'ganger';
interface DialogueFile { /* … */ backdrop?: string }      // clé de src/data/backdrops.ts
interface DialogueNode { /* … */
  backdrop?: string;                                      // remplace le décor à l'entrée du nœud
  sound?: { sfx?: SfxId[] };                              // joués à l'entrée ; `music` réservé (B7)
}
type Condition = /* … */ | { tempo: { atLeast?: number; atMost?: number } };
type Effect = /* … */ | { counter: string; delta: number; min?: number; max?: number };
```

Exemple (scène 3) :

```json
"rafale": {
  "backdrop": "ch2-attaque-boom",
  "sound": { "sfx": ["burst", "glass"] },
  "text": "La musique s'arrête net.",
  "effects": [{ "counter": "ch2.letitia.etat", "delta": 1, "min": 0, "max": 3 }],
  "choices": [{ "text": "Continuer.", "to": "entree-gangers" }]
}
```

### 4.4 Les scènes du chapitre 2

Les scènes `explore` suivent la règle du lot 3.6b : l'entité `completionTrigger` porte le
`dialogueId` de la scène suivante.

| `SceneDef.id` | N° | Type | Carte / étape | Déclencheur de fin → scène suivante |
|---|---|---|---|---|
| `ch2.photo` | 1 | dialogue | — | — |
| `ch2.bal` | 2 | explore | `holt-nuit` / `bal` | `bal.letitia` → `ch2.slow` |
| `ch2.slow` | 3 | dialogue | — (finit sur les tables renversées) | — |
| `ch2.fuite` | 4 | explore | `holt-nuit` / `fuite` | `dortoir.grille` → `ch2.grille` |
| `ch2.grille` | 4 | dialogue | — | — |
| `ch2.conduits` | 5 | explore | `conduits` / `conduits` | `petits.enfant` → `ch2.enfant` |
| `ch2.enfant` | 5 | dialogue | — | — |
| `ch2.cantine` | 6 | explore | `conduits` / `cantine` | `cantine.vide-ordures` → `ch2.egouts` |
| `ch2.egouts` | 7 | dialogue | — | — |
| `ch2.adieu` | 8 | dialogue | — | — |
| `ch2.campement` | 9 | explore | `campement` / `campement` | `campement.murano` → `ch2.murano` |
| `ch2.murano` | 9 | dialogue | — | — |
| `ch2.decharges` | 10 | dialogue | — | — |
| `ch2.charcudoc` | 11 | dialogue | — | — |

Au lot 5.1, les cinq scènes `explore` sont provisoirement des dialogues d'un nœud, du même
identifiant. Chacune redevient `explore` dans le lot de sa carte (même identifiant, autre
type : le précédent du lot 3.6b).

Suiveurs (`SceneDef.followers`) :

| Scène | Suiveurs |
|---|---|
| `ch2.bal` | aucun (la bande est placée dans la salle) |
| `ch2.fuite` | `letitia`, puis `john` ou `abigail` (le porteur), `grover`, `zachary`, et l'autre des deux |
| `ch2.conduits` | les cinq, sans Letitia visible si la mesure l'impose |
| `ch2.cantine` | les cinq, plus `enfant` |
| `ch2.campement` | `john`, `grover`, `abigail`, `enfant` (Letitia portée hors champ) |

Le porteur (`ch2.porteur` = `john` | `abigail`) change l'ordre de la file : la liste est
choisie par une condition, via deux `SceneDef` jumelles gardées par `when`. Le chapitre 1
procède déjà ainsi.

### 4.5 Exploration (ADR 0024)

```ts
// explore/types.ts
interface ZoneEntity { /* … */ effects?: Effect[] }     // seuls tempo, flag, counter (validateur)
// radio.ts
interface RadioCue { /* … */ channel?: 'radio' | 'pression'; sfx?: SfxId[] }
// src/data/exploreVisuals/index.ts
export const EXPLORE_VISUALS: Record<string, ExploreVisuals>; // clé = MapDef.id
// ExploreVisuals gagne les réglages aujourd'hui déduits de def.id (bandes de mur, matière, etc.)
type FollowerId = CharacterId | 'enfant';
```

### 4.6 Jauges, bilan et leviers de fun (ADR 0025)

```ts
interface GaugeDef {
  id: string; counter: string; label: string;     // 'Letitia'
  levels: string[];                               // ['stable', 'blessure sérieuse', 'blessure grave', 'état critique']
  from?: string;                                  // SceneDef.id à partir duquel elle s'affiche
}
interface ChapterEndDef {
  kicker: string; title: string;                  // « Rapport de nuit », « Fin du chapitre 2 »
  photo?: { backdrop: string; faded: CharacterId[] };
  lines: { label: string; cases: { when?: Condition; value: string }[] }[]; // premier cas vrai
  next?: ChapterId;                               // bouton « Chapitre suivant » (absent au ch.2)
}
export function resolveChapterEnd(def: ChapterEndDef, ctx: NarrativeContext): ResolvedChapterEnd; // pur
```

Les quatre **leviers de fun** retenus par le propriétaire (GAME-DESIGN §11), tous en données :

- **Relais de garde** (scène 10, lot 5.6) : le joueur place les veilleurs dans l'ordre qu'il
  veut, en choisissant pour chaque tour qui prend la garde. Avec `enfant-confiance`, après
  un jet raté, un choix « L'enfant secoue {veilleur} » relance ce tour, une seule fois
  (drapeau `ch2.garde.enfant-utilise`). L'idiome est celui de la Chance : décider maintenant
  ou garder pour plus tard.
- **Échos du bal** (scène 2, lot 5.8) : les conversations facultatives posent déjà
  `<dialogueId>.fait`. Elles sont lues plus loin :

  | Conversation | Relue à la scène | Effet |
  |---|---|---|
  | `ch2.bal.zachary.fait` | 7 | calmer Abigail : DV −1 cran |
  | `ch2.bal.abigail.fait` | 4 | l'outil est en poche : DV de la grille Normale |
  | `ch2.bal.john.fait` | 10 | John parle du rendez-vous avant la question |
  | `ch2.bal.grover.fait` | 5 | +2 à la Persuasion de Grover sur l'enfant |

  L'échelle des DV est celle de `DV` : un cran = passer d'un nom au suivant, jamais un nombre.
- **Photo au bilan** (lot 5.4, contenu au lot 5.6) : la photo souvenir en tête du bilan,
  Zachary estompé ; sous chaque survivant, une ligne (Letitia : état ; Abigail : brisée ou
  non ; l'enfant : confiance ; la voiture ; le fusil).
- **Fuite qui s'entend** (lots 5.7, 5.8) : à chaque seuil de tempo de la fuite, une réplique
  de pression (« Des pas, deux couloirs plus loin. ») et un tir lointain synthétisé.

## 5. ADR

| N° | Titre | Statut |
|---|---|---|
| [0021](../../process/adr/0021-plusieurs-chapitres-chapterdef.md) | Plusieurs chapitres : `ChapterDef` et `RunState.chapter` | proposé |
| [0022](../../process/adr/0022-dossier-entre-chapitres-archive-et-profils.md) | Le dossier entre deux chapitres : archive locale, suite directe, profils | proposé |
| [0023](../../process/adr/0023-format-dialogue-decor-bruitage-tempo-locuteurs.md) | Format de dialogue : décor et bruitage par nœud, compteur borné, tempo, locuteurs | proposé |
| [0024](../../process/adr/0024-exploration-fuite-zones-pression-suiveurs.md) | Exploration de fuite : zones à effets, pression, suiveurs déclarés, habillage par registre | proposé |
| [0025](../../process/adr/0025-jauges-et-bilan-de-chapitre-en-donnees.md) | Jauges d'état et bilan de chapitre déclarés en données | proposé |

## 6. Lots

> Un lot = une session. `npm run verify` vert en fin de lot, chapitre 1 compris. Tests
> selon l'économie d'AGENTS.md : un test par comportement, les propriétés globales d'abord,
> une manche de captures au plus, les parcours e2e seulement pour « ça se joue de bout en bout ».

### Lot 5.1 — le chapitre 2 se lance

- **But** : `?chapter=2` (et `window.__game.startChapter(2)`) joue les 14 scènes de §4.4, en
  dialogues squelettes, de la photo au bilan provisoire, avec le profil Neutre. Le chapitre 1
  est inchangé.
- **Dépend de** : —
- **Lire** : §1, §4.1, §4.4 ; ADR 0021 ; [`ARCHITECTURE.md`](../../process/ARCHITECTURE.md)
  (« chapter.ts », « L'écran titre ») ; `src/narrative/sceneRouter.ts`, `runState.ts`,
  `effects.ts` (`NARRATIVE_CHAPTER`), `dialogueRunner.ts` (clés de Chance) ; `src/chapter.ts`
  (constructeur, `startNewGame`, `jumpRouter`, `checkRadio`, `showChapterEnd`) ; `src/main.ts` ;
  `src/ui/narrativeView.ts` (`SCENE_NUMBERS`) ; [`DEBUG_API.md`](../../process/DEBUG_API.md).
- **Toucher** :
  - créés : `src/narrative/chapter.ts`, `src/data/chapters/{index,ch1,ch2}.ts`,
    `src/data/chapters/ch2Profiles.ts` (Neutre seulement), 14 fichiers `src/data/dialogues/ch2.*.json`
    (un à trois nœuds chacun ; les choix qui posent les étiquettes et les entrées de §7 du
    game design peuvent déjà y figurer, sans jets) ;
  - modifiés : `sceneRouter.ts`, `runState.ts`, `effects.ts`, `dialogueRunner.ts`,
    `chapter.ts`, `main.ts`, `narrativeView.ts`, `src/data/dialogues/registry.ts`,
    `src/debug/gameApi.ts`, `tests/e2e/debug-api.d.ts` ;
  - contenu : `ch1.bal.json` (Smith au féminin, « Zacharie » → « Zachary »).
- **Fini quand** :
  - `tests/unit/chapter2Flow.test.ts` : depuis le profil Neutre, toute suite de choix atteint
    la fin (le « aucun cul-de-sac » du chapitre 2) ; les étiquettes posées appartiennent à
    la liste fermée de §7 ;
  - un test de `runState` : un `RunState` sans `chapter` migre vers 1, et la Chance du
    chapitre 2 s'écrit sous `ch2.chance` sans toucher `ch1.chance` ;
  - les tests du chapitre 1 passent sans modification ;
  - e2e `tests/e2e/chapter2.spec.ts` : `?chapter=2&seed=…` va jusqu'à l'écran de fin par
    `window.__game`.
- **Documents à mettre à jour** : `ARCHITECTURE.md` (couche chapitres), `DEBUG_API.md`,
  `ENGINE-COUPLING.md` (rayer les lignes soldées, ajouter `NARRATIVE_CHAPTER` soldé),
  `06-SCORING-DOSSIER.md` (les 7 étiquettes et 7 entrées du chapitre 2).

### Lot 5.2 — le dossier passe d'un chapitre à l'autre

- **But** : finir le chapitre 1 archive son dossier et propose « Chapitre 2 — La nuit du
  bal » ; l'écran titre propose « Chapitre 2 » : il reprend l'archive si elle existe, sinon
  le joueur choisit parmi trois profils.
- **Dépend de** : 5.1
- **Lire** : §4.2 ; ADR 0022 ; `src/core/save.ts`, `src/core/dossier.ts` ; `src/chapter.ts`
  (`isResumingRun`, `showChapterEnd`, `startNewGame`) ; `src/ui/titleView.ts`,
  `src/ui/reportView.ts` ; [`UI-DESIGN-SYSTEM.md`](../../art/UI-DESIGN-SYSTEM.md) (écran titre,
  bilan) pour l'allure des cartes de profil.
- **Toucher** : `core/save.ts`, `chapter.ts` (`startChapter(id, { profile?, useArchive? })`),
  `main.ts` (`?profile=`), `ui/titleView.ts`, `ui/reportView.ts`, `ch2Profiles.ts` (trois
  profils), `gameApi.ts`, `debug-api.d.ts`, styles.
- **Fini quand** :
  - `tests/unit/dossierArchive.test.ts` : archive écrite en fin de chapitre 1 ; relue au
    départ du chapitre 2 ; une nouvelle partie du chapitre 1 ne l'efface pas ; une archive
    illisible retombe sur le choix de profil ;
  - le test de 5.1 balaie désormais les trois profils ;
  - e2e : le parcours complet du chapitre 1 existant, prolongé d'une assertion :
    « Chapitre 2 » démarre `ch2.photo` avec les étiquettes du chapitre 1 ;
  - une capture de l'écran titre et une du choix de profil.
- **Documents** : `DEBUG_API.md`, `ENGINE-COUPLING.md` (§2, dossier soldé), ROADMAP (le lot
  2.12 « export au joueur » reste ouvert, il n'est plus bloquant).

### Lot 5.3 — le format de dialogue s'étend

- **But** : décor et bruitage par nœud, compteur borné, condition `tempo`, six locuteurs ;
  registre des décors.
- **Dépend de** : 5.1
- **Lire** : §4.3 ; ADR 0023 ; [`07-DIALOGUE-FORMAT.md`](../../design/07-DIALOGUE-FORMAT.md) ;
  `src/narrative/types.ts`, `conditions.ts`, `effects.ts`, `validate.ts` ;
  `src/ui/sceneChrome.ts`, `narrativeView.ts` (rendu du décor), `src/ui/portraits.ts` ;
  `src/audio/sfx.ts`.
- **Toucher** : les fichiers lus, plus `src/data/backdrops.ts` (nouveau ; il accueille aussi
  les décors du chapitre 1, la table de `sceneChrome.ts` restant en repli), zones `nuit` et
  `ville` dans `styles.css`.
- **Fini quand** :
  - `tests/unit/dialogueFormatCh2.test.ts`, en une table : compteur borné (plafond et
    plancher), condition `tempo`, décor d'un nœud prioritaire sur celui du fichier, clé de
    décor inconnue signalée par `validateDialogue` ;
  - tous les dialogues existants valident toujours ;
  - une capture d'un dialogue d'essai dont le décor change entre deux nœuds.
- **Documents** : `07-DIALOGUE-FORMAT.md` (contrat exact), `CAPABILITIES.md` (DLG-10 étendu,
  DLG-05 compteur borné, DLG-04 tempo).

### Lot 5.4 — la jauge et le bilan

- **But** : la jauge de Letitia s'affiche en dialogue et en exploration, et se tamponne
  quand elle change ; le bilan du chapitre est rendu depuis `ChapterDef.end`, photo comprise.
- **Dépend de** : 5.3 (clés de décor pour la photo)
- **Lire** : §4.6 ; ADR 0025 ; `src/ui/reportView.ts`, `narrativeView.ts` (`buildHud`,
  encarts de l'examen pour le style), `src/ui/objectiveHud.ts` ; `UI-DESIGN-SYSTEM.md`
  (tampons, bilan).
- **Toucher** : `src/narrative/chapterEnd.ts` (nouveau, pur), `src/ui/gaugeView.ts`
  (nouveau), `reportView.ts` (`renderChapterBilan`), `chapter.ts`, `objectiveHud.ts`,
  `data/chapters/ch2.ts` (jauge et bilan provisoires), styles.
- **Fini quand** :
  - `tests/unit/chapterEnd.test.ts` : premier cas vrai retenu, ligne sans cas vrai omise ;
  - le bilan du chapitre 1 est identique (le repli `'ch1-report'` passe par l'ancien rendu) ;
  - une capture de la jauge (niveau « grave ») et une du bilan avec la photo.
- **Documents** : `UI-DESIGN-SYSTEM.md` (jauge, bilan de nuit), `CAPABILITIES.md` (RES :
  jauge ; STR-03 : bilan déclaré).

### Lot 5.5 — les scènes dites : photo, slow, égouts, adieu

- **But** : contenu complet des scènes 1, 3, 7 et 8 : la suite d'images de la rafale, la mort
  de Zachary, l'adieu, avec leurs jets, leurs effets sur l'état de Letitia et sur Abigail.
- **Dépend de** : 5.3, 5.4 (décors provisoires tant que 5.A n'est pas livré)
- **Lire** : GAME-DESIGN §4 (scènes 1, 3, 7, 8), §5.1 à 5.3, §7 ; §4.3 et §4.6 ; 07 (idiome
  « Continuer. ») ; `src/data/dialogues/ch1.bal.json` pour le ton.
- **Toucher** : `ch2.photo.json`, `ch2.slow.json`, `ch2.egouts.json`, `ch2.adieu.json`,
  `data/backdrops.ts`.
- **Fini quand** :
  - `tests/unit/ch2Content.test.ts` (nouveau, gardien du contenu) : Zachary ne parle plus et
    ne lance plus de jet après `ch2.egouts` ; l'état de Letitia reste dans [0, 3] sur tout
    chemin ; `abigail-brisee` n'est posée qu'en scène 8 ;
  - le test de flux de 5.1 reste vert.
- **Documents** : —

### Lot 5.6 — les décharges, le charcudoc et l'équilibre de la nuit

- **But** : scènes 10 et 11 complètes, dont le **relais de garde** ; bilan final rempli ;
  un simulateur mesure ce que la nuit produit.
- **Dépend de** : 5.4, 5.5
- **Lire** : GAME-DESIGN §4 (scènes 10, 11), §7 ; §4.6 ; `scripts/simulate.ts` (modèle).
- **Toucher** : `ch2.decharges.json`, `ch2.charcudoc.json`, `data/chapters/ch2.ts` (bilan),
  `scripts/simulate-ch2.ts` (nouveau : N nuits aux choix tirés sur la graine, pour chaque
  profil ; répartition de l'état de Letitia, de la voiture et d'Abigail).
- **Fini quand** :
  - `ch2Content.test.ts` étendu : le joker de l'enfant ne sert qu'une fois ; les quatre
    entrées finales sont toujours écrites ;
  - `npx tsx scripts/simulate-ch2.ts 500` : aucune issue n'est sûre (chaque état de
    Letitia entre 0 et 3, `voiture-pillee` oui/non) ; les DV sont ajustées sinon, et les
    chiffres notés dans ce document.
- **Documents** : ce document (§7, résultats du simulateur).

### Lot 5.7 — l'exploration sait fuir

- **But** : habillage par registre, zones à effets, pression en exploration, suiveurs par
  scène, profil `enfant` ; mesure de cinq suiveurs.
- **Dépend de** : 5.1, 5.3 (condition `tempo`)
- **Lire** : §4.5 ; ADR 0024 ; [`08-EXPLORATION.md`](../../design/08-EXPLORATION.md) (« Le groupe »,
  « Les objets du monde ») ; `src/explore/types.ts`, `validateMap.ts`, `exploreState.ts`
  (`checkZones`, `setFollowers`) ; `src/exploreSession.ts` ; `src/render/exploreView.ts`
  (choix des visuels et `def.id`) ; `src/data/exploreVisuals/` ; `src/narrative/radio.ts`.
- **Toucher** : les fichiers lus, `src/data/exploreVisuals/index.ts` (nouveau),
  `characterProfiles.ts`, `chapter.ts`.
- **Fini quand** :
  - `tests/unit/exploreFlight.test.ts` : une zone à effets avance le tempo une seule fois ;
    une réplique de pression échue apparaît en exploration ; `validateMap` refuse un effet
    autre que tempo, flag ou counter sur une zone ;
  - les tests d'accord carte/visuels passent pour `holt` et `centre-examen` sans
    changement de rendu ;
  - mesure notée dans ce document : appels de dessin et images par seconde au dortoir avec
    cinq suiveurs ; décision prise sur B9.
- **Documents** : `08-EXPLORATION.md`, `ENGINE-COUPLING.md` (couplages nouveaux, soldés),
  `CAPABILITIES.md` (EXP-08 : groupe de cinq ; EXP-03 : zone à effets ; RES-03 : pression).

### Lot 5.8 — le bal et la fuite

- **But** : scènes 2 et 4 jouées sur `holt-nuit` : le bal (objectif, cinq conversations
  avec leurs échos, l'invitation), puis la fuite (tempo, seuils, portes fermées, silhouettes
  de gangers, choix du porteur, grille, options `solitaire`/`loyal-bande`).
- **Dépend de** : 5.5, 5.7
- **Lire** : GAME-DESIGN §4 (scènes 2, 4), §4.4 à 4.6 ; `src/data/maps/holt.ts` ;
  `src/data/exploreVisuals/holt.ts` ; [`ROOM-COMPOSITION.md`](../../art/ROOM-COMPOSITION.md)
  (salles d'entraînement, dortoirs).
- **Toucher** : `src/data/maps/holt-nuit.ts`, `src/data/exploreVisuals/holtNuit.ts`,
  `data/maps/index.ts`, `ch2.bal*.json`, `ch2.grille.json`, `data/chapters/ch2.ts` et
  `ch2Radio.ts` (répliques de pression).
- **Fini quand** :
  - `tests/unit/exploreScenes.test.ts` (existant) couvre les scènes `explore` du chapitre 2
    (règle du déclencheur) ;
  - `ch2Content.test.ts` : chaque écho du bal est lu là où §4.6 le dit ;
  - une manche de captures : bal, fuite avec la file, une porte fermée.
- **Documents** : `09-MAPS-CHAPTER-1.md`, ou un nouveau `docs/design/10-MAPS-CHAPTER-2.md` si
  la variante le demande.

### Lot 5.9 — les conduits et la cantine

- **But** : scènes 5 et 6 sur la carte `conduits` : bifurcation, détour facultatif chez
  Smith, ventilateur (Piratage, puis Électronique), enfant, cantine en feu, vide-ordures.
- **Dépend de** : 5.7, 5.8
- **Lire** : GAME-DESIGN §4 (scènes 5, 6) ; §4.4 ; `src/data/maps/centre-examen.ts` (modèle
  de carte à étapes) ; `08-EXPLORATION.md` (« Format des cartes »).
- **Toucher** : `src/data/maps/conduits.ts`, `src/data/exploreVisuals/conduits.ts`,
  `ch2.smith.json`, `ch2.enfant.json`, `ch2.conduits*.json`, `ch2.cantine.json`.
- **Fini quand** : `exploreScenes.test.ts` et `ch2Content.test.ts` couvrent la carte ; une
  manche de captures (conduit, labo, cantine).
- **Documents** : `10-MAPS-CHAPTER-2.md`.

### Lot 5.10 — le campement

- **But** : scène 9 : insignes au scorpion, matériel, **qui tue Murano** et comment.
- **Dépend de** : 5.7, 5.5
- **Lire** : GAME-DESIGN §4 (scène 9) ; §4.4 ; `src/data/maps/centre-examen.ts`.
- **Toucher** : `src/data/maps/campement.ts`, `src/data/exploreVisuals/campement.ts`,
  `ch2.murano.json`, `ch2.campement*.json`.
- **Fini quand** : `ch2Content.test.ts` : `a-tue` si et seulement si Franklyn tue ; le fusil
  est vide sur l'échec du tueur ; une capture du campement.
- **Documents** : `10-MAPS-CHAPTER-2.md`.

### Lot 5.A — les illustrations (en parallèle, dès 5.3)

- **But** : décors plein cadre en `.webp` légers (≈ 1280 px), tirés des images de
  `docs/art/Reference_pictures/Chapter2/` : photo, slow (×2), attaque, égouts, Badlands,
  académie en feu, décharges, clinique (accueil, rue), campement, labo de Smith. Plus six
  portraits (Smith, l'enfant, Murano, le guide, le charcudoc, un ganger).
- **Dépend de** : 5.3 (registre des décors)
- **Lire** : [`ART-PIPELINE.md`](../../art/ART-PIPELINE.md),
  [`image-generation/ORCHESTRATOR.md`](../../art/image-generation/ORCHESTRATOR.md).
- **Toucher** : `public/assets/backdrops/`, `public/assets/portraits/`, `data/backdrops.ts`,
  `ui/portraits.ts`.
- **Fini quand** : chaque clé de décor citée par un dialogue du chapitre 2 pointe vers un
  fichier présent (test existant de validation étendu) ; une planche de captures.
- **Documents** : `ART-PIPELINE.md` (inventaire).

### Lot 5.11 — revue de bout en bout

- **But** : une nuit complète jouée à la souris avec chaque profil, et depuis une archive
  réelle du chapitre 1 ; performances sur la cible ; les documents de transmission.
- **Dépend de** : tout le reste (sauf 5.12)
- **Lire** : ce document ; `CAPABILITIES.md`.
- **Toucher** : corrections ; `docs/chapters/CH2-LEGACY.md` (nouveau) ; `CAPABILITIES.md` ;
  `ENGINE-COUPLING.md`.
- **Fini quand** : e2e `chapter2.spec.ts` complété (fin atteinte, bilan affiché, entrées
  finales présentes) ; captures des vues décisives ; mesures notées.
- **Documents** : `CH2-LEGACY.md`, ROADMAP (epic close), AGENTS.md §2.

### Lot 5.12 — la musique du slow (facultatif)

- **But** : une piste fournie par le propriétaire joue au slow et se coupe net sur la rafale
  (`sound.music`, ADR 0023).
- **Dépend de** : 5.5, et la piste.

### Dépendances

```
5.1 ──▶ 5.2
 │
 ├──▶ 5.3 ──▶ 5.4 ──▶ 5.5 ──▶ 5.6 ─────────────────┐
 │     │             │                              │
 │     ├──▶ 5.A      ├──────────────▶ 5.10 ─────────┤
 │     │             │                              ├──▶ 5.11
 └─────┴──▶ 5.7 ─────┴──▶ 5.8 ──▶ 5.9 ──────────────┘
                                   (5.12 facultatif, après 5.5)
```

Ordre conseillé : 5.1 ; puis 5.2, 5.3 et 5.7 en parallèle (fichiers presque disjoints :
`chapter.ts` est touché par les trois, dans des méthodes différentes, donc **à fusionner
avec soin**) ; puis 5.4 ; 5.5 ; puis 5.6, 5.8 et 5.10 ; puis 5.9 ; enfin 5.11. 5.A court en
parallèle dès 5.3.

## 7. Risques

| Risque | Parade |
|---|---|
| Régression du chapitre 1 en généralisant `ChapterApp` | 5.1 enveloppe l'existant sans le réécrire ; les tests et l'e2e du chapitre 1 ne changent pas ; les cas particuliers restent gardés par leurs identifiants |
| Cinq suiveurs trop lourds sur la cible | mesure au lot 5.7 ; repli B9 🟢 (deux visibles, le reste en narration) |
| Les jets de la nuit produisent toujours la même issue | simulateur du lot 5.6, sur les trois profils ; DV ajustées avant les cartes |
| Volume de contenu (≈ 75 min, 25 fichiers de dialogue) | le squelette de 5.1 garde le chapitre jouable à chaque lot ; le contenu arrive scène par scène |
| Trois cartes nouvelles, coût d'habillage | `holt-nuit` réemploie l'habillage de `holt` ; `conduits` et `campement` sont petites ; lumière et narration avant le mobilier |
| `docs/art/Reference_pictures/Chapter2/` pèse 31 Mo et n'est pas versionné | décision du propriétaire (l'exception d'AGENTS.md §6 couvre le dossier parent) ; le jeu n'en sert que des dérivés `.webp` légers |
| La jauge rend le chapitre « comptable » | quatre libellés en mots, pas de chiffres ; tampon bref au changement ; retrait possible par la donnée (`gauges` vide) |
| `chapter.ts` touché par trois lots parallèles | chaque lot cite les méthodes qu'il touche ; 5.2, 5.3 et 5.7 se rebasent l'un sur l'autre avant de se fusionner |
