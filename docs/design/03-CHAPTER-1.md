# Chapitre 1 — le dernier jour

Une journée, du réveil au bal de promo. C'est l'histoire du personnage principal, pas celle
de l'académie : tout est vu par Franklyn.

**État d'implémentation** : les neuf scènes existent sous forme de dialogues enchaînés
(epics 1 et 2). **L'epic 3 les rend explorables** : on se déplace dans l'académie puis dans
le centre d'examen, et les scènes se déclenchent sur place
([`08-EXPLORATION.md`](08-EXPLORATION.md), [`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md),
[ADR 0013](../process/adr/0013-exploration-temps-reel-sur-grille.md)).

## Déroulé

| # | Scène | Lieu (epic 3) | Ce qui s'y joue |
|---|---|---|---|
| 1 | Réveil | Dortoirs → couloirs | réveil, ton de l'académie ; objectif « Rejoindre la cantine » |
| 2 | Discours du directeur | Cantine (s'asseoir) | la première promotion, les stages à venir |
| 3 | Examen écrit | Salles d'entraînement (s'asseoir au pupitre) | concentration, Chance, triche, note /6 |
| 4 | Tirage | Salles d'entraînement | Franklyn et Abigail capitaines ; **le joueur choisit ses deux coéquipiers** |
| 5 | Temps libre | toute l'académie | parler aux cinq cadets là où ils sont ; objectif « Rejoindre le garage » |
| 6 | Trajet en fourgon | Garage → dialogue | traversée des Badlands, ambiance, avec les coéquipiers choisis |
| 7 | Parcours intérieur | Centre d'examen : hall, salles 1 à 3 | entités à examiner, jets, dilemmes |
| 8 | **Affrontement final** | Cour de containers, même carte | **combat tactique**, déclenché en franchissant le portail |
| 9 | Bal de promo | dialogue (exploration hors périmètre de l'epic 3) | les conséquences de la journée |

---

## Scène 2 — Le discours

Le directeur (appelé aussi *surveillant général*) s'adresse à la **première promotion** de
l'académie, celle qui partira en stage. Ton institutionnel, fierté rentrée, un peu de
solennité.

Fonction : poser l'enjeu de la journée et le fait que **cette promotion est la première**,
donc observée.

## Scène 3 — L'examen écrit

**Un dialogue guidé, pas un QCM.** Les questions portent sur la culture générale, la
technique et le monde cyberpunk.

Chaque question ouvre par un **jet de réflexion** (compétence propre à la question :
Éducation pour les questions de droit, Électronique pour l'enregistreur en panne, Piratage
pour le mandat corpo, Perception pour le convoi, Tactique pour le cas de cyberpsychose).
Réussi, il indique LA meilleure réponse — un jugement institutionnel, ce qu'un correcteur de
l'académie attendrait. Raté, aucune indication : Franklyn répond à l'instinct.

Règle de design : la **justesse** (la meilleure réponse, qui alimente la note écrite,
/6) et la **doctrine** (légaliste, pragmatique, cynique, idéaliste, corporatiste — la
personnalité du joueur) sont deux axes séparés. Chaque réponse pose sa doctrine quoi qu'il
arrive ; seule la réponse `best` compte pour la note. Voir
[`06-SCORING-DOSSIER.md`](06-SCORING-DOSSIER.md),
[`07-DIALOGUE-FORMAT.md`](07-DIALOGUE-FORMAT.md) et
l'[ADR 0012](../process/adr/0012-examen-ecrit-jet-de-reflexion-et-mise-en-scene.md).

### Ce qui rend l'examen vivant (epic 3)

Détail et chiffres : [ADR 0015](../process/adr/0015-concentration-chance-et-triche.md).

- **Concentration** : 3 points pour 6 questions. Réfléchir coûte un point ; le joueur
  choisit où il en a besoin.
- **Chance** : 3 points pour toute la journée. Après un jet raté de peu, on peut dépenser de
  la Chance devant le dé pour le rattraper — ce qu'on dépense ici manquera dans les salles.
- **La triche** : les cadets sont assis autour de Franklyn. Zachary souffle une réponse
  (question 2), la copie de Letitia est en vue (question 4), Grover demande de l'aide
  (question 5). Chaque tentative réveille un peu plus le surveillant. Les affinités ainsi
  gagnées ou perdues pèsent **immédiatement** sur le tirage qui suit.

## Scène 4 — Le tirage

Décision : [ADR 0014](../process/adr/0014-tirage-franklyn-capitaine-equipes-dynamiques.md).

Le directeur tire au sort **les six premiers à partir** pour l'examen pratique — toujours
les six mêmes — et désigne deux capitaines : **Franklyn et Abigail** (« l'académie veut voir
ses profils techniques commander »). Ils choisissent **à tour de rôle, Franklyn d'abord** :
Franklyn, Abigail, Franklyn, Abigail. Le joueur fait donc deux vrais choix.

**L'écran du tirage** réutilise l'alignement du hub : les quatre cadets restants devant le
mur gradué, les deux capitaines de part et d'autre. Chaque choix tombe comme un tampon
« ÉQUIPE BLEUE » ou « ÉQUIPE ROUGE » sur le portrait ; Abigail commente les siens ; le
cadet choisi réagit. Avant de choisir, le survol d'un cadet rappelle son rôle, ses deux
traits et l'affinité actuelle — le joueur choisit en connaissance de cause.

Abigail choisit dans l'ordre de préférence **Zachary, Letitia, John, Grover** (le premier
disponible). Ce qu'implique chaque composition :

| Si Franklyn prend… | Ce que ça change |
|---|---|
| John | le meilleur combattant brut, un ami sûr |
| Zachary | la puissance de feu, sa bande ; prive Abigail de son premier choix |
| Letitia | le repérage (Perception), l'anticipation |
| Grover | le rassembleur (Encourager) ; un rival à apprivoiser |
| Zachary **et** Grover | les deux rivaux dans la même équipe : dispute scriptée en salle 1 ; Abigail hérite de Letitia et John |

L'équipe d'Abigail a toujours la soigneuse ; celle de Franklyn, jamais — sauf kit gagné en
salle 1. C'est l'asymétrie voulue du chapitre ([`05-TACTICAL-COMBAT.md`](05-TACTICAL-COMBAT.md)).

## Scène 5 — Le temps libre

Il reste un moment avant le départ. Les cinq cadets sont **quelque part dans l'académie**,
chacun dans un lieu qui lui ressemble ([`09-MAPS-CHAPTER-1.md`](09-MAPS-CHAPTER-1.md)) :
Abigail à l'infirmerie, John à l'armurerie, Letitia aux archives, Grover dans la cour
intérieure, Zachary aux salles d'entraînement. Les conversations sont facultatives
(objectif secondaire « Parler aux cadets 0/5 »), l'objectif principal est de rejoindre le
garage.

Chaque conversation :

- révèle un fragment de personnalité et un morceau de la relation,
- peut faire bouger l'**affinité** (échelle −3 à +3, valeur de départ dans les fiches),
- tient compte du tirage : un coéquipier parle du parcours à venir, un adversaire du duel,
  un cadet vexé de ne pas avoir été choisi le fait sentir,
- peut ouvrir une option tactique **si le cadet est dans l'équipe** (un conseil de Grover, un
  repérage de Letitia).

## Scène 6 — Le trajet

Fourgon de police à travers les Badlands, jusqu'à un **centre d'examen de police désaffecté**
en périphérie de Night City. Graffitis, épaves, un campement de pillards au loin.

Fonction : montrer le monde sans combat, et faire monter l'inquiétude.

## Scène 7 — Le parcours intérieur

Les deux équipes de trois sont celles du tirage (scène 4). Les deux équipes font le
parcours **en parallèle mais séparément** : le joueur en joue une, l'autre est résolue par
l'IA hors champ, quelques jets suffisent. On entend sa progression à la radio et par les
bruits.

Thème : **simulation de libération d'otage**. Trois objets partagés entre trois cadets :

| Objet | Effet |
|---|---|
| Pistolet taser | touché = immobilisé jusqu'à un soin |
| Kit de soin | un usage, ranime un coéquipier |
| Outil de piratage | ouvre les portes et les systèmes |

### Salle 1 — la porte et le chien

Pirater une porte. De la fumée, du mouvement au loin. Un jet de **Perception** révèle qu'un
chien poursuit quelqu'un, et permet de distinguer ami d'ennemi. **Tirer sur le chien sauve
l'otage** — un policier qui joue le rôle. Paniqué, il donne un **second kit de soin**.

### Salle 2 — le choix coûteux

Deux options : la porte en face, ou une **armoire sécurisée**. Forcer l'armoire **coûte du
temps** (donc de la note) mais c'est **le seul moyen d'obtenir un second taser**. Les
portes se passent au piratage, éventuellement via un mini-jeu.

C'est le premier vrai dilemme du chapitre : la note contre la puissance.

### Salle 3 — le gaz et la vidéo

La porte se verrouille derrière. Gaz irritant. Un ordinateur au centre, la sortie en face.

- **Sortir vite** : aucun dégât.
- **Rester** : jets de Résistance ; les cadets touchés sont **gazés** (−2 à tous les jets,
  −1 MOUV) pour la phase finale. Mais l'ordinateur **montre le parcours de l'équipe
  adverse**, donc son placement et son matériel à l'affrontement final.

Deuxième dilemme, symétrique du premier : l'information contre la forme physique.

### L'équipe adverse, hors champ

Résolue par quelques jets. Sa progression est entendue à la radio. Son résultat fixe son
état à l'affrontement final : second taser obtenu ou non, membre gazé ou non. **La vidéo de
la salle 3 montre ce qui s'est réellement passé** — c'est la récompense du dilemme.

Dans le code, cet état est porté par `TeamState` (`healkits`, `extraTaser`, `gassedMembers`),
déjà branché sur le moteur de combat. Plusieurs cadets d'une même équipe peuvent être gazés
(jet de Résistance individuel par cadet) : `gassedMembers` est une liste, pas un seul cadet.

## Scène 8 — L'affrontement final

Opposition tactique en extérieur, entre les containers. **C'est la seule scène implémentée.**
Spécification complète : [`05-TACTICAL-COMBAT.md`](05-TACTICAL-COMBAT.md).

Fin de l'acte 1 à l'issue de ce combat.

## Scène 9 — Le bal

Les conséquences. La note tombe, les instructeurs commentent, les amis réagissent selon
leur affinité et selon ce qui s'est passé pendant la journée.

**Règle d'or : aucun échec dur.** Rater l'exercice donne une mauvaise note, des remarques
pointues au bal, et une étiquette au dossier. Jamais un écran de fin.

## Le minuteur invisible

Le temps presse, mais **aucune barre de temps n'est affichée**. La pression passe par les
remarques de l'instructeur à la radio (« vous êtes en retard », « l'autre équipe est déjà en
salle 3 »). Le joueur doit le **sentir**, pas le lire.
