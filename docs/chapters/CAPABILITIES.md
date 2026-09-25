# Ce que le jeu sait faire — la palette du concepteur

Catalogue des capacités **livrées** à la fin du chapitre 1, vues du joueur et du concepteur,
pas du programmeur. Il sert à la phase 1 ([`README.md`](README.md)) : concevoir un chapitre
en sachant ce qui est gratuit, ce qui coûte un peu, et ce qui demande un nouveau système.

Chaque capacité porte un **identifiant stable** (`DLG-03`) que le game design cite dans son
tableau des besoins, et un pointeur vers sa spécification — que seule la phase 2 ouvre.

## L'échelle de coût

| | Coût | Ce que ça veut dire | Exemple |
|---|---|---|---|
| 🟢 | **Données** | nouveau contenu dans un format existant : JSON de dialogue, carte ASCII, réplique radio, fiche | une conversation, une salle, une porte verrouillée |
| 🟡 | **Extension** | petite évolution d'un système existant, quelques fichiers, un test | un nouvel effet de dialogue, un trait, une action tactique, un type d'entité |
| 🔴 | **Nouveau système** | un mécanisme que rien ne porte aujourd'hui ; ADR obligatoire | des blessures létales, un inventaire, un mini-jeu |

Règle d'or pour le concepteur : **une scène 🟢 bien écrite vaut mieux qu'une scène 🔴 à
moitié faite.** Le chapitre 1 entier tient presque tout en 🟢 sur quatre systèmes.

---

## STR — La structure d'un chapitre

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| STR-01 | **Suite linéaire de scènes** de trois sortes : `dialogue`, `explore`, `tactical` | l'ossature du chapitre ; l'ordre est fixe, les variations passent par l'état | 🟢 (ajouter une scène) | [ARCHITECTURE](../process/ARCHITECTURE.md), ADR 0011 |
| STR-02 | **Sauvegarde automatique** à chaque début de scène ; reprise au point d'apparition de l'étape | jamais de sauvegarde libre ; une scène doit pouvoir reprendre à froid | gratuit | [08](../design/08-EXPLORATION.md) « Sauvegarde » |
| STR-03 | **Écran titre**, **procès-verbal** (bilan d'exercice entre deux écrans) | réutilisables tels quels | gratuit | ARCHITECTURE |
| STR-04 | **Graine** : toute partie est rejouable à l'identique (`?seed=`) | les jets sont aléatoires mais reproductibles ; aucun hasard « caché » | gratuit | ADR 0002 |

**Limite** : pas d'embranchement de scènes (pas d'« acte B » alternatif). Deux chemins
différents = une scène commune dont le contenu varie selon l'état. Un vrai arbre de scènes
serait 🔴.

## DLG — Le dialogue

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| DLG-01 | **Graphe de nœuds** : narration, répliques, choix, enchaînements | toute conversation, toute scène lue | 🟢 | [07](../design/07-DIALOGUE-FORMAT.md) |
| DLG-02 | **Choix à jet** `[Compétence]` avec chance de réussite affichée ; l'échec mène toujours ailleurs | le cœur du pilier « le dé raconte » ; un jet raté ouvre une autre suite, jamais un mur | 🟢 | 07 |
| DLG-03 | **Jet lancé par un coéquipier** (`who`) | faire briller un compagnon sur sa compétence | 🟢 | 07 |
| DLG-04 | **Conditions** sur un choix : drapeau, étiquette, affinité (seuils), coéquipier présent, combinaisons `not/all/any` | options qui n'existent que pour certains joueurs ; branchements silencieux (idiome « Continuer. ») | 🟢 | 07 |
| DLG-05 | **Effets** : affinité, étiquette de dossier, entrée de dossier, drapeau, compteur, tempo, matériel d'équipe, note écrite | toute conséquence d'un choix | 🟢 (combinaison) · 🟡 (nouvel effet) | 07 |
| DLG-06 | **Jet de réflexion** (`insight`) qui révèle la meilleure réponse (`best`) ; obligatoire, ou facultatif et payé sur un compteur | un examen, un interrogatoire, une énigme : savoir contre instinct | 🟢 | ADR 0012, 0015 |
| DLG-07 | **DV variable** selon un compteur (`dvByCounter`) | une tension qui monte : vigilance, alerte, méfiance | 🟢 | ADR 0015 §3 |
| DLG-08 | **Alias** `{equipier1}`, `{equipier2}`, `{rivale}` et variantes par cadet (`teammate`) | écrire une fois pour toutes les compositions d'équipe | 🟢 | ADR 0014 §7 |
| DLG-09 | **Points d'entrée multiples** d'un même fichier (`startNode`) | plusieurs objets d'une pièce partagent un fichier, chacun son moment | 🟢 | 07 |
| DLG-10 | **Portrait** du locuteur, **décor plein cadre** par dialogue | chaque dialogue a son image de lieu | 🟢 si l'image existe · art à produire sinon | [UI-DESIGN-SYSTEM](../art/UI-DESIGN-SYSTEM.md) |
| DLG-11 | **Dé 3D** qui roule à l'écran, chaîne d'explosion visible | gratuit sur tout jet | gratuit | ADR 0012 |

