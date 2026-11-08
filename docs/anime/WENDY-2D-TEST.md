# Essai Wendy : couche 2D animée

Le 4 novembre 2026, la première prise de Wendy (« I'm Wendy... ») a servi à un test de
5,6 secondes pour comparer la 2D animée à la 3D. Le résultat est un **essai technique
sur une illustration**, pas une animation entièrement dessinée ni un plan approuvé.

## Source et fabrication

- `art-masters/anime/experiments/wendy2d/wendy-base.png` : image cible de Wendy au
  Blue Purple, produite par ImageGen pour ce lot à partir de la cible anime du projet.
  Cheveux asymétriques bleus, veste violette et éclairage cyan/magenta/jaune : ce sont des
  choix visuels de travail, pas un nouveau fait canonique.
- `art-masters/anime/blue-purple/voices/01-wendy-*.mp3` : prise anglaise existante,
  aucune génération audio ni nouvel appel à ElevenLabs. La même prise et la même réplique
  permettent une comparaison avec l'essai 3D.
- `art-masters/anime/experiments/rhubarb/wendy-01.json` : 39 séquences de bouches de
  Rhubarb 1.14.0, calculées antérieurement sur l'audio de 5,6 s et son texte. Les lettres
  A/X gardent la bouche fermée ; les autres pilotent des variantes vectorielles en calque.
- `anime/experiments/wendy2d/render.cjs` : moteur local basé sur Playwright/Edge et Canvas.
  Le visage est un calque dessiné au-dessus de l'image, avec huit formes de bouche et
  deux clignements brefs ; un léger zoom anime l'ensemble. Le corps, les mains, la tête et
  le décor restent fixes entre eux : ce n'est ni un vrai rig de personnage, ni une animation
  corporelle ni une animation vidéo générée. Les visèmes sont des approximations Rhubarb,
  pas une analyse validée phonème par phonème.

## Résultat et contrôle

`art-masters/anime/experiments/wendy2d/wendy-2d-v3.mp4` : 5,60 s ; H.264 960×540,
24 i/s, voix AAC mono et piste de sous-titres français `mov_text`. Une copie SRT est
`wendy-fr-v2.srt`. Les 135 images sources sont dans `frames-v2/` ; le montage v3 replace la césure des sous-titres à la pause audio de 3,73 s. Le v1 et `frames-v1/` sont
conservés : après revue, les paupières ont été élargies en v2 pour masquer les blancs qui
restaient visibles lors du clignement. Images `frame_0003.png` et `frame_0048.png` contrôlées
visuellement : visage ouvert et clignement ; l'écusson n'est pas affiché sur ce cadre.
Les lèvres sont un dessin simplifié et le clignement montre encore un style de calque : une
revue de jeu image par image et une écoute de la synchro restent nécessaires. Le mix utilise
la voix seule, sans musique pour que la comparaison avec l'autre prototype reste claire.

Test : lancer `node anime/experiments/wendy2d/render.cjs <nouveau-dossier>` depuis la racine
avec Edge disponible ; le script refuse un dossier déjà existant. Sous Windows, utiliser le
chemin Edge référencé dans le script et l'exécuter hors du bac à sable si nécessaire.
Assembler au moyen de FFmpeg, qui doit être choisi par son chemin local ; préserver toute
version existante. Les PNG et MP4 restent hors Git dans `art-masters/`.
