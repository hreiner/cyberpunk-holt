# Reprise 03 — colère, vision et animation par case

5 novembre 2026. Demande du propriétaire après lecture de la séquence v2.
État : livré. Les versions et exports précédents sont conservés.

## Retour source du propriétaire

> c'est bien, un peu trop de bruit de respiration, à garder quand ça sert le récit mais pas à quasi chaque ligne + pas asset d'effet visuel animé, il devrait y avoir une petite animation par case. Il faut insister sur la colère de franklyn aussi qui va finir par craquer pour aider le groupe mais ça doit le prendre aux trippes (il faut le montrer en images sur le ton et sur les dialogue). Pour la partie vision rajouter au milieu de la vision des un effet de coordonées qui aparaissent comme sur une minimap d'un jeu vidéo un effet de vision qui se fragmente en element numérique pour rajouter l'effet avec genre comme des éclair sur la tete de franklyn animé dans l'image juste avant.
> L'image juste après Franklyn doit etre sous le choc.
> Orchestre la reprise de tous ces éléments (aussi tu as bien repris les dialogue de la première page en V4 ? si ce n'est pas le cas fais le)

## Exécution et propriété

- Réalisation : nouveaux STORYBOARD.md et contracts/, IDs de cases/répliques conservés.
- Art : BIBLE.md, prompts/, quatre éditions ciblées et assemblages v2 ; aucune suppression
  des masters v1. Colère puis ralliement douloureux page 2, choc après vision page 3,
  séquelles page 4. Une tentative initiale par bande, corrections sur diagnostic.
- Audio : AUDIO-DIRECTION.json, AUDIO.md et génération cumulant les 1 044 caractères
  historiques avec les nouvelles tentatives ; aucune respiration imposée automatiquement.
- Animation : effects.js, nouveaux types et tests, EFFECTS.md/effects-plans/ ; mouvement
  perceptible dans les 16 cases, éclairs et fragmentation/minimap dans les cases prévues.
- Montage : reader.html/render.cjs, temps narratif local séparé de l'ambiance en pause,
  contrôles par case et exports après sélection stabilisée.
- Qualité : contre-revue indépendante en lecture seule des contrats puis vrais médias.
- Intégrateur : core.js/validation, manifestes, ADR, audit page 1 et livraison finale.

Tous les agents préservent les modifications des autres. Aucun commit/push demandé.

## Décisions de reprise

La minimap est un effet subjectif à l'intérieur de la vision, avec grille/croix et
coordonnées partielles lisibles, pas la miniature de page du lecteur ni le GPS actuel
de Night City. Fragments prévus : `LAT 3?.7?? / LON -1??.4??`, jamais une adresse complète.
Elle apparaît après le début de la vision ; augmenter sa tenue à au moins six secondes.
Les éclairs précèdent cette case ; Franklyn est encore sous le choc juste après.

L'intégrateur a approuvé les nouvelles propositions de dialogue 006/008/009, sous
contre-revue : colère exprimant sa peur pour Letitia, puis accord pour aider le groupe
et promesse de revenir. Cela n'annonce pas comme fait que Letitia va mourir.

Prochaine action : contre-revue des contrats avant dépenses, audit fichiers v4 page 1,
fixation du nouveau plafond vocal cumulé, puis production et intégration ciblées.

## Production en cours

Audit page 1 exécuté et recoupé indépendamment : quatre journaux `eleven_v4`, et
empreintes des quatre copies audio de l'export v2 identiques aux prises originales.
Les reprises de page 1 servent à alléger les respirations, pas à changer de modèle.
Contrats v3 et conduite audio contre-revus : pas de blocage narratif. Quatre éditions
ciblées ImageGen autorisées, une tentative chacune ; elles sont reçues et contre-revues
brutes, amélioration émotionnelle réelle sans défaut bloquant, assemblage en cours.

Nouveau plafond vocal global approuvé : **3 000 caractères**, incluant les 1 044
historiques. Quinze prises v4 produites en une passe, 1 372 caractères nouveaux,
cumul **2 416/3 000**, zéro échec/reprise, aucun tag respiratoire automatique.
Mapping `art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/measurements.json`.
Décodage et niveaux contrôlés ; aucune écoute humaine ni validation auditive des mots
revendiquée. Les minima de lecture sont conservés malgré les prises plus courtes.

Quatre nouveaux effets locaux implémentés avec horloge narrative séparée : éclairs,
fragmentation/HUD, particules et balayage lumineux. Tests du socle : 14 réussis.
Prévisualisation de vision inspectée par l'intégrateur et le relecteur, lisible et
visage intact. Les plans des pages révisées attendent les PNG finaux pour fixer masques.
Le nouveau contrôle par case a confirmé sur l'ancienne sélection v2 une case totalement
immobile (`p01-c02`) ; la reprise doit atteindre les 16 cases, avec revue des paires
visuelles et pas seulement un compteur global de pixels.

Sélection prévue : `blue-purple-page01-v4-r3.json`, `blue-purple-page02-v3.json` à
`blue-purple-page04-v3.json`, et `blue-purple-pages01-04-v3.json`. L'intégrateur utilise
`integrate.cjs` après stabilisation des dessins et plans ; l'apparition du HUD est
recalée à 2,5 s dans une vision tenue six secondes. Aucun export long avant revue.

## Intégration et contre-revue du lecteur

Sélection v3 construite et validée : 34,40 / 43,40 / 31,40 / 35,40 s par page,
**144,60 s** au total. Le retrait des souffles ne raccourcit pas le temps de lecture ;
les tenues donnent à voir colère, ralliement et choc. Quatorze tests du socle passent,
`npm run verify` réussit (788 tests du jeu, typage, lint et build). Les adaptateurs sont
synchronisés ; la première tentative sandbox bloquée par `.codex` a été relancée
dans le circuit autorisé et a écrit les 42 adaptateurs.

Les 16 cases de v3 passent la mesure au zoom, déterminisme et arrêt. Série unique
de 32 paires et quatre planches conservée dans
`art-masters/motion-comics/blue-purple/pages-01-04/revision-03/panel-qa-v1/`.
La revue indépendante confirme un mouvement perceptible dans chaque case, avec
éclairs et vision nettement plus forts. Contrôle de 472 comparaisons de protections
sur seize instants : toutes stables et identiques au master, vision active comprise.

Un défaut visuel concret est signalé avant export : reflet cyan rectangulaire sans
support derrière John/Abigail en p04-c02. Correction minimale retenue : retrait de
ce seul `lightSweep`, particules du vrai néon conservées, moteur inchangé. Le plan
initial et la QA restent conservés ; `page-04-fix-v1.json` est la correction.
`select-final.cjs` produit `blue-purple-page04-v4.json` et
`blue-purple-pages01-04-v4.json`, **30 effets/118 protections**, même durée et médias.
Seule cette case doit être revue après correction ; les quinze autres preuves restent
applicables. Aucun nouvel appel fournisseur pour ce correctif.

## Livraison finale

Réserve p04-c02 levée : 1 073 pixels écran >15, seuil 400, particules mobiles conservées,
colonne supprimée ; paire revue en pleine résolution. Les cinq exports (quatre pages
et ensemble) sont terminés et décodés, snapshots relus et empreintes conformes.
Complet `pages-01-04/render-r3-v1/motion-comic.mp4` : 144,60 s, 3 471 images rendues,
19 507 198 octets, H.264 1280 × 720/24 i/s et AAC mono 44,1 kHz.
Mix mesuré : moyenne −26,5 dB, crête −1,7 dB ; trois frames extraites du MP4 final
et inspectées (colère, vision avec HUD, choc). Voir [livraison](DELIVERY.md) et [revue](REVIEW.md).

Lecteur final sur 50587, session 71463 ; ancienne URL v2 redirigée vers v4 et testée.
Les previews temporaires sont arrêtées. Quatorze tests du socle, `npm run verify`
et contrôles documentaires réussis. Aucun commit/push ni appel fournisseur supplémentaire.
Le cumul vocal reste 2 416/3 000, journaux historiques inclus.
Prochaine action : appréciation à l'écoute du propriétaire, puis éventuelle correction
ciblée dans une nouvelle version. Aucune écoute humaine des nouvelles prises revendiquée.

## Retour après livraison — variété des animations

Le propriétaire juge le résultat bon mais trouve le balayage de lumière droite/gauche
trop fréquent. Il demande explicitement de conserver la version livrée et de varier
davantage lors des prochaines productions. Retour intégré dans le répertoire d'effets,
la fabrication et le skill motion comics ; aucun média, manifeste ou export retouché.
À sa demande, le [prompt de prochaine session](../../../../../anime/MOTION-COMICS-PAGES-05-08-ORCHESTRATOR.md)
est rédigé pour quatre nouvelles pages 5–8, du piège au bar au départ en voiture,
avant la borne. Il prépare l'exécution future et n'a lancé aucune génération.
