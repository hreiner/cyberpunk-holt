# Blue Purple — premier blocage Blender

Essai local du 4 novembre 2026 construit par `anime/blender/scene.py`, séparé du jeu.
L'image cible `target-v2.png` est un objectif graphique, non un rendu de la scène. Le fichier
`v6/blue-purple-blocking.blend` et l'image `v6/blue-purple-wide.png` se trouvent dans le
répertoire de travail Blender de la session sur C:, les GLB du jeu restent inchangés.

Les armatures des personnages portent les noms `HOLT_franklyn`, `HOLT_john`, `HOLT_grover`,
`HOLT_abigail`, `HOLT_enfant` et `HOLT_wendy`. Les cinq premiers utilisent leurs GLB HOLT ;
Wendy emploie un doublon d'Abigail comme **placeholder**, pas une identité satisfaisante.
La scène comprend une table, des verres, une feuille, un bar et des néons ; les caméras
`Camera_Wide` et `Camera_Wendy` sont dans le fichier. La caméra rapprochée est active dans v6.
L'enfant conserve son modèle civil ; aucun Zachary ni Letitia n'est présent.

Les mouvements de tête sont calculés à partir de l'enveloppe des 14 prises vocales existantes
avec `lipsync.analyse_project` / `lipsync.animate_head`. Ce sont des mouvements de tête,
**pas des lèvres ni des phonèmes**. Les GLB n'ont pas de morphs faciaux ; les premiers essais
de déformation buccale ont été rejetés pour leur rendu. Les corps et mains restent rudimentaires,
l'assise et les intersections ne sont pas satisfaisantes, et l'aspect reste réaliste plutôt que
cel-shading anime. Le décor n'atteint pas l'image cible. Le fichier est une base à retoucher,
pas une scène achevée ni une preuve de synchronisation labiale.

Commande utilisée, à lancer depuis la racine avec un nouveau répertoire vide sur C: :

```powershell
& 'D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe' -b --factory-startup --python-exit-code 1 --python anime/blender/scene.py -- 'C:/Users/hadri/.codex/visualizations/2026/11/04/01a1a728-9ede-7730-93dc-26ad220618a0/blender/v7'
```

Blender 4.2.23, Cycles CPU, 12 échantillons : 960×540, première image rendue et contrôlée.
Les imports de six rigs et les animations de tête ont été enregistrés dans la scène ; une
prévisualisation vidéo courte reste à encoder et à contrôler séparément avec la voix. Ne pas
interpréter la durée de rendu d'une seule image comme une estimation fiable du film complet.
Les médias de la scène doivent être sauvegardés avec le fichier .blend ; l'espace libre de D:
était presque épuisé pendant ce lot et les rendus ont été dirigés vers C:.

## Variante multicaméra v7

`v7/blue-purple-blocking.blend` conserve la caméra large et crée six caméras de gros plan.
Quatorze marqueurs les affectent aux débuts des répliques, après une seconde d'établissement.
Les images `v7/qa_0030.png`, `qa_0185.png`, `qa_0450.png` et `qa_0900.png` ont été rendues
et examinées : visages et bouches sont cadrés ; les coiffures/maillages sont encore bruts.
Ces captures ne démontrent ni une animation faciale ni un rendu anime. Pour une sortie à
cadence réduite, garder les 24 images/seconde de la timeline et échantillonner les images avec
un pas fixe ; ne pas modifier la cadence Blender, car cela décale les repères par rapport aux
voix. La validation de la vidéo entière relève du montage et de la revue de ce dernier.
