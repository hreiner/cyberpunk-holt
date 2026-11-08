# Essai Wendy — témoin 3D anime et visèmes

Le 4 novembre 2026. Cet essai est une comparaison technique sur la première prise de Wendy,
non une Wendy 3D finie. Le modèle est **Seed-san**, exemple tiers du consortium VRM (auteur :
VirtualCast, Inc., attribution requise), documenté avec son téléchargement et sa somme dans
[QUALITY-PATHS](QUALITY-PATHS.md). Il reste juvénile, son visage, ses cheveux et ses vêtements
ne reproduisent pas l'identité adulte de Wendy. Son costume et le décor du Blue Purple sont
simplifiés ; les découpes et éclairages ne sont pas validés comme direction finale.

## Livrables locaux et méthode

- `art-masters/anime/experiments/wendy3d/wendy-3d-v7-comparable.mp4` : 5,60 secondes, voix de la
  première réplique déjà générée dans `art-masters/anime/blue-purple/voices/`, sous-titres
  français sélectionnables. Le MP4 est H.264 576 × 324, 25 i/s ; 72 images distinctes
  ont été calculées dans Blender à 12 i/s puis répétées à l'export. La première version v4
  de six secondes est conservée ; la v7 utilise les mêmes deux sous-titres et la même durée
  que la version 2D pour la comparaison. Aucune génération
  payante nouvelle.
- `wendy-3d-v4.blend` et `frames-v4/` dans le même dossier ignoré : personnage témoin,
  formes faciales importées en glTF, clignements, mouvement de caméra, fond et vêtement
  géométriques provisoires. Image de contrôle `preview-v4.png`. Les GLB HOLT sont inchangés.
- `anime/experiments/wendy3d/scene.py` reconstruit la scène depuis
  `art-masters/anime/experiments/vrm/Seed-san.glb` et la chronologie Rhubarb de
  `art-masters/anime/experiments/rhubarb/wendy-01.json` ; les médias externes doivent
  être préalablement disponibles. Usage isolé, **aucune modification du jeu**.

Rhubarb a analysé l'audio anglais et le texte, puis son code A–H/X est relié aux voyelles
`lip_a`, `lip_i`, `lip_u`, `lip_e`, `lip_o`, `lip_w` du modèle par une table approchée.
Ce mapping n'est pas une équivalence phonétique exacte ; les cinq voyelles ne couvrent pas
séparément les consonnes. Les transitions et la durée sont quantifiées à 12 i/s ; aucune
écoute humaine ou évaluation phonétique n'a été réalisée. Deux clignements sont définis par
images clés manuelles. La caméra se déplace légèrement ; pas de jeu corporel ni d'assise.

Rendu Blender 4.2.23 Cycles CPU, quatre échantillons et 60 % de 960 × 540 ; la première
image a été écrite à 17:45:58 et la dernière à 17:47:10. C'est une mesure exploratoire,
pas un benchmark comparatif CPU/GPU ni un temps de production définitif. Le contrôle FFmpeg
identifie 5,60 secondes, H.264, AAC mono et piste `mov_text` française. Le cadrage et la
ressemblance ne sont pas approuvés ; évaluer le plan face à la référence et au test 2D,
puis construire un modèle original adulte avec coiffure, tenue et visèmes contrôlés.
