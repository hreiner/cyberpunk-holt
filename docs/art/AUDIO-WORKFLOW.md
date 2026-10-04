# Produire et intégrer l'audio HOLT

Point d'entrée pour voix, musique, ambiances et bruitages. La direction de fond est dans
[11-SOUND-DESIGN](../design/11-SOUND-DESIGN.md), les montages dans
[CINEMATIC-SCENES](../process/CINEMATIC-SCENES.md). Partir du besoin sonore et de la scène ;
ne pas générer tout le récit parce que l'accès ElevenLabs est disponible.

## Choisir le circuit

| Besoin                                                | Sources et raccord                                                      | Production                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| fond musical                                          | `src/data/backgroundAudio.ts`, `src/audio/background.ts`                | [background.json](audio-generation/background.json), script de musique |
| ambiance continue                                     | même contrôleur, registre de pièce/scène                                | CC0 livré ; alternative ElevenLabs si endpoint accessible              |
| effet ponctuel                                        | `src/audio/sfx.ts`, `src/narrative/types.ts`, champ de nœud `sound.sfx` | synthèse ou fichier attribué ; contrôler la clé sonore                 |
| VO de dialogue/montage                                | manifestes `src/data/*Voices.ts`, `ChapterVoiceover`, `chapter.ts`      | CLI ElevenLabs OAuth ; `eleven_v3`, casting conservé                   |
| chanson cinématique locale                            | vue de montage et propriété jusqu'à la fin du dialogue                  | fichier du propriétaire ; ne pas le redistribuer                       |
| nettoyer, transcrire ou transformer un enregistrement | besoin de production distinct du lecteur du jeu                         | skill ElevenLabs adapté ; pas un nouveau système de jeu                |

Les skills génériques `music`, `sound-effects`, `text-to-speech` documentent leurs
SDK/API. Pour le flux livré de HOLT, employer d'abord `$holt-audio` et les scripts OAuth.
`voice-isolator`, `speech-to-text`, `voice-changer`, `dubbing` répondent respectivement
au nettoyage, à la transcription, au changement de voix et à la traduction d'un média.
`agents` / `speech-engine` construisent des agents **vocaux ElevenLabs** ; ils ne
configurent pas les agents de développement du dépôt.

## Authentification : vérifier avant de demander

1. `npm run doctor -- --scope=audio` localise CLI/Python/FFmpeg ; il ne teste pas le compte.
2. Vérifier `elevenlabs auth status`. Sous Windows, si le shim ou PATH échoue :

   ```powershell
   & node "$env:APPDATA/npm/node_modules/@elevenlabs/cli/bin/cli.js" auth status
   ```

3. Si OAuth CLI est valide, conserver ce circuit pour les scripts existants.
   Un SDK qui attend `xi-api-key` et un MCP connecté ont des accès distincts.
   Un autre emplacement du fichier JS de la CLI se configure par `HOLT_ELEVENLABS_CLI`.
4. Si la CLI n'est pas connectée, utiliser son login avec le propriétaire. Une connexion
   MCP dédiée ne se déduit pas de la CLI ; ne jamais extraire/transférer son bearer,
   cookies ou stockage de compte pour fabriquer cette connexion.
5. Employer `setup-api-key` seulement si le circuit choisi exige réellement une clé.
   Ne pas réouvrir une configuration OAuth fonctionnelle pour satisfaire un exemple SDK.

Constat daté du 4 octobre : la CLI OAuth a généré musiques et voix ; les bruitages CLI ont
renvoyé HTTP 401. Cela ne démontre pas une incapacité générale d'ElevenLabs. Le MCP officiel
demande une connexion dédiée. Pour la passe livrée, CC0 était le repli autorisé.
Les prompts alternatifs du manifeste ne sont **pas** la provenance des ambiances CC0.
Voir [production du fond](audio-generation/README.md) et [revue](SOUND-PASS-REVIEW.md).
Une erreur 401 appelle un diagnostic d'accès, pas une boucle de tentatives payantes.

## Voix : conduite, puis prise ciblée

Les textes à l'écran restent français ; les VO cinématiques validées sont anglaises.
Lire [VOICE-DESIGN](../chapters/ch2/VOICE-DESIGN.md) ou
[CH1-HALL-CINEMATIC](../chapters/CH1-HALL-CINEMATIC.md). Le texte français et les choix
restent la source du récit. Décider où une voix aide et où le silence raconte mieux.

