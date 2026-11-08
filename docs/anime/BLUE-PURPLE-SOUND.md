# Blue Purple — mixage de l'animatique

Mix local préparé le 4 novembre 2026 pour la chronologie `scene-v1.json` du studio.
Les 14 voix existantes ElevenLabs conservent leurs points de départ exacts ; musique
`music-neon.mp3` et ambiance `ambience-night-city.mp3` proviennent du jeu. Une baisse
progressive du fond pendant la parole, une remontée sur 600 ms, des fondus début/fin,
un filtre grave sur les voix et un limiteur forment la proposition. Aucun bruit d'action
n'est inventé dans cette conversation ; l'effet de vision reste à concevoir. Les fichiers
d'entrée ne sont pas modifiés. Aucun appel externe ni génération payante.

Le master de travail local `art-masters/anime/blue-purple/mix-scene-v2.m4a` fait 62,30 s,
AAC stéréo 48 kHz. FFmpeg `volumedetect` mesure -21,1 dBFS en moyenne et -2,6 dBFS au
maximum échantillon ; ce n'est pas une mesure LUFS ni une mesure de crête vraie. Le premier
mix coupait trop tôt et est conservé comme essai écarté. Aucun examen d'écoute humaine n'a
été réalisé ici : intelligibilité, émotion et équilibre restent à approuver à l'écoute.

Depuis la racine PowerShell, avec un nom de sortie nouveau :

```powershell
$env:PYTHONPATH='anime'
$ffmpegAnime=(Resolve-Path 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe').Path
python -m holt_anime.mix_scene art-masters/anime/blue-purple/scene-v1.json art-masters/anime/blue-purple/nouveau-mix.m4a --ffmpeg $ffmpegAnime
$env:HOLT_FFMPEG=$ffmpegAnime
python -m unittest discover -s anime/tests -p test_mix_scene.py -v
```

Pour combiner avec une nouvelle image : ajouter les deux fichiers en entrée FFmpeg,
mapper vidéo et sous-titres du montage et audio du nouveau mix, recopier la vidéo et les
sous-titres sans réencodage, choisir une nouvelle sortie. Recaler tous les éléments si le
rythme ou la durée de la chronologie changent ; ce mix ne s'adapte pas automatiquement à
un autre découpage.
