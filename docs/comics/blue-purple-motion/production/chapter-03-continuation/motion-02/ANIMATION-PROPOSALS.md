# Pages 9–21 — propositions de mouvement

8 novembre 2026 — **proposé, pas implémenté par cette revue**. Objectif : rendre les
accents perceptibles et propres à chaque scène, plutôt qu'ajouter un balayage lumineux
à toutes les cases. Les temps indiqués sont des ordres de grandeur à recaler sur les
voix et la lecture ; ils ne demandent pas d'allonger chaque case.

Les treize masters désignés dans `../format-01/FORMAT.json` ont été ouverts réellement,
en entier : `format-01/selected/page-09/page.png`, `page-10/page-final.png`,
`page-11/page-fitted.png` à `page-14/page-fitted.png`, puis `page-15/page.png` à
`page-21/page.png`, sous `art-masters/motion-comics/blue-purple/chapter-03-continuation/`.
Le tableau suit leurs images actuelles, pas le storyboard initial devenu historique.
FORMAT décrit **42 cadres sources** ; les trois sous-bandes de 17-2 et les deux moitiés
de chacun des composites 10-2 et 10-3 sont distinguées ici, soit **46 sous-cases visibles**.
Les mentions gauche/droite décrivent ces vues ; leurs identifiants sources 10-2 et 10-3
restent inchangés.

**S** : candidat simple sur le dessin présent, avec masque/calque local à préparer et
revue dans le moteur ; ce statut ne garantit pas que l'effet existe déjà.
**A** : exige un vrai dessin, fond reconstruit ou élément séparé, à produire avant
animation ; rester sur une tenue fixe si cet asset manque. Les sons sont des intentions,
pas des demandes de génération. Réutiliser les ressources compatibles en priorité.

Dans tous les cas : corps, contacts et anatomie rigides ; bulles et queues composées
en dernier, immobiles et dégagées. Masquer précisément visages, coiffures rigides,
mains, vêtements et objets solides. Ni zoom respiratoire global, ni marche par translation,
ni mouvement de main obtenu en étirant le raster. Les nouveaux assets de machine ou de
lieu doivent conserver les références originales et la géométrie retenue.

