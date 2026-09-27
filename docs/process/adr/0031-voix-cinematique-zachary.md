# ADR 0031 — Voix de la cinématique de Zachary et mix adaptatif

**Statut : accepté · Date : 2026-09-27**

## Contexte

L'essai VO du bal (ADR 0030) a été accepté après retrait de la narration aux portes et sous
la fusillade. Le propriétaire veut appliquer la même méthode à la mort de Zachary dans les
égouts. La cinématique possède déjà un montage chronométré, deux pauses de choix et une
chanson avec eau et pleurs ; les derniers mots ont cinq variantes liées au dossier.

## Décision

- Conserver les textes et effets français dans `ch2.egouts.json`. Générer les prises anglaises
  `eleven_v3` avec les voix validées : Lukas pour Zachary, Ember pour Abigail, George pour un
  narrateur discret. Chaque variante exclusive des derniers mots a son propre fichier.
- Le narrateur n'ouvre que `chute` et `soins`. Pas de narration sur la mort ni sur Abigail
  arrachée au corps. La réplique de Zachary et celles d'Abigail gardent leurs Audio Tags et
  jouent à l'entrée de leur nœud. La première prise attend le clic « Lancer » afin de ne pas
  heurter le blocage d'autoplay du navigateur.
- Un lecteur VO partagé par les deux cinématiques gère l'arrêt, le muet et l'onglet caché.
  Pendant une prise, musique, eau, pleurs et bruitages actifs baissent, puis reviennent. Les
  pistes continues changent de volume sur 0,5 s et leur fondu s'interrompt proprement si la
  scène se termine. Les choix et l'horloge visuelle existants ne changent pas ; « Passer »
  coupe la prise en cours.

## Conséquences

Dix petits MP3 sont livrés sous `public/assets/audio/voices/ch2-egouts/` et reproduits par
`scripts/generate-ch2-zachary-voices.ts`. Le format de dialogue et l'API de debug restent
inchangés. Le mix et le jeu émotionnel restent à valider à l'écoute réelle. La conduite et la
méthode de poursuite sont dans [`VOICE-DESIGN.md`](../../chapters/ch2/VOICE-DESIGN.md).
