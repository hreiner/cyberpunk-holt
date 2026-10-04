# Production du fond sonore

La direction et la conduite sont dans [`11-SOUND-DESIGN.md`](../../design/11-SOUND-DESIGN.md).
Les musiques sont des compositions originales ElevenLabs ; les ambiances livrées sont des
enregistrements CC0. Les trois chansons locales du propriétaire ont servi à définir les
intentions de tension, d'amitié et de perte ; elles n'ont pas été téléversées ni échantillonnées.

## Reproduire les fichiers

1. Vérifier `elevenlabs auth status` sur le poste connecté. Sous Windows, la CLI peut être
   lancée par Node depuis `%APPDATA%/npm/node_modules/@elevenlabs/cli/bin/cli.js`.
2. `npx tsx scripts/generate-background-audio.ts --music-only` génère les masters musicaux
   manquants. Pour une nouvelle version : `--asset=music-academy --force`. `--force` exige
   toujours une seule cible. Les prompts et durées sont dans [`background.json`](background.json).
3. `python scripts/download-background-ambiences.py` télécharge les préécoutes HQ officielles
   manquantes. [`ambience-sources.json`](ambience-sources.json) donne sources, licences et SHA-256.
   Le téléchargement vérifie les hashes avant écriture ; un fichier existant est conservé.
4. Fournir FFmpeg via `--ffmpeg=<chemin>` ou `FFMPEG_BINARY`, puis lancer
   `python scripts/prepare-background-audio.py`. L'outil peut aussi repérer la copie locale
   hors dépôt de `imageio-ffmpeg`. `--asset=<identifiant> --force` refait un seul fichier servi.

Les quatre masters de jeu sont tronqués à 96 s ; l'accueil utilise 64 s. Les ambiances
emploient au plus 24 s. Le raccord
circulaire mélange sa fin et son début sur 6 ou 4,8 s pour la musique, 2 s pour les ambiances.
La sortie dure donc 90 ou 91,2 s en jeu et 60 s pour l'accueil ; les ambiances durent 22 s,
sauf le ventilateur de 5 s.
Un passe-haut à 35 Hz enlève le très grave inutile. Le feu reçoit aussi un passe-bas à
4 500 Hz et un limiteur à 0,0625 sans gain automatique pour contenir les craquements.
Deux microfondus de 10 ms aux extrémités évitent les clics ajoutés par l'encodage MP3.

La normalisation FFmpeg utilise les mesures du premier passage (`loudnorm`) : cible
−20 LUFS pour la musique, −24 LUFS pour les ambiances, plafond −2 dBTP. Les fichiers servis
sont des MP3 44,1 kHz : musique stéréo 96 kbit/s, ambiances mono 64 kbit/s. Les métadonnées
des sources sont retirées. `art-masters/audio/background/measurements.json` conserve durée,
niveau intégré, crête, dynamique, taille et discontinuité résiduelle du raccord après décodage.
Les mesures de la livraison sont aussi versionnées dans [`measurements.json`](measurements.json).

Les onze fichiers livrés pèsent **6,00 Mo au total**. Les mesures finales donnent
−20,41 à −20,45 LUFS pour les musiques et −24,40 à −24,45 LUFS pour les ambiances.
La crête maximale est −2,21 dBTP (feu). La discontinuité de boucle après décodage est
inférieure à 0,0017 de la pleine échelle, avant le gain de lecture de fond.

## Accès ElevenLabs constaté le 4 octobre 2026

OAuth actif, accès à l'abonnement et génération `music_v2_5` confirmés. La CLI 1.4.0 valide
incorrectement certains champs `music_prompt` dépréciés lorsque seuls les flags `--prompt`
sont fournis : le script transmet donc un corps JSON sur stdin. Aucun secret n'est lu,
affiché ou enregistré dans le dépôt.

L'endpoint `text-to-sound-effects.convert` renvoie HTTP 401 avec cette même session OAuth,
alors que la CLI transmet bien l'en-tête bearer (vérifié sans lire ni afficher le token).
Le [MCP officiel ElevenLabs](https://elevenlabs.io/blog/introducing-voice-music-image-and-video-generation-in-the-elevenlabs-mcp)
annonce la génération de bruitages par OAuth ; sa connexion dédiée reste à autoriser.
Les prompts d'ambiances de `background.json` restent des alternatives de production ; ils
ne décrivent pas les fichiers CC0 livrés. Le repli sur Freesound est prévu par la demande
du propriétaire. Il ne nécessite pas de clé ni de nouvelle connexion.

Les clics et le roulement des dés sont des effets Web Audio locaux, définis dans
`src/audio/sfx.ts`. Aucun fichier généré ElevenLabs n'est revendiqué pour ces deux sons.

## Vérification du serveur local

Si des fichiers sont produits pendant que Vite tourne, redémarrer le serveur après la
préparation. Lors de cette passe, son registre de fichiers publics avait gardé une entrée
obsolète : `ambience-industrial.mp3` recevait la page HTML avec un statut 200. Un statut
HTTP seul ne prouve donc pas qu'un son est servi ; vérifier `audio/mpeg`, la taille ou le
hash de la réponse, puis sa lecture. Après redémarrage, les onze réponses correspondent
exactement aux MP3 locaux.

Résultats de la passe et limites de vérification : [SOUND-PASS-REVIEW](../SOUND-PASS-REVIEW.md).