| Scène         | Casting/prompts                                 | Script                                   |
| ------------- | ----------------------------------------------- | ---------------------------------------- |
| briefing hall | `src/data/ch1HallVoices.ts`                     | `scripts/generate-ch1-hall-voices.ts`    |
| bal/slow      | `src/data/ch2BallVoices.ts`                     | `scripts/generate-ch2-ball-voices.ts`    |
| égouts        | `src/data/ch2ZacharyVoices.ts` + casting du bal | `scripts/generate-ch2-zachary-voices.ts` |

```sh
npx tsx scripts/generate-ch1-hall-voices.ts --file=tease-grover --force --dry-run
npx tsx scripts/generate-ch1-hall-voices.ts --file=tease-grover --force
npx tsx scripts/generate-ch2-ball-voices.ts --file=slow-zachary-stay-down --force
npx tsx scripts/generate-ch2-zachary-voices.ts --file=egouts-zachary-abi --force
```

Sans `--force`, les fichiers non vides existants sont conservés. Avec `--force`,
**une seule cible `--file` est obligatoire**. `--dry-run` ne lance aucun service et ne
crée pas de dossier, MP3 ou manifeste. Pour un nouveau lot, prévisualiser les manquants
avant de lancer le script sans filtre. Ne pas recréer les prises du slow retirées après écoute.

Adapter brièvement l'anglais, placer les Audio Tags dans le texte au changement de jeu,
puis écouter : un tag peut être prononcé ou sonner faux. Ne pas deviner une voix par son
prénom : les deux George (narrateur et instructeur) ont des IDs différents.
Conserver IDs/réglages dans les données. Une modification de texte nécessite la prise
correspondante ; un réglage de volume/fondu ne nécessite pas de nouveau MP3.

## Musique et ambiances

Réemployer les cinq couleurs livrées avant une composition nouvelle. Les intentions,
durées, modèles et raccords sont dans [background.json](audio-generation/background.json).
Les scripts de génération transmettent le corps JSON sur stdin pour contourner une
validation erronée de la CLI constatée, sans manipuler son auth.

```sh
npx tsx scripts/generate-background-audio.ts --music-only --dry-run
npx tsx scripts/generate-background-audio.ts --asset=music-academy --force --dry-run
npx tsx scripts/generate-background-audio.ts --asset=music-academy --force
python scripts/download-background-ambiences.py
python scripts/prepare-background-audio.py --asset=music-academy --force --ffmpeg=<chemin>
```

`python` est un alias de commande dans ces exemples ; utiliser le chemin repéré dans
[TOOLS](../process/TOOLS.md) s'il n'est pas dans PATH. La préparation prend des masters
dans `art-masters/audio/background/` et écrit les MP3 légers dans
`public/assets/audio/background/`. Sources CC0 et hashes :
[ambience-sources.json](audio-generation/ambience-sources.json).
Mesures versionnées : [measurements.json](audio-generation/measurements.json).
Après une préparation nouvelle, recopier les mesures pertinentes depuis les masters
vers ce rapport versionné. Cibler aussi `--asset` pour refaire une préparation.

## Mix, raccord et preuve

- Le fond commun appartient à `ChapterApp` ; la scène et la pièce choisissent ses données.
  Une porte ou une conversation ne redémarre pas une composition identique.
- Fond normalisé : musique autour de −20 LUFS, ambiance −24 LUFS, crête <=−2 dBTP.
  Le gain de lecture du fond est très inférieur aux chansons cinématiques.
- Les voix abaissent le fond ; les montages prennent l'exclusivité jusqu'à la sortie
  réelle du dialogue. Garder leur musique pendant pauses, tirs et choix, sauf conduite contraire.
- Cinématique : baisse et remontée sur 0,5 s depuis le volume courant ; fondu de sortie
  prioritaire, chansons/effets/prises nettoyés sur saut forcé et destruction.
- Muet commun, pause d'onglet, premier geste utilisateur et fallback de fichier manquant
  sont des comportements de lecture à vérifier.

Contrôler réponse HTTP (`audio/mpeg`, taille/hash), durée et lecture après un geste.
Vite peut garder un fichier public produit pendant son exécution avec une réponse HTML
200 : redémarrer et contrôler le contenu. Mesurer puis écouter avec voix, musique et effets
ensemble ; tester « Passer », choix et reprise. Rapporter explicitement si l'écoute n'était
pas disponible. Ajouter provenance dans [ATTRIBUTION](../../public/assets/audio/ATTRIBUTION.md).
