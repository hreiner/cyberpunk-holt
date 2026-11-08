# Storyboard — pages 05 à 08, révision 01

5 novembre 2026. Contrats narratifs [CONTRACTS.json](CONTRACTS.json), version 5, révision éditoriale 1. Prêts pour contre-revue avant dépenses ; aucun nouveau média produit par la réalisation.

Le retour utilisateur demande davantage de contenu, de voix, de musique et de bruitages, des mouvements d’action réels et un rythme plus vif. Il tranche explicitement l’action auparavant collective : **John assomme le barman**. Les fichiers précédents restent conservés ; pages 1–4 et leurs médias/chronologie sont intacts.

## Découpage et jeu

Les quatorze cases conservent leurs IDs, cadres et trois bandes par page. Aucun nouveau plan ne gonfle le budget.

| Page | Action et dialogue | Mouvement réel attendu |
| --- | --- | --- |
| 5 | John sent le piège ; Wendy éloigne des fenêtres. John somme le barman de poser la batte **avant** de le frapper ; Grover l’arrête après un seul coup. Le tir ouvre la dernière case sur vitre déjà brisée ; Franklyn et Abigail réagissent ensuite. | Quatre états dessinés : préparation, contact, recul/chute, KO vivant. Contact et SFX après sommation. Coupe sonore tir/bris vers dessin déjà brisé, éclats ponctuels, sans variante intacte promise. |
| 6 | John veut suivre le fuyard ; Wendy refuse et explique les caméras. Abigail vérifie le groupe et Grover confirme les six. | Fuyard statique en pose de fuite avec pas décroissants ; deux vrais états des six au seuil puis franchissant la sortie, porte reste ouverte. |
| 7 | Wendy laisse les quatre en retrait ; John objecte qu’ils n’ont pas les clés. Bluff Wendy/Franklyn, puis elle lui confie le volant et il doute. | Grille déjà ouverte/accord lisible dans le dessin, clic loquet et coupe vers intérieur ; aucun geste de gardien mobile promis. |
| 8 | Serrure forcée. Moteur hésitant, Franklyn s’énerve, Wendy guide. Question sincère de l’enfant, « Monte ». Une fois parti, il demande timidement de ralentir. | Serrure/volant/embarquement statiques, récit par voix/SFX et raccord portière ; vraie voiture séparée du décor qui prend la perspective. |

La dernière réplique de l’enfant apporte une petite gêne de conduite, pas un gag triomphant. Sa bulle p08-c04 est une voix intérieure **sans queue**, fixe pendant que voiture se déplace : aucun trait ne reste accroché à son ancienne position. Franklyn aide le groupe malgré Letitia et la vision, sans guérison émotionnelle soudaine. Aucun rire imposé. Aucune poursuite automobile, borne, carte GPS, blessure sanglante ou mort nouvelle. Barman KO **vivant**, sans série de coups, visage intact, signe de respiration discret dans l’état final.

Wendy a rangé le papier ; elle reste civile sans écusson. Les quatre cadets sont Franklyn, John, Abigail et Grover ; l’enfant reste anonyme et civil. Voiture six places, Franklyn conducteur gauche, Wendy avant droite, les quatre autres derrière.

## Voix, bulles et rythme

22 lignes au total : huit prises Eleven v4 existantes bp-l016 à bp-l023 strictement réemployées, quatorze nouvelles bp-l024 à bp-l037. Tous les textes exacts FR, EN et EN annoté figurent dans les cues. Aucun nouveau casting barman/gardien ni aucun tag de souffle. La diction alterne sommation, urgence, réserve, défi de bluff, guidage calme et question timide.

Les bulles FR sont éditables, deux maximum par case ; les propositions de rectangles restent ajustables aux dessins retenus sans cacher les mains, regards ou action. p05-c01 et p06-c01 : John parle hors champ intérieur, la queue ne vise pas un autre personnage. p07-c01 : son objection vient du retrait de ruelle, hors cadre et hors vue des gardiens.

Arbitrage final de rythme : **82 s** pour les nouvelles pages, **226,60 s** au complet avec les144,60s conservées des pages1–4. Voix mesurées42,64s, soit52% du lot. Vues d’entrée0,7s, transitions0,3s, gaps0,1s, sorties0,5s. Holds p5=[4,4,6,4.5], p6=[3,8,5.5], p7=[6,6.5,5.5], p8=[2.5,6.5,6,5] :73s +9s raccords =82s. Les anciennes chronologies100/96s restent des preuves d’essai, avec3–6s de vide relevées après les voix ; les22bulles courtes gardent un temps de lecture confortable. Une scène gagne du rythme par action et décisions, pas par accélération de la voix ni par bulle illisible. Les temps mesurés et la lecture FR priment.