| Case | Intention et effet concret | Rythme, limites et assets | Son éventuel |
| --- | --- | --- | --- |
| 09-1 | Installer la rue : pluie oblique et impacts en anneaux dans la flaque libre entre Wendy et Grover. | **S** : flux clairement visible, irrégulier, continu ; masque sol et ciel libre. Borne, voiture et acteurs fixes. | Pluie et ville lointaine. |
| 09-2 | Faire lire le calcul : écran moins lisible au début, réseau existant révélé puis halo du point rose qui se resserre. | **S** : acquisition 0,6–1 s, point tenu ensuite ; quadrilatère exact de la vitre, pas de carte flottante. Main et cadre inchangés. | Deux notes de calcul puis confirmation. |
| 09-3 | Clore la décision : une goutte descend sur le montant de borne à gauche ; l'ambiance de pluie reste en arrière-plan. | **S** : passage unique pendant la réplique, puis tenue. Pas de geste ajouté à Grover sans pose. | Pluie atténuée sous la voix. |
| 10-1 | Donner l'échelle : pluie dense à deux profondeurs et ruissellement/reflets mouvants sur la chaussée. | **S** : flux plus rapide au premier plan, plus fin près de la tour. Voiture, roues et ombre ancrées ; pas de faux trajet. | Pluie, grondement urbain. |
| 10-2 gauche — source 10-2 | Installer Grover et le groupe au bas de la rue : pluie fine dans la profondeur et reflets d'eau entre les silhouettes. | **S** : mouvement continu contenu au décor, sans déplacement des acteurs ni de leurs appuis. Ne pas animer la foule comme un bloc flottant. | Rue et foule distante. |
| 10-2 droite — source 10-2 | Faire sentir la surveillance de l'ascenseur derrière Wendy : témoin rouge d'une caméra, puis reflet sous l'entrée bondée. | **S** : un témoin s'allume une fois et reste stable ; masque propre à cette moitié. Pas de caméra pivotant sans calque ni de foule translatée. | Moteur de cabine et foule étouffée. |
| 10-3 gauche — source 10-3 | Donner le temps à la protection de Grover : tenir sa main sur l'épaule de l'enfant, pluie visible seulement dans le fond libre. | **S** : ambiance lente pendant la réplique ; silhouettes, regards, main et épaule immobiles. Une nouvelle attitude demande une vraie pose. | Pluie atténuée sous les voix. |
| 10-3 droite — source 10-3 | Faire porter l'alerte de Wendy : impulsion brève du témoin de caméra derrière elle, puis tenue menaçante. | **S** : un accent pendant l'avertissement, pas de balayage du visage. Coiffure, bras croisés et caméra rigides. | Petit bruit mécanique lointain, facultatif. |
| 11-1 | Attirer vers l'entrée de service : vapeur basse issue de la grille à droite, éclairage intérieur stable. | **S** : une bouffée de 1–2 s dans le décor libre ; pas de fumée devant le geste de Grover ni déplacement de porte. | Ventilation de l'entrée. |
| 11-2 | Maintenir la barrière : pluie et ronds d'eau dans l'espace vide devant les bottes ; halte visuelle sur la main du gardien. | **S** : ambiance continue moins intense pendant la négociation. Barrière et main fixes ; aucun faux refus articulé. | Pluie, fond du poste. |
| 11-3a | Marquer l'impulsion de John : apparition franche de la case et de sa réplique, puis tenue du geste déjà dessiné. | **S** : accent de montage bref, pas de tremblement du corps ni de poings fabriqués. Pluie localisée dans le fond. | Léger resserrement du fond sonore. |
| 11-3b | Laisser Abigail le raisonner : révéler la réponse après la proposition de John et stabiliser toute la case. | **S** : transition de lecture puis silence visuel pendant le désaccord. Une autre attitude demanderait **A** ; ne pas interpoler les mains entre dessins. | Voix privilégiées, pas de ponctuation spectaculaire. |
| 12-1 | Montrer l'option hôtel : témoin du portillon qui s'éveille et reflet bref sur le sol à droite. | **S** : une montée douce vers un état stable ; aucune porte qui s'ouvre encore ni réservation déjà confirmée. | Ambiance feutrée du hall. |
| 12-2 | Réservation intérieure : lumière cyan de l'implant de Wendy monte, pulse deux fois puis s'apaise. | **S** : 0,8–1,2 s ; masque limité au petit implant et halo proche. Visage, doigts, crâne et comptoir fixes ; aucun écran matériel inventé. | Confirmation électronique intime. |
| 12-3 | Faire sentir la montée : variation douce des reflets verticaux sur les parois métalliques latérales. | **S** : glissement lent dans les panneaux libres, puis arrêt ; pas de plafond/sol déplacés, pas de groupe oscillant. | Moteur sourd puis ralentissement. |
| 13-1 | Signaler le trouble de Franklyn : courte perturbation cyan dans le décor derrière sa tempe, qui disparaît. | **S** : un accent de moins d'une seconde, sans ajout de carte ; masque strict hors peau/doigts/cheveux. Pas de tête qui tremble. | Bourdonnement subjectif bref, puis retour au couloir. |
| 13-2 | Donner un rôle au plan : souligner une seule liaison déjà tracée sous le doigt de Grover. | **S** : tracé de 0,6–1 s puis stabilisation, strictement dans le support. Ne pas déplacer le doigt ni ajouter d'étage. | Frôlement électronique très léger, facultatif. |
| 13-2-detail | Répondre par l'examen d'Abigail : la même liaison termine sa progression dans la moitié droite du plan. | **S** : poursuite cohérente de la case gauche, pas un deuxième balayage autonome. Visage, bras croisés et appareil fixes. | Même ambiance, sans deuxième confirmation. |
| 13-3 | Découvrir la boutique : quelques gouttes descendent sur sa vitre et la lumière chaude du fond reste accueillante. | **S** : mouvement visible dans les fenêtres à droite ; acteurs marchant dessinés tenus, aucun glissement collectif. | Pluie qui s'atténue au raccord intérieur. |
| 14-1 | Faire vivre la boutique : battement lent de l'hologramme cylindrique au fond à droite. | **S** : intensité et fines lignes internes seulement ; vitrine, implants et clients fixes. Une danse réelle des silhouettes exigerait **A**. | Ronronnement des appareils. |
| 14-2 | Distinguer la capsule ancienne : écran bleu qui peine à tenir sa luminosité et petit témoin intermittent dans le pupitre. | **S** : deux défauts brefs irréguliers, puis écran faible. Géométrie de la capsule et couvercle fixes ; pas de démarrage réussi anticipé. | Grésillement électrique discret. |
| 14-3 | Négociation : tenir les acteurs ; un témoin du matériel de comptoir clignote dans le fond. | **S** : un seul détail lent, sans concurrencer le vendeur et Wendy ; aucun dialogue gesticulé fabriqué. | Magasin, ventilation. |
| 15-1 | Préparer la réparation : lampe de service stable et faible lueur instable dans le compartiment ouvert. | **S** : instabilité contenue aux voyants, pas sur les câbles/bras. Abigail et Franklyn restent les deux techniciens, Grover reste avec l'enfant. | Ventilation mourante, petit relais. |
| 15-2 | Rendre le contact décisif : voyant auparavant éteint qui s'allume franchement à la fin du rebranchement. | **S** pour l'état lumineux et la synchronisation ; **A** si l'on veut voir la prise entrer réellement. Ne pas faire glisser les doigts autour du câble. | Clic sec, démarrage bas. |
| 15-3 | Montrer la fermeture annoncée : couvercle ouvert → fermeture → verrouillage, puis tenue. | **A** : couvercle et fond propres, au moins une vraie pose de fermeture avec main raccordée ; ne pas rabattre le couvercle en entraînant le bras rigide. Sans asset, tenir cette image et raccorder franchement à 16-2 fermée. | Charnière, verrou de capsule. |
| 16-1 | Révélation majeure : paysage elfique lisible, rupture numérique localisée, puis carte de Night City subjective et points révélés successivement. | **A** : carte exacte et variantes/calques propres séparés ; fenêtre de 1–2 s avant lecture stable, à recaler comme la révélation de la page 3. Garder la bulle nette ; pas de nouvelle destination inventée ni de projection physique dans la boutique. | Passage organique vers décodage numérique, une confirmation. |
| 16-2 | Faire sentir le travail interne : lueurs cyan/magenta à l'intérieur de la vitre de capsule, puis apaisement. | **S** : masque vitre précis ; intensité sur le reflet, Franklyn derrière la vitre et coque inchangés. Ne pas faire respirer le métal ni déplacer les mains d'Abigail. | Machine qui se stabilise. |
| 16-3 | Laisser Franklyn expliquer : dernière lueur résiduelle sur l'écran visible dans la capsule, qui s'éteint doucement. | **S** : baisse unique, puis silence visuel pendant les informations. Ne pas dessiner une carte visible de tous ni animer l'index sans vraie pose. | Fin de souffle électronique, voix seules. |
| 17-1 | Repérage au loin : vapeur du tuyau bas à droite, pluie derrière la passerelle, puis tenue attentive. | **S** : ambiance qui ralentit perceptiblement avant le tir ; silhouettes des poursuivants fixes. Une patrouille marchant nécessite **A**. | Pas lointains si cohérents avec la scène, pluie. |
| 17-2a — visée | Révéler uniquement la première sous-bande : départ du tir depuis le tireur distant, brève flamme au canon. | **S/A** : zone initialement sans flamme/traçante à reconstruire, masque diagonal exact. Tenue courte avant tir ; ne pas afficher les étincelles de la sous-bande suivante. | Détonation unique. |
| 17-2b — impact | Faire apparaître la deuxième sous-bande : impact franc sur le montant, éclats qui se dispersent puis fumée. | **S/A** : état sans impact propre requis, particules localisées et fond reconstruit. Accent de quelques images puis récupération 0,3–0,6 s ; aucun tremblement de la main de Wendy. | Claquement métal à la même ancre que l'impact. |
| 17-2c — couvert | Faire apparaître la troisième sous-bande avec le groupe déjà baissé, puis la réplique « À couvert ! ». | **S** : vraie pose suivante déjà dessinée, révélation de case franche après impact ; pas de fondu anatomique entre les trois positions. Fumée seulement dans le décor. | Retombées de débris et voix, pas de second tir. |
| 17-3 | Donner l'élan de fuite : pluie et éclaboussures au sol, vapeur qui s'étire dans l'espace libre derrière le groupe. | **S** : accent initial puis flux continu. Corps, tresses, pieds et contacts fixes ; pour courir réellement, **A** avec cycle et fond propres. Pas de glissement du groupe entier. | Départ de course, pluie et souffle du passage. |
| 18-1 | Faire comprendre le contact de John : première case seule pendant l'interpellation, arrêt bref sur le contact déjà dessiné. | **S** : montage, pas de poussée par déformation ; **A** pour ajouter préparation/contact intermédiaire. Préserver main, poitrine, tête et jambages. | Contact sourd non exagéré. |
| 18-after | Révéler la conséquence : deuxième case après le contact ; habitante déjà au sol, intérieur chaud stable. | **S** : changement de dessin existant, sans chute par translation. Pause lisible avant refuge ; ne pas rajouter de sang ni de blessure. | Petit bruit de chute raccordé, puis baisse du couloir. |
| 18-2 | Sentir la mise à l'abri : verrou qui passe à sa position fermée. | **A** : pêne/poignée isolés et fond propre, sans déplacement des doigts. Version **S** : petit témoin existant de porte seulement si visible, sinon tenir le geste fixe et laisser le clic porter la fin. | Clic de verrou sec, couloir filtré. |
| 18-3 | Attendre les poursuivants : un reflet faible traverse une seule fois le sol près de la porte, puis tout se calme. | **S** : masque sol libre, sans ombre humaine inventée dans l'appartement. Les personnes immobiles et Grover près de l'enfant donnent le silence visuel ; aucune respiration du corps par raster. | Pas étouffés qui s'éloignent, silence après. |
| 19-1 | Écouter l'entrebâillement : lumière froide du couloir dans la fente, stable après un très léger changement. | **S** : fente seule, Grover et porte fixes ; **A** si ouvrir davantage avec poignée et ombres raccordées. Ne pas découvrir des poursuivants absents du dessin. | Dernier pas distant, ambiance de pièce. |
| 19-2 | Relâcher partiellement la tension : reflets des parois d'ascenseur plus lents et stables qu'à l'aller. | **S** : variation latérale contenue, pas de groupe déplaçant ses appuis. Finir sur une tenue avant l'extérieur. | Moteur d'ascenseur, arrêt doux. |
| 19-3 | Repartir vers le point vert : pluie sur la rue et eau sous le pneu, lueur verte lointaine qui pulse une fois. | **S** : vert contenu au point existant, sans transformer ce repère en GPS physique expliqué à tous. Porte, voiture et Wendy en cours d'entrée restent fixes ; embarquement réel **A**. | Pluie plus ouverte ; poignée seulement au raccord compatible. |
| 20-1 | Installer le quai au niveau de l'eau : vagues qui longent le bord et écume qui vient lécher le béton. | **S** : boucle lente lisible 2–3 s, masque eau et bord humide. Aucun déplacement du quai ni des jambes, mains Grover/enfant protégées. | Eau lourde, pluie, ambiance portuaire. |
| 20-2 | Faire durer la menace : même mer plus agitée derrière John et le SDF, puis attente immobile sur la prise. | **S** pour eau/écume ; **A** pour action de saisie supplémentaire. Ne pas tirer les bras de John avec le manteau ; John et Grover gardent leurs proportions. | Tissu tendu seulement si raccord, clapot plus présent. |
| 20-3 | Rendre le rejet perceptible : grand impact d'eau, couronne d'écume puis gouttes qui retombent ; tenir le groupe sur le quai. | **S/A** : éclaboussures sur masque eau ; pour voir tomber l'homme puis disparaître, vraie silhouette séparée et fond d'eau sans lui (**A**). Sans ces assets, ne pas le laisser flotter par oscillation : accent sur l'écume puis coupe tenue. | Plouf lourd unique puis retombées d'eau. |
| 21-1 | Découvrir l'abri : bruit mécanique puis joint de porte qui s'éclaire et ouverture réelle. | **A** : panneaux de porte séparés, intérieur révélé et ombres propres ; ne pas inventer un système de commande. Version **S** : tension de lumière très limitée et coupe vers la case ouverte. | Ferrures lourdes, résonance du seuil. |
| 21-2 | Sentir le volume vide : poussières visibles sous un luminaire du plafond et goutte dans une zone libre du sol. | **S** : dérive lente peu dense, un seul foyer perceptible. Ne pas meubler le refuge, ni déplacer les acteurs en posture de marche. | Grande pièce vide, eau éloignée. |
| 21-3 | Finir sur le groupe épuisé : voyant rouge lointain pulse lentement une fois, puis dernier plan presque immobile. | **S** : extinction de l'activité ambiante pendant la dernière réplique ; Grover/l'enfant restent le foyer. Une longue tenue calme est intentionnelle, sans faux cycle de respiration. | Bourdonnement très bas ; musique peut se résoudre après les voix. |

## À retenir pour cette passe

Les meilleurs accents immédiats sont la borne **09-2**, la confirmation d'implant
**12-2**, le contact électrique **15-2**, les trois sous-bandes **17-2a/b/c** et
l'eau du quai **20-1 à 20-3**. La transition subjective **16-1** est le principal
moment spectaculaire, avec la carte exacte en asset séparé. Les vrais mouvements
de couvercle, porte, chute et course restent dépendants de dessins/fonds propres :
les effets de matière ne doivent pas servir à les déclarer déjà animés.

La demande orale situe la transition elfique/carte en « 18 » ; le master inspecté
la place en **16-1**. La page 18 concerne l'appartement : conserver cette correspondance
dans la revue. Les variantes de pose requises n'ont pas été créées dans cette mission.

Pour juger la passe suivante : un court intervalle avant/accent/après pour chaque
révélation, deux phases pour les boucles, vue case et page, et image issue du vrai export.
Valider le mouvement à la vitesse réelle ; un compte de pixels différents ne démontre
pas que l'effet soit perceptible ni qu'il laisse les bulles et les corps intacts.