**Limites** : locuteurs en liste fermée (six cadets, narrateur, directeur, instructeur,
otage, radio) — un nouveau personnage parlant est 🟡. Pas de minuterie de choix, pas de
choix « silencieux » à la Telltale.

## RES — Les ressources et l'état

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| RES-01 | **Chance** : réserve pour le chapitre ; après un jet raté de peu, le joueur peut payer la différence | arbitrage « maintenant ou plus tard » ; réglable par chapitre | 🟢 (montant) | ADR 0015 §2 |
| RES-02 | **Compteurs et drapeaux** de partie (volatils, perdus en fin de chapitre) | concentration, vigilance, « déjà vu », étapes | 🟢 | ADR 0011 |
| RES-03 | **Tempo, minuteur invisible** : avancé par les actions, jamais par l'horloge ; déclenche des **répliques radio** à seuil | pression temporelle sans barre de temps | 🟢 | 07 « La radio » |
| RES-04 | **Matériel d'équipe** porté jusqu'au combat : kits de soin, taser en plus, cadets gazés | un choix en exploration change la bataille qui suit | 🟢 (ces trois) · 🟡 (un nouveau) | [03](../design/03-CHAPTER-1.md) scène 7 |
| RES-05 | **Affinités** −3 à +3 avec les cinq cadets, persistantes | relations qui bougent et qui se lisent plus tard | 🟢 | [04](../design/04-CHARACTERS.md) |

## DOS — La trace (dossier du candidat)

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| DOS-01 | **Étiquettes** en vocabulaire fermé, persistantes entre chapitres | la mémoire narrative : une étiquette posée doit être lue quelque part | 🟢 (en ajouter = étendre le tableau) | [06](../design/06-SCORING-DOSSIER.md) |
| DOS-02 | **Entrées** clé/valeur (réponses, choix notables) | détail fin, lisible par un chapitre ultérieur | 🟢 | 06 |
| DOS-03 | **Notes** : pratique /20 avec mention, écrite /6 | une évaluation chiffrée qui ressort ensuite | 🟡 (autre barème) | 06 |

**Limite** : le dossier est exportable en code mais aucun écran ne le propose au joueur
(lot 2.12). Comment le chapitre 2 le récupère est une question de phase 2
(voir [`ENGINE-COUPLING.md`](ENGINE-COUPLING.md)).

