# Reprise ciblée du 6 novembre 2026

Retour du propriétaire : page6, seules les mèches doivent bouger, pas le crâne ni
le sommet des cheveux ; page5 case4, montrer la vitre intacte puis son bris ; page8
dernière case, garder la voiture fixe et suggérer la vitesse par vent/particules.
Rendre les sons clés francs : coup de John, tir/verre et démarreur.

Base conservée : sélection `blue-purple-pages01-08-v3.json`, pages1–4 originales,
37 prises dont22 sur pages5–8, mêmes textes et casting. Les images, manifestes,
MP4 et sauvegarde de revision-01 restent présents. Dépôt sale préservé, sans commit.

## Plafonds fixés avant production

- ImageGen : **3 appels maximum**, une vitre intacte initiale et deux corrections
  seulement sur défaut constaté ; historiques pages5–8 connus27, total maximum30.
  Art seul opérateur ; prompt et références exacts contre-revus avant appel.
- TTS : **0 nouvelle requête**, cumul3394 caractères inchangé ; mêmes37 voix.
- SFX : **0 nouvelle génération** à cette étape ; réemploi des six sources ElevenLabs
  déjà produites et des trois compléments locaux. Conduite/mix et niveaux à corriger.
  Si un son est réellement absent ou impropre, diagnostic documenté avant nouvelle
  allocation bornée, aucun appel automatique.
- Musique : réemploi ; **0 nouvelle génération payante**.
- Exports : deux simultanés maximum, uniquement après revue des changements réels.
  Dossiers neufs sous `art-masters/motion-comics/blue-purple/pages-05-08/revision-02/`.

Réalisation fixe la fenêtre intacte visible avant impact et recale les répliques
de réaction si nécessaire sans étirer une voix. Art prépare uniquement la vitre
intacte avec personnages/mains et décor conservés. Animation borne les mèches,
le bris et les particules ; aucun déplacement de voiture. Audio resynchronise et
fait ressortir les accents. Montage prépare sélections/masters et six MP4, qualité
contre-revoit dessins/gestes/mix technique puis encodages. Intégrateur : sélection,
documentation, sauvegarde et vérification finale. Aucune écoute humaine présumée.

## Clôture de production

Sélection v4 publiée depuis `candidates-v2` : 37 voix conservées, 82 s nouvelles,
226,60 s au complet. Une seule image générée sur trois autorisées, 28 appels connus
cumulés. Le composite SVG garde 922480 pixels d'acteurs strictement identiques ;
mains/visages et zones de meubles restent préservés après normalisation.

Les trois corrections passent leur contre-revue : pointes seules, crâne fixe ; vitre
intacte jusqu'à 16,399 s et brisée à 16,40, miniature au même état ; voiture/roues/ombre
immobiles et vent dans les zones libres. 14/14 cases et 113 protections contrôlées.
Le son du coup utilise désormais le bon transitoire, tir/verre et démarreur renforcés
avec musique abaissée localement. Aucune nouvelle voix/SFX/musique payante.

Les six MP4 `revision-02/exports/*/render-v1` sont completed, entièrement décodés,
H.264/AAC 1280×720 à 24 images/s. Neuf fichiers moteur et tous médias conformes.
Six snapshots/seize pages copiées ont les mêmes données et SHA que les originaux.
Six images du H264 réel ont été ouvertes par l'intégrateur et la contre-revue : les
trois changements restent lisibles après encodage. Les six AAC ont des crêtes négatives.

`npm run verify` et les 30 tests motion comics passent. Quatre PNG témoins des pages
1–4 restent byte-identiques. Les 71 sources de v3 et 25 sources initiales sont intactes.
Le lecteur final 50588 répond 200 et l'alias de l'onglet v3 ouvre v4. Navigation,
pauses, arrêt et mouvements réduits passent sans erreur JavaScript.

[DELIVERY](DELIVERY.md) donne fichiers, relance, preuves, sauvegarde et limites réelles.
Toutes les anciennes versions et sauvegardes sont conservées ; aucun commit/push.
