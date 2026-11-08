# Revue son — motion01

7 novembre2026. Sélection courante : [SELECTION.json](SELECTION.json).
Pilotage et intégration globale : root. Cette revue établit la production et les
mesures ; elle ne revendique pas une écoute humaine du mix. Les AAC des véritables
MP4 9–21 et1–21 sont contre-vérifiés ci-dessous, après les exports finaux render-v2.

## Production et provenance

Quatre SFX ont été réellement générés via la CLI ElevenLabs OAuth existante et
`eleven_text_to_sound_v2` : capsule4s, ascenseur4s, tir/impact métallique3s et
chute dans l'eau5s. Quatre requêtes réussies, seize secondes demandées ; réserve
deux requêtes/huit secondes intacte, cumul connu dix requêtes/trente-six secondes.
Les journaux, requêtes, MP3 sources et SHA sont conservés dans `sfx-takes/` ;
préparation de gain et analyse par blocs5ms dans `sfx-prepared-v1/report.json`.
Coûts et identifiants fournisseur non exposés restent inconnus.

Sept petits motifs/Foley déterministes ont été produits localement : borne,
confirmation d'implant, connecteur, outil, déverrouillage neural, alimentation,
tissu. Le code [foley.cjs](foley.cjs) et `local-v1/report.json` en conservent la
provenance, distincte des SFX ElevenLabs. Les anciens SFX du lot5–8 sont réemployés
par leurs segments exacts. Musiques `neon`, `pressure`, `afterglow` originales HOLT,
ambiances ville/industrie/ventilation et égouts déjà disponibles : voir
[attribution commune](../../../../../../../public/assets/audio/ATTRIBUTION.md).
Aucun appel de composition musicale n'a été effectué.

La [conduite](PLAN.md) distingue recherche urbaine, boutique, simulation, embuscade,
attente cachée, quai et refuge. La musique change de présence selon l'action ; les
creux au tir, au contact et au splash laissent les ambiances physiques continuer.
Les backings ne contiennent aucune voix : les prises restent séparées dans le lecteur
et l'export, avec `preMixed:true` et gain1.

## Pages5–8

Le coup principal déjà corrigé reste inchangé. Les anciens ducks étaient spécifiques :
coup1, tir0,30, verre0,62, démarreur0,60 ; la valeur0,42 ne concernait que les autres
effets par défaut. La nouvelle conduite relève les matières auparavant écrasées
sous les voix et ménage des fenêtres musicales, sans retimer ou modifier les prises.

| Segment réellement joué | Variation RMS des SFX |
| --- | ---: |
| Coup de John | 0dB |
| Queue de verre | +2,63dB |
| Démarreur hésitant | +6,26dB |
| Porte arrière | +11,52dB |
| Appuis du groupe dans la ruelle | +12,97dB |
| Loquets/serrure | +7à8dB |
| Portière | +5dB |
| Départ moteur/pneus | +10,65dB |

`legacy-v2/report.json` conserve les événements, prélèvements, gains, ducks,
fenêtres et dix stems isolés. Sa préécoute AACstéréo192k décode entièrement sans
sample écrêté : pic−1,476dBFS, truepeak−1,5dBFS,−16,7LUFS.

Le comparatif `comparison-v1/comparison-pages05-08.m4a` permet une revue rapide :
ancien puis nouveau, pour porte/pas, démarreur, portière/départ. Les voix et leur route
stéréo sont identiques des deux côtés ; ce comparatif évite de confondre un écart de
conversion de canaux avec une amélioration des bruitages. Son plan indique les temps.

## Synchronisation et chaîne effective

L'ancienne conversion implicite ne correspondait pas toujours au lecteur : le test
`channel-conversion.json` prouve que `aformat=stereo` atténue une source mono de
3,0103dB par canal. La route adoptée par l'intégrateur duplique explicitement le mono
avec `pan=stereo|c0=c0|c1=c0`, conserve la stéréo et exporte en AAC2canaux192k.
Les préécoutes suivent ce même chemin, sans gain global ajouté aux voix.

Le premier mix9–21 `soundtrack-v1` est historique. L'intégrateur a corrigé le délai
entre le flash d'arme déjà dessiné et le tir : la bande17.2 complète est conservée,
avec un seul départ sonore à son entrée. La sélection finale `soundtrack-v2` suit
le TIMING central de219,402222s, SHA
`8c756ade65eed59e686b09cd01340fdf43fd691e199fd81c7ff3c59e06d9fdc9`.

| Accent | Ancre du lot | Onset fort après l'ancre |
| --- | ---: | ---: |
| Fermeture capsule | 122,69s | +10,02ms |
| Tir unique et métal | 146,39s | 0ms |
| Contact unique sur l'habitante | 160,112222s | +10,02ms |
| Splash au quai | 197,212222s | 0ms |

Onsets mesurés après prélèvement/gain/duck, par blocs5ms. Les trois contacts courts
restent dans une image à24i/s. Les pas de course ne prétendent pas reproduire un
contact de pied par image ; ils accompagnent le dessin tenu et l'ellipse comics.
La fermeture et l'ouverture de refuge respectent les raccords décidés par root.

