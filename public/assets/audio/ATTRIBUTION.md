# Provenance des sons du chapitre 2

| Fichier | Source | Licence | Traitement |
|---|---|---|---|
| `gunfire-distant.wav` | [SuperPhat, « Rapid Fire Sub Machine Gun distant.wav »](https://freesound.org/people/SuperPhat/sounds/417690/) | CC0 | Préécoute HQ officielle, extrait des 5,3 premières secondes, mono 32 kHz. |
| `gunfire-close.wav` | [HeyHar, « ambientgunfire.mp3 »](https://freesound.org/people/HeyHar/sounds/347792/) | CC0 | Préécoute HQ officielle, extrait des 4,5 premières secondes, mono 32 kHz. |
| `sewer-drips.wav` | [Urkki69, « Storm Drain »](https://freesound.org/people/Urkki69/sounds/734773/) | CC0 | Préécoute HQ officielle, 0–8 s (le reste de la préécoute est silencieux), gain ×4, fondu d'entrée 0,25 s et de sortie 0,5 s, PCM 16 bits mono 32 kHz ; boucle discrète. |
| `abigail-sobbing.wav` | [9voltfan, « Sobbing »](https://freesound.org/people/9voltfan/sounds/776321/) | CC0 | Préécoute HQ officielle, 3–16 s, fondus d'entrée et de sortie, PCM 16 bits mono 32 kHz ; déclenché une seule fois à la mort de Zachary. |

## Voix du bal et du slow

Les MP3 de `voices/ch2-bal/` sont générés avec ElevenLabs `eleven_v3`, en anglais, au format
MP3 44,1 kHz / 128 kbit/s. Le casting, les identifiants de voix, les textes anglais, les Audio
Tags et les réglages exacts sont dans [`src/data/ch2BallVoices.ts`](../../../src/data/ch2BallVoices.ts).
Le script [`scripts/generate-ch2-ball-voices.ts`](../../../scripts/generate-ch2-ball-voices.ts)
permet de regénérer uniquement les fichiers absents, ou une seule prise avec
`--file=slow-zachary-stay-down --force` (attention : `--force` seul regénère tout). Les 27
prises actuelles utilisent les voix suivantes :
Harry (Franklyn), Rick (John), Lukas (Zachary), Ember (Abigail), Laura (Letitia), George
(narrateur). Ces voix viennent de la bibliothèque ElevenLabs ; les prises sont des créations
générées pour ce projet. Les sous-titres et dialogues du jeu restent en français. Grover n'a
pas encore de prise VO.

## Voix de la mort de Zachary

Les dix MP3 de `voices/ch2-egouts/` sont générés avec ElevenLabs `eleven_v3`, en anglais,
au format MP3 44,1 kHz / 128 kbit/s. Les textes, Audio Tags et identifiants de prise sont
dans [`src/data/ch2ZacharyVoices.ts`](../../../src/data/ch2ZacharyVoices.ts) ; le casting
reste celui de [`ch2BallVoices.ts`](../../../src/data/ch2BallVoices.ts). Le script
[`scripts/generate-ch2-zachary-voices.ts`](../../../scripts/generate-ch2-zachary-voices.ts)
reproduit les fichiers absents, ou une prise choisie avec `--file=<nom> --force`. Zachary
(Lukas) est ralenti (`speed = 0,94`, `stability = 0,35`, `style = 0,24`) ; Abigail (Ember) et
le narrateur (George) conservent les paramètres du bal. Les voix viennent de la bibliothèque
ElevenLabs ; les prises sont des créations générées pour ce projet. Les textes affichés restent
en français. La provenance de la chanson, de l'eau et des pleurs est détaillée ici.

La piste `I_Really_Want_to_Stay_at_Your_House_-_Rosa_Walton_Hallie_Coggins.mp3` est fournie
localement par le propriétaire pour un usage privé. Elle n'est pas versionnée. Vérifier aussi
qu'elle est absente de tout artefact destiné à être publié : le build Vite local copie `public/`.

La piste `47. Let You Down.mp3` est également fournie localement par le propriétaire pour la
cinématique des égouts. Elle est ignorée par Git. Elle reste présente dans un build local si le
fichier est dans `public/` ; l'enlever de tout artefact publié sans licence de diffusion.

## Briefing du centre d'entraînement — chapitre 1

`13. Me Machine.mp3` est fourni localement par le propriétaire pour cette cinématique, à usage
privé. Le fichier est ignoré par Git mais copié dans un build Vite local s'il reste sous `public/`.
La piste commence au clic, joue sous le choix et les voix, puis s'éteint en trois secondes à la
sortie du dialogue.

Les 14 prises MP3 anglaises de `voices/ch1-hall/` ont été générées avec ElevenLabs `eleven_v3`,
au format MP3 44,1 kHz / 128 kbit/s. Sous-titres et choix restent en français. Les textes anglais,
Audio Tags, identifiants de voix et noms de fichiers sont dans
[`src/data/ch1HallVoices.ts`](../../../src/data/ch1HallVoices.ts) ; la commande reproductible est
`npx tsx scripts/generate-ch1-hall-voices.ts` après connexion OAuth de la CLI. Franklyn, Abigail,
Zachary, John et Letitia reprennent les voix du bal ; Grover utilise « Jett — Gritty and Spunky
Young Hero » et l'instructeur « George — War-torn Seargant » (voix différente du narrateur George).
