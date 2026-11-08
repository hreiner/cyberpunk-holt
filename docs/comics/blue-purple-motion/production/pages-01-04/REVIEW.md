# Revue — Blue Purple, pages 01 à 04

5 novembre 2026. Revue en cours ; ce document distingue preuves techniques,
contre-revue d'agent et approbation humaine.

## Contrats et sources

STORYBOARD v1, BIBLE v1 et contrats pages 02–04 v1 contre-revus indépendamment contre
SCENARIO ch3, SCREENPLAY et CH2-LEGACY. Aucun blocage narratif, textuel ou géométrique.
Trois liens documentaires signalés puis corrigés. Intégrateur : feu vert de production.
La césure précède le barman et le poursuivant armé ; pas de carte ni coordonnées
réelles ajoutées. Risque de l'ancre complète (Letitia/Zachary) transmis aux artistes.

## Voix

Onze prises nouvelles v4, indices 5–15. Mesures PCM complètes sans erreur, 44,1 kHz
mono, crêtes de −12,1 à −1,5 dB. Identités FR/EN, locuteurs, indices et empreintes
contrôlés par la direction audio. Une tentative chacune, 1 044/1 800 caractères.
Page 1 : quatre prises v4 déjà approuvées par le propriétaire, réemployées.
Les journaux des nouvelles prises restent en état fournisseur `review`.

Aucune écoute humaine des onze nouvelles prises ni du nouveau mix n'est revendiquée.
Le décodage ne certifie ni interprétation ni prononciation. Préécoute disponible dans
`art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1-audition.mp3`.

## Socle technique

Onze tests du socle passent après ajout de la séquence et du fond musical.
QA Edge sur quatre pages témoins : navigation pages/cases, trois raccords automatiques,
pause voix/fond, ambiance au repos, arrêt des effets, réduction des mouvements, aucune
erreur de page. Rapport `art-masters/motion-comics/sequence-smoke-v1/browser-qa-v3/report.json`.
Export témoin 4 s, 96 frames, H.264 1280 × 720/24 i/s et AAC mono 44,1 kHz :
décodage complet et relecture du snapshot réussis, `sequence-smoke-v1/render-v2/report.json`.
Ces témoins ne valident pas les pages et médias de production.

Contre-revue technique indépendante du code effectuée : aucun défaut ouvert sur
frontières de pages, navigation depuis l'outro final, arrêt voix/fond, calcul au temps
explicite, copie des médias et limitation des accès locaux. Onze tests réellement
réexécutés par le relecteur, snapshot témoin revalidé par CLI, huit empreintes moteur
du rapport comparées aux fichiers actuels et décodage complet du témoin réexécuté
avec succès. Ces contrôles portent sur les fichiers du moteur sélectionnés à ce stade.

Les essais sandbox échoués sont conservés et identifiés dans ce même dossier :
browser-qa-v1/v2 et render-v1. Cause : Edge/Crashpad sandbox et isolation du serveur.
Serveur et navigateur ont ensuite été exécutés dans le même environnement autorisé.

## Dessins, effets et séquence sélectionnée

Page 2 `page-v1.png` et `page-raw-v1.png` inspectées par l'intégrateur et le relecteur
indépendant : six identités correctes, enfant civil, aucun document anticipé, dessin
convaincant, cinq répliques françaises exactes dans six bulles lisibles et entières,
yeux et mains préservés. V1 retenue. Réserve mineure consignée : Wendy et John changent
d'ordre apparent dans la bande haute par rapport à la page 1 ; le nouvel angle de table
n'explique pas complètement cet écart de géographie. La compréhension reste claire,
le relecteur recommande la sélection sans nouvelle dépense.

Page 2, effets : `effects-qa-v2` mesure 32 433 pixels source modifiés, 29 régions
protégées stables et identiques au master, déterminisme et désactivation réussis.
`live-qa-v2` : caméra immobile en pause, horloge d'ambiance +0,8993 s, 10 835 pixels
écran variant de plus de 15 niveaux, arrêt/reprise réussis. Le zoom de contrôle a
été inspecté par l'animation : bulles entières et lumière sans rectangle visible.
Les dossiers v1 échoués à cause d'Edge sandbox sont conservés séparément.

