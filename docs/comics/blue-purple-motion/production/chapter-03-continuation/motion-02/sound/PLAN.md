# Conduite sonore — motion02

8 novembre2026. Propriétaire : sound_production sous pilotage root. Périmètre :
musique de la couverture et synchronisation du tir/impact17 ; aucune nouvelle voix.

Root confirme une couverture de12s comme première entrée de la séquence, suivie
des21pages numérotées comme avant. La couverture suit le démarrage audio ordinaire
par geste « Lire » ; elle ne demande pas de second moteur de musique.

Sélection : `music-neon.mp3` HOLT existant, extrait24–36s,
montée douce0,8s et sortie1,4s. Après mesure, gain0,794642 (−1,997dB), plafonné
à−8dBFS : RMS−25,18dBFS, AAC−23,6LUFS. Aucune voix
ni bruitage ajouté sur la couverture. Puis début du backing du chapitre conservé.
Pas de chevauchement qui modifierait le PCM des premières pages.

Le nouveau backing global contient12s de couverture puis le backing sélectionnév8.
Seule la fenêtre17 peut être remélangée pour les nouvelles ancres d'action transmises
par motion_production et validées par root. Tous les autres échantillons du chapitre
doivent être identiques au PCM source. Un seul tir, un seul impact dans le pilier ;
ne jamais conserver le tir initial puis ajouter son double à une nouvelle ancre.

Voix, source sonore, timbre musical et provenance restent ceux livrés. Aucun appel
payant, aucune nouvelle prise. Produire une préécoute couverture→début et un extrait17,
avec mesures float, canaux, AAC et hashes ; aucun long export MP4.

Ancres définitives confirmées par root et motion_production : début17 à368,89s du
chapitre ; tir à373,56s, impact à373,64s, Wendy à374,02s. Ajouter12s pour la séquence
avec couverture. Une seule prise composée tir/métal est jouée, avec sa résonance
présente dans la fenêtre de l'impact80ms après le départ. Aucun second tir ajouté.

Mix final calculé dans `soundtrack-v2/`, sélection et preuves dans
[SELECTION.json](SELECTION.json) et [REVIEW.md](REVIEW.md).
