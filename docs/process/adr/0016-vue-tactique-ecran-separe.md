# ADR 0016 — Le passage au combat reste une coupure vers un écran tactique séparé

**Statut** : accepté · **Date** : 2026-09-20

## Contexte

Le lot 3.7b (epic 3) devait faire franchir le portail de la cour de containers, à la fin du
parcours intérieur du centre d'examen, et enchaîner sur l'affrontement tactique existant. Le
document de design (`docs/design/08-EXPLORATION.md`, « Passer au combat ») demandait à
l'origine une transition « sur la même carte » : la cour vue en exploration et la cour du
combat devaient être **le même rendu**, sans coupure d'écran autre que le tampon « CONTACT ».

En chantier, cette exigence s'est révélée coûteuse : `GameApp` (`src/app.ts`) possède son
propre `WebGLRenderer`, sa propre `IsoCamera`, sa propre scène (`YardView`, décor du seul
rectangle 30 × 20), son propre HUD (`Hud`, DOM monté à part) et sa propre boucle d'image —
tout cela construit indépendamment de `ExploreView`/`ChapterApp`, qui possèdent leur propre
triplet équivalent pour l'exploration. Faire cohabiter les deux dans un seul canvas aurait
exigé une refonte de `GameApp` pour qu'il accepte un renderer/scène/caméra externes, une
unification des entrées (raycast partagé), et un nouveau mode d'incrustation du HUD tactique
par-dessus l'exploration — une vraie refonte d'architecture, pas un ajustement de rendu.

## Décision

**L'écran tactique reste un écran à part**, avec son propre renderer/caméra/HUD
(`enterTacticalScene` bascule simplement d'hôte DOM, comme avant ce lot). Un tampon
« CONTACT » et une coupure brève de 400 ms (`ChapterApp.playContactTransition`) habillent le
changement d'écran, seul moment orchestré de la transition.

Cette décision n'est **pas** un repli devant le coût de la fusion des deux rendus — c'est la
bonne architecture, pour une raison qui dépasse ce lot : **la vue tactique est l'interface de
tous les combats à venir**, y compris ceux qui n'auront aucune carte d'exploration derrière
eux (un futur chapitre pourrait déclencher un combat sans scène d'exploration préalable). La
coupler au rendu d'exploration l'aurait rendue dépendante d'un contexte qu'elle ne doit pas
supposer.

Ce que la carte d'exploration garantit, en revanche, et que le moteur de combat ne remet
jamais en cause : **le terrain est le même des deux côtés de la coupure**. Le rectangle
`tacticalArea` (30 × 20) de `centre-examen.ts` est engendré depuis `yard-map.ts`
(`pasteYard()`) et un test vérifie la correspondance case par case
(`tests/unit/centreExamenMap.test.ts`). Le joueur voit la cour en s'en approchant, puis se
bat dedans ; il ne découvre pas un autre décor, même si le *rendu* de ce décor change
d'écran.

## Conséquences

**Favorables**

- Aucune refonte de `GameApp`/`YardView`/`IsoCamera` : le moteur de combat, son rendu et son
  HUD restent ce qu'ils étaient à la clôture de l'epic 1, testés et stables.
- La vue tactique reste réutilisable telle quelle pour un futur combat sans carte
  d'exploration (aucune dépendance implicite à `ExploreView`).
- Le tampon « CONTACT » donne quand même la sensation d'un enchaînement voulu, pas d'un
  écran qui saute.

**Défavorables**

- Une coupure d'écran, même brève, reste visible — moins immersif qu'un rendu réellement
  continu. Accepté : le terrain identique des deux côtés (voir ci-dessus) limite la
  dissonance à la caméra/l'éclairage, pas à la géométrie du lieu.
- Si un jour la fusion des deux rendus devient nécessaire (par exemple pour un combat qui
  s'ouvrirait au milieu d'une pièce explorée), elle demandera le chantier décrit dans le
  contexte ci-dessus — non entamé par ce lot.

## Règle qui en découle

**Le moteur de combat ne connaît que le rectangle `tacticalArea`** (30 × 20, `yard-map.ts`) et
n'en dépend jamais d'une carte d'exploration plus large : c'est au rendu — et à un test de
correspondance case par case — de garantir que ce rectangle est bien celui que le joueur
vient de traverser.