Les coordonnées d'effets sont écrites après inspection des pages réelles.
Pages 3–4, PNG bruts et lettrés v1 contre-revus indépendamment : aucun blocage.
Six identités, enfant civil, absence Letitia/Zachary, vision subjective en deux cases
muettes, aucune carte/GPS anticipés. Bar vidé avec seul barman distant, sans geste
d'avertissement ajouté. Textes exacts, entiers et attribution nette ; dessins complets
sous les bulles, mains acceptables. V1 retenues. Réserve mineure : le document p03-c01
utilise des groupes de traits très abstraits plutôt que des chiffres reconnaissables ;
le dialogue porte la reconnaissance numérique. Aucune coordonnée réelle inventée.
Le relecteur recommande de conserver sans nouvelle dépense.

Page 3 : 24 813 pixels source modifiés, 22 protections exactes/stables, déterminisme
et arrêt réussis. En pause réelle : +0,8342 s d'ambiance, 3 706 pixels écran > 15,
caméra stable et reprise réussie. Rapports `page-03/effects-qa-v1/` et `live-qa-v1/`.
Page 4 : 33 214 pixels source modifiés, 35 protections exactes/stables, déterminisme
et arrêt réussis. Pause réelle +0,8339 s, 9 669 pixels écran > 15, reprise réussie.
Rapports correspondants sous `page-04/`. Les premiers zooms ont été inspectés par
l'animation : bulles/documents entiers, pas de rectangle lumineux ni déformation.
Tous les serveurs temporaires d'effets sont arrêtés.

Le lecteur de production passe `check-sequence.cjs` sur les quatre pages sélectionnées :
137,12 s, 15 voix, navigation pages/cases, trois jonctions automatiques, pause voix/fond,
ambiance au repos, arrêt et réduction des mouvements, aucune erreur navigateur.
Rapport `art-masters/motion-comics/blue-purple/pages-01-04/navigation-qa-v1/report.json`.

Une anomalie de présentation du lecteur a été observée par le monteur : les libellés
des manifestes v1 pages 2–4 reprenaient les intentions de production, affichées dans
le lecteur et le MP4. L'intégrateur a corrigé dans des manifestes **v2** et une sélection
d'ensemble v2, avec titres narratifs courts. Les manifestes v1 sont conservés ; images,
voix, effets, protections et chronologies sont strictement identiques. Les QA d'effets
restent applicables à ces médias et paramètres inchangés.

Les exports v1 terminés des pages 2–3 sont historiques. Le rendu v1 de page 4 et celui
de l'ensemble ont été interrompus, rapports datés avec raison, sans suppression.
Les exports retenus seront les dossiers `render-v2/`. Aucun appel fournisseur ajouté.

Les quatre exports de production v2 sont terminés et intégralement décodés. La
séquence complète compte 3 291 frames, 15 prises et le fond continu, 17 887 634 octets,
H.264 High/YUV420p 1280 × 720 à 24 i/s, AAC mono 44,1 kHz. Chronologie 137,12 s,
conteneur 137,13 s après arrondi aux frames. Les exports individuels pages 2–4 et
leurs snapshots sont également contrôlés. Synthèse `pages-01-04/export-check-v2.json`.

La contre-revue indépendante des trois captures `final-stills-v2/` est terminée :
page 2 entière et miniature, vision page 3 entière dans son zoom, bar page 4 et bulle
de John entière. Libellés narratifs visibles, aucun défaut nouveau. Le diff v1→v2 a
été relu par le relecteur : seuls version, douze labels et provenance changent.
Le rapport `navigation-qa-v2/report.json` confirme les contrôles réussis sur la
sélection finale : quatre pages, 15 voix, 137,12 s, aucune erreur de page.

Contre-revue finale indépendante favorable : empreintes source, huit fichiers moteur
et tous les médias vérifiés contre les fichiers actuels ; snapshot d'ensemble relu
par `readDocument`, quatre pages/15 prises/24 fichiers locaux. Aucune superposition de
voix ; frontières 38,60 / 77,32 / 103,72 / 137,12 s cohérentes. Rapports et métadonnées
relus, MP4 présent, `completed` et `decoded: true`. Aucune anomalie bloquante ouverte.

Mesure du mix final exécutée par l'intégrateur avec FFmpeg : décodage AAC complet,
moyenne −25,8 dB, crête −1,0 dB. Preuve `pages-01-04/mix-check-v2.json`.
Cette mesure ne vaut ni écoute humaine ni visionnage intégral humain.
Lecteur final conservé actif sur le port 50587 ; serveurs QA temporaires arrêtés.
L'approbation humaine des nouvelles pages reste distincte et non acquise.
