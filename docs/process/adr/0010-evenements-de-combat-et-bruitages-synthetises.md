# ADR 0010 — Événements de combat pour le rendu, bruitages synthétisés

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Un tir de taser était invisible : le journal annonçait « touché » et le cadet visé changeait
d'état, sans aucun trait, impact ni chute. Il n'y avait pas non plus de son. Or le moteur
tactique ne doit ni connaître le rendu, ni le temps ([ADR 0009](0009-animation-des-deplacements-et-equipement-visible.md)).

## Décision

1. **Le moteur émet des événements**, sous forme de donnée pure ajoutée à `CombatState.events` :
   `shot` (avec `hit`), `melee`, `mine`, `neutralized`, `revived`. Il n'attend jamais qu'ils
   soient joués, n'y consomme aucun aléatoire, et l'ordre est celui des faits (un tir au but
   est toujours suivi de la `neutralized` de sa cible).
2. **Le rendu les rejoue dans une file** (`src/render/effectQueue.ts`, sans dépendance à `three`) :
   un effet à la fois, et jamais tant qu'un des personnages concernés marche encore.
   Les visuels (`src/render/effects.ts`) sont des formes additives : trait de tir, étincelle
   au canon, gerbe d'impact, anneau au sol. La chute du cadet touché est une animation du rig
   (pivot progressif, éclair jaune), le tireur recule légèrement.
3. **L'IA joue désormais une action à la fois dans l'interface** (`GameApp.runAiTurn`), en
   attendant la fin des déplacements et des effets entre deux actions. Elle utilise les mêmes
   `decideAction` et la même borne de 8 actions que `playAiTurn` : les parties restent
   identiques. `playAiTurn` reste utilisé par la simulation, `flushAi` et l'API debug.
4. **Les entrées du joueur sont ignorées tant qu'un déplacement ou un effet est en cours**
   (pas de file de commandes). L'API `window.__game` n'est pas concernée.
5. **Les bruitages sont synthétisés** avec Web Audio (`src/audio/sfx.ts`) : tir, impact, tir
   manqué, chute, corps à corps, mine, réanimation, clic d'interface. Aucun fichier binaire.
   Le bruit blanc vient du `Rng` seedé, pas de `Math.random`. Le contexte audio n'est créé
   qu'après un geste du joueur (règle des navigateurs), tout échec est silencieux, et un
   bouton du HUD coupe le son (mémorisé dans la sauvegarde de session).
6. **Mode test** : avec `?ai=0`, les événements sont ignorés et il n'y a pas de son.

## Conséquences

**Favorables**

- Un tir se lit : d'où il part, s'il touche, ce qui arrive à la cible.
- Les tests et la simulation n'ont rien à savoir de tout cela.
- Un futur `GltfRig` réagit aux mêmes appels (`play('shoot')`, `play('down')`, `play('revive')`).

**Défavorables**

- Le HUD (journal, bandeau) se met à jour avant la fin de l'effet correspondant : il annonce
  brièvement le résultat d'un tir avant que le trait ne parte.
- Les bruitages de synthèse sont fonctionnels, pas beaux. L'audio définitif (lot 2.11) devra
  les remplacer ou les compléter par de vrais fichiers, via Howler.js.
- Bloquer les entrées pendant les animations ralentit un joueur pressé : à réévaluer si un
  mode « animations rapides » devient nécessaire.
