# ADR 0009 — Animation des déplacements et matériel visible, côté rendu uniquement

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Le moteur tactique déplace les unités **instantanément** : une action `move` change `unit.pos`
et rend la main. À l'écran, les cadets « téléportaient », et, surtout, un tour de l'IA (jusqu'à
huit actions d'affilée) était illisible : on constatait le résultat sans comprendre ce qui
s'était passé. Par ailleurs, on ne voyait pas qui portait quoi (taser, outil de piratage,
mine), ni les cadets cachés derrière un container.

## Décision

1. **Le moteur ne change pas** et ne connaît toujours pas le temps. Le mouvement animé est une
   affaire de rendu : `src/render/rigAnimator.ts` reçoit le chemin parcouru et fait avancer le
   rig à vitesse constante (marche ou course, durée plafonnée). Ce fichier n'importe pas
   `three` et se teste sous Node.
2. `app.ts` reconstitue le chemin en comparant la dernière case connue de chaque unité à sa
   case actuelle (BFS de `tactical/pathfinding`, celui-là même que le moteur emploie).
   La course est reconnue à `unit.exposed`.
3. **Le tour de l'IA attend la fin des déplacements en cours** avant de démarrer : le joueur voit
   ce qui vient de se passer. Avec `?ai=0` (tests, simulation), tout reste instantané.
4. `CharacterRig` gagne deux méthodes : `update(dt)` (balancement de marche, pulsation de
   l'anneau — nécessaire aussi pour un futur `AnimationMixer`) et `setEquipment(items | null)`.
5. **Le joueur ne connaît que le matériel de sa propre équipe.** Pour les adversaires,
   l'appelant passe `null` : ni accessoire 3D, ni pictogramme, ni ligne dans la fiche ou la bande
   d'initiative. Le matériel **posé au sol** (taser lâché, mine) reste visible : il est public,
   le journal en donne déjà les coordonnées.
6. Un cadet masqué par un décor reste visible en **silhouette de couleur d'équipe**
   (`depthFunc: GreaterDepth`), et son étiquette est dessinée sans test de profondeur. La caméra
   se pivote aussi avec deux boutons du HUD (en plus de `A` / `E`), avec une rotation animée.

## Conséquences

**Favorables**

- Aucun test de gameplay n'est touché ; la simulation en lot reste aussi rapide.
- Un futur `GltfRig` n'a qu'à implémenter `update()` et `setEquipment()` (attacher des props à des
  os), le contrat à six animations reste inchangé.

**Défavorables**

- Le chemin animé est *reconstitué*, pas *enregistré* : si un jour le moteur autorise des
  chemins non minimaux, il faudra que l'action renvoie son chemin.
- L'état visuel peut retarder de moins de deux secondes sur l'état logique (le HUD passe déjà
  au cadet suivant pendant que le précédent finit sa marche). C'est voulu.
