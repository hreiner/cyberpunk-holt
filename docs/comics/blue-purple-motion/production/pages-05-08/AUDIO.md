# Audio — pages 05 à 08

État du 5 novembre 2026 : huit prises produites et intégralement décodées ; sélection
de niveau préparée pour montage. Aucune écoute humaine réalisée par cet agent.

Le circuit retenu est la CLI ElevenLabs OAuth existante. La vérification réelle
`node %APPDATA%/npm/node_modules/@elevenlabs/cli/bin/cli.js auth status`, exécutée
hors sandbox, annonce `Windows Credential Manager`, `logged_in: true`, entrée
OAuth `active`. Dans le sandbox, le backend fichier annonce une entrée manquante ;
ce résultat ne décrit pas la session Windows. Aucun jeton n'a été lu ou transféré.
La requête OAuth en lecture seule `models list --query
"[?model_id=='eleven_v4'].{model_id:model_id,can_do_text_to_speech:can_do_text_to_speech}"
--no-retry` réussit et confirme `eleven_v4`, `can_do_text_to_speech: true`.

Les quinze lignes sélectionnées des pages 1–4 sont conservées. Le compteur hérité
de la production précédente est de **2 416 caractères soumis** pour un plafond de
3 000, selon `pages-01-04/audio-v3/global-budget.json`. Le nouveau plafond cumulé
fixé par l'intégrateur est de **3 200 caractères** : les huit nouvelles lignes
annotées comptent **440 caractères**, soit **2 856 après une première passe** et
**344 caractères de réserve** pour corrections ciblées sur diagnostic.
Les reprises, échecs et interruptions seront comptés ; il ne s'agit pas d'euros.

Au démarrage, seuls `page-01` à `page-04` et `pages-01-04` existaient sous les
masters Blue Purple : aucune tentative pages 5–8 à relancer. Les prochaines lignes
portent les indices globaux 16 et suivants et les IDs `bp-l016` et suivants.

Casting : `anime/projects/blue-purple/cast.json`, inchangé. Modèle `eleven_v4`,
stabilité 0,5, similarité 0,8. Les tags servent le jeu adressé et les changements
d'intention ; aucun soupir ou souffle automatique. Aucun nouveau casting de barman
ou de gardien n'est prévu. Coûts réels et identifiants fournisseur non retournés
par la CLI resteront inconnus.

`audio/REUSE-INVENTORY.json` conserve le mapping des quinze réemplois et vérifie
les hashes des médias, journaux, manifestes et historique. `audio/DIRECTION.json`
reprend les huit textes exacts des contrats v1 avec leurs tags, sans ajout de souffle.
Le dry-run de `bp-l016` confirme le routage vers la voix Wendy existante et les
réglages v4 attendus. Les cinq tests `test_voice_take.py` passent ; les scripts
locaux se compilent. `audio/generate.py` refuse les réemplois, les modifications
de conduite, un historique modifié, les tentatives encore `running`, une dépense
dépassant le plafond et les appels concurrents.

La contre-revue indépendante de la conduite exacte a confirmé huit textes identiques
aux contrats, le compte 440 et les quinze réemplois. L'intégrateur a donné le feu vert
définitif, enregistré dans `audio/BUDGET.json`, avant la soumission.

## Prises effectivement produites

Les huit appels OAuth ont réussi sur `eleven_v4`, réglages 0,5/0,8, sans échec,
interruption ou reprise. **Cumul : 2 856/3 200 caractères ; réserve : 344.**
Les journaux fournisseur sont conservés sans altération dans
`art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/takes/`.
Le récapitulatif `audio-v1/global-budget.json` reste hors de ce dossier de prises.
Coût réel et identifiants de requête non fournis par la CLI : inconnus (`null`).

| Ligne | Locuteur | Durée PCM | Intention |
| --- | --- | --- | --- |
| bp-l016 | Wendy | 2,24 s | Ordre ferme, urgence contenue |
| bp-l017 | Abigail | 0,96 s | Cri protecteur bref |
| bp-l018 | Wendy | 4,16 s | Avertissement puis décision |
| bp-l019 | Wendy | 2,64 s | Bluff assuré et impatient |
| bp-l020 | Franklyn | 1,52 s | Désinvolture retenue et fatiguée |
| bp-l021 | Wendy | 2,48 s | Guidage doux |
| bp-l022 | Enfant | 2,00 s | Question inquiète |
| bp-l023 | Franklyn | 1,76 s | Réponse urgente, protectrice |

Total de parole décodée : **17,76 s**, hors silences de lecture et transitions.
`audio/measure.py` a décodé entièrement les huit MP3 avec FFmpeg en mode d'erreur
strict, mesuré durée/échantillons/niveaux/silences et calculé les empreintes.
Les crêtes sont sous −1,5 dBFS ; aucun fichier muet ou tronqué détecté techniquement.
Les intentions du tableau sont celles de la conduite ; leur réussite à l'oreille
n'est pas affirmée par ces mesures.

Les répliques douces 21 et 22 étaient environ 10 dB sous les autres. La préparation
locale leur applique **+10 dB constant**, sans compression ni étirement, dans deux
WAV PCM 16 bits distincts. Les MP3 sources restent intacts. Le décodage confirme
le même nombre d'échantillons et les mêmes durées, avec crêtes respectives −3 et
−5,4 dBFS. Les six autres prises sont réemployées sans changement.

Mapping définitif destiné au montage :
`art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/prepared-measurements.json`.
Chaque entrée conserve source, empreinte, prise fournisseur, textes FR/EN exacts,
durée et préparation locale. L'audition séquentielle complète, avec 0,65 s entre
prises, est `audio-v1/audition-prepared.mp3` (master WAV également présent).
`audio-v1/measurements.json` et `audition.mp3` conservent les niveaux fournisseur.

Commandes effectivement exécutées : `audio/inventory.py`, `audio/prepare.py`,
`audio/generate.py --line 16 --dry-run`, puis `--line 16` à `--line 23 --approved`,
`audio/measure.py`, `audio/prepare-levels.py` ; `python -m unittest discover -s
anime/tests -p test_voice_take.py` : cinq tests réussis. Les scripts sont relatifs
au présent dossier, exécutés depuis la racine avec le Python local documenté.

Prochaine étape : contre-revue technique indépendante, intégration du mapping dans
les nouvelles pages puis contrôle des raccords/mix. Une écoute réelle reste
nécessaire pour valider prononciation, souffle naturel et réussite du jeu vocal.

## Réemploi sonore examiné

Les recherches dans `public/assets/audio/`, `art-masters/audio/`, la provenance
`public/assets/audio/ATTRIBUTION.md` et `src/audio/sfx.ts` n'ont trouvé aucun effet
enregistré de vitre, porte, démarreur ou automobile. Les deux WAV de tirs existants
sont issus de rafales/ambiances de tirs ; ils ne sont pas présentés comme un unique
coup vérifié pour cette scène. Aucun service supplémentaire n'a été appelé.

`background/music-pressure.mp3`, composition HOLT ElevenLabs déjà livrée, reste le
fond adapté et conservé, avec gain 0,08 et baisse sous les voix selon le moteur.
`background/ambience-night-city.mp3` est un réemploi possible pour parking/rue :
circulation urbaine, qubodup, CC0, provenance déjà enregistrée. Le socle possède un
seul fond global ; ajouter ce second fond seulement aux nouvelles pages demanderait
un événement audio ou un prémix explicitement raccordé au lecteur et à l'export.
Cette extension n'est pas nécessaire à la livraison des voix et ne justifie aucun
bruitage de remplacement trompeur.
