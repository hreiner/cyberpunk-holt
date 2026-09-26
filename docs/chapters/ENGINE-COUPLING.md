# Où le moteur suppose encore le chapitre 1

Pour la **phase 2** seulement ([`README.md`](README.md)). Le moteur a été écrit pour un seul
chapitre : ses couches sont propres (ARCHITECTURE), mais plusieurs points câblent en dur une
scène, un drapeau ou une liste du chapitre 1. Ce document les recense pour que le design
technique du chapitre 2 décide, pour chacun : **généraliser**, **dupliquer pour le chapitre
2**, ou **laisser** (sans objet pour ce chapitre).

État relevé le 2026-09-25, mis à jour à la revue de l'epic 5 (lot 5.11, 2026-09-26) ; les numéros
de ligne bougent, les noms de symboles font foi. Rayer une ligne quand elle est soldée. Les
couplages découverts pendant le chapitre 2 sont au §6.

## 1. Le chapitre lui-même

| Point de couplage | Où | Conséquence pour un chapitre 2 |
|---|---|---|
| ~~La liste des scènes est une constante unique `CHAPTER_1_SCENES`~~ **soldé (lot 5.1)** | `src/narrative/sceneRouter.ts`, `src/narrative/chapter.ts` (`ChapterDef`), `src/data/chapters/` (`CHAPTERS`, `chapterOfScene`) | `CHAPTER_1_SCENES` garde son nom et son contenu, enveloppée dans une `ChapterDef` ; le chapitre 2 a la sienne (`CHAPTER_2_SCENES`) ; choix par `?chapter=`, `window.__game.startChapter()` |
| ~~Les étapes d'exploration sont un type fermé `Ch1Etape`, posées dans le drapeau `ch1.etape` (`CH1_ETAPE_FLAG`)~~ **soldé (lot 5.1)** | `sceneRouter.ts` (`SceneDef.etape: string`, `SceneRouter`/`withEtape` reçoivent `etapeFlag`), lu par les `condition` de `src/data/maps/holt.ts` | `ChapterDef.etapeFlag` porte le nom du drapeau par chapitre (`ch2.etape` pour le second) ; `Ch1Etape` reste l'union du chapitre 1, un futur `Ch2Etape` s'ajoutera au lot 5.7 (cartes du chapitre 2) |
| ~~La scène initiale est `'ch1.intro'` (`INITIAL_SCENE_ID`)~~ **soldé (lot 5.1)** | `src/narrative/runState.ts` | `createRunState(seed, start?)` reçoit la scène initiale et la Chance du chapitre ; sans argument, comportement du chapitre 1 inchangé |
| `ChapterApp` est l'orchestrateur du chapitre 1 : cas particuliers du tirage (`TIRAGE_SCENE_ID`), du procès-verbal, de l'examen | `src/chapter.ts` (≈ 30 références `ch1.`) | **laissé, par choix (ADR 0021 §Décision 5)** : ces cas particuliers restent en place, gardés par leurs identifiants de scène (`ch1.*`, que le chapitre 2 n'emploie pas) ; ce qui était commun (liste de scènes, radio, drapeau d'étape, Chance de départ) est généralisé derrière `this.chapterDef` |
| ~~Numérotation et titres des scènes affichés~~ **soldé (lot 5.1)** | `src/ui/narrativeView.ts` (`sceneNumberFor`/`totalScenesFor`/`chapterStampFor`) | `SceneDef.number` porte le numéro par scène (chapitre 2) ; la table `SCENE_NUMBERS`/`TOTAL_SCENES` du chapitre 1 reste en repli, inchangée |
| ~~Décor plein cadre par dialogue~~ **soldé (lot 5.3, ADR 0023)** | `src/data/backdrops.ts`, `src/ui/sceneChrome.ts` | `backdrop` par fichier ou par nœud, clé du registre (validée) ; la table du chapitre 1 reste en repli ; zones `nuit`/`ville` |
| Encarts de l'examen (concentration, vigilance) | `src/ui/narrativeView.ts` | sans objet, le chapitre 2 ne réemploie pas le mécanisme |
| Registre des dialogues et des cartes | `src/data/dialogues/registry.ts`, `src/data/maps/index.ts`, `src/data/exploreVisuals/` | ajouter des entrées suffit — pas un couplage, un point d'extension ; les 14 dialogues squelettes du chapitre 2 y sont depuis le lot 5.1 |
| ~~Les suiveurs d'exploration sont toujours « les deux coéquipiers du tirage » (`exploreFollowerIds`)~~ **soldé (lot 5.7, ADR 0024 §3)** | `src/narrative/sceneRouter.ts` (`FollowerId`, `SceneDef.followers`, `VISIBLE_FOLLOWERS_LIMIT`), `src/chapter.ts` (`exploreFollowers`) | `SceneDef.followers` déclare la liste par étape (jusqu'à l'enfant, `FollowerId = CharacterId \| 'enfant'`) ; absent, la règle du chapitre 1 s'applique telle quelle |
| ~~`ExploreView` compare `MapDef.id` à `'holt'`/`'centre-examen'` pour choisir palette, mur, architecture~~ **soldé (lot 5.7, ADR 0024 §4)** | `src/render/exploreView.ts` (`this.visuals`), `src/data/exploreVisuals/index.ts` (`EXPLORE_VISUALS`) | une carte nouvelle déclare son habillage dans le registre (`coldPalette`, `dormitoryArchitecture`) ; le rectangle de conteneurs empilés se déduit de `MapDef.tacticalArea` (pas de champ séparé à tenir synchronisé) |