Le nouveau backing dure219,402222s ; le backing global446,002222s. Les144,6premières
secondes de backing des pages1–4 sont copiées exactement en PCM : même SHA
`c106d570dddff55ddd6875c07663ddd4acca4a524a66908f940e8f1037546ce7` avant/après.
Les82s du nouveau mix5–8 sont ensuite copiées exactement, puis le nouveau lot.
Aucun fondu n'est appliqué au préfixe historique.

SHA du backing global :
`8eef48dde3e72184c3c28853133031548bb0709fbb592220c8295a8846197888`.
SHA du backing9–21 :
`49892d12b6e766fe329e4669601348bae1a4fff024de4108dcdec855fb4c4ef1`.

La préécoute AAC9–21 est entièrement décodée : deux canaux,192k, pic−1,335dBFS,
truepeak−1,3dBFS,−17,8LUFS, zéro sample écrêté. SHA :
`cb16f5a4b31272133fe19acaca47d5156818c386681f144023b58a92c272535e`.
Les chiffres viennent du PCMfloat décodé et d'`ebur128=peak=true`. Les effets ont
leurs stems et contrastes mesurés ; aucune simple crête globale ne tient lieu de revue.

## Contre-mesure du véritable MP4 9–21

`sound/final-lot-aac.json` porte sur le véritable film exporté, SHA
`27ea4f4a50ecb006b0bd722b4453b35c1cd4d1b1ee034fef13602409fc184f5a`.
Le flux est AACLC44,1kHz, deux canaux,192kbit/s. Décodage entier réussi, pic−1,335dBFS,
truepeak−1,3dBFS,−17,8LUFS, LRA6,2LU, zéro sample écrêté.

La comparaison `sound/final-lot-aac-comparison.json` extrait et empreinte le PCMfloat
et l'essence AAC ADTS du film et de la préécoute de référence. Les19 351 552samples
PCM sont identiques, SHA
`e4bd0730dbd06d77fe72d6fed6ff602e54b85d064fb17b2f4276bd3ad933b8ff`.
Les5 359 574octets d'essence AAC sont aussi identiques, SHA
`3b77f60377dd441ee384ce68ea4b3a825a75497bbcf9354fa619221ee130a2eb`.
La bande sonore effectivement exportée correspond donc à la préécoute mesurée,
au-delà d'une simple égalité de volume maximal ou de configuration.

Après correction des libellés français du lecteur, le film final du lot est
`exports/pages-09-21/render-v2/motion-comic.mp4`, SHA
`1d595ea37c682ac6a359aef5d77de38f4c8d0028a2679d7b0ced2b140313748c`.
La nouvelle contre-comparaison `sound/final-lot-v2-aac-comparison.json` prouve que
son essenceAAC et ses19 351 552samples PCMfloat sont strictement identiques à ceux
de render-v1 et, transitivement, à la préécoutev2. Les métriques ci-dessus restent
donc celles de l'audio effectivement livré après cette correction de métadonnées.

## Contre-mesure du film complet final

Le film livré `exports/pages-01-21/render-v2/motion-comic.mp4` contient21pages et
99prises séparées, durée nominale446,002222s. SHA
`eee85dac2ece0123dc4062bcd9bcd023bc0dd1e7ab1541e84169617ebd5db7f9`,
67 855 339octets. Aucun média gelé n'a été modifié par la contre-revue.

`sound/full-final-aac.json` confirme son décodage entier : AACLC44,1kHz,
deux canaux, encodage visé192kbit/s (débit moyen des métadonnées193kbit/s),
pic−1,340dBFS, truepeak−1,3dBFS,−18,0LUFS,
LRA9,1LU, zéro sample écrêté. Le PCM décodé dure446,008889s ; les6,67ms de
différence avec la durée nominale viennent du remplissage de trame AAC.

La contre-revue a aussi reproduit l'audio seul depuis le TIMING-FULL et les99prises
inchangées, avec le backing gelé et la route exacte d'export. Le rapport
`sound/full-qa-v1/report.json` établit l'identité des39 337 984samples PCMfloat,
SHA `7e518bcce5c1a2db724092d984c5ffd4f56a264d26be8ccdecd23e4bfa1fbfe0`,
et des10 916 341octets d'essence AAC,
SHA `74fe6ab9bac1fd343e3c526a00fb0a3662f68281ef7387ebb5114a520eca0e34`.
Cette vérification porte sur l'audio extrait du véritable MP4 complet.

Neuf fenêtres sont en outre comparées aux préécoutes des lots5–8 et9–21 : coup,
tir/verre, pas de ruelle, démarreur, capsule, tir du pilier, contact de l'habitante,
splash et porte du refuge. Corrélations normalisées0,9867à0,9993 ; décalage optimal
de0ou−1sample (−0,023ms), soit très inférieur à une image à24i/s. Les positions
globales sont reliées aux ancres du TIMING central, pas à une estimation indépendante.

## Limites de la revue

L'intégrateur conserve la sélection globale et les contrôles du lecteur, des images
et des snapshots. Les contrôles audio ci-dessus portent sur les films réellement
exportés et leurs empreintes. Le script
[measure-delivery.cjs](measure-delivery.cjs) accepte `--file` et `--output` pour ces
mesures avec SHA. L'équilibre perçu, le contenu des nouveaux SFX et le jeu des voix
restent accessibles à la revue audio du propriétaire ; aucune écoute humaine n'a été
effectuée par cette passe.
