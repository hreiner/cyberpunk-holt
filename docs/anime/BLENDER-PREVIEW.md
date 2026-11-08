# Prévisualisation locale Blender — Blue Purple

`anime/blender/preview.py` rend une plage d'un `.blend` existant dans un **nouveau**
dossier, puis assemble ces images avec le mix local des 14 voix et les sous-titres
français de `scene-v1.json`. Les entrées restent intactes et chaque essai conserve ses
images, sa liste de lecture, son extrait SRT et son MP4. Choisir le dossier de sortie sur
C: tant que D: manque d'espace.

Le projet source est une ébauche 3D ; Wendy utilise une doublure et le résultat ne valide
ni le caractère anime ni le jeu des personnages. Le script ne crée pas de synchro labiale.
`--step 3` calcule une image toutes les trois images à 24 i/s, soit huit images calculées
par seconde, puis encode à 24 i/s en répétant les images. C'est un aperçu économique,
pas un rendu fluide à 24 images distinctes par seconde.

```powershell
$blenderAnime='D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe'
$ffmpegAnime='D:/AgenticCoding/cyberpunk-holt/art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
$sceneAnime='C:/Users/hadri/.codex/visualizations/2026/11/04/01a1a728-9ede-7730-93dc-26ad220618a0/blender/v6/blue-purple-blocking.blend'
$sortieAnime='C:/Users/hadri/.codex/visualizations/2026/11/04/01a1a728-9ede-7730-93dc-26ad220618a0/blender/nouvel-essai'
python anime/blender/preview.py --blend $sceneAnime --output-dir $sortieAnime --blender $blenderAnime --ffmpeg $ffmpegAnime --start 1 --end 144 --step 3 --percentage 50 --samples 4
```

Les images `start..end` sont interprétées selon la chronologie 24 i/s de la scène ; mix et
sous-titres sont coupés au même instant. Rendus Blender hors bac à sable sur ce poste : la
version 4.2.23 démarre alors que le lancement isolé échoue. Pour vérifier une séquence qui
ne commence pas à la première image, contrôler son premier sous-titre et son audio en plus
 des métadonnées. Aucun service externe ni génération payante n'est utilisé.

## Preuve locale effectuée

Le 4 novembre 2026, Blender 4.2.23 hors bac à sable a rendu la version v6, frames 1 à
168, échantillonnées tous les trois frames, 480 × 270 et quatre échantillons Cycles. Les
56 images source ont été rendues et assemblées en 54,06 s sur ce poste. L'extrait initial
fait 7,00 s ; un second fichier `preview-replique-complete.mp4` en conserve 6,67 s pour ne
pas couper la prise Wendy ni introduire la prise John. FFmpeg y détecte H.264 24 i/s,
AAC stéréo et sous-titre français `mov_text`. La durée et les flux ne constituent pas une
écoute humaine ni une évaluation de jeu ou de synchronisation labiale.

## Prévisualisation complète v7

Le 4 novembre 2026, v7 a été rendu du frame 1 au 1496 : 499 images calculées à
480 × 270 (une toutes les trois images), assemblées sur 62,33 s en MP4 H.264 à 24 i/s
avec AAC et sous-titres français. Le processus complet de rendu et multiplexage a pris
487,5 s. Sortie et images intermédiaires sous `preview-v7-complet/` dans le dossier
`C:/Users/hadri/.codex/visualizations/2026/11/04/01a1a728-9ede-7730-93dc-26ad220618a0/blender/`.
La scène `.blend` v7, avec caméras par locuteur et marqueurs de répliques, est dans `v7/`.
Les sous-titres de la dernière réplique et les flux ont été contrôlés avec FFmpeg. Il ne
s'agit pas d'une validation d'écoute ni d'une animation labiale ; Wendy reste un doublon
provisoire d'Abigail et les poses ainsi que le rendu restent très loin de la cible.

La cible `target-v2.png` a été créée avec ImageGen à partir du décor HOLT, de l'ancre
comics et du portrait de Wendy, puis retravaillée à la demande du propriétaire : anime aux
aplats francs pour tous les personnages et le bar, éclairage cyan, magenta et jaune. Elle
est une référence de direction artistique, pas une image extraite du rendu Blender.

La version v7 complète a ensuite été rendue localement sur les frames 1–1496 avec le
même échantillonnage et les mêmes réglages : 499 images calculées, puis MP4 de 62,33 s
en 487,5 s. FFmpeg y détecte vidéo H.264 480 × 270 à 24 i/s, audio AAC 48 kHz stéréo
et piste `mov_text` française ; le SRT comporte 14 répliques. Elle se trouve sous
`C:/Users/hadri/.codex/visualizations/2026/11/04/01a1a728-9ede-7730-93dc-26ad220618a0/blender/preview-v7-complet/preview.mp4`.
Ce contrôle ne prouve pas une écoute ni une synchronisation labiale ; la scène reste une
prévisualisation avec Wendy doublée par le modèle d'Abigail.
