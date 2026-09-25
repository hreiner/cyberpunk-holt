# Où le moteur suppose encore le chapitre 1

Pour la **phase 2** seulement ([`README.md`](README.md)). Le moteur a été écrit pour un seul
chapitre : ses couches sont propres (ARCHITECTURE), mais plusieurs points câblent en dur une
scène, un drapeau ou une liste du chapitre 1. Ce document les recense pour que le design
technique du chapitre 2 décide, pour chacun : **généraliser**, **dupliquer pour le chapitre
2**, ou **laisser** (sans objet pour ce chapitre).

État relevé le 2026-09-25 ; les numéros de ligne bougent, les noms de symboles font foi.
Rayer une ligne quand elle est soldée.

## 1. Le chapitre lui-même

| Point de couplage | Où | Conséquence pour un chapitre 2 |
|---|---|---|
| La liste des scènes est une constante unique `CHAPTER_1_SCENES` | `src/narrative/sceneRouter.ts` | il faut une liste par chapitre et un moyen de choisir laquelle jouer (paramètre d'URL, écran titre) |
| Les étapes d'exploration sont un type fermé `Ch1Etape`, posées dans le drapeau `ch1.etape` (`CH1_ETAPE_FLAG`) | `sceneRouter.ts`, lu par les `condition` de `src/data/maps/holt.ts` | type et nom de drapeau par chapitre, ou un drapeau d'étape générique |
| La scène initiale est `'ch1.intro'` (`INITIAL_SCENE_ID`) | `src/narrative/runState.ts` | `createRunState` doit connaître le chapitre |
| `ChapterApp` est l'orchestrateur du chapitre 1 : cas particuliers du tirage (`TIRAGE_SCENE_ID`), du procès-verbal, de l'examen | `src/chapter.ts` (≈ 30 références `ch1.`) | la plus grosse pièce à désépaissir ; isoler ce qui est propre au chapitre 1 derrière des crochets déclarés dans les données de scène |
| Numérotation et titres des scènes affichés | `src/ui/narrativeView.ts` (table `sceneId → numéro`) | table par chapitre, ou portée par `SceneDef` |
| Décor plein cadre par dialogue | `src/ui/sceneChrome.ts` (table `dialogueId → image`), zones `SceneZone` fermées (`academy`, `transit`, `interior`, `bal`) | idem ; nouvelles zones pour de nouveaux lieux |
| Encarts de l'examen (concentration, vigilance) | `src/ui/narrativeView.ts` | sans objet sauf si le chapitre 2 réemploie le mécanisme |
| Registre des dialogues et des cartes | `src/data/dialogues/registry.ts`, `src/data/maps/index.ts`, `src/data/exploreVisuals/` | ajouter des entrées suffit — pas un couplage, un point d'extension |

## 2. L'état de partie et le dossier

| Point de couplage | Où | Conséquence |
|---|---|---|
| La Chance dépensée s'écrit sous `ch1.chance` / `ch1.chance.total` | `src/narrative/dialogueRunner.ts` (`LUCK_ENTRY_KEY`, `LUCK_SPENT_COUNTER`) | clé par chapitre, sinon le chapitre 2 écrase l'entrée du chapitre 1 |
| La réserve de Chance initiale est une constante (`INITIAL_LUCK`) | `runState.ts` | par chapitre si le montant change |
| L'équipe par défaut et la capitaine adverse (`DEFAULT_BLUE`, `DEFAULT_RED`, `redCaptain: 'abigail'`) | `runState.ts`, `src/narrative/draft.ts` | le roster suppose deux équipes de cadets ; un chapitre sans exercice n'a pas de « rouge » |
| `TeamState` connaît trois champs propres au parcours (`healkits`, `extraTaser`, `gassedMembers`) | `src/tactical/types.ts` | un nouveau matériel d'équipe = un champ, un effet `team`, un branchement combat |
| Le barème lit trois drapeaux des salles (`ch1.salle1.otage-sauve`…) | `src/rules/scoring.ts` | le barème est celui de l'examen pratique ; un autre chapitre aura un autre barème — ou aucun |
| La résolution hors champ de l'équipe adverse | `src/narrative/offscreen.ts` | propre au chapitre 1 ; à ne réemployer que si le schéma « équipe rivale parallèle » revient |
| **Le dossier traverse les chapitres en théorie, pas en pratique** : `exportDossier()` n'est appelé nulle part (lot 2.12), le stockage est `holt.dossier.v1`, et une nouvelle partie repart d'un dossier vierge | `src/core/save.ts`, `src/core/dossier.ts`, `ChapterApp.isResumingRun` | **décision d'ADR** : comment un chapitre 2 obtient le dossier du 1 (reprise locale, import d'un fichier, dossier « type » par défaut pour démarrer directement) ; le champ `chapter` des entrées existe déjà |
| La règle « nouvelle partie = dossier vierge » | `src/chapter.ts` | devient « nouveau chapitre 1 = dossier vierge ; chapitre 2 = dossier hérité » |

## 3. Les personnages

| Point de couplage | Où | Conséquence |
|---|---|---|
| `CharacterId` est une union fermée des six cadets | `src/rules/character.ts` | tout nouveau personnage jouable ou combattant l'étend ; fiche dans `characters.json`, rig, portrait |
| `SpeakerId` est une union fermée (cadets + narrateur, directeur, instructeur, otage, radio) | `src/narrative/types.ts` | tout nouveau locuteur l'étend ; le validateur de dialogue refuse les autres ; portrait dans `src/ui/portraits.ts` |
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
| `window.__game` nomme des scènes du chapitre 1 (`goToScene('ch1.affrontement')`…) | `src/debug/gameApi.ts`, [DEBUG_API](../process/DEBUG_API.md) | contrat public : toute évolution passe par `DEBUG_API.md` et `tests/e2e/debug-api.d.ts` |
| Le test « aucun cul-de-sac » et les tests de parcours tirent les compositions du chapitre 1 | `tests/unit/` | à répliquer pour le chapitre 2 ; ce sont eux qui gardent le chapitre jouable |
| `?scene=` saute à une scène du chapitre 1 | `src/main.ts`, `src/chapter.ts` | doit pouvoir cibler un chapitre |

## Ce qui est déjà générique

Pour ne pas le réécrire par excès de prudence : le moteur de dialogue (format, conditions,
effets, jets, Chance, alias), le socle d'exploration (`MapDef`, entités, découverte,
objectifs), le rendu d'exploration déclaratif (ADR 0017), le dé 3D, la radio indexée sur le
tempo, le RNG, la sauvegarde tolérante aux pannes. Le chapitre 2 les **alimente**, il ne les
modifie pas — sauf besoin identifié par le game design.
