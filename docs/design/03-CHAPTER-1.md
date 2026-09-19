# Chapitre 1 — le dernier jour

Une journée, du réveil au bal de promo. C'est l'histoire du personnage principal, pas celle
de l'académie : tout est vu par Franklyn.

**État d'implémentation** : seule la scène 8 (l'affrontement final) existe dans le code.
Les scènes 1 à 7 et 9 sont la charge de l'epic 2. Ce document est leur spécification.

## Déroulé

| # | Scène | Epic | Ce qui s'y joue |
|---|---|---|---|
| 1 | Introduction brève | 2 | réveil, dortoir, ton de l'académie |
| 2 | Discours du directeur | 2 | la première promotion, les stages à venir |
| 3 | Examen écrit | 2 | dialogue guidé à jets de dés, remplit le dossier |
| 4 | Tirage des équipes | 2 | scripté : toujours les six mêmes |
| 5 | Hub de dialogue | 2 | Franklyn parle aux cinq autres |
| 6 | Trajet en fourgon | 2 | traversée des Badlands, ambiance |
| 7 | Parcours intérieur | 2 | trois salles, jets de compétences |
| 8 | **Affrontement final** | **1** | **combat tactique entre containers** |
| 9 | Bal de promo | 2 | les conséquences de la journée |

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

## Scène 4 — Le tirage

Scripté : **les six mêmes cadets** sortent du chapeau. Zacharie et Grover sont les deux
capitaines et choisissent à tour de rôle.

Composition par défaut retenue dans le code (`DEFAULT_BLUE` / `DEFAULT_RED`) :

| Équipe | Cadets | Profil |
|---|---|---|
| Bleue (joueur) | Zacharie, John, Franklyn | puissance de feu, pas de soigneur |
| Rouge (IA) | Grover, Letitia, Abigail | soutien, reperage, soins |

Justification : Zacharie choisit John (le meilleur élément brut) puis Franklyn (sa bande) ;
Grover prend Letitia (son trio) et hérite d'Abigail. L'asymétrie qui en résulte est
volontaire et documentée dans [`05-TACTICAL-COMBAT.md`](05-TACTICAL-COMBAT.md).

## Scène 5 — Le hub de dialogue

Franklyn peut parler à chacun des cinq autres avant le départ. Chaque conversation :

- révèle un fragment de personnalité et un morceau de la relation,
- peut faire bouger l'**affinité** (échelle −3 à +3, valeur de départ dans les fiches),
- peut ouvrir une option tactique plus tard (un conseil de Grover, un repérage de Letitia).

## Scène 6 — Le trajet

Fourgon de police à travers les Badlands, jusqu'à un **centre d'examen de police désaffecté**
en périphérie de Night City. Graffitis, épaves, un campement de pillards au loin.

Fonction : montrer le monde sans combat, et faire monter l'inquiétude.

## Scène 7 — Le parcours intérieur

L'instructeur sépare les six cadets en **deux équipes de trois**. Les deux équipes font le
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
