# Socle local de production animé

Approche motion comics retenue pour la suite : [fabrication des pages](MOTION-COMICS-WORKFLOW.md)
et [socle technique réutilisable](MOTION-COMICS-TECHNICAL.md) — création de scène, effets
locaux, voix anglaises, bulles françaises, lecteur et export MP4. Les essais animés ci-dessous
sont conservés comme historique de recherche.

Premier lot technique, 4 novembre 2026. Le film, son scénario audiovisuel et sa direction
artistique ne sont pas validés. [Scénario audiovisuel](SCREENPLAY.md), [plan de production](PRODUCTION-PLAN.md),
[direction artistique](ART-DIRECTION.md), [poste et rendu](ANIMATION-ENVIRONMENT.md),
[audio et fournisseurs](AUDIO-PROVIDERS.md). Décision : [ADR 0044](../process/adr/0044-socle-anime-local.md).

## Animatique Blue Purple — 4 novembre 2026

Le propriétaire a choisi voix anglaises, sous-titres français et les voix ElevenLabs de
Wendy (`W3C2vBPukr5b5jvoXhPK`) et de l'enfant (`AFkIMdmeB0MMrr1tgGds`). Le casting
complet et ses sources sont dans `anime/projects/blue-purple/cast.json`. Le scénario
provisoire suit la partie sur table pour l'habitante et le sans-abri ; les détails du bar et
de la porte attendent un arbitrage. Le scénario audiovisuel fait 7 min 30 estimées ; sa
première scène montée fait 62,3 secondes, durées basées sur les prises réelles et non sur
l'allocation initiale d'1 min 40.

Rendu privé : `art-masters/anime/blue-purple/blue-purple-vo-v2.mp4` ; sous-titres français
sélectionnables dans le MP4 et fichier `.fr.srt` associé. Fond, portraits, musique et
ambiance proviennent des médias du jeu ; 14 prises ElevenLabs sur 725 caractères anglais ont
été produites avec la CLI OAuth après connexion du propriétaire. Chaque prise et son journal
JSON restent dans `art-masters/anime/blue-purple/voices/`, hors Git. La CLI n'a pas fourni
le coût réellement débité ni d'identifiant de génération ; ils restent inconnus. Ne pas
considérer les caractères comme un montant exact : les crédits peuvent varier selon la voix
et le circuit. Aucune écoute humaine du mix n'a encore été documentée. Les portraits fixes,
sur un même décor, sont une animatique, pas une animation ni un jeu d'acteur validés.

`anime/holt_anime/animatic.py` compose images, pistes audio et sous-titres MP4 ;
`prepare_scene.py` aligne la scène sur la durée mesurée de chaque prise. Après préparation :

```powershell
$env:PYTHONPATH = 'anime'
$ffmpegAnime = (Resolve-Path 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe').Path
python -m holt_anime.animatic art-masters/anime/blue-purple/scene-v1.json art-masters/anime/blue-purple/une-nouvelle-version.mp4 --ffmpeg $ffmpegAnime
```

`voice_take.py` permet une seule réplique explicitement autorisée à la fois avec
`--approved --max-characters N` ; le plafond cumule les caractères de tous les journaux
du dossier, échecs et interruptions compris, et `--retry` est obligatoire pour reprendre.
Ce plafond de caractères n'est pas un plafond de crédits : multiplicateur et coût réel sont
à vérifier dans le compte. Exécution mono-opérateur uniquement : ce contrôle n'est pas
transactionnel. Les prises de ce lot ont été lancées avant l'ajout de ce garde-fou, au titre
de l'autorisation donnée pour la scène. Le script audio est distinct du registre SQLite :
leurs budgets ne sont pas fusionnés, et il ne faut pas utiliser le budget du registre comme
preuve de limitation des dépenses ElevenLabs. Pour un usage régulier, intégrer transaction,
coûts réels et rapprochement fournisseur avant d'élargir la production.

## Essai animé local — 4 novembre 2026

`art-masters/anime/blue-purple/blue-purple-anime-v1.mp4` est un montage local de 62,30 s,
960 × 540, 24 ips : voix anglaises existantes, mix revu et piste de sous-titres français.
`animated.py` fabrique des cadres mobiles, des champs/contrechamps, un insert documentaire
et une vision graphique ; les personnages de l'ancre comics sont détourés et replacés sur le
fond du jeu. Les yeux et écussons ont été vérifiés après remplacement du détourage par couleur
par un masque de fond connecté ; deux petites poches claires restent derrière les tresses
d'Abigail et une zone dans les cheveux de Grover. Wendy et l'enfant restent dans le style
hachuré du jeu, différent des aplats des cadets. Aucun mouvement corporel, synchronisation
labiale ou jeu facial n'est produit. Les images sont fixes et la caméra bouge : c'est un
montage 2,5D expérimental, pas un animé terminé. Le scénario de vision elfique reste à illustrer.

`coordinate-document.svg` a été converti localement avec Edge en PNG transparent sous
`art-masters/anime/blue-purple/coordinate-document.png` et intégré au plan. La grille SVG
n'est pas intégrée ; la vision utilise une grille FFmpeg. Le mix séparé et ses mesures sont
dans [BLUE-PURPLE-SOUND](BLUE-PURPLE-SOUND.md). Aucun examen d'écoute n'est revendiqué.
Le test [Blender](BLUE-PURPLE-3D.md) confirme son démarrage hors sandbox mais les personnages
du jeu nécessitent travail d'habillage, retarget et visage pour servir dans cette scène.
Sept tests Python ont réussi avec FFmpeg et `npm run workflow:check` passe. La revue reste
visuelle sur des images ciblées, pas une revue exhaustive de chaque image ou un jugement du
mix en écoute. Aucune génération payante nouvelle n'a été effectuée.

