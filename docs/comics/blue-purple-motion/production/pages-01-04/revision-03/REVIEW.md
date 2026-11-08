# Revue — reprise 03

5 novembre 2026. Contre-revue indépendante favorable à la sélection et à l'export.
Les cinq exports de livraison sont terminés et intégralement décodés.

## Réponse au retour du propriétaire

| Demande | Changement réellement contrôlé |
| --- | --- |
| Moins de bruits de respiration | Quinze nouvelles prises `eleven_v4`, zéro tag automatique de souffle/soupir/déglutition ; source annotée, paramètres, journaux, empreintes et décodage vérifiés. L'absence de bruit gênant reste à juger à l'écoute. |
| Colère viscérale de Franklyn | P02-c02 redessinée : cri, yeux contractés et humides, paume plaquée, poing. Réplique 006 plus dure, voix dirigée de la colère vers la douleur. |
| Il craque pour aider le groupe | P02-c04 redessinée : épaules tombées, main crispée au col, larmes, blessure toujours visible. Réplique 008 accepte d'aider et exige le retour pour Letitia ; John répond par une promesse. |
| Une petite animation par case | Seize cadrages contrôlés, paires A/B au même temps narratif, mouvement perceptible dans chaque case après contre-revue visuelle. |
| Éclairs avant la vision | Branches cyan/blanc animées autour de la tête p03-c02, visage préservé. |
| Vision fragmentée et coordonnées type minimap | Paysage morcelé en tuiles, puis grille/réticule et chiffres partiels dans la case p03-c03 ; apparition après 2,5 s sur une tenue de six secondes. |
| Franklyn sous le choc juste après | P03-c04 redessinée : regard écarquillé et désorienté, sueur, main à la tempe et appui tendu ; p04-c01 prolonge la sidération. |
| Page 1 bien en v4 | Audit indépendant : les quatre fichiers copiés dans l'ancien export v2 sont identiques aux sources dont les journaux indiquent `eleven_v4`. Les nouvelles prises restent en v4 et répondent au souffle, pas à un changement de modèle. |

## Dessins et lettrage

Quatre éditions ImageGen ciblées, une tentative chacune, zéro reprise. Les pages
02–04 `page-v2.png` et `page-raw-v2.png` ont été inspectées par l'intégrateur et le
relecteur indépendant. Onze textes des `lettering-v2.json` comparés aux contrats v3 :
exacts, ordre et attribution nets, gestes émotionnels non masqués. La moitié Grover
de p02-c03 reste exactement issue de v1 : zéro pixel modifié à droite, 779 174 à gauche
dans la bande composite, rapport `page-02/grover-composite-v2.json`.

Les réemplois p03-c01 et p04-c02 sont plus posés que les plans nouveaux. Après les
tenues longues, le relecteur les juge compatibles avec une attention au document et
une reprise progressive de concentration ; aucune nouvelle retouche recommandée.
Les réserves mineures antérieures de géographie de table et chiffres abstraits du papier
restent conservées, sans nouvelle coordonnée canonique ajoutée.

## Animations et correction ciblée

La baseline v2 avait une case réellement immobile (`p01-c02`). La nouvelle sélection
est contrôlée par case, plutôt que par un compte global sur toute la page.
`panel-qa-v1/` conserve 32 PNG A/B, quatre planches comparatives et quatre vues décisives,
dans `art-masters/motion-comics/blue-purple/pages-01-04/revision-03/`.
Le relecteur a agrandi les cas les plus discrets : particules/lueurs mobiles présentes
partout ; éclairs et vision nettement plus forts. Les gestes des personnages sont
redessinés, les petits mouvements restent principalement ambiants.

Un défaut est signalé et corrigé **avant** export : colonne cyan rectangulaire sans
support en p04-c02. Le seul `lightSweep` concerné est retiré dans le plan séparé
`page-04-fix-v1.json`, sans changement de moteur. `panel-fix-qa-v1/` confirme 1 073
pixels écran variant de plus de 15 niveaux, seuil 400, déterminisme et arrêt ; deux
phases inspectées en pleine résolution : colonne disparue, particules conservées,
visages et bulle intacts. Le relecteur lève la réserve.

Les quinze autres preuves v3 restent applicables. Sélection finale : page 1 v4-r3,
pages 2–3 v3, page 4 v4 et ensemble v4, 30 effets et 118 protections.
`protected-effects-qa-v1/` vérifie 472 comparaisons sur seize instants, vision active
comprise : régions exactes au master, stables, déterminisme et arrêt réussis.
Le retrait d'un effet ne modifie aucun des détails protégés.

## Son, budget et limites

Nouvelles prises dans `pages-01-04/audio-v3/takes/`, mapping et mesures dans son parent.
Cumul sous plafond : 1 044 caractères historiques + 1 372 nouveaux = **2 416/3 000**,
zéro échec/reprise, quinze journaux v4 et décodage PCM complets. Les sources anglaises
et françaises et leurs attributions sont vérifiées ; les mots effectivement prononcés
ne sont pas présentés comme validés par une écoute ou transcription humaine.
La musique de pression HOLT est réemployée, sans génération supplémentaire.

Aucune écoute humaine des nouvelles prises ou du nouveau mix n'est revendiquée.
La lecture du propriétaire de l'ancien export a fourni le retour de reprise ; elle
n'est pas une approbation humaine de ces nouveaux médias. Coûts monétaires et IDs
fournisseur non exposés : inconnus. Les journaux, dessins, prises et exports antérieurs
restent présents ; aucun état interrompu n'a entraîné de nouvelle dépense automatique.

## Export final et contrôle du fichier encodé

Les quatre pages et l'ensemble sont `completed` et `decoded: true`, dans les nouveaux
dossiers `render-r3-v1/`. Le complet fait 19 507 198 octets, chronologie 144,60 s,
3 471 images rendues, H.264 High/YUV420p 1280 × 720/24 i/s et AAC mono 44,1 kHz.
Les cinq snapshots sont revalidés ; empreintes sources, moteur et médias conformes.
Synthèse `pages-01-04/export-check-r3-v1.json`.

Le relecteur indépendant a recoupé les empreintes de la source, huit fichiers moteur
et tous les médias du complet, puis relu le snapshot : quatre pages, quinze prises,
30 effets, 118 protections, aucune superposition de voix. Frontières :
34,40 / 77,80 / 109,20 / 144,60 s. Les rapports et métadonnées concordent.

L'intégrateur a extrait trois frames du MP4 encodé final : colère à 47,3 s, vision/HUD
à 96,65 s et choc à 101,4 s. Images inspectées, dessin, texte, overlays et cadrage
attendus présents. Preuves `revision-03/mp4-final-stills-v1/` dans les masters.
Le mix AAC complet a été décodé pour mesure : moyenne −26,5 dB, crête −1,7 dB,
sans erreur. Aucune écoute humaine ni visionnage humain intégral revendiqués.

Le lecteur final reste servi sur 50587, session 71463. L'ancienne URL v2 renvoie HTTP307
vers v4 ; le parcours via cette ancienne URL a passé les contrôles de navigation,
pause sonore et temporelle, ambiance, arrêt et réduction des mouvements, sans erreur.

Conclusion indépendante après inspection des trois frames réellement extraites du MP4 :
favorable, aucune anomalie bloquante ouverte. Colère, coordonnées de vision et choc
sont présents sans cadrage coupé. Les animations restent principalement ambiantes.
Cette conclusion ne revendique ni écoute humaine des nouvelles prises ni visionnage
humain intégral de la séquence.
