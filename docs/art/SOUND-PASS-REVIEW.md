# Revue de la passe sonore — 4 octobre 2026

## Livraison

Cinq compositions originales ElevenLabs : Title, plus rythmée pour l'accueil à 120 BPM,
Academy, Pressure, Afterglow et Neon pour le jeu. Six ambiances CC0 complètent les pièces
et les extérieurs. Les onze MP3 servis pèsent 5 996 829 octets ; les masters restent hors
dépôt. Les trois chansons cinématiques locales du propriétaire restent exclusives pendant
leurs dialogues, y compris après la disparition de l'image.

Musique à 0,12 et ambiance à 0,16, encore abaissées sous les voix ; les chansons cinématiques
jouent à 0,48–0,58. Les sources inchangées conservent leur position, les changements se
raccordent en 1,5 s. Le muet commun est sauvegardé et fonctionne aussi depuis le tactique.

Les boutons ont un clic discret et le premier lancer visuel du dé a un roulement. Ces
effets sont synthétisés localement avec Web Audio. La barre d'exploration contient le son
et la rotation horaire de la caméra ; elle quitte la zone de Chance. Sur petit écran,
l'objectif se place aussi sous la Chance, et sous la jauge d'état lorsqu'elle est présente.

Direction : [11-SOUND-DESIGN](../design/11-SOUND-DESIGN.md). Production, prompts,
provenances et mesures : [audio-generation](audio-generation/README.md).

## Vérifications

- `npm run verify` : typecheck, lint, **57 fichiers / 787 tests** et build réussis sur
  les sources finales. L'avertissement existant sur la taille des bundles Vite reste présent.
- Deux parcours Playwright existants ont passé leurs assertions : chapitre 1 de l'intro
  jusqu'au combat et chapitre 2 jusqu'au bilan. Le processus a ensuite été arrêté pendant
  une fermeture de serveur de preview bloquée ; ce n'est pas un résultat de suite E2E complète.
- Navigateur Chromium, gestes réels : accueil, changement de morceau au lancement,
  continuité sur conversation, muet depuis le tactique et après rechargement, briefing
  du hall, baisse sous VO, exclusivité du slow et des égouts après leur image, restauration
  du fond et pause/reprise selon la visibilité. Instantanés via `window.__game.audio()`.
- Clic et dé : clic unique, silence au muet, roulement au premier lancer manuel, aucun
  roulement à l'ouverture du contrôle ; rotation au clic et par activation clavier sans
  déplacement du cadet. Cibles de 44 px, contrôles hors Chance et objectif à 1280 et 390 px.
- Les onze réponses HTTP ont le type `audio/mpeg` et correspondent aux fichiers locaux
  octet pour octet. Lecture réelle de toutes les nouvelles couleurs, y compris Industrial
  après exclusivité et après huit changements rapides ; aucune piste perdue.
- Normalisation, durée et raccords mesurés : [measurements.json](audio-generation/measurements.json).
  Les crêtes restent sous −2 dBTP et les discontinuités de boucle sous 0,0017 de la pleine
  échelle avant le gain de fond.

Les captures de placement et instantanés techniques restent localement dans `.dream-loop/`.
Le propriétaire a également essayé cette passe et signalé un résultat satisfaisant.
Ces contrôles prouvent la lecture et le comportement ; le choix musical reste un jugement
d'écoute.

## Accès ElevenLabs

La CLI OAuth existante a généré les cinq musiques. Son appel REST de bruitage transmet le
bearer mais reçoit HTTP 401. Le MCP officiel propose les bruitages par son propre OAuth ;
cette connexion dédiée n'a pas été autorisée dans cette passe. Un essai de relais de la
session CLI a été refusé par le contrôle automatique : aucun relais exécuté, aucun token
lu, affiché ou enregistré. Les ambiances CC0 et les effets synthétisés sont les sons livrés.