## EXP — L'exploration

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| EXP-01 | **Carte à la case de 1 m** en ASCII : murs, portes, vitres, mobilier bas/haut, végétation ; pièces nommées | un lieu jouable ; deux cartes au chapitre 1 (académie 52 × 64, centre d'examen) | 🟢 (carte) + habillage 3D à composer | [09](../design/09-MAPS-CHAPTER-1.md) |
| EXP-02 | **Découverte des pièces** : contenu caché tant qu'on n'est pas entré | suspense, envie de pousser la porte suivante | gratuit | 08 |
| EXP-03 | **Entités** : `npc` (dialogue ou bulle), `object` (examiner, souvent un jet), `seat` (s'asseoir déclenche une scène), `door` (verrouillée, avec réplique, ouverte par un dialogue), `zone` (invisible, déclenchée une fois en y entrant) | tout ce qui réagit dans un lieu | 🟢 | 08 « Les objets du monde » |
| EXP-04 | **Entités conditionnelles** (même vocabulaire que les dialogues) | un personnage présent seulement à telle étape, une porte qui s'ouvre après un objectif | 🟢 | 08 |
| EXP-05 | **Répliques brèves** : bulle de figurant, ligne de narration d'objet ou de zone | des lieux habités à peu de frais ; sans effet sur l'état | 🟢 | 08 |
| EXP-06 | **Une salle se joue beat par beat** : chaque entité porte son moment, la sortie clôt l'étape | le joueur choisit l'ordre et ce qu'il laisse ; fouiller nourrit la note sans être un péage | 🟢 | 08 |
| EXP-07 | **Objectif** principal + facultatifs (compteur « 2/5 »), balise rouge unique sur ce qui fait avancer, repère `Tab` | guider sans tenir la main | 🟢 | 08 « Les objectifs » |
| EXP-08 | **Le groupe suit** : deux coéquipiers en file derrière Franklyn | la bande est présente physiquement | gratuit | 08 « Le groupe » |
| EXP-09 | **Passage au combat** : franchir un seuil → tampon « CONTACT » → écran tactique sur le **même terrain** | enchaîner exploration et affrontement sans rupture de décor | 🟢 si le terrain tactique existe (voir TAC) | ADR 0016 |
| EXP-10 | **Jouable au doigt** : appui = ordre, glissé = caméra, pincement = zoom | toute nouvelle interaction doit avoir un geste tactile | contrainte | 08 « Contrôles » |

**Limites** : l'entité `exit` (changer de lieu en marchant) existe dans le format mais n'a
jamais servi — le chapitre 1 change de carte entre deux scènes. La brancher est 🟡. Pas de
discrétion en temps réel, pas de PNJ qui patrouillent, pas d'objets ramassables en
exploration (le matériel est une ressource d'équipe, RES-04) : 🔴 chacun.

## TAC — Le combat tactique

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| TAC-01 | **Tour par tour sur grille** (case de 1,5 m), initiative, points de mouvement + une action, fin de combat à un nombre de rounds | tout affrontement | — | [05](../design/05-TACTICAL-COMBAT.md) |
| TAC-02 | **Couvert** bas (+3) / haut (+5), ligne de vue, **à découvert** après une course, diagonales bloquées aux angles | un terrain qui se lit | 🟢 (nouvelle carte ASCII) · voir couplages | 05 |
| TAC-03 | **Actions** : se déplacer, courir, tirer (taser), corps à corps, ranimer, repérer, encourager, ramasser, poser une mine | le vocabulaire du joueur en combat | 🟡 (une action de plus) | 05 « Les actions » |
| TAC-04 | **Touché = neutralisé**, pas de points de vie ; le neutralisé lâche son matériel | tension sans gore ; le matériel au sol est un enjeu | contrainte (ADR 0003) | ADR 0003 |
| TAC-05 | **Traits** de personnage câblés dans le moteur (Sang-froid absolu, Cohésion, Mains d'or…) | chaque cadet joue différemment | 🟡 (un trait = code + test) | [02](../design/02-RULES-CPRED-LITE.md) |
| TAC-06 | **IA adverse** : un profil unique (tirer si la chance dépasse un seuil, sinon chercher un meilleur poste) | un adversaire honnête | 🟡 (réglages) · 🔴 (autre comportement : fuite, otage, renforts) | 05 « L'IA » |
| TAC-07 | **Information asymétrique** : on ne voit le matériel que de sa propre équipe | un renseignement gagné avant (vidéo de la salle 3) a une vraie valeur | gratuit | 05 « Le matériel » |
| TAC-08 | **Le joueur dirige ses trois cadets** | une escouade, pas un héros | contrainte (ADR 0008) | ADR 0008 |
| TAC-09 | **Simulateur d'équilibrage** IA contre IA | chiffrer un affrontement avant de l'écrire | gratuit | AGENTS.md §4 |

**Limites** : trois contre trois, six cadets connus, une seule carte (la cour de
containers), taser seul, aucun objectif autre que « neutraliser » (pas d'otage à escorter,
pas de zone à tenir, pas de fuite). Chacune se lève, mais chacune coûte : 🟡 à 🔴 selon
l'ampleur. **De vrais enjeux vitaux** (blessures, mort) touchent l'ADR 0003 et les règles
elles-mêmes : 🔴 et décision du propriétaire.

## RUL — Les règles (CPRED-lite)

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| RUL-01 | **Jet unique** : attribut + compétence + d10 explosif/implosif ≥ DV nommée (Facile 9 → Exceptionnelle 21) | tout se résout pareil, en combat comme en dialogue | — | 02 |
| RUL-02 | **Jets opposés** (le défenseur gagne l'égalité) | duels, bluff contre perspicacité | 🟡 hors combat (le dialogue n'a que des DV fixes) | 02 |
| RUL-03 | **8 attributs, 13 compétences**, fiches en JSON | un nouveau personnage est une fiche | 🟢 fiche · 🟡 s'il doit parler ou combattre (voir couplages) | 02, [04](../design/04-CHARACTERS.md) |

**Limites voulues** (02 « Ce que le système ne fait volontairement pas ») : pas de blessures
graduées, pas de munitions, pas d'encombrement, pas de montée de niveau. Revenir sur l'une
d'elles est 🔴 et demande un ADR.

## BND — La bande et les équipes

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| BND-01 | **Tirage** : écran où le joueur compose son équipe, en alternance avec une capitaine adverse qui choisit par préférence | le joueur choisit avec qui il vit le chapitre | 🟡 (autre règle de tirage) | ADR 0014 |
| BND-02 | **Équipe adverse résolue hors champ** par quelques jets, entendue à la radio, son résultat pèse sur le combat | une rivalité parallèle sans la jouer | 🟡 (autre parcours) | 03 scène 7, ADR 0011 |

## ART — Rendu et ambiance

| Id | Capacité | Ce que le concepteur en fait | Coût | Réf. |
|---|---|---|---|---|
| ART-01 | **Habillage 3D déclaratif** des pièces : catalogue de modèles, matières, luminaires qui éclairent | un nouveau lieu se compose avec l'existant | 🟢 si le catalogue suffit · art à produire sinon | ADR 0017, 0018, [ROOM-COMPOSITION](../art/ROOM-COMPOSITION.md) |
| ART-02 | **Personnages humanoïdes animés** en exploration et en combat, figurants gris | — | 🟢 cadets · art pour tout nouveau visage | [ART-PIPELINE](../art/ART-PIPELINE.md) |
| ART-03 | **Illustrations** : 17 décors, portraits des cadets et des adultes du chapitre 1, pipeline de génération documenté | chaque nouveau lieu ou visage = une fiche de brief | coût de production | [ORCHESTRATOR](../art/image-generation/ORCHESTRATOR.md) |
| ART-04 | **Bruitages synthétisés** du combat | — | gratuit | ADR 0010 |

**Absents** : musique et ambiance sonore (lot 2.11), cinématiques.

---

## Ce que le chapitre 1 a appris (à réemployer)

- **Le dilemme symétrique** : salle 2 (la note contre la puissance), salle 3 (l'information
  contre la forme). Deux coûts différents, une même structure — le joueur les reconnaît et
  les pèse.
- **La ressource à répartir sur la journée** (Chance, concentration) : un choix local qui
  pèse plus loin.
- **L'exploration qui prépare le combat** : ce qui se passe à pied change l'affrontement.
- **La conséquence différée** : ce qui est fait le matin est commenté le soir (au bal).
- **Le branchement silencieux** : le même nœud, trois registres selon l'affinité.
