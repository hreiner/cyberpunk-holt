# Revue de fabrication — pages 05–08

5 novembre 2026. Cette revue porte sur les fichiers réellement produits. Les six exports
ont passé le décodage intégral et l'audit indépendant.

## Récit et génération

Les contrats v1 (SHA256 `f51a768e90745bedf5b169cc39bdec00b3fd7070b6eba9dd7602ae0b36eb2180`)
ont reçu une contre-revue avant dépenses. Quatorze cases, huit lignes `bp-l016`–`bp-l023`.
Le groupe maîtrise le barman avant le tir, sort par l'arrière, bluffe au parking et
récupère les quatre autres avant le départ. Aucun tir attribué à Wendy, aucune blessure,
conversion de coordonnées, carte GPS ou poursuite automobile ajoutés. Voiture à six
places et Franklyn conducteur explicitement déclarés comme détails d'adaptation.

Douze bandes et quatre corrections ciblées ont été produites par ImageGen intégré :
**16/16 appels**, sans échec ni reprise interrompue. `IMAGE-SPEND.json` recoupe les
seize journaux, sorties et empreintes de toutes les références effectivement jointes.
Coût monétaire et identifiants fournisseur inconnus. Les tentatives rejetées restent
conservées avec leur diagnostic, sans écraser les sorties précédentes.

## Inspection visuelle renforcée

Le rôle qualité a examiné chaque bande brute en plein format puis les mains, poignets
et contacts critiques en agrandissement. L'intégrateur a également ouvert les douze
bandes retenues et les quatre pages lettrées ; il a contrôlé séparément la main-papier
et la main-batte du premier dessin en agrandissement.

Défauts réellement trouvés puis corrigés et contre-revus : six doigts sur une paume
du barman ; écusson HOLT indu sur Wendy ; écusson indu sur un gardien ; dans la
récupération du groupe, conducteur inversé, bulles raster et main isolée au montant.
Ces erreurs ne sont pas cachées par le lettrage ou les effets. `QA-IMAGES.md` donne
les fichiers exacts, SHA256, détails d'occultation anatomique et réserves levées.

Les pages 5–7 utilisent `page-v1.png`, la page 8 `page-v2.png`. Cette seconde version
de lettrage remplace des queues croisées, sans nouvelle dépense d'image. Les sources
SVG, calques de bulles et géométries JSON restent éditables. Les textes sont comparés
exactement aux contrats ; les queues sont adaptées aux locuteurs réellement dessinés.

## Voix

Huit prises anglaises `eleven_v4`, casting conservé, stabilité 0,5 et similarité 0,8.
Texte annoté contre-revu : 440 caractères, aucun tag automatique de respiration.
Historique 2 416 + nouvelle passe 440 = **2 856/3 200 caractères**, réserve 344 intacte.
Aucun échec ni reprise. Modèle/casting/textes et décodage des huit sources recoupés
indépendamment. Deux copies WAV reçoivent uniquement +10 dB de gain constant ;
sources intactes, durées et empreintes documentées dans AUDIO.md.

Aucune écoute humaine des prises ou du mix n'est revendiquée. Les contrôles techniques
ne certifient ni prononciation ni appréciation du jeu ; l'audition préparée est conservée.

## Animations

Le moteur ajoute vapeur directionnelle, éclats et ondes, avec horloge narrative et fin
exclusive pour les événements physiques. Pause fige l'événement, tout en laissant
l'ambiance indépendante. `softEdge: true` borne les nouveaux halos par une ellipse
douce ; son absence conserve le chemin de rendu historique des pages 1–4.

Les premières captures ont révélé un halo rectangulaire en L et une bande violette
sous la batte. Le halo a été resserré sur le tube avec bords doux ; la bande a été
retirée et remplacée par de minuscules poussières neutres. Une chute de poussière trop
masquée a été déplacée sur le sol libre. Ces corrections sont locales et sans génération.

Pages 5–7 : dix cadrages revus sur paires A/B, protections pixel exactes, déterminisme,
arrêt et pause/reprise vérifiés. Éclats avant/pendant/après contrôlés, avec zéro pixel
ajouté par l'événement avant/après et événement figé en pause. La vapeur de sortie est la plus discrète,
mais visible au zoom ; cette limite est conservée dans QA-ANIMATION.md.

Les quatre animations de page 8 ont ensuite reçu leur contre-revue favorable sur les
huit phases et trois triptyques. Quatorze cases nouvelles revues au total, huit familles
d'effets, aucun `lightSweep`. Les 88 protections nouvelles sont identiques au master.
Reflet de serrure très fin, modulation ponctuelle du voyant déjà allumé et vapeurs
discrètes sont décrits selon leur rendu réel, sans promettre de geste de personnage.

## Sélection, lecteur et exports

Sélection finale : `anime/motion-comics/projects/blue-purple-pages01-08-v1.json`,
**248,50 s**, huit pages, 30 cases, 23 prises, 49 effets et 206 protections.
Le lot nouveau fait 103,90 s. `delivery-audit-v1.json` dans les masters confirme
25 fichiers de la sélection 1–4 inchangés, les 23 prises entièrement décodées et aucun
chevauchement vocal. `QA-FINAL.md` recoupe indépendamment candidats, sélection,
empreintes et frontières temporelles.

Le lecteur final port 50588 a passé `check-sequence.cjs` : huit pages, navigation
page/case et changements automatiques, voix et musique stoppées en pause, récit figé,
ambiance indépendante, arrêt des effets, réduction des mouvements et aucune erreur.
Preuve : `pages-01-08/qa-sequence-final-v1/report.json`.

Les six dossiers `render-v1` (pages 5, 6, 7, 8, lot 5–8, complet 1–8) sont `completed`.
Snapshots rejouables, médias/moteur/source SHA256 inchangés, H.264 High/YUV420p,
1280 × 720 à 24 i/s et AAC LC mono 44,1 kHz. Tous ont subi deux décodages complets,
celui du renderer et celui de l'audit indépendant. `export-check-v1.json` rassemble
les résultats ; `mix-check-v1.json` mesure les six mixes, sans saturation. Complet :
38 098 000 octets, 248,50 s, moyenne −27,0 dB et crête −1,7 dB.

Cinq images du lot encodé ont été extraites puis ouvertes par l'intégrateur : main du
barman, six membres en ruelle, conducteur, récupération et départ. Trois images du
complet contrôlent en plus le raccord 4→5 et la récupération avec compteur 8/8.
Temps, fichiers et empreintes d'entrée sont dans `encoded-stills-v1/`. Aucun nouveau
défaut visible observé ; ces images ne constituent pas une écoute ou un visionnage
humain intégral du film.

## Vérification du dépôt

`npm run verify` a réussi après ajout du contexte Node ciblé pour les nouveaux outils
de production sous docs. `npm run workflow:check` a réussi. Les premiers ajouts d'effets
ont passé 18 tests ; l'ajout des bords doux est couvert par un dix-neuvième test.
Sur l'état final gelé, `npm run verify`, `npm run workflow:check` et les **19 tests**
du socle ont de nouveau réussi. Les liens documentaires sont revérifiés après ajout
de la livraison. Aucun commit ou push effectué.
