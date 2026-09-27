# L'héritage du chapitre 2

Ce que le chapitre 3 reçoit : où en est l'histoire, ce que le joueur a vécu, et ce que le
dossier du candidat a retenu. Même forme que [`CH1-LEGACY.md`](CH1-LEGACY.md), volontairement
court ; les sources font foi ([`ch2/GAME-DESIGN.md`](ch2/GAME-DESIGN.md),
[`../design/06-SCORING-DOSSIER.md`](../design/06-SCORING-DOSSIER.md),
[`ch2/TECH-DESIGN.md`](ch2/TECH-DESIGN.md)).

> État décrit : le chapitre complet, douze scènes, de la photo au Blue Purple (lot 5.14). Les
> lots 5.13 (la mort de Zachary jouée en scène 7) et 5.15 (le slow allongé, Zachary touché en
> protégeant Abigail) ne changent pas ce que le dossier transmet ; le lot 5.14 y ajoute l'entrée
> `ch2.inconnue.premier-mot`.

## Où en est l'histoire

La nuit du bal, l'académie HOLT est attaquée par un gang dont les membres portent **un scorpion
cousu sur la manche**. La promotion se disperse. Franklyn et sa bande fuient par le couloir de
ceinture, le dortoir, les conduits (où ils trouvent **un enfant** de la seconde génération) et
la cantine en feu, puis tombent dans les égouts. **Zachary meurt** là, le soir du bal. Dans les
Badlands, un campement : **Murano**, un vieil homme au fusil, est tué pour son camion. La nuit
se tient aux décharges, en tours de garde. Au matin, un gamin guide le groupe jusqu'à une
clinique de Night City : le **charcudoc** garde Letitia contre **2 000 crédits** et donne un
nom — un rendez-vous, pour le soir même, au **Blue Purple**.

Le soir même, la bande entre au Blue Purple, un bar en sous-sol au bord de Night City. Smith n'y
est pas. Une courte attente, puis **une inconnue** s'assoit à leur table : elle connaît leurs
noms, et promet de leur dire ce que vaut leur nuit, et à qui ils
la doivent. Le chapitre s'arrête là, avant qu'elle ait dit qui elle est.

Le groupe qui entre au chapitre 3 : Franklyn, John, Grover, Abigail, l'enfant. Letitia est
chez le charcudoc ; Zachary est mort. Tous les chapitres suivants se jouent **hors de
l'académie**, qui a brûlé.

## Ce que le dossier transmet

