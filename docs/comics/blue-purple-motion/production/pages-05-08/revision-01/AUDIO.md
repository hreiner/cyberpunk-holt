# Audio — révision 01 des pages 05–08

Préparation du 5 novembre 2026 à la demande du propriétaire : davantage de dialogue,
rythme plus vif, bruitages réels et musique structurée. John assomme désormais le
barman ; cette attribution est le nouveau canon communiqué par l'intégrateur.
Les pages 1–4 et toutes les prises de la livraison précédente sont conservées.

Skills appliqués : `holt-audio` et `sound-effects`. Circuit : CLI ElevenLabs OAuth
existant, sans extraction ni transfert de jeton et sans installation de SDK.
La vérification réelle hors sandbox annonce Windows Credential Manager connecté,
entrée OAuth active ; `models list` confirme `eleven_v4` disponible pour TTS.

Compteur TTS hérité : **2 856 caractères**. Nouveau plafond autorisé : **4 800**.
Conduite exacte : 14 nouvelles lignes, **538 caractères annotés**, soit **3 394**
après la première passe. Réserve allouée : **444 maximum** ; limite opérationnelle
**3 838**, marge **962 non allouée** et interdite aux dépenses automatiques.
Les huit prises 16–23 sont réemployées, nouvelles lignes 24–37. `audio/DIRECTION.json`
conserve aussi les quinze réemplois 1–15 ; `audio/INVENTORY.json` vérifie l'historique.
Le dry-run de la ligne 24 confirme la voix John existante, v4, stabilité 0,5 et similarité 0,8.

SFX : première passe prévue de six sons pour **20 s demandées** ; plafond absolu
**8 requêtes et 24 s demandées**, échecs et interruptions inclus. Réserve : deux
corrections totalisant au plus quatre secondes. `audio/SFX-PLAN.json` conserve
prompts exacts, modèle et intentions. Le prompt punch-wood a été contre-revu puis
autorisé par l'intégrateur. Son appel de deux secondes a **réussi** via OAuth :
modèle `eleven_text_to_sound_v2`, sortie MP3 stéréo44,1kHz, décodage intégral réussi.
Compteur actuel : **une requête / deux secondes demandées**, coût et ID inconnus.
Le prompt porte a été corrigé pour ne produire que l'ouverture, porte laissée ouverte.
Un HTTP401 arrêtera les appels suivants, sans boucle ni demande de clé.
Le repli alors autorisé est une fabrication locale explicitement attribuée comme
procédurale, sans prétendre à une provenance ElevenLabs.

Musique : réemploi des pistes HOLT pressure/neon/afterglow, aucune composition
réseau nouvelle. Les événements seront calés sur les vrais temps des cases et des
voix. Le montage négocie avec l'éditeur une piste d'accompagnement prémixée partagée
par le lecteur et le MP4 : `music:{audio,gain:1,preMixed:true}`, sans boucle ni seconde
enveloppe. La musique baisse sous les voix et s'interrompt brièvement à l'impact
avant de reprendre. Les premiers144,6s reproduisent le completv1 : pressure phase0,
gain0,08 et duck ancien, sans nouveau fondu artificiel à144,6s. Les données et
journaux restent distincts des prises. `audio/MIX-PLAN.json` porte les sections.

## Production réellement effectuée

Après confirmation QA exacte de la conduite et des six prompts, les autorisations
conditionnelles de l'intégrateur ont permis la production : **14 nouvelles voix v4**
et **six SFX ElevenLabs v2**, tous réussis, aucun échec, interruption ou reprise.
Les journaux et médias restent dans `art-masters/motion-comics/blue-purple/pages-05-08/
revision-01/audio-v1/`, séparés en `takes/` et `sfx-takes/`.