## 2. L'état de partie et le dossier

| Point de couplage | Où | Conséquence |
|---|---|---|
| ~~La Chance dépensée s'écrit sous `ch1.chance` / `ch1.chance.total`~~ **soldé (lot 5.1)** | `src/narrative/dialogueRunner.ts` (`luckEntryKey(chapter)`, `luckSpentCounter(chapter)`) | clé calculée d'après `run.chapter` (`ch<N>.chance`/`ch<N>.chance.total`) : le chapitre 2 n'écrase plus l'entrée du chapitre 1 |
| ~~`NARRATIVE_CHAPTER` fixe le chapitre des entrées de dossier~~ **soldé (lot 5.1)** | `src/narrative/effects.ts` | la constante a disparu ; l'effet `{ entry: ... }` lit `ctx.run.chapter` (`draft.ts` fait de même pour l'entrée du tirage) |
| La réserve de Chance initiale est une constante (`INITIAL_LUCK`) | `runState.ts` | **soldé (lot 5.1)** : `ChapterDef.initialLuck` (3 pour les deux chapitres à ce jour) ; `INITIAL_LUCK` reste le repli de `createRunState(seed)` sans argument |
| L'équipe par défaut et la capitaine adverse (`DEFAULT_BLUE`, `DEFAULT_RED`, `redCaptain: 'abigail'`) | `runState.ts`, `src/narrative/draft.ts` | le roster suppose deux équipes de cadets ; un chapitre sans exercice n'a pas de « rouge » |
| `TeamState` connaît trois champs propres au parcours (`healkits`, `extraTaser`, `gassedMembers`) | `src/tactical/types.ts` | un nouveau matériel d'équipe = un champ, un effet `team`, un branchement combat |
| Le barème lit trois drapeaux des salles (`ch1.salle1.otage-sauve`…) | `src/rules/scoring.ts` | le barème est celui de l'examen pratique ; un autre chapitre aura un autre barème — ou aucun |
| La résolution hors champ de l'équipe adverse | `src/narrative/offscreen.ts` | propre au chapitre 1 ; à ne réemployer que si le schéma « équipe rivale parallèle » revient |
| ~~Le dossier traverse les chapitres en théorie, pas en pratique~~ **soldé (lot 5.2, ADR 0022)** | `src/core/save.ts` (`archiveDossier`/`loadArchivedDossier`, clé `holt.archive.ch<N>.v1`), `src/chapter.ts` (`showChapterEnd`, `continueToNextChapter`, `startChapter`) | atteindre la fin d'un chapitre archive son dossier ; l'écran de fin propose la suite directe (dossier en mémoire) ; l'écran titre reprend l'archive ou ouvre le choix de profil (`ch2Profiles.ts` : Loyal à la bande, Solitaire, Neutre) ; `exportDossier()`/`importDossier()` (lot 2.12, fichier) restent ouverts mais ne bloquent plus rien |
| ~~La règle « nouvelle partie = dossier vierge »~~ **soldé (lot 5.2)** | `src/chapter.ts` (`startingDossier`) | « nouveau chapitre 1 = dossier vierge ; chapitre 2 = profil explicite, sinon archive si `useArchive`, sinon profil Neutre » ; une nouvelle partie du chapitre 1 n'efface jamais l'archive (seule une nouvelle fin la remplace) |