Seuls les **étiquettes**, les **entrées** et les **affinités** traversent (ADR 0022 : archive
`holt.archive.ch2.v1` à la fin du chapitre, suite directe depuis l'écran de fin). Les drapeaux,
compteurs et le tempo meurent avec le chapitre ; tout ce qui doit être relu plus tard a donc
une entrée ou une étiquette.

### Étiquettes nouvelles (liste fermée, `06-SCORING-DOSSIER.md`)

| Étiquette | Sens | Réservée au chapitre 3 pour |
|---|---|---|
| `cavalier-letitia` | Franklyn a dansé avec Letitia au slow | ce que Letitia attend de lui ; les adieux déjà lus en scène 11 |
| `protecteur-bal` | il a crié pour tous au lieu de protéger Letitia seule | les survivants de la promotion, témoins |
| `vu-simulation` | il a vu, chez Smith, la simulation de son enfance | Smith, et ce qu'elle sait de lui |
| `enfant-confiance` | l'enfant lui fait confiance | la place de l'enfant dans le groupe |
| `abigail-brisee` | Abigail ne s'est pas relevée de la mort de Zachary | Abigail, sa loyauté, ses choix |
| `a-tue` | Franklyn a tué Murano de sa main | la manière dont il se voit ; qui le sait |
| `voiture-pillee` | la voiture de Murano a été pillée aux décharges | les moyens du groupe (plus de pièces à vendre) |

Le chapitre 2 **relit** aussi le vocabulaire du chapitre 1 (`loyal-bande`, `solitaire`,
`equipe-bande`/`equipe-tactique`, `tricheur`/`pris-a-tricher`/`copie-brillante`, `sauveteur`,
`bluffeur`, `vainqueur-exercice`/`defaite-exercice`) ; il ne le réécrit pas.

### Entrées (toujours écrites, sur tout chemin)

| Entrée | Valeurs | Posée en |
|---|---|---|
| `ch2.letitia.etat` | `stable`, `blessure sérieuse`, `blessure grave`, `état critique` (les mots de la jauge) | 11 (le charcudoc) |
| `ch2.zachary` | `mort le soir du bal` | 7 |
| `ch2.zachary.adieu` | `dit` | 8 |
| `ch2.campement.insignes` | reconnus sur-le-champ, ou trouvés sur Murano après sa mort | 9 |
| `ch2.campement.tueur` | `Franklyn`, `John`, `Grover`, `Abigail` | 9 |
| `ch2.fusil` | chargé d'une cartouche, vide, tiré en l'air aux décharges, laissé au guide, gardé | 9 à 11 (la dernière valeur écrite fait foi) |
| `ch2.rendezvous.source` | `le charcudoc` | 11 |
| `ch2.inconnue.premier-mot` | `méfiant` (il demande qui elle est), `direct` (Letitia et la dette), `silence` (il laisse parler John), chacun suivi d'une glose | 12 (le Blue Purple) |
| `ch2.chance` | Chance dépensée au chapitre (moteur) | au fil du chapitre |

L'entrée `ch2.letitia.etat` manquait jusqu'au lot 5.11 (le compteur ne finissait qu'en jauge et
au bilan) : elle est désormais écrite par quatre branches silencieuses du charcudoc, gardées par
`ch2Content.test.ts`.

### Affinités

Elles bougent au bal, à la grille (Abigail, si Franklyn force le mécanisme), à l'adieu
(Abigail) et aux adieux à Letitia. Zachary garde la sienne au dossier, figée : il ne parle plus.

### Drapeaux utiles, qui ne traversent pas

À relire au besoin **par leur entrée** ; ils ne sont connus que pendant le chapitre 2 :
`ch2.porteur` (qui a porté Letitia), `ch2.fusil.charge`/`ch2.fusil.donne` (miroir de
`ch2.fusil`), `ch2.campement.tueur` (miroir de l'entrée), `ch2.garde.*` (qui a veillé, qui a
dormi, échecs), `ch2.bal.<cadet>.fait` (les conversations du bal). Si le chapitre 3 veut savoir
qui a dormi pendant la garde ou qui a porté Letitia, il faut **ajouter une entrée** au
chapitre 2, pas lire un drapeau.

## Les mystères posés, non résolus

1. **Les insignes au scorpion.** Un gang organisé, cousu main, a attaqué l'académie ; Murano en
   était, ou en portait le signe. Qui ils sont, pourquoi HOLT : rien n'est dit.
2. **Le rendez-vous au Blue Purple.** Trois sources convergent — Smith (si le joueur fait le
   détour), John (qui le tient de Smith, relu aux décharges), le charcudoc (toujours). L'entrée
   ne retient que le charcudoc. Au bar, Smith n'est pas venue, et l'inconnue n'en dit
   rien : rien n'indique si elle la connaît, ni si elle vient à sa place.
3. **La simulation de Smith.** La machine du labo montre la simulation qui revient à Franklyn
   depuis ses dix ans. Smith promet des réponses « pas au fond d'un conduit ». `vu-simulation`
   dit si le joueur l'a vue.
4. **La dette du charcudoc.** 2 000 crédits pour garder Letitia. Personne n'a cette somme ; le
   rendez-vous est présenté comme la seule issue.
5. **L'état de Letitia.** Elle ne meurt jamais au chapitre 2. Son délai (« demain soir » ou
   « quelques heures ») dépend de l'entrée `ch2.letitia.etat` : c'est au chapitre 3 de décider
   ce que coûte un « état critique ».
6. **L'enfant.** Un petit de la seconde génération, sans nom au chapitre 2 ; il suit le groupe.
7. **L'inconnue du Blue Purple.** Veste de cuir violette, cheveux bleu nuit sur un œil (portrait
   P19, locuteur `inconnue`, « L'inconnue »). Elle connaît les noms des quatre cadets, pas celui
   de l'enfant (« je ne connais pas encore son nom »), et selon la réplique de Franklyn, elle sait
   pour Letitia et les deux mille crédits. Qui elle est, pour qui elle travaille, comment elle
   sait : **rien n'est dit**, c'est la porte d'entrée du chapitre 3. Sa dernière phrase est une
   promesse : leur dire « ce que vaut votre nuit. Et à qui vous la devez ». Le **premier mot** de
   Franklyn (`ch2.inconnue.premier-mot`, lu aussi au bilan) dit sur quel pied la relation
   commence : méfiance, marchandage direct, ou John en avant.

Hérités du chapitre 1 et toujours ouverts : ce que Letitia cherchait dans la salle
d'interface, les niveaux cachés du compte de John, le manque de Franklyn (défaut *En manque*,
relu à la garde des décharges).

## Les questions que le chapitre 3 devra trancher

- **L'argent.** La dette du charcudoc et la voiture (pillée ou non) posent une économie que le
  moteur n'a pas (pas d'inventaire, pas de monnaie : 🔴 si elle devient un système).
- **Le groupe.** Cinq personnages dont un enfant, sans Letitia : qui suit, qui parle, qui lance
  les jets (la file visible reste bornée à deux suiveurs, décision B9).
- **Les vrais enjeux vitaux.** Le chapitre 2 a tué sans combat (ADR 0003 intact) ; un combat au
  chapitre 3 reposerait la question des blessures et de la mort en jeu.
- **Night City.** Le chapitre 2 finit à ses portes ; aucune carte de ville n'existe encore.
