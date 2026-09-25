# ADR 0024 — Exploration de fuite : zones à effets, pression, suiveurs déclarés, habillage par registre

**Statut : accepté · Date : 2026-09-25**

## Contexte

Le game design du chapitre 2 remplace la poursuite en temps réel par une variante 🟢 :
tempo, zones sonores, portes fermées par la narration, silhouettes statiques (§5.6). Le
socle d'exploration (ADR 0013) n'a pas les pièces de cette variante :

- une zone n'affiche qu'une bulle ;
- la radio n'est vérifiée que dans les dialogues ;
- les suiveurs sont « l'équipe bleue après le tirage » (`exploreFollowerIds`) ;
- le rendu choisit l'habillage et plusieurs réglages en comparant `def.id` à `'holt'` et à
  `'centre-examen'` (`exploreView.ts`), si bien que toute carte nouvelle sort sans décor.

## Décision

1. `ZoneEntity.effects?: Effect[]`, que `validateMap` limite à `tempo`, `flag` et `counter`.
   `ChapterApp` applique ces effets une seule fois, au déclenchement de la zone, puis
   vérifie les répliques échues. Les autres effets restent l'affaire des dialogues (règle
   de l'ADR 0011 : l'état change par des choix).
2. `RadioCue.channel?: 'radio' | 'pression'` et `RadioCue.sfx?`. Une réplique de pression
   n'a pas de locuteur : c'est une ligne de narration en dialogue, et une ligne de brief en
   exploration. Les répliques échues sont désormais vérifiées aussi pendant
   l'exploration, après chaque changement de tempo.
3. `SceneDef.followers?: FollowerId[]`, avec `FollowerId = CharacterId | 'enfant'`. Si le
   champ est absent, la règle du chapitre 1 s'applique. Les profils de rig gagnent une
   échelle (`enfant` : 0,7) et un profil `ganger` pour les figurants armés.
4. Registre `EXPLORE_VISUALS`, indexé par `MapDef.id`. Les réglages aujourd'hui déduits de
   `def.id` deviennent des champs de `ExploreVisuals` ; le rendu de `holt` et de
   `centre-examen` reste identique.

## Conséquences

- La fuite se joue sans IA de poursuite, et chaque seuil franchi se sent, par une réplique
  et un bruitage.
- `MapDef` évolue de façon rétrocompatible ; `08-EXPLORATION.md` est mis à jour.
- Une carte nouvelle déclare son habillage dans le registre, au lieu de modifier
  `exploreView.ts`.
- Le chapitre 2 aura jusqu'à cinq suiveurs. Une mesure sur GTX 1070, au lot 5.7, décide
  s'ils sont tous visibles.
