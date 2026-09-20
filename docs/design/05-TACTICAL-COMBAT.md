# Combat tactique — spécification

Scène 8 du chapitre 1 : deux équipes de trois cadets s'affrontent au taser dans une cour de
containers. **C'est la seule scène implémentée aujourd'hui.**

| | |
|---|---|
| Code | [`src/tactical/`](../../src/tactical/) |
| Carte | [`src/data/yard-map.ts`](../../src/data/yard-map.ts) |
| Tests | `tests/unit/combat.test.ts`, `ai.test.ts`, `los.test.ts`, `pathfinding.test.ts` |
| Équilibrage | `npx tsx scripts/simulate.ts 200 seed` |

---

## Le terrain

Grille de **30 × 20 cases**, une case = **1,5 m**. Carte ASCII éditable à la main :

| Symbole | Nature | Passage | Vue | Couvert |
|---|---|---|---|---|
| `.` | sol | oui | oui | — |
| `#` | container | non | **non** | haut (+5) |
| `o` | caisses, barils | non | oui | bas (+3) |
| `m` | sol + mine au départ | oui | oui | — |
| `B` / `R` | déploiement bleu / rouge | oui | oui | — |

L'équipe **rouge entre par le nord**, la **bleue par le sud**. Trois positions de départ
chacune. Un test unitaire vérifie que la carte est rectangulaire, connexe, et qu'elle
contient bien trois déploiements par camp et une mine.

---

## Le tour

1. **Initiative** : `RÉF + d10`, lancée une fois au début. +1 pour Zacharie (*Fonceur*).
   Égalité départagée par RÉF, puis par identifiant — l'ordre est donc déterministe.
2. Chaque cadet joue à son tour : **des points de mouvement** (= MOUV, −1 si gazé, minimum 1)
   **et une action**, dans l'ordre qu'il veut, mouvement fractionnable.
3. Les cadets neutralisés sont sautés.
4. Au-delà de **12 rounds**, l'exercice s'arrête : l'équipe ayant le plus de cadets debout
   l'emporte.

### Déplacement

Huit directions, **une case = un point**, y compris en diagonale. Une diagonale est
interdite si elle coupe **deux angles bloqués** : on ne se faufile pas entre deux
containers.

**Courir** : double le budget de mouvement (+3 supplémentaires pour Zacharie), consomme
l'action, et laisse le cadet **à découvert** jusqu'à son tour suivant — les tirs contre lui
gagnent 2 points de DV en moins.

---

## Vue et couvert

**Ligne de vue** : segment entre centres de cases. Seuls les containers la bloquent. Sur une
diagonale parfaite, les deux cases d'angle sont testées : on ne tire pas à travers un coin
fermé.

**Couvert** : déterminé par les cases bloquantes **adjacentes à la cible et situées du côté
du tireur** (produit scalaire positif). On retient le meilleur. Une caisse en diagonale
compte si elle est du bon côté.

> Conséquence contre-intuitive mais voulue : un container **derrière** la cible ne protège
> pas. On se colle à un obstacle **face** à la menace.

---

## Les actions

| Action | Coût | Conditions | Effet |
|---|---|---|---|
| Se déplacer | PM | case atteignable | déplacement, déclenche les mines traversées |
| Courir | action + tous les PM | action disponible | double le mouvement, met à découvert |
| Tirer | action | taser, ligne de vue, portée ≤ 16 | voir ci-dessous |
| Corps à corps | action | adversaire adjacent | jet opposé |
| Ranimer | action | allié neutralisé adjacent | kit d'équipe, ou *Mains d'or* DV 15 |
| Repérer | action | ligne de vue sur un adversaire | +2 (+3 pour Letitia) aux tirs alliés sur cette cible, jusqu'à la fin du round |
| Encourager | action, 1×/round | trait *Cohésion*, allié en vue | +2 au prochain jet de l'allié |
| Ramasser | action | objet sur sa case | prend l'objet ; désamorcer une mine demande TECH + Électronique DV 13, sauf *Bricoleuse* |
| Poser la mine | action | porte la mine | mine armée sur sa case ou une case adjacente |
| Fin du tour | — | — | passe au suivant |

### Le tir au taser

```
DV = 13 + couvert + pénalité de distance − (2 si la cible est à découvert)
jet = DEX + Armes de poing + d10 + modificateurs
```

| Élément | Valeur |
|---|---|
| Portée efficace | 8 cases |
| Portée maximale | 16 cases |
| Au-delà de l'efficace | +2 de DV par tranche de 4 cases entamée |
| À bout portant (≤ 2 cases) | **+2 au jet** du tireur |
| Cible gazée | −2 à ses propres jets |
| John, premier tir | +2 (*Sang-froid absolu*) |

**Retour visuel.** Chaque tir montre un trait depuis le canon ; au but, un impact et la chute du cadet ; manqué, le trait dévie vers le sol. Voir [ADR 0010](../process/adr/0010-evenements-de-combat-et-bruitages-synthetises.md).

**Touché = neutralisé.** Pas de dégâts, pas de points de vie (ADR 0003). Le cadet tombe et
**lâche son taser et sa mine sur sa case** : le matériel redevient un enjeu tactique.

### Le corps à corps

Jet opposé `DEX + Corps à corps` contre `DEX + Esquive`.
L'attaquant gagne → cible neutralisée. Le défenseur gagne **de 5 ou plus** → c'est
l'attaquant qui tombe. Entre les deux, rien ne se passe.

