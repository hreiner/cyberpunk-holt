# Essai Mixamo pour Franklyn

**État au 25 septembre 2026 : flux de conversion prêt, aucun personnage Mixamo encore
intégré.** La revue du pilote juge la silhouette actuelle insuffisante. Un personnage
Mixamo et une marche sur place serviront de test dans le dortoir autonome, puis un travail
dans Blender devra lui donner les proportions, la tête, les cheveux et l'uniforme de
Franklyn. Le moteur Three.js et la grille de déplacement restent les mêmes.

## Obtenir le premier fichier

1. Se connecter à [Mixamo](https://www.mixamo.com/) avec un identifiant Adobe personnel.
   Adobe indique que le service est gratuit sans abonnement Creative Cloud et que les
   personnages et animations peuvent servir dans un jeu vidéo
   ([FAQ officielle](https://helpx.adobe.com/fr/creative-cloud/faq/mixamo-faq.html)).
2. Dans **Characters**, choisir une silhouette masculine qui pourrait devenir un cadet de
   17 ans. La ressemblance avec Franklyn et une tenue modifiable comptent plus que le nom
   du modèle. Conserver une capture ou noter son nom exact pour la provenance.
3. Sur ce personnage, choisir une marche, activer **In Place**, puis télécharger en **FBX
   Binary**, **With Skin**, à **30 FPS**. Ce premier fichier suffit à vérifier le modèle,
   son squelette et un clip. Le déposer dans `art-masters/mixamo/franklyn-walk.fbx` ; ce
   dossier est ignoré par Git. Ne pas transmettre d'identifiants de connexion.

Adobe décrit le choix d'un personnage dans l'onglet Characters, l'application d'un clip et
son téléchargement dans [son guide Mixamo](https://helpx.adobe.com/creative-cloud/help/animate-characters-mixamo.html).
La connexion Adobe est requise pour obtenir les fichiers ; ce dépôt ne contient pas de
copie Mixamo. Le [format FBX](https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html)
est également celui pris en charge pour réimporter un personnage déjà riggé.

## Conversion locale et contrôle

Blender portable 5.2.2 peut être téléchargé depuis la
[distribution officielle](https://download.blender.org/release/Blender5.2/). Son archive
locale est dans `art-masters/tools/`, ignoré par Git ; elle a été vérifiée par SHA-256.
La commande, à la racine du dépôt :

```powershell
& 'art-masters/tools/blender-5.2.2-windows-x64/blender.exe' -b --factory-startup --python 'scripts/prepare-mixamo-pilot.py' -- 'art-masters/mixamo/franklyn-walk.fbx' 'art-masters/mixamo/franklyn-walk.blend' 'art-masters/mixamo/franklyn-walk.glb'
```

Le script refuse l'absence de squelette, de peau ou d'animation ; il relève le nombre de
triangles, les os, la hauteur et le déplacement des hanches du début à la fin. Un
déplacement supérieur à 0,2 m appelle un nouvel export **In Place**. Le script ne
retouche volontairement ni l'orientation ni l'échelle : ces deux points doivent être
contrôlés sur le vrai fichier, sous les quatre orientations du pilote, avant d'insérer le
GLB dans le jeu. Les fichiers `.blend` et `.glb` issus de ce test restent dans
`art-masters/` pendant la revue.

Le convertisseur a été exécuté avec un FBX de contrôle provenant du rig Quaternius déjà
présent dans ce dépôt. Il a produit un `.blend`, un GLB et le rapport attendu ; il a
signalé correctement un déplacement racine de 0,73 m. Ce contrôle valide l'outillage,
**pas** le rendu, le squelette ou la licence d'un personnage Mixamo encore absent.

## Critère avant intégration

Le personnage doit être reconnaissable comme Franklyn sans étiquette au zoom de jeu,
garder des articulations propres au repos et pendant la marche, faire face à `+Z`, mesurer
environ 1,75 m et marcher visuellement à 4 m/s **sans** déplacer sa racine hors de
`ExploreState`. La marche doit être jugée en mouvement et sous quatre angles. Ensuite
seulement, préparer les autres clips du contrat `CharacterRig` et décider si la nouvelle
base sert aux cinq autres cadets.

La [FAQ Adobe](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) autorise
l'incorporation à un jeu. Une [explication publiée sur le forum Adobe](https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400)
distingue cependant le jeu de la redistribution de fichiers bruts. Un navigateur charge
nécessairement des fichiers consultables par le client : avant une publication, vérifier
auprès d'Adobe le mode de distribution retenu pour le GLB final. Le pilote local n'est pas
une publication.
