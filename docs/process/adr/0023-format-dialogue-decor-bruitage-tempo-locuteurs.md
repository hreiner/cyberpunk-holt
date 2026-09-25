# ADR 0023 — Format de dialogue : décor et bruitage par nœud, compteur borné, tempo, locuteurs

**Statut : accepté · Date : 2026-09-25**

## Contexte

Le chapitre 2 a besoin de ce que le format de [`07-DIALOGUE-FORMAT.md`](../../design/07-DIALOGUE-FORMAT.md)
ne sait pas dire :

- une scène montrée en suite d'images (le slow, puis la rafale) ;
- des coups de feu entendus ;
- un état de blessé qui monte et descend entre 0 et 3 ;
- une conséquence qui dépend du temps perdu pendant la fuite ;
- six personnages non cadets qui parlent.

Aujourd'hui, le décor est choisi en code : une table de `sceneChrome.ts` indexée par
`dialogueId`, et par `dialogueId:nodeId` dans quelques cas. Aucune condition ne lit le
tempo. Un compteur n'a pas de bornes. `SpeakerId` est une union fermée.

## Décision

Les extensions sont **facultatives et rétrocompatibles** : tout fichier existant reste valide.

1. `DialogueFile.backdrop` et `DialogueNode.backdrop` : une clé du registre
   `src/data/backdrops.ts`. Le décor se résout dans cet ordre : le nœud, puis le fichier,
   puis l'ancienne table de `sceneChrome.ts`, conservée en repli pour le chapitre 1. Un
   changement de décor entre deux nœuds se fait en coupe franche. Une clé inconnue est une
   anomalie de `validateDialogue`.
2. `DialogueNode.sound = { sfx?: SfxId[] }` : des bruitages synthétisés, joués à l'entrée du
   nœud. L'emplacement `sound.music` est **réservé** à la musique du slow ; il n'entrera
   dans le type qu'avec la piste (lot 5.12).
3. Effet `counter` : bornes `min?` et `max?` facultatives, appliquées après le `delta`.
4. Condition `{ tempo: { atLeast?, atMost? } }`, qui lit `RunState.tempo`.
5. `SpeakerId` s'étend de `smith`, `enfant`, `murano`, `guide`, `charcudoc` et `ganger`, avec
   leurs libellés dans `SPEAKER_LABELS`. Faute de portrait, `portraits.ts` affiche l'initiale
   sur une couleur, comme pour les autres adultes.

## Conséquences

- Le décor devient une donnée : un chapitre ajoute des lieux sans toucher `sceneChrome.ts`.
  La table du chapitre 1 pourra migrer vers le registre, sans urgence.
- `07-DIALOGUE-FORMAT.md` (contrat exact) et `src/narrative/types.ts` changent ensemble.
- Chaque locuteur nouveau appelle un portrait (lot d'illustrations) ; l'initiale n'est
  qu'un repli.