C'est la réponse des cadets sans taser — et John est redoutable à ce jeu.

### La mine

Une seule, cachée dans un container ouvert à l'ouest de la carte. La ramasser demande
TECH + Électronique DV 13 (Abigail en est dispensée). Posée, elle est armée : tout cadet
qui entre sur la case fait DEX + Esquive **DV 15** ou tombe.

---

## Le matériel

Chaque équipe dispose de **trois objets pour trois cadets**, répartis automatiquement :
le **taser au meilleur tireur**, l'**outil de piratage au meilleur technicien non organique**
(John ne peut jamais l'avoir). Le **kit de soin est une ressource d'équipe**, pas un objet
porté.

**Information visible.** Le joueur ne sait **qui porte quoi que dans son équipe** : pour les
adversaires, ni l'étiquette au-dessus du cadet, ni la bande d'initiative, ni la fiche ne
révèlent leur matériel. Le matériel lâché au sol reste visible de tous (voir
[ADR 0009](../process/adr/0009-animation-des-deplacements-et-equipement-visible.md)).
Pictogrammes : ⚡ taser, 💻 outil de piratage, 💣 mine, ✚ kit de soin (`src/data/items.ts`).

L'état importé du parcours intérieur (scène 7) est porté par `TeamState` :

| Champ | Effet |
|---|---|
| `healkits` | nombre de réanimations possibles |
| `extraTaser` | l'armoire de la salle 2 a été forcée : un second cadet reçoit un taser |
| `gassedMembers` | ces cadets ont subi le gaz de la salle 3 (liste, plusieurs possibles) : −2 aux jets, −1 MOUV chacun |

---

## L'IA

Volontairement **lisible plutôt que brillante**. Ce sont des cadets de dix-sept ans qui
passent un examen, pas des joueurs d'échecs. Priorités, dans l'ordre :

1. ranimer un coéquipier à terre (aller le chercher si besoin) ;
2. tirer si une cible offre **au moins 35 %** de réussite ;
3. entre 35 % et 55 %, chercher d'abord un meilleur angle si un gain net existe ;
4. sans taser, **repérer** pour un allié armé, ou **encourager** si on a *Cohésion* ;
5. progresser vers l'ennemi le plus proche en privilégiant les cases couvertes ;
6. passer le tour.

L'IA utilise un **flux aléatoire séparé** (`combat.aiRandom`) : modifier l'IA ne décale donc
pas les jets de combat d'une partie rejouée.

---

## Équilibrage

**Depuis le tirage dynamique (ADR 0014, lot 3.2), l'équipe du joueur n'est plus fixe** : elle
dépend des deux coéquipiers que le joueur choisit pour Franklyn. `scripts/simulate.ts` balaie
donc les **cinq compositions réellement atteignables** (pas six — voir ADR 0014, "Correctif
lot 3.2" : Abigail choisit entre les deux tours de Franklyn, et son ordre de préférence
commence par Zachary puis Letitia, ce qui rend "Zachary et Letitia" impossible pour l'équipe de
Franklyn), 200 combats IA contre IA par composition (`npx tsx scripts/simulate.ts 200
equilibrage`) :

| Composition (Franklyn +) | Victoire bleue | Victoire rouge | Nul | Rounds moy. | Note moy. /20 |
|---|---|---|---|---|---|
| Zachary + John | 98,0 % | 2,0 % | 0,0 % | 6,49 | 17,10 |
| Letitia + John | 60,5 % | 38,0 % | 1,5 % | 5,97 | 12,07 |
| John + Grover | 48,5 % | 51,5 % | 0,0 % | 7,36 | 9,92 |
| Zachary + Grover | 35,5 % | 64,0 % | 0,5 % | 5,88 | 8,64 |
| Letitia + Grover | 32,0 % | 68,0 % | 0,0 % | 4,75 | 8,36 |
| **Toutes compositions (1000 parties)** | **54,9 %** | **44,7 %** | **0,4 %** | **6,09** | **11,22** |

**Lecture** : l'équilibre ne dépend presque plus de la couleur d'équipe mais de **qui a John**
(le combattant brut, `sangFroidAbsolu` + `organique`) et, dans une moindre mesure, **qui a
Zachary** (`fonceur`, initiative et portée de course) — les deux fiches les plus fortes en
duel direct. Les garder ensemble avec Franklyn écrase l'IA adverse (98 % de victoires) ; les
laisser toutes les deux à Abigail (Letitia + Grover pour Franklyn) inverse le rapport de force
presque à l'identique (32 %). C'est l'asymétrie **voulue** du chapitre — chaque pick a un vrai
coût tactique, pas seulement narratif (docs/design/03-CHAPTER-1.md, scène 4, tableau "Ce que ça
change") — mais elle est plus marquée que l'ancien tirage scripté ne le laissait supposer : la
moyenne globale (54,9 % / 11,22 pt) reste dans la fourchette visée, tant qu'aucune composition
individuelle n'est réellement injouable (même la pire, 32 %, reste gagnable, et un humain joue
mieux que l'IA adverse).

**Après toute modification des fiches, de la carte ou de l'IA, relancer la simulation** et
mettre ce tableau à jour.

---

## Ce qui n'est pas encore fait

- Animations et retours visuels des tirs (trait de tir, impact, son).
- Overwatch / tir de couverture — envisagé, non décidé.
- Alimentation réelle de `TeamState` par le parcours intérieur (epic 2).