TTS : **538 caractères nouveaux**, cumul **3 394/4 800** ; réserve allouée444 intacte,
limite opérationnelle3 838 et marge962 non allouée. Les22 prises sélectionnées
totalisent **42,64s**, dont24,88s nouveaux et17,76s réemployés. Les huit prises
existantes16–23 sont conservées à l'identique, y compris les WAV préparés21/22.
Le mapping définitif `audio-v1/prepared-measurements.json` donne chemins, hashes,
durées PCM, textes exacts, journaux, sources et gains constants. Six nouvelles
prises ont un gain local, positif pour les voix basses ou −0,4dB pour éviter une
crête forte ; aucun étirement ni compression. Les sources MP3 restent intactes.

SFX : **6 requêtes / 20s demandées** ; réserve **2 requêtes / 4s** intacte. Les six
MP3 stéréo ont été intégralement décodés, puis des copies WAV PCM16 ont reçu un
gain constant adapté : coup−10dBFS, tir/verre−8dBFS, porte−18dBFS, pas−22dBFS,
démarreur−18dBFS et départ−18dBFS. La sélection finale est
`audio-v1/sfx-measurements-v3.json`, WAV dans `sfx-prepared-v3/`. Elle conserve
provenance ElevenLabs OAuth, modèle `eleven_text_to_sound_v2`, requête exacte,
journal et hashes. Aucun repli procédural ne s'est substitué aux six sons.
Deux préparations locales antérieures sont conservées : la première mesure utilisait
volumedetect, la seconde gardait ce filtre avant la sortie float, ce qui forçait
encore une conversion S16 masquant les dépassements MP3. La contre-revue a détecté
ce défaut. La troisième décode en float brut sans filtre et calcule directement
RMS et crête ; les cibles sont atteintes à moins de0,005dB, sans requête supplémentaire.

Commandes réellement exécutées : `audio/prepare.py`, dry-run `audio/generate.py
--line 24 --dry-run`, puis lignes 24–37 avec `--approved` ; `audio/sfx-take.py --id punch-wood`
puis cinq autres IDs avec `--approved` ; `audio/measure.py` et `audio/measure-sfx.py`.
La conduite immuable soumise porte SHA256 `ee7b2176302ed59572252fdd78496273f61ad97dec40f5e7b3c0ae8673d84576`.
Le champ de référence des contrats dans BUDGET a été harmonisé vers666a537… après
ces générations déjà autorisées ; la version précédente18908e… et la version
finale ont les mêmes textes TTS, speakers et réglages, contre-revus avant appel.

Audition des22 lignes dans l'ordre du récit : `audio-v1/audition.mp3`, master WAV
également présent. L'audition est un fichier produit pour écoute, elle ne signifie
pas qu'une écoute humaine a été effectuée. Prononciation, souffle naturel et
contenu auditif exact des SFX restent à apprécier à l'oreille. Coûts réels et
identifiants fournisseur non retournés restent inconnus.

## Backing final produit

