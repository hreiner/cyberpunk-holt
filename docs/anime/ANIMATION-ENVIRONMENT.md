# Animation : capacités et limites du poste

Constat local du 4 novembre 2026, dans l'environnement Windows de cette mission ;
les chemins hors dépôt et les exécutables présents ne sont pas des dépendances distribuées.
Aucune installation, connexion ni génération payante n'a été effectuée.

| Outil | Vérification effective | Conséquence |
| --- | --- | --- |
| Node / npm | `node --version` : 24.4.0 ; `npm --version` : 11.4.2 | Runtime et outillage déjà utilisés par le jeu, adaptés à un outil local isolé. |
| Python | `python --version` : 3.12.10 | Disponible ; pas nécessaire pour imposer un deuxième runtime au socle. |
| FFmpeg | `art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe -version` : 7.1, avec libx264 | Fonctionne hors PATH ; binaire local ignoré, à découvrir ou à spécifier par configuration. Sa présence seule ne prouve pas un export. |
| FFprobe | Absent du PATH et de la recherche dans `D:/AgenticCoding/tools` et `art-masters/tools` | Ne pas supposer sa présence. Prévoir une inspection alternative explicite ou signaler son absence. |
| Blender | Le fichier `D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe` existe ; `-b --factory-startup --version` n'a rien affiché et a renvoyé -1073741790 | La présence ne prouve pas un fonctionnement dans cette session ; ne pas rendre Blender obligatoire pour l'export local. Cause non diagnostiquée. |
| Docker | Absent du PATH | Aucun conteneur nécessaire pour ce lot. |
| GPU | `nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader` : GeForce GTX 1070, 8192 MiB, pilote 560.94 | Pas de promesse de génération vidéo locale lourde ; mesurer tout rendu réellement choisi. |

`npm run doctor` a confirmé les chemins détectés de Blender, MPFB, FFmpeg, Python,
Mixamo et la CLI ElevenLabs. C'est une recherche de fichiers, sans exécution ni preuve
d'authentification. Voir [TOOLS](../process/TOOLS.md) pour les variables et chemins.

## Réemplois et séparation

- Les sept personnages GLB et les clips FBX partagés sont dans `public/assets/mixamo/` ;
  leurs rigs, retargets et limites d'usage sont documentés dans
  [CHARACTER-PIPELINE-FINDINGS](../art/CHARACTER-PIPELINE-FINDINGS.md),
  [MIXAMO-WORKFLOW](../art/MIXAMO-WORKFLOW.md) et
  [ATTRIBUTION](../../public/assets/mixamo/ATTRIBUTION.md). Ce sont des ressources de jeu,
  pas des personnages prêts à tourner en gros plan : animation faciale, poses et continuité
  propres au film restent à examiner. Les conditions Mixamo sont à revalider avant réemploi
  dans le film ; conserver les attributions des composants MakeHuman et les sources.
- Les décors et portraits de `public/assets/`, notamment ceux du Blue Purple, ainsi que les
  références du comics v2 peuvent guider la continuité ; leur statut, provenance et droits
  doivent être vérifiés individuellement avant toute diffusion. Le deck du propriétaire est
  une référence, pas une licence établie pour chacune des images qu'il contient.
- [CINEMATIC-SCENES](../process/CINEMATIC-SCENES.md) décrit des images fixes chronométrées
  dans le navigateur avec audio et choix. C'est une expérience de montage utile, mais pas
  un moteur d'export vidéo déclaratif. Ne pas modifier le gameplay pour créer le film.

## Préconisation de rendu

Un service local déterministe, séparé de `src/`, compose les couches référencées par un
plan, produit un fichier par tentative et utilise FFmpeg pour l'encodage et l'assemblage.
Garder les durées, ordre, transformations, versions des entrées et sélection de rendu dans
le projet ; remplacer un plan doit préserver les anciens rendus et les autres plans. Un
fournisseur distant éventuel s'ajoute derrière un contrat de tâche, sans dépendance du
montage à un fournisseur ou à une interface web. Le suivi des coûts et l'autorisation
précèdent toute opération payante ; aucun fournisseur distant n'est validé par ce constat.

Pour le premier test technique, la discussion des chiffres au Blue Purple dans
[SCENARIO](../chapters/ch3/SCENARIO.md) offre un segment identifiable : fond provisoire,
document chiffré en avant-plan, puis flash technologique. Un mouvement de caméra simple
ou un fondu est suffisant pour vérifier la chaîne ; il ne prouve ni qualité artistique,
ni continuité des personnages. Le scénario audiovisuel et les choix de la partie restent
à arrêter par la réalisation. Les effets 2,5D, rendus 3D et vidéo générée sont des options
par plan à évaluer, pas des proportions ou des capacités garanties.

Avant production : vérifier les exécutables sur le poste cible, réaliser un export et
inspecter ses flux, revoir visuellement les raccords, puis vérifier les conditions et prix
officiels de tout fournisseur envisagé. Aucun test de performance de rendu 3D ni de qualité
artistique n'a été effectué dans cette mission.
