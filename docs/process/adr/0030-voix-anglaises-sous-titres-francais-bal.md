# ADR 0030 — Voix anglaises et sous-titres français pour le bal

**Statut : accepté · Date : 2026-09-27**

## Contexte

Les premiers essais ElevenLabs en français semblaient robotiques au propriétaire. Les essais
anglais de Letitia (Laura) et du narrateur (George) ont été acceptés, puis le propriétaire a
choisi Harry pour Franklyn, Rick pour John, Lukas pour Zachary et Ember pour Abigail. Les
dialogues du jeu restent écrits et affichés en français (ADR 0006).

## Décision

- Les prises de la scène `ch2.bal` et du slow `ch2.slow` sont générées en anglais avec
  `eleven_v3`. Le script, les voix, les paramètres et les Audio Tags se trouvent dans
  `src/data/ch2BallVoices.ts` ; `scripts/generate-ch2-ball-voices.ts` reproduit les fichiers.
  Le texte français de `src/data/dialogues/` reste la source des sous-titres et des effets.
- `ChapterVoiceover` joue le fichier correspondant à l'entrée d'un nœud, au plus une fois par
  entrée. Passer à un autre nœud coupe la prise ; une erreur de lecture laisse jouer la scène
  en texte. Grover reste sans voix tant que son casting n'est pas choisi.
- Dans le slow, le narrateur accompagne les moments calmes, mais **pas** le plan des portes ni
  la fusillade. Après le début des tirs, seule la réplique de Zachary est parlée. L'horloge
  visuelle attend la fin du murmure de Franklyn et Letitia ; la chanson continue. Pendant une
  prise, la chanson et les bruitages du dialogue baissent, puis retrouvent leur niveau. Ainsi
  la rafale reste perceptible sans couvrir Zachary. Le muet, le changement d'onglet, « Passer »
  et la fin de scène arrêtent ou suspendent les voix comme les autres sons.

## Conséquences

Le format de dialogue et l'API de debug ne changent pas. Les fichiers MP3 légers sont servis
localement sous `public/assets/audio/voices/ch2-bal/`. Leur provenance est consignée dans
`public/assets/audio/ATTRIBUTION.md`. La version anglaise est une interprétation fidèle du
texte français, sans incidence sur les choix ni les règles. La sélection finale des prises
et le mix avec la chanson demandent une écoute sur le poste de jeu.
La conduite et les critères de poursuite sont dans
[`VOICE-DESIGN.md`](../../chapters/ch2/VOICE-DESIGN.md).