## Installation et démonstration

Python 3.12 et FFmpeg avec libx264 ; aucune dépendance Python à installer. Depuis la racine,
dans PowerShell, remplacer le chemin FFmpeg si nécessaire ; le répertoire cible doit être
nouveau. Les résultats sont locaux et ne vont ni dans `src/` ni dans les assets du jeu.

```powershell
$env:PYTHONPATH = 'anime'
$ffmpegAnime = (Resolve-Path 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe').Path
python -m holt_anime "$env:TEMP/holt-anime-exemple" --ffmpeg $ffmpegAnime
$env:HOLT_FFMPEG = $ffmpegAnime
python -m unittest discover -s anime/tests -v
```

Le répertoire contient `project.sqlite`, deux versions d'un plan et de son montage,
un plan de contexte et `metadata.txt` (sortie de `ffmpeg -i`). Le support est la scène
« Les chiffres et la vision » : fond et document représentés par des formes géométriques,
sans dialogue ni audio. C'est un essai de 1,5 seconde, pas un pilote ni une évaluation
artistique. FFprobe permet une inspection JSON via `media.probe` lorsqu'il est disponible ;
son absence ici n'empêche pas l'inspection textuelle par FFmpeg.

## Modèle et fonctionnement

`registry.py` conserve dans SQLite les versions append-only des objets `project`, `scene`,
`shot`, `character`, `asset`, `audio`, `task` : chaque version porte un dictionnaire JSON.
La convention est de stocker références `[id, version]`, source et provenance, paramètres,
état, chemin du rendu retenu et droits ; la démonstration en donne des exemples. **Ces
champs restent libres et ne sont pas validés par schéma** : vérifier leur complétude avant
production. Un rendu reste candidat tant qu'une revue humaine ne le retient pas ; la
sélection est inscrite dans une nouvelle version du plan.

Une tentative conserve sa tâche et sa version, fournisseur, paramètres, estimation et devise.
Son journal ajoute des événements avec état, identifiant fournisseur éventuel, coût réel et
résultat : `queued → running → review → approved/rejected`, ou `failed`, `cancelled`,
`interrupted` selon les transitions définies. La reprise crée une nouvelle tentative avec
`retry_of`, elle ne relance pas l'ancienne. Après une interruption brutale, identifier
manuellement les tentatives `running`, les marquer `interrupted` après vérification, puis
créer une nouvelle tentative ; il n'y a pas de détection automatique ni de file de travail.
Les événements gardent les coûts même après échec. Utiliser des unités entières de la plus
petite unité monétaire, par exemple centimes EUR. Une réservation transactionnelle compte
le coût réel connu, sinon l'estimation, y compris pour les tentatives inachevées ; un
surcoût réel peut dépasser le plafond et bloque les nouvelles réservations. Une devise par
registre. Plafond obligatoire, zéro dans la démonstration.

`providers.py` définit des protocoles image, vidéo et audio et un simulacre local ; aucun
adaptateur distant n'est fourni. `Registry.start(..., external=True)` refuse toujours les
opérations externes : budget et autorisation ne les activent pas encore. Un futur adaptateur
devra faire respecter l'autorisation avant tout appel, tracer identifiants et coûts réels,
réconcilier les opérations dont le résultat est inconnu et vérifier les conditions et tarifs
à la source officielle au moment de son intégration. Les protocoles seuls ne constituent pas
une barrière de sécurité contre du code Python tiers : seul un opérateur de confiance peut
exécuter du code dans ce socle. Aucun secret ne doit entrer dans les paramètres enregistrés.

Les plans sont produits dans des fichiers distincts. `replace_shot` construit une nouvelle
liste et l'export écrit un nouveau MP4. Le dossier cible doit rester réservé à un seul
processus de montage ; une interruption FFmpeg peut laisser un fichier partiel à examiner
et conserver ou écarter manuellement avant un nouvel essai à un nouveau chemin. Les chemins
externes et masters ne sont pas embarqués dans SQLite ; sauvegarder ensemble le registre et
ses médias. Aucun service web, serveur, file distribuée ou génération GPU n'est nécessaire.

## Preuves et suites

Le 4 novembre 2026 : quatre tests Python réussis avec FFmpeg 7.1 local : persistance et
versions, transitions, réservations et refus externe, remplacement et deux exports MP4.
FFmpeg a inspecté le flux H.264 640 × 360, silencieux. FFprobe absent du PATH et des
répertoires examinés ; aucun contrôle de ses métadonnées JSON n'est revendiqué. Blender n'a
pas démarré dans l'environnement et Docker n'est pas au PATH. `npm run workflow:check` :
41 adaptateurs, 332 documents et 1044 liens vérifiés.

Avant production : schéma strict et migrations, inventaire des sources, reprise et
réconciliation robustes, composition et mix plus élaborés,
conformité média, contrôle humain et scénario complet. Le registre actuel est un socle
local mono-opérateur, pas une application de production concurrente ni une preuve de
qualité audiovisuelle. Tarifs et disponibilité des fournisseurs restent à vérifier sur
leurs documentations officielles au moment de choisir une intégration.
