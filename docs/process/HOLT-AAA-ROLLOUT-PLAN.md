# HOLT — porter la qualité du dortoir dans toute l'école

Plan demandé le 1er octobre 2026, après validation du dortoir intégré. Le correctif
du nom réfléchi est livré séparément : noms au survol/appui, en HTML. Ce document
suit le déploiement autorisé ; le journal ci-dessous précise les zones livrées.

## Référence et périmètre

La référence est le **dortoir intégré validé**, documenté dans la
[revue de fidélité](../art/DORMITORY-AAA-FIDELITY-REVIEW.md), avec le
[pilote autonome](../design/10-DORMITORY-AAA-STUDY.md) pour les détails de matière.
La réussite se juge sur l'architecture, les contacts, la lumière, les matières,
les reflets et le cadrage ensemble. Un changement de textures seul ne suffit pas.

Traiter les **11 pièces/zones de HOLT et ses trois circulations**, une à la fois.
Chaque lieu comprend sa variante `holt-nuit`, y compris bal et fuite lorsqu'ils
le concernent. L'aile seconde génération reste derrière sa porte condamnée ; le
centre d'examen, les conduits et le campement gardent leur planification séparée.
Les personnages, animations et outils de personnages restent hors de ces lots.

Sources : [exploration](../design/08-EXPLORATION.md),
[plan de l'académie](../design/09-MAPS-CHAPTER-1.md),
[composition des pièces](../art/ROOM-COMPOSITION.md), `src/data/maps/holt.ts`,
`holt-nuit.ts` et leurs habillages dans `src/data/exploreVisuals/`.

## Socle à préparer dans le premier lot

Extraire progressivement les composants réutilisables du dortoir : matériaux et
atlas, enveloppe architecturale, profils de lumière, environnement de réflexion,
caméra et traitement d'image. Les assemblages propres au dortoir restent son
profil ; les autres pièces reçoivent une identité distincte. Compléter les
contrats déclaratifs au lieu d'ajouter une branche spéciale dans `ExploreView`
pour chaque salle. Écrire un ADR au prochain numéro libre à l'implémentation,
pour les murs partagés et l'extension des profils au-delà de l'ADR 0036.

**Tous les murs** sont dans le périmètre : quatre côtés de chaque intérieur,
cloisons entre salles, murs des couloirs, retours, angles, faces côté pièce et
côté circulation. Le dortoir détaillé couvre aujourd'hui ses façades nord/est ;
ses côtés ouest/sud et ses seuils demandent donc aussi une finition.

Construire l'enveloppe depuis les cellules de la carte et leurs voisinages :
segments stables, ouvertures connues, une structure commune par séparation,
deux finitions si les pièces voisines diffèrent. Cela évite les murs doublés,
les surfaces coplanaires et les raccords impossibles. Les jonctions à deux
rangées de mur, cour/cantine → entraînement à `y=31/32`, doivent produire un
passage continu et un seul seuil visuellement cohérent.

Prévoir de vraies baies découpées avec tableaux, appuis, menuiserie et vitrage.
Une fenêtre extérieure ne donne sur les Badlands que si la façade est extérieure ;
une baie intérieure donne sur la cour ou la pièce voisine. Les salles aveugles
reçoivent des éclairages locaux, sans fausse fenêtre ni soleil traversant un mur.

Créer une famille de **portes HOLT** : acier peint pétrole, panneaux techniques,
chambranle, seuil, joints, poignée/lecteur et signalétique française. Déclinaisons
résidentielle, administrative, médicale, blindée et garage ; mêmes proportions
et vocabulaire industriel. Les cellules `+` sans entité restent des passages
ouverts avec cadre et battant ouvert, sans nouvelle interaction. Les portes
interactives suivent leur état réel ouvert/fermé/verrouillé ; aucune serrure
visuelle ne crée de condition de jeu. Inclure la grille nocturne du dortoir et
les deux accès condamnés, directeur et seconde génération.

Correction demandée pendant H15 : façades extérieures et sur cour à 4,9 m,
cloisons communes à 2,45 m dès le départ, sans bascule liée à la salle occupée.
La caméra est plus haute et plonge à environ 40°. Les façades suivent une coupe
stable par orientation ; une cloison ne s'abaisse à 0,4 m que si elle masque
réellement le meneur. Habillages, fenêtres, accessoires et parties hautes des
portes suivent leur mur. Aucun plafond ou équipement suspendu ne masque les
occupants. La découverte cache émissions, faisceaux, contacts et contenus dans
les reflets ; l'enveloppe architecturale est finie dès l'arrivée sur la carte.

## Ordre de production

Une seule zone en production à la fois. Terminer son enveloppe, ses seuils et son
rendu avant la suivante. Les interfaces avec une zone encore ancienne doivent
rester propres ; ses murs partagés ne sont pas construits une deuxième fois.

| Lot | Lieu | Résultat visuel attendu |
| --- | --- | --- |
| H0 | Référence | Conserver les captures validées, relever les réglages et établir l'inventaire des murs, ouvertures et portes. |
| H1 | Dortoir — finitions et socle | Finir ouest/sud, cloisons et trois accès ; porte résidentielle et grille nocturne. Préserver le rendu validé nord/est. Extraire les contrats communs à partir de ce cas réel. |
| H2 | Couloir de ceinture | Parois continues des deux côtés, angles et liaisons nord/milieu, seuils vers dortoir/cour/entraînement. Lumière de circulation, peinture institutionnelle, aucun encombrement au sol. |
| H3 | Cantine | Salle lumineuse, vraies baies, sol entretenu aux reflets contenus, mobilier et comptoir détaillés. Traiter les quatre murs et les accès dortoir, cour et entraînement. |
| H4 | Cour intérieure | Façades des pièces voisines, baies côté cour et seuils, bassin, arbre et végétation. Reflet de l'eau local, matériaux extérieurs ; cour ouverte et soleil cohérent. |
| H5 | Salles d'entraînement | Volume et parois sur toute la largeur, agrès/pupitres, sol marqué et lumière lisible. Accès cour/cantine continus, ceinture et garage ; variante bal puis fuite avec piste libre. |
| H6 | Garage | Béton, métal, outillage, véhicules existants mieux intégrés, porte/baie industrielle. Garder le fourgon et la seule sortie du parcours parfaitement accessibles. |
| H7 | Couloir est de la colonne | Murs des deux côtés et cinq portes de service, traversée de l'administration, raccords vers ceinture. Éclairage régulier et cadres partagés prêts pour chaque salle. |
| H8 | Administration | Guichet, bancs, dossiers, finitions institutionnelles plus soignées. Quatre murs, deux traversées latérales et porte fermée du directeur. |
| H9 | Interface | Cloisons techniques, postes de netrun, écrans et câbles muraux, lumière froide localisée. Terminal narratif mis en valeur ; salle aveugle si le plan l'impose. |
| H10 | Infirmerie & labo | Peinture claire, lits médicaux, inox/verre, paillasse et pharmacie. Contacts propres, lumière clinique ; porte médicale et parois intérieures complètes. |
| H11 | Armurerie | Parois renforcées, porte blindée, râteliers, caisses et armoire sécurisée. Métaux lisibles, reflets plus mats ; allée et ancre de John conservées. |
| H12 | Archives & serveurs | Deux familles de rangement, baies techniques, portes de maintenance et panneaux muraux. Émissions d'écrans mesurées ; allée centrale et place de Letitia libres. |
| H13 | Local technique & énergie | Transformateurs, établi et réseaux muraux crédibles, métal usé, lumière de service. Toutes les parois et porte technique ; retirer les éléments de plafond qui gênent la vue. |
| H14 | Couloir ouest | Terminer l'enveloppe ouest, la traversée administrative et la porte condamnée seconde génération. Même qualité de parois/éclairage que les autres circulations. |
| H15 | Revue de l'école | Raccords entre zones, vues larges, quatre angles, seuils jour/nuit et parcours des deux chapitres. Corriger les écarts visibles et mesurer le coût cumulé. |

Statut final au 2 octobre 2026 : H0–H15 livrés. Le journal conserve les validations intermédiaires et la reprise finale.
Tenir ici un suivi bref par lot : livré, preuve visuelle, mesures, écart restant.
Réévaluer l'effort après H3, premier intérieur d'une autre fonction entièrement
converti. Les estimations historiques du rollout ne sont pas des durées de séance.

### Suivi d'exécution

- **H0 livré** : référence conservée ; murs et seuils lus dans la carte réelle.
- **H1 livré** : enveloppe ouest/sud et trois portes, remplacement des anciens
  blocs, coupe par tronçon et état des portes réels. Les façades nord/est gardent
  leur rendu validé. [Vue opposée](../art/reviews/holt-rollout/h1-dormitory-interior.jpg).
  Quatre orientations jour/nuit revues sans erreur de page ; `npm run verify`
  passe. Le test global vérifie les passages de jour/nuit et les séparations
  uniques ; le test de ressources couvre états mutables et destruction répétée.
  Mesure de cadence cumulée prévue H3/H5/H15 ; les compteurs H1 seuls ne prouvent
  pas la réserve GPU. Décision du socle : [ADR 0037](adr/0037-enveloppe-et-profils-visuels-holt.md).
- **H2 livré** : couloir de ceinture, deux parois et retours, panneaux et
  luminaires muraux, sol mat, perspective commune. Une pool de lumière suit la
  zone occupée ; les finitions restent visibles selon découverte. Quatre vues
  de jour et deux de nuit sans erreur ; `npm run verify` passe (753 tests).
  [Vue du couloir](../art/reviews/holt-rollout/h2-belt-corridor.jpg).
  La revue a révélé une superposition au sommet des couvre-murs : leur hauteur
  est corrigée dans le socle avant H3.
- **H3 livré** : cantine, quatre parois, trois fenêtres étroites réellement
  découpées à l'est, comptoir inox, tables et vaisselle, joints et sol ciré.
  La réflexion unique est réaffectée à la pièce occupée. Suspensions supprimées.
  [Vue de la cantine](../art/reviews/holt-rollout/h3-canteen.jpg).
  Quatre vues de jour et deux de nuit sans erreur ; `npm run verify` passe.
  Mesure courte 1080p, DPR 1, GTX 1070 : p95 16,8 ms jour/nuit, p99 33,3 ms
  de jour. La réserve constatée permet de poursuivre, sans prédire le coût final.
  Le comptoir utilise encore un panneau inox opaque, cohérent avec le self.
- **H4 livré** : cour, quatre fenêtres partagées masquées jusqu'à la découverte
  du voisin, dalle rugueuse, seuils, jardinières, arbre et bassin ouvert.
  [Vue de la cour](../art/reviews/holt-rollout/h4-courtyard.jpg).
  Revue jour/nuit sans erreur ; bassin et densité du feuillage corrigés après
  revue. Texture alpha réemployée, 308 Ko : [asset et prompt](../art/HOLT-AAA-ASSETS.md).
  `npm run verify` passe, y compris portes hors étape et emprises végétales.
  La perspective reste désormais continue sur HOLT, seuils inclus.
- **H5 livré** : salle d'entraînement, quatre façades et baies est, pupitres et
  agrès détaillés ; marquage plat et sol satiné. Les deux rangées de mur à
  l'entrée sont raccordées par un seuil et des jambages continus. Les portes
  reprennent des finitions résidentielle, institutionnelle, médicale, blindée,
  maintenance et garage, sur leurs deux faces. Au bal, les guirlandes longent
  les parois et la piste reste libre ; la fuite conserve son éclairage d'alerte.
  [Vue du bal](../art/reviews/holt-rollout/h5-training-ball.jpg).
  Revue jour/bal/fuite sans erreur, `npm run verify` passe (753 tests).
  Mesure courte 1080p DPR 1, GTX 1070 : p95 16,8 ms de jour, 33,3 ms à la fuite.
  Les huit parcours e2e existants d'exploration/chapitre 2 passent, dont les deux
  chapitres complets et les interactions au clic.
- **H6 livré** : garage, trois baies extérieures, façades en tôle, établi dédié,
  marquages de stationnement et allée dégagée. L'unique accès et le fourgon
  interactif restent en place ; éclairages et gaine suspendus retirés.
  [Vue du garage](../art/reviews/holt-rollout/h6-garage.jpg).
  Deux angles sans erreur ; `npm run verify` passe (753 tests).
- **H7 livré** : couloir est, retours et huit seuils (six vers les salles, deux
  vers la ceinture), appliques et plaques au-dessus des ouvertures.
  [Vue du couloir](../art/reviews/holt-rollout/h7-east-corridor.jpg).
  La revue a corrigé les plaques absentes sur `+` et la coupe simultanée de
  deux faces d'une cloison dans un couloir connecté. La région visuelle occupée
  gouverne maintenant la coupe et les changements de région la recalculent.
  Deux angles sans erreur ; `npm run verify` passe (753 tests).
- **H8 livré** : administration, baies nord et porte du directeur conservée,
  guichet détaillé, sol satiné, accueil et direction signalés. Deux angles
  revus sans erreur ; `npm run verify` passe. Le recentrage en perspective
  vise désormais la pièce demandée, sans la déporter pour cadrer tout le bâtiment.
  [Vue de l'accueil](../art/reviews/holt-rollout/h8-administration.jpg).
- **H9 livré** : interface aveugle, cloisons et sol de service mats, six écrans
  sur trois postes, sièges et périphériques intégrés, terminal narratif distinct
  et câbles contre les murs. [Vue de l'interface](../art/reviews/holt-rollout/h9-interface.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests, dont la coupe
  des couloirs connectés et le recentrage aux bords de carte).
- **H10 livré** : infirmerie, soubassements clairs, lits avec rails et potences,
  rangement médical et paillasse dédiés, porte signalée, éclairage froid et sol
  satiné. [Vue de l'infirmerie](../art/reviews/holt-rollout/h10-infirmary.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests).
- **H11 livré** : armurerie aveugle, porte blindée, trois râteliers détaillés,
  caisses à mousse et armoire sécurisée ; allée et ancre de John conservées.
  [Vue de l'armurerie](../art/reviews/holt-rollout/h11-armory.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests).
  Toutes pièces découvertes, 1080p/DPR 1/GTX 1070 : p95 33,4 ms, p99 50 ms
  sur 180 images en vue rapprochée. La marge cumulée demande une revue à H15.
- **H12 livré** : archives et serveurs, modules et ventilation détaillés au nord,
  dossiers et boîtes au sud, signalétique murale et allée dégagée.
  [Vue des archives](../art/reviews/holt-rollout/h12-archives.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests).
- **H13 livré** : local technique, transformateurs et établi détaillés, vraie
  baie sud, chemins de câble muraux coupés avec les parois ; éléments suspendus
  retirés et grille d'écoute conservée. Sol mat sans reflet planaire.
  [Vue du local technique](../art/reviews/holt-rollout/h13-maintenance.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests).
- **H14 livré** : couloir ouest, trois baies réelles, murs et sol de circulation,
  passage administratif et porte condamnée blindée signalée.
  [Vue du couloir ouest](../art/reviews/holt-rollout/h14-west-corridor.jpg).
  Deux angles sans erreur ; `npm run verify` passe (755 tests), avec contrôle
  de toutes les faces des profils livrés et des quatorze zones.
- **H15 livré le 2 octobre 2026** : enveloppe complète des onze pièces et trois
  circulations, raccords fermés, plan canonique commun aux murs et accessoires.
  Les façades du pilote rejoignent les retours ; les couvre-murs continuent sur
  les ouvertures. Cloisons intérieures finies à 2,45 m dès le départ, façades à
  4,9 m ; leur coupe ne dépend plus de la salle occupée. Perspective relevée à
  environ 40°, sans bascule aux seuils. Le miroir décroît au dézoom ; armurerie
  et archives restent mates. Les captures et choix antérieurs de coupe H7/H9
  sont remplacés par cette reprise globale.
  [Revue finale, preuves et mesures](../art/HOLT-AAA-ROLLOUT-REVIEW.md).
  `npm run verify` passe (760 tests, 51 fichiers), ainsi que les huit parcours
  e2e exploration/chapitre 2. Quarante-deux visites jour/bal/fuite et trois cycles
  entre cartes sans erreur ni croissance de ressources après échauffement.
  GTX 1070, 1080p, toutes pièces découvertes : p95 33,4 ms (environ 30 ips)
  dans les vues normales et larges relevées, jour/fuite, DPR 1 ; contrôle DPR 1,5
  sur la cantine également à 33,4 ms. Ces relevés courts ne sont pas extrapolés
  aux autres cartes ni à chaque instant d'une partie complète.

## Boucle commune à chaque zone

1. Lire son plan, ses ouvertures et sa composition ; écrire un brief court avec
   l'ancre narrative, les matériaux, la source de lumière et ses portes.
2. Produire dans l'ordre : enveloppe complète et accès → sol/matières → mobilier
   et contacts → lumière/reflets → cadrage. Réutiliser le kit et les textures.
3. Vérifier par les données la découverte, les collisions et les états des portes.
   Ajouter un test global utile pour les murs/ouvertures du socle, sans multiplier
   les tests identiques par salle. `npm run verify` à la sortie du lot.
4. Faire une seule revue visuelle regroupée : cadrage principal et angle opposé,
   plus nuit lorsque nécessaire. Vérifier les deux autres rotations par les
   contrôles ; ajouter une capture seulement si elles montrent un problème.
5. Corriger les écarts puis consigner le résultat avant de démarrer la zone suivante.
   Présenter le jalon dans le fil sans imposer une confirmation pour chaque salle.

## Rendu et budget

Cible demandée : **30 ips**, p95 ≤ 33,3 ms à 1080p sur GTX 1070, DPR effectif
consigné et personnages présents. Les mesures du dortoir ne garantissent pas
celles de l'école entièrement convertie. Mesurer H3, H5 et H15 en vue normale
et large ; faire un relevé court par autre zone seulement si son coût change.

Mutualiser le compositeur et l'environnement au niveau de la session. Une seule
conversion de couleur et un seul tone mapping. Adapter le cadrage perspective
par profil, garder rotation/zoom/panoramique ; éviter les bascules brusques aux
seuils. Rayons de survol/clic et projections HTML utilisent la caméra rendue.

Limiter les ombres coûteuses à l'éclairage pertinent de la zone active. Mutualiser
le budget des lumières ; aucune addition automatique des cinq spots du dortoir
dans chaque pièce. Garder au plus **une réflexion planaire active**, réaffectée
à la surface pertinente et plafonnée en résolution ; autres surfaces via matières
et environnement. Un sol médical, une armurerie et un jardin n'ont pas besoin
du même niveau de brillance. Dézoom, découverte et coupe gouvernent les effets.

Regrouper les objets statiques par pièce/étape et préserver les cibles interactives.
Vérifier resize et plusieurs cycles HOLT → centre → HOLT-nuit à H15 : compteurs
stables après chargement, ressources possédées/libérées explicitement, console
sans erreur. Réutiliser les parcours e2e complets existants à H5 et H15, plutôt
que créer un scénario par porte.

## Conduite agentique et économie de tokens

L'orchestrateur possède l'intégration, la revue visuelle et les fichiers partagés.
Un agent **GPT-6 Luna** peut produire le lot courant à partir d'un brief borné,
avec propriété explicite de ses fichiers. Séquencer les écritures communes ;
ne pas lancer plusieurs agents pour refaire le même moteur de murs ou la même
session. Aucun travail sur les personnages et aucun commit autonome.

Donner à chaque agent le contrat commun, la fiche de la zone et les seules
références utiles, sans transmettre toute l'histoire des itérations. Privilégier
la lecture des données et des résultats chiffrés ; conserver les captures en JPEG
et les brouillons dans `.dream-loop/`. Les preuves retenues vont dans `docs/art/`.

Les références existantes et le dortoir suffisent pour commencer. La génération
d'images est autorisée si une identité de pièce manque : une image ciblée par
famille visuelle, réemployée ensuite. Utiliser Dream Loop lorsque la comparaison
au rendu réel aide à résoudre un écart précis, après lecture de son skill ; aucun
nouveau cycle systématique de génération pour chaque salle.