## 3. Les personnages

| Point de couplage | Où | Conséquence |
|---|---|---|
| `CharacterId` est une union fermée des six cadets | `src/rules/character.ts` | tout nouveau personnage jouable ou combattant l'étend ; fiche dans `characters.json`, rig, portrait |
| `SpeakerId` est une union fermée (cadets + narrateur, directeur, instructeur, otage, radio ; **étendue au lot 5.3** : smith, enfant, murano, guide, charcudoc, ganger) | `src/narrative/types.ts` | tout nouveau locuteur l'étend ; le validateur de dialogue refuse les autres ; portrait dans `src/ui/portraits.ts` |
| Les traits sont une union fermée câblée dans le moteur (test `traits.test.ts`) | `src/rules/character.ts`, `src/tactical/` | un trait nouveau = code + test, jamais seulement des données |
| Alias `equipier1`/`equipier2`/`rivale` supposent la composition du tirage | `src/narrative/aliases.ts` | à redéfinir si le chapitre 2 compose le groupe autrement |

## 4. Le combat

| Point de couplage | Où | Conséquence |
|---|---|---|
| `TacticalCombat` accepte une carte ASCII en paramètre, mais retombe sur `YARD_MAP_ASCII` | `src/tactical/combat.ts` | une autre carte tactique est possible côté moteur ; à vérifier côté rendu (`yardView.ts`) et côté exploration |
| `tacticalArea.mapId` est typé `'yard'` littéral | `src/explore/types.ts` | à élargir pour embarquer une autre arène dans une carte d'exploration |
| Trois contre trois, cadets contre cadets, taser seul, victoire par neutralisation, limite de rounds | `src/tactical/`, [05](../design/05-TACTICAL-COMBAT.md) | tout écart (adversaires non-cadets, effectifs différents, objectif de mission) est au moins 🟡 |
| Pas de points de vie (ADR 0003) | `src/tactical/combat.ts` | de vrais enjeux vitaux remettent en cause un ADR — décision du propriétaire |
| Une IA, un profil | `src/tactical/ai.ts` | nouveaux comportements = nouveau code et nouvelles simulations |

## 5. Les outils

| Point de couplage | Où | Conséquence |
|---|---|---|
| `window.__game` nomme des scènes du chapitre 1 (`goToScene('ch1.affrontement')`…) | `src/debug/gameApi.ts`, [DEBUG_API](../process/DEBUG_API.md) | contrat public, inchangé : toute évolution passe par `DEBUG_API.md` et `tests/e2e/debug-api.d.ts` ; `goToScene` accepte maintenant un id de n'importe quel chapitre (bascule dessus au besoin), et `startChapter(id, options?)` s'ajoute (lot 5.1) |
| ~~Le test « aucun cul-de-sac » et les tests de parcours tirent les compositions du chapitre 1~~ **soldé pour 5.1** | `tests/unit/narrativeDeadEnds.test.ts` (chapitre 1), `tests/unit/chapter2Flow.test.ts` (chapitre 2, lot 5.1) | dupliqué avec la forme adaptée au contenu de chaque chapitre (le chapitre 2 n'a encore aucune condition de choix à ce lot : le test balaie exhaustivement toutes les combinaisons de choix plutôt que d'échantillonner) |
| ~~`?scene=` saute à une scène du chapitre 1~~ **soldé (lot 5.1)** | `src/main.ts`, `src/chapter.ts` | `?scene=` déduit son chapitre (`chapterOfScene`) ; `?chapter=N` choisit le chapitre au démarrage |

## 6. Découverts pendant le chapitre 2

