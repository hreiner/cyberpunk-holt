# Essai de mouvement facial — Blue Purple

Le 4 novembre 2026, le GLB d'Abigail a été inspecté dans Blender 4.2.23 : il possède
`mixamorig:Head` mais pas de mâchoire, d'os faciaux ni de shape keys labiales. Dans la
scène expérimentale, Wendy repose provisoirement sur ce même GLB. Le modèle n'est pas
modifié dans le jeu.

`anime/blender/lipsync.py` extrait avec FFmpeg le PCM mono de chaque prise et mesure le
niveau RMS à 24 ips. `analyse_project(manifest, root, ffmpeg, fps)` renvoie, par locuteur,
les amplitudes sur les frames globales des 14 prises (offsets du projet). Le silence ferme
le signal ; aucune autre piste sonore n'est analysée. `animate_head` ajoute un hochement de
0,025 rad maximum pendant les répliques et ne constitue pas une synchronisation labiale.
`animate_shape` peut piloter une forme préexistante, mais ne fabrique pas de visèmes.
Cette méthode n'identifie pas les phonèmes et le volume n'est pas la position des lèvres.

## Test de déformation expérimentale

`create_experimental_abigail_mouth` est une expérience explicitement limitée au maillage Abigail à 9491
sommets, fondée sur sa position de repos et non sur une correspondance anatomique fiable.
Contrôles réalisés avec Blender et Cycles CPU, en gros plan : `face-close.png`,
`face-open.png` et `face-open-quarter.png` dans le dossier de visualisation de cette session.
À pleine ouverture, la forme est fortement déformée ; même à 25 %, les lèvres et la cavité
semblent anormales. **Ne pas l'intégrer dans le film**. Les deux images ne prouvent ni un
visème valide ni une animation synchronisée. Une nouvelle topologie de bouche, une cavité,
des contrôles faciaux dédiés puis une revue face/profil sont nécessaires ; l'énergie audio
pourra ensuite piloter une ouverture indicative, tandis qu'un alignement phonétique
nécessitera un outil ou une annotation distincts.

## Vérification

`python -m unittest discover -s anime/tests -p test_lipsync.py -v` valide silence et présence
d'énergie ; l'analyse des 14 MP3 a produit des valeurs pour les six locuteurs, entre les
frames 7 et 1479. Les essais de la forme ont été rendus localement en PNG, sans appel
externe ni modification des GLB. Aucun clip démontrant une synchronisation labiale
convaincante n'a été produit et aucune écoute n'a été effectuée.
