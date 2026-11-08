# Revue son — couverture et tir17

8 novembre2026. [Sélection prête à intégrer](SELECTION.json), sous pilotage root.
Cette passe n'a produit aucun MP4 long, aucune nouvelle voix, aucun appel payant.
Les mesures sont techniques ; aucune écoute humaine n'est revendiquée.

## Couverture

La couverture dure12s et précède les21pages. Sa musique réemploie `music-neon.mp3`
HOLT, extrait24–36s, fadein0,8s et fadeout1,4s. Le gain mesuré0,7946423176
(−1,9966dB) conduit à un pic−8dBFS et un RMS−25,18dBFS. La préécouteAAC stéréo192k
donne−23,6LUFS/−8dBTP, sans écrêtage. Cette présence de fond n'ajoute ni voix ni
accent artificiel au visuel.

Source SHA `ca163a37fe61f5b03e668708bfa4b80f531144e6d9d93db976791f03d29cd0e6`.
La composition est une création HOLT ElevenLabs `music_v2_5` déjà livrée en octobre,
réemployée ici sans génération. Provenance :
[attribution commune](../../../../../../../public/assets/audio/ATTRIBUTION.md) et
[conduite des sources](../../../../../../art/audio-generation/background.json).

`cover-v1/cover-backing.wav` SHA
`39c386a7bd781682c6fc61391da7a2950c780cecf16e81ab34e39ef7072f06e4`.
Le lancement audio reste lié au geste de lecture habituel du navigateur ; root
intègre la couverture comme première entrée de la séquence.

## Tir, impact et réaction17

Contrat confirmé par root : révélation du premier état, départ du tir, impact80ms
plus tard, puis réaction et voix. La durée de la page reste10,902222s. La prise
Wendy « Take cover! » dure toujours1,04s ; root déplace son entrée dans le candidat17,
sans régénération et sans incorporer les mots au backing.

| Événement | Dans la page17 | Chapitre sans couverture | Avec couverture12s |
| --- | ---: | ---: | ---: |
| Tir unique | 4,67s | 373,56s | 385,56s |
| Impact visuel | 4,75s | 373,64s | 385,64s |
| Entrée Wendy | 5,13s | 374,02s | 386,02s |

Une seule occurrence de `single-shot-metal` est jouée. Le composé existant contient
le départ et la résonance métallique : pas de deuxième copie à l'ancre d'impact.
Les fenêtres source0–80ms et80–160ms donnent respectivement RMS−14,37 et−17,87dBFS,
avec pics−10,00 et−10,45dBFS. La seconde fenêtre demeure présente au moment du
contact visuel ; elle ne constitue pas un second départ sonore. La revue technique
ne prétend pas isoler sémantiquement chaque composante par une écoute humaine.

La musique et les enveloppes sous parole sont recalculées dans la seule page17,
en respectant le nouvel emplacement de Wendy. Les pas de fuite et leur ancre sont
conservés. La source du tir et toutes les voix restent les fichiers livrés.

## Fichiers et conservation

Le dossier sélectionné est `motion-02/sound/soundtrack-v2/` : backing global avec
couverture, backing chapitre sans couverture, backing du lot9–21, backing isolé17,
source du mix et rapport. `soundtrack-v1/` est un essai local arrêté pendant la
préparation des préécoutes, marqué `FAILED.json` ; il n'est pas sélectionné et n'a
déclenché aucun appel fournisseur.

Le chapitre sourcev8 dure446,002222s. Le complet avec couverture dure458,002222s.
L'audit indépendant `motion-02/sound/final-audit.json` relit les fichiers produits
et compare les octets PCM :

- toute la partie du chapitre avant368,89s est exacte ;
- toute la partie après379,792222s est exacte ;
- les gardes de0,25s aux deux bords de la fenêtre17 sont exactes ;
- les12s de couverture sont exactement celles du backing couverture ;
- le reste du complet égale exactement le nouveau chapitre ;
- le backing17 et celui9–21 correspondent exactement à leurs portions du chapitre.

Le backing complet est stéréo44,1kHz,20 197 898framesPCM, pic−4,005dBFS,
RMS−33,72dBFS, zéro sample écrêté. SHA
`964d7a71275abe6e1b3d3b04531b595e0a6a9f393d8f141cea6acd6e80715137`.
Le backing17 SHA est
`a7c88f14598eec0d0776291e2ad0ef811df8353d59a92e25ae9a6138698753b6`.
Les calculs du mix en float précèdent l'écriturePCM16 ; la fonction d'écriture refuse
toute valeur dépassant1. Le décodage des fichiers finaux est également contrôlé.

## Préécoutes et synchronisation

Deux préécoutes courtes suivent la chaîne réelle stéréo à gain vocal unitaire,
AAC2canaux192kbit/s :

| Préécoute | Durée nominale | True peak | Niveau intégré |
| --- | ---: | ---: | ---: |
| `cover-to-chapter-audition.m4a` | 22s | −6,1dBTP | −22,5LUFS |
| `page-17-audition.m4a` | 10,902222s | −1,8dBTP | −16,6LUFS |

Aucun écrêtage, décodage entier et deux canaux vérifiés. Le premier extrait comprend
la couverture puis le début du chapitre avec la première voix. Le second conserve
les trois prises de la page17, dont Wendy décalée au contrat.

La corrélation du transitoire du tir entre le stem isolé et l'AAC17 mixé vaut0,99487,
avec décalage optimal0sample sur une recherche±2ms : la préécoute ne déplace pas
l'accent par rapport à l'ancre. Root conserve la contre-revue de l'image animée et
de son raccord au lecteur ; cette passe ne revendique pas un nouveau film complet.

Compteurs audio inchangés : cumul10requêtesSFX/36s demandées et7062caractèresTTS
connus. Nouvelle production de cette passe :0appelpayant,0voix,0musiquegénérée.