| Couplage | Où | État |
|---|---|---|
| ~~`SceneRouter.goTo(id)` retient la PREMIÈRE `SceneDef` de l'identifiant, même quand son `when` est faux~~ **soldé (lot 5.11)** | `src/narrative/sceneRouter.ts` | `ChapterApp.advanceRouter` repart de `goTo(run.sceneId)` : avec des scènes jumelles, `next()` depuis la mauvaise jumelle tombait sur l'autre -- avec Abigail pour porteuse, la grille relançait la fuite (défaut de QA). `goTo` retient désormais la jumelle éligible ; gardé par `chapter2Flow.test.ts` et `chapter2.spec.ts` |
| ~~Le portrait hero « garde le dernier locuteur » d'un fichier de dialogue au suivant~~ **soldé (lot 5.11)** | `src/ui/narrativeView.ts` (`renderHero`) | le repli ne vaut plus qu'à l'intérieur d'un fichier ; un fichier qui s'ouvre sur de la narration n'a pas de portrait (Murano restait affiché aux décharges) |
| ~~Le dialogue du déclencheur d'objectif clôt toujours l'étape~~ **soldé (lot 5.11)** | `src/narrative/objective.ts` (`completesWhen`), `src/chapter.ts` (`completeExploreConversation`), `src/explore/exploreState.ts` | `ObjectiveDef.completesWhen` : l'étape ne se clôt qu'à la fin du dialogue du déclencheur si la condition est vraie ; sinon retour à l'exploration, dialogue rejouable (le bal attend l'invitation) |
| ~~Une porte d'une autre étape reste survolable, avec son identifiant brut pour libellé~~ **soldé (lot 5.11)** | `src/render/exploreView.ts` (`setActiveDoors`), `src/exploreSession.ts` (`syncVisibility`) | seules les portes actives à l'étape se survolent et se cliquent (les portes de la fuite pendant le bal affichaient « fuite.porte-cour-ouest ») |
| Le panneau de porte est toujours posé mince en z | `src/render/exploreView.ts` (construction des `WallCellInfo`) | **laissé** : dans un mur nord-sud (la grille du dortoir), la porte se voit de profil ; la cible de clic reste suffisante (mesurée au lot 5.11), mais la lisibilité est faible. Corriger change aussi le rendu du chapitre 1 : décision du propriétaire |
| ~~Les murs de couloir ne se coupent pas : le couloir de ceinture de `holt`/`holt-nuit` cache Franklyn et la file~~ **soldé (lot 5.11b)** | `src/explore/corridors.ts`, `src/render/exploreView.ts` (`recomputeCutaway`, `syncActiveCorridor`) | ADR 0027 : un couloir est déduit du plan (espace hors de toute `RoomDef`) ; ses murs se coupent comme ceux d'une pièce tant que Franklyn y est. Sans annotation des cartes ; vaut pour le chapitre 1 (`holt`) comme pour le chapitre 2. Gardé par `exploreMap.test.ts` |
| La jauge est calculée deux fois (`ChapterApp` et `ExploreSession.gaugeStatusFor`) | `src/chapter.ts`, `src/exploreSession.ts` | **laissé** (choix du lot 5.8) : deux copies courtes qui lisent la même donnée |
| `chapter2Flow` et `simulate-ch2` rejouent les scènes `explore` par une règle générique lue sur la `MapDef`, pas par le moteur d'exploration | `tests/unit/chapter2Flow.test.ts`, `scripts/simulate-ch2.ts` | **laissé** : rapide et exhaustif, mais aveugle à ce que seul `ChapterApp` fait (routeur, conversations) -- les trois défauts de QA du lot 5.11 lui échappaient. Le parcours au clic de `chapter2.spec.ts` complète |

## Ce qui est déjà générique

Pour ne pas le réécrire par excès de prudence : le moteur de dialogue (format, conditions,
effets, jets, Chance, alias), le socle d'exploration (`MapDef`, entités, découverte,
objectifs, zones à effets), le rendu d'exploration déclaratif (ADR 0017), le dé 3D, la radio
indexée sur le tempo (dialogue et exploration, canal `radio`/`pression`, ADR 0024 §2), le RNG,
la sauvegarde tolérante aux pannes. Le chapitre 2 les **alimente**, il ne les modifie pas —
sauf besoin identifié par le game design.
