# Blue Purple — faisabilité 3D locale

Constat du 4 novembre 2026. Essai strictement séparé du jeu, à partir de
`public/assets/mixamo/franklyn/franklyn.glb`, sans altération du fichier.

Le Blender local 4.2.23 LTS démarre hors du bac à sable (son échec à démarrer depuis
le bac à sable ne signifie pas que le programme est inutilisable). L'essai
`anime/experiments/render_character_proof.py` importe le GLB, place une caméra, deux
sources colorées et produit un PNG transparent via Cycles CPU à 512 × 512 et 16
échantillons. Sortie locale ignorée :
`art-masters/anime/blue-purple/3d-proof/franklyn.png`. Le processus a duré environ
6,5 secondes, dont 1,55 seconde annoncée par Blender pour le rendu et l'enregistrement ;
ce n'est ni une mesure de débit vidéo ni un test GPU.

## Résultat et limites

Le maillage et les textures s'affichent. La revue de l'image montre une pose A, un
cadrage encore trop large et le costume générique du GLB. Ce n'est pas le personnage
stylisé tel qu'on le voit dans le jeu : palette, détails d'uniforme et habillage sont
ajoutés côté Three.js. Le GLB exporté exclut les morphs faciaux ; il ne permet donc pas
immédiatement une synchronisation labiale expressive. Cette image n'est ni une pose
animée, ni un rendu anime, ni une validation de continuité.

Les clips `talk`, `idle`, `nervous`, `sad`, `look` et `argue` existent dans
`public/assets/mixamo/exo/`, mais le jeu les réoriente en temps réel vers les
personnages : voir `src/render/characters/mixamoRetarget.ts` et `mpfbAssets.ts`.
Leur existence ne prouve pas un retarget Blender fonctionnel : l'essai ne l'a pas fait.
La voie à explorer consiste à soit exporter une scène animée avec l'habillage appliqué
par le moteur HOLT, soit reproduire et vérifier le retarget et l'habillage dans Blender,
puis créer une direction cel-shading et de véritables contrôles de visage. Un plan test
et une revue face/profil sont nécessaires avant montage. Pour cette minute, les dessins
anime déjà disponibles et la composition 2,5D assurent une continuité visuelle plus
fiable ; les mouvements de caméra ne sont cependant pas une animation corporelle.

Commande de reproduction depuis la racine (nouveau chemin de sortie obligatoire) :

```powershell
& 'D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe' -b --factory-startup --python anime/experiments/render_character_proof.py -- public/assets/mixamo/franklyn/franklyn.glb art-masters/anime/blue-purple/3d-proof/franklyn-v2.png
```