La sommation bp-l025 finit avant le contact (marge0,12s) ; contact0,12s puis recul0,32s et KO. Gap25 de0,75s réserve le geste avant réaction26, au moins0,35s après contact. Master statique CONTACT choisi pour action lisible quand animations désactivées ; en mode animé, overlay READY lors entrée/overview puis DOWN après geste, sans fondu inventant une pose. Preuve du recalage v4 : p05-c03 tenue minimale10→6s pour retirer4s vides ; la chronologie96s et ses positions absolues sont archivées dans CONTRACTS-v4.json. La version5 recalcule les positions absolues sur82s, en gardant onsets relatifs du coup, gestes et voix inchangés. Aucun mot ni voix modifié. Le calque de lettres ne saute pas avec les variantes. Ces règles sont explicites dans cuePhaseAnchors/actionTiming et doivent être implémentées, testées et revues.

## Son et action

Chaque case possède soundCues : frottement vêtement, un impact mat, batte bois au sol, affaissement, un tir dehors, verre, pas, porte arrière, grille, serrure, portière, démarreur, moteur et départ sur chaussée mouillée. Réemploi HOLT prioritaire ; synthèse locale déterministe si un élément manque, aucun service payant supplémentaire. Sous-mixage systématique pendant parole, pas saturation tir/verre.

Musique : pression bar/sortie puis suspense de bluff et impulsion de départ, avec raccord bref et enveloppes sous voix. Pas un fond indifférent identique sous toute l’action. Trois moments physiques sont réellement reconstruits : coup John, franchissement de sortie arrière et départ de voiture. Ailleurs, les dessins statiques sont assumés ; cadence, voix, SFX et pluie/vapeur/néon animent la lecture sans annoncer des gestes absents. Aucun balayage lumineux systématique.

Le punch demande de vrais dessins d’états et un fond propre ; aucune torsion du raster pour inventer le bras. Architecture exacte huit appels initiaux : quatre états punch, deux états sortie ouverte/seuil→franchissement (pas de fermeture), cleanplate rue, calque voiture RGBA. Quatre appels réservés aux corrections observées, plafondImageGen12. Aucun cycle de fuite, grille, volant, portière ou embarquement animé supplémentaire hors budget. Voix : historique2856, plafondcumulé4800, nouvelle première passe annotée≤1400 et réserve bornée. Décompter tags/échecs/reprises, aucun compteur à zéro.

## Contrôle avant sélection

Contre-revoir ce contrat exact avant voix/images. Contrôler tous les doigts, poignets, contacts, têtes et corps dans **chaque variante**, le raccord de John argent, le barman vivant, les six du groupe, les manches civiles de Wendy et le conducteur. Conserver les corrections acquises de la livraison précédente.

Puis vérifier les trois vrais mouvements et ordre des événements en phases avant/pendant/après, pause, seek, arrêt, réduction des mouvements et synchronisme du son ; mêmes fonctions de temps lecteur/MP4. Le warning de Wendy bp-l016 en p05-c02 précède toujours le tir et le coup John p05-c03 a déjà eu lieu ; aucun tir pendant overview/ambiance. Le tir ouvre p05-c04 sur dessin déjà brisé, les deux voix réagissent ensuite ; ce choix évite un état vitre intacte non produit. Les autres raccords grille/portière/embarquement sont des ellipses sonores et de cadrage, pas des gestes dessinés annoncés. Une variation de pixels ou de vapeur ne vaut pas preuve du coup ou du déplacement de voiture.

## État et propriété

La réalisation possède seulement les deux présents fichiers. Aucune génération ou dépense effectuée ici. Le scénario source doit recevoir l’arbitrage John par l’intégrateur, hors présent périmètre. La livraison et ses anciennes preuves sont des instantanés conservés, pas l’état de cette révision en cours. CONTRACTS-v4.json conserve exactement le contrat précédent avant l’arbitrage final82s. Après contre-revue v5, aucun nouvel aller-retour de timing hors défaut concret.