Essai intermédiaire : `art-masters/motion-comics/blue-purple/pages-05-08/
revision-01/soundtrack-v2/report.json`, lot96s/complet240,60s, sur `timing-r1-v3.json`
et contratsv4 b62984…db4b. Les variantes100s de travail restent sous `soundtrack-v1/`.
Ces deux essais sont conservés et **ne seront pas retenus** : l'intégrateur a ensuite
figé le rythme à **82s nouvelles / 226,60s complètes**, sans modifier aucune voix.
Le **backing final v3 est produit**, calculé sur `timing-r1-v4.json` puis rapproché
du gel final `timing-r1-v5.json`, contrats v5
SHA256 `4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Le timing v4 portait encore la référence documentaire intermédiaire a296bc… ; la
comparaison profonde v4/v5 confirme que seuls `revision` et `contractSha256` changent,
tous les temps, prises, médias, ancrages et données de pages étant identiques.
`soundtrack-v3/final-provenance.json` donne les empreintes et cette équivalence ;
le rapport d'origine et les WAV ne sont pas modifiés, aucun nouveau mix n'est requis.
Rapport retenu : `soundtrack-v3/report.json`. Durées : **82 s nouvelles / 226,60 s
complètes**, dont **42,64 s de voix**, soit 52 % du nouveau lot.

Fichiers réellement présents : `backing-page-05.wav` à `backing-page-08.wav`,
`backing-pages05-08.wav` et `backing-full.wav`. Ce sont des pistes musique+SFX
stéréo44,1kHz PCM16 **sans voix**, raccordées avec `music.preMixed:true` : pas de
boucle ni seconde baisse de musique dans lecteur/export. Les fichiers séparés des
22 voix restent ceux du mapping. Chaque backing a été entièrement redécodé.

Trois sections se suivent avec fondus0,65s : pressure confrontation/sortie gain0,30 ;
neon bluff/parking0,26 ; afterglow voiture/départ0,32. La musique est donc plus
présente dans les silences ; elle baisse à28% sous les voix, rampe0,15s. Le premier
gain passe de0,08 à0,30 sur0,8s après le raccord historique. Le coup et le tir ont
une coupure musicale brève ; les SFX baissent à42% sous une réplique.
L'ambiance urbaine HOLT CC0 existante reste discrète après la sortie arrière.

Le composé Eleven `punch-wood` est découpé en **deux segments disjoints** : impact
0–0,22 s au contact 11,08 s, puis partie bois 1,10–1,80 s au recul 11,20 s. Aucun
second impact ou doublage de batte n'a été ajouté. Les ancrages exacts du tir,
des portes, de la serrure, du démarreur et du départ sont conservés dans le rapport,
calculés depuis le timing définitif plutôt que des temps d'une version antérieure.
Trois petits compléments seulement sont procéduraux locaux : loquet de grille,
clic de serrure et fermeture de portière. Leur code, graine et provenance sont
dans `audio/foley.cjs` et `audio-v1/foley-local-v1/report.json`, séparés des six
SFX ElevenLabs. Aucun appel payant supplémentaire et aucune musique réseau nouvelle.

Les **144,60s initiales** du backing complet sont copiées en PCM à l'identique du
préfixe calculé avec la source pressure, phase0 et filtre historique du completv1.
La preuve `soundtrack-v1/legacy-prefix-report.json` donne paramètres, expression
partagée, empreintes source et PCM attendu. Le début de `soundtrack-v3/backing-full.wav`
porte la même empreinte PCM `c106d570dddff55ddd6875c07663ddd4acca4a524a66908f940e8f1037546ce7`.
Aucun nouveau fondu n'est ajouté à144,60s. Cela garantit le backing PCM, pas
l'identité binaire du futur MP4 recompressé.

Préécoute du mix **avec voix** : `soundtrack-v3/preview-pages05-08.mp3`, master WAV
également présent. Crête mesurée du master : **−4,16 dBFS**, sans écrêtage détecté.
Cette préécoute n'est pas employée comme backing afin de ne pas doubler les voix.
Le rapport conserve les scripts copiés, empreintes des médias/moteur et ancrages.

Commandes de mix exécutées : `audio/prepare-prefix.cjs`, `audio/foley.cjs`, puis
`audio/build-soundtrack.cjs --version 3 --sfx-version 3 --timing timing-r1-v4.json
--expected-duration 82`, puis `audio/check-soundtrack.cjs` avec le dossier v3.
Ce dernier contrôle est réussi : les sept WAV sont redécodés intégralement,
35 empreintes de sources correspondent, le lot est identique au suffixe du complet,
chaque page est une découpe PCM exacte du lot, le préfixe historique est exact,
aucune voix ne se superpose et le coup tombe entre sommation et réaction.
Les quatre pages sonores durent 20,90 / 18,60 / 20,10 / 22,40 s. Le code et le timing
sont copiés dans le dossier du mix pour reproduction ; `audio-output-check.json`
conserve les preuves et la limite d'écoute.

Prochaine étape :
contre-revue indépendante du backing et contrôle de lecture/export sur les mêmes médias.
