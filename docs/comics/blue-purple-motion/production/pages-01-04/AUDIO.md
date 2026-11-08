# Conduite sonore — pages 1 à 4

Lot lancé le 5 novembre 2026 selon [l’orchestrateur](../../../../anime/MOTION-COMICS-ORCHESTRATOR.md).
Propriétaire : direction audio ; intégration des manifestes et sélection finale : intégrateur.

## Circuit vérifié

- `npm run doctor -- --scope=audio` : CLI, Python 3.12, FFmpeg et librairies média présents.
- `elevenlabs auth status` dans la sandbox : backend fichier, session absente ; cette sortie
  ne représente pas le compte Windows. La même commande via Windows Credential Manager
  a confirmé une session OAuth active. Aucun jeton n’a été lu ou transféré.
- Liste des modèles du circuit OAuth : `eleven_v4`, `can_do_text_to_speech: true`,
  `token_cost_factor: 1.0`. Le débit exact en crédits ou euros reste inconnu.
- Cinq tests simulés de `holt_anime.voice_take` réussis : transmission du modèle et des
  réglages, prévisualisation sans réseau/écriture, défauts v4, plafond cumulant échecs et
  tags, reprise et autorisation explicites.

Documentation officielle consultée le 5 novembre : [tags audio v3/v4](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-do-audio-tags-work-with-eleven-v3-and-v4),
[contrôles du TTS](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech),
[tarifs API](https://elevenlabs.io/pricing/api). Les tarifs publics ne suffisent pas à
déduire le coût réel du circuit OAuth. Les tags dirigent les changements d’intention ;
leur effet doit être contrôlé sur les prises.

## Production et dépenses

Les quatre prises de page 1 sont conservées depuis le manifeste retenu
`anime/motion-comics/projects/blue-purple-page01-v4-v1.json` ; aucune régénération.
Les nouvelles prises utilisent le casting `anime/projects/blue-purple/cast.json`,
`eleven_v4`, stabilité 0,5 et similarité 0,8, MP3 mono 44,1 kHz/128 kbit/s.
La conduite globale est `AUDIO-DIRECTION.json`, indices `--line` uniques pour tout le lot.

Dossier commun de journaux et prises :
`art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1/`.
Les synthèses et mesures restent dans son parent afin de ne pas entrer dans le compteur.
Plafond cumulé fixé avant soumission : **1 800 caractères**, pour une première passe de
**1 044 caractères avec tags** et une réserve de 756 caractères pour corrections ciblées.
Toutes les tentatives, tags, échecs et interruptions sont comptés. Une tentative `running` impose une inspection
avant toute décision de reprise ; aucune reprise automatique.

Conduite : 15 lignes globales, dont les quatre réemplois page 1 et les onze nouvelles
prises d’indices 5 à 15, identifiants `bp-l005` à `bp-l015`. Les onze prévisualisations
sans réseau ont réussi avant soumission. Contrats v1 et storyboard v1 contre-revus sans
blocage narratif, lexique verrouillé ; feu vert intégrateur reçu. SHA-256 de conduite :
`b2258541f159e43b53838eceb10f3ad98e71d9fe018e8da0277464647ab2d19b`.

## Mix et limites de revue

Le fond HOLT peut être réemployé sans génération : `music-pressure.mp3`, à niveau bas et
en continuité entre pages, avec fondu d’entrée/sortie. Le montage conserve les respirations
et recale les cases sur les durées décodées ; la VF doit rester lisible.
La page 4 vide les clients du bar ; éviter une ambiance de foule persistante à ce moment.

Aucune écoute humaine des nouvelles prises n’est encore revendiquée. Un décodage ou une
mesure de niveau ne remplace pas le jugement d’interprétation, de prononciation ou de mix.

## Résultat de la première passe

Les onze requêtes ont réussi : **1 044 caractères soumis sur 1 800**, onze journaux
individuels, aucune reprise ni aucun échec ; réserve restante 756 caractères. Les journaux
gardent leur état fournisseur `review`. La sélection technique ne constitue pas une
approbation humaine. Coût réel et identifiants fournisseur restent inconnus, non exposés
par la CLI. Le hash de conduite transmis est identique pour toutes les prises.

Synthèse avec mapping d’intégration, hashes SHA-256, niveaux, événements de silence et
durées PCM décodées :
`art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1-measurements.json`.
Champs `audio` et `takeJournal` relatifs à la racine du dépôt ; l’intégrateur les convertit
en chemins relatifs aux manifestes sélectionnés. Les onze fichiers décodent entièrement
en PCM mono 44,1 kHz sans erreur FFmpeg. Aucun écrêtage détecté : crêtes de −12,1 à −1,5 dB.
Les différences de niveau correspondent en partie aux intentions de murmure et d’autorité ;
elles restent à juger à l’écoute du mix.

| Indice | Case | Voix | Durée décodée |
| --- | --- | --- | --- |
| 5 | p02-c01 | Wendy | 5,28 s |
| 6 | p02-c02 | Franklyn | 6,48 s |
| 7 | p02-c03 | Grover | 6,08 s |
| 8 | p02-c04 | Franklyn | 2,72 s |
| 9 | p02-c04 | John | 2,40 s |
| 10 | p03-c01 | Wendy | 5,04 s |
| 11 | p03-c04 | L’enfant | 2,88 s |
| 12 | p04-c01 | Franklyn | 7,12 s |
| 13 | p04-c02 | Franklyn | 4,08 s |
| 14 | p04-c03 | Wendy | 2,40 s |
| 15 | p04-c04 | John | 3,04 s |

Préécoute locale : `voices-v4-v1-audition.mp3` dans le parent des prises, ordre 5 à 15,
avec 0,65 s après chaque réplique, sans gain ni étirement appliqué. Le WAV PCM reste
présent à côté. Ce fichier facilite une écoute ultérieure ; sa fabrication ne vaut pas
écoute humaine. Le montage doit conserver les minima de lecture des contrats, notamment
la case Grover et les deux cases muettes de vision.

Commandes réellement exécutées : diagnostic audio, statut OAuth sandbox puis Windows,
liste des modèles OAuth, cinq tests simulés `test_voice_take.py`, onze appels `--dry-run`,
puis onze appels `holt_anime.voice_take` avec `--line 5` à `--line 15`, `--model eleven_v4`,
`--approved`, le dossier commun et `--max-characters 1800`. Mesure : FFmpeg décode vers
`s16le`, un canal/44 100 Hz ; la durée est le nombre d’échantillons divisé par 44 100.
Les effets `volumedetect` et `silencedetect=noise=-45dB:d=0.2` consignent les contrôles
de niveau et de silence. Aucun nouveau script fournisseur partagé n’a été modifié.
