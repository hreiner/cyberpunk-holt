# Revue ciblée du 6 novembre 2026

Contrat `da290bacb031c7133d66abda9792b506dbb6ce8dadafa2e69fb710ac17c34822`.
La reprise part de v3 sans modifier ses fichiers : 71 sources sélectionnées sont
empreintées dans `revision-02/baseline-v3.json`, en plus du contrôle des pages1–4.
Les quatre masters canoniques, les textes français/anglais et les37 prises restent
identiques. Seules les deux réactions au tir sont retardées de0,70 s ; les tenues
permettent de garder82 s de lot et226,60 s au complet.

## Vitre et mains

Un appel ImageGen prépare le vitrage entier. Le natif est visuellement favorable,
mais présente des retouches fines hors vitre. Il n'est donc pas employé directement.
L'assemblage SVG/Canvas garde l'original et utilise la nouvelle image uniquement
dans les zones verre/éclats. La chaise de premier plan reste celle de l'original.
Le composite final `1da76f06e5f71d241626b2a50d42f1e27601930b00c26a936a9c51af5e10c55e`
a été ouvert en entier, puis fenêtre, sol, chaise et mains agrandis : avis favorable.
922480 pixels d'acteurs restent strictement identiques, comme les zones meubles
et les deux mains/trois visages après normalisation1000×496. [QA-IMAGES](QA-IMAGES.md).

Le cadre stable arrive à15,90 s page5 ; la vitre reste entière0,50 s puis se brise
à16,40. Franklyn réagit à16,60, Abigail à18,38. Les éclats suivent le temps du récit.
`storyThumbnail` réutilise le composite lettré courant : la miniature ne révèle pas
le bris avant l'impact quand les animations sont activées. La preuve v2 vérifie
le changement à16,40 exactement, après correction d'un arrondi de soustraction
dans les données de pose ; aucun fichier moteur ou audio n'a changé pour cela.

Animations désactivées ou mouvements réduits : le master canonique final déjà brisé
reste statique, selon la convention existante. Aucune nouvelle coupe narrative n'est
ajoutée à ce mode. Les quatre masters restent les mêmes fichiers que v3.

## Mèches et vitesse

Page6 case2 : la grande région déformant la coiffure est remplacée par une petite
zone de pointes, amplitude2,2 pixels. Crâne, sommet, front, visage et col sont protégés.
Le franchissement en deux poses de la case3 est conservé.

Page8 case4 : aucun calque de mouvement du véhicule. La voiture, ses roues et son
ombre restent celles du masterv3 ; une protection absolue les conserve. Deux régions
libres reçoivent `wind`, particules directionnelles avec bords adoucis. Aucun balayage
lumineux ni nouvelle transformation du véhicule.

## Bruitages réellement joués

La reprise corrige une faiblesse du contrôle précédent : la crête du fichier source
ne prouvait pas que son bon segment était joué. L'ancien prélèvement du coup0–0,22 s
culminait à−36,9 dBFS ; le vrai transitoire est vers1,14 s. Le nouveau segment unique
est recalé sur le contact : onset fort à+10 ms. La contre-revue recalcule les fenêtres
PCM réellement jouées et leur RMS, plutôt que la seule crête globale du fichier.

Les gains RMS mesurés sur220 ms sont+16,2 dB pour le coup,+6,06 dB pour le tir/verre
et+10,10 dB pour le démarreur ; musique abaissée localement, voix inchangées. Un seul
coup et un seul tir. La préécoute AAC passe par le même mixage mono que le renderer :
−0,836 dBFS, zéro échantillon écrêté, décodage intégral réussi. Les six backings et
leur préfixe historique144,60 s ont leur contre-revue favorable.
[AUDIO](AUDIO.md), [QA-AUDIO](QA-AUDIO.md). Aucune écoute humaine n'est prétendue.

## Tests et clôture

`npm run verify` passe (typage, lint, tests du jeu et build). Les30 tests motion comics
passent, dont lead-in et vent borné. `code-checks-v1.json` garde les neuf empreintes
moteur. Quatre PNG témoins des pages1–4 restent byte-identiques après ces ajouts.
La sélection finale v4 provient de `candidates-v2` :37 voix/82 s/226,60 s, mêmes
masters, mêmes textes, aucune voiture transformée. `delivery-audit-v1.json` confirme
les71 sources v3 et25 sources initiales intactes,38 décodages audio complets,
aucun chevauchement et seulement les deux réactions déplacées de0,70 s.
Le lecteur50588 et son alias v3→v4 répondent200. `qa/sequence-final-v1/` vérifie
navigation, raccords automatiques, pause audio/récit, arrêt, mouvements réduits et
zéro erreur JavaScript.

Preuves dans `qa/selected-v4-*` : trois calques narratifs réels,14/14 cases,
113 régions protégées à zéro altération. Les lettres opaques des deux pages à
calques conservent270542 pixels sans altération. Le néon p7c2 non retouché conserve
la trace initiale de phases presque égales et son supplément ambiant explicite,
sans abaisser le seuil. Les41 preuves candidates ont été déplacées hors de `docs/`
avec conservation de tous leurs SHA ; inventaire et rapport de déplacement conservés.

Six images du H264 réellement livré ont été ouvertes par l'intégrateur et la
contre-revue : vitre entière16,125 puis brisée16,416667 ; pointes28,125/28,75 ;
voiture fixe77/80,833333 s. [QA-DELIVERY](QA-DELIVERY.md) consigne l'avis favorable.
Le zéro pixel crâne/voiture est une propriété du Canvas avant encodage ; le H264
est jugé visuellement, sa quantification pouvant varier entre images.

Les six `independent-audit.json` et `export-check-v1.json` sont completed : source,
neuf fichiers moteur et tous médias inchangés, H.264/AAC mono1280×720 à24 images/s,
décodages intégraux réussis. `snapshot-audit-v1.json` compare six exports/seize pages
copiées : données et SHA de chaque média identiques après rebasing. `mix-check-v1.json`
mesure les six AAC : complet/lot/page5−0,8 dBFS, page6−2,9, page7−2,1, page8−2,6.
Aucune sortie à0 dBFS. Complet226,60 s/29 123 446 octets,
SHA `764bfca3cfcb5e6abbf15c55ffecf092c20319e9ddb661b2f64a3178b3e59837`.
Lot82 s/9 824 659 octets,
SHA `c125fb2de740815526eb8f153ed088139bd01629b66ab5f7ecc93b4973f49d7c`.
La sauvegarde et son rapport CRC/SHA sont référencés dans [DELIVERY](DELIVERY.md).

Budget :1/3 appel ImageGen,28 connus cumulés ; aucune nouvelle voix, aucun nouveau
SFX ni musique payante. Cumul vocal3394 caractères inchangé, six SFX/20 s historiques.
Réserves inutilisées ; coûts fournisseur non exposés inconnus.
