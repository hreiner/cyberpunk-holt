# Direction artistique — révision 01 pages 05–08

Production artistique du 5 novembre 2026. Les huit assets retenus sont réellement produits et contre-revus, sans modifier les médias v1 ni les pages1–4. John assomme explicitement le barman, attribution désormais donnée par le propriétaire. Source des prompts initiaux : CONTRACTS.json v3, empreinte666a537fad6f9896eb494f966e5115d06d7af6c4eeeef5e73514cd5a0bb9a545. La réalisation et l'intégrateur ont ensuite précisé les choix de plan statique/onset dans le contrat courant v5 ; ces politiques sont appliquées au montage, sans inventer une pose supplémentaire.

## Huit appels initiaux proposés

Le plafond communiqué par l'intégrateur est global à la révision : **8appels initiaux +4correctifs sur diagnostic,12maximum**, sans confondre ce compteur avec les16appels du lot précédent. L'intégrateur autorise les huit premières soumissions après contre-revue du contrat et de chaque prompt exact et inspection/envoi effectif des références, sans nouvelle demande individuelle de feu vert. Chaque correction exige un défaut constaté et une notification intégrateur. Les cellules alignées proposées ci-dessous sont des dessins opaques de plein cadre : aucun morphing, crossfade de mains ou déformation de raster.

| Appel | Asset concret | Fabrication / mouvement utile |
| --- | --- | --- |
| 1 | `p05-c03-pose-01-preparation.png` | Case carrée entière sans lettres : John argent/buzzcut s'interpose, arme son poing ; barman se tend avec batte basse. Cadrage fixe où les deux corps et mains sont lisibles. |
| 2 | `p05-c03-pose-02-contact.png` | Édition alignée de1 : coup bref de John au barman, une seule main frappante, batte lâchée, aucune blessure graphique. Même fond/caméra/positions des ancrages. |
| 3 | `p05-c03-pose-03-recoil.png` | Édition alignée de1/2 : John retire son bras, barman perd équilibre, batte séparée de sa main commence à tomber. Aucun nouveau coup. |
| 4 | `p05-c03-pose-04-down.png` | Édition alignée de1/2 : barman affaissé inconscient vivant au sol, batte au sol, John après le coup, poing abaissé. État distinct du recul. |
| 5 | `p06-c03-pose-01-seuil.png` | Case large entière sans lettres : les six au seuil de la porte arrière entrouverte, silhouettes séparées. Établissement de la mécanique de porte et des appuis. |
| 6 | `p06-c03-pose-02-franchissement.png` | Édition alignée de5 : porte davantage ouverte, six membres avancent/franchissent, nouveaux appuis des pieds et nouveaux contours des corps. Aucune fermeture supplémentaire de porte prévue. |
| 7 | `p08-c04-cleanplate.png` | Reconstruction du fond entier de la case de départ, voiture/ombres/reflets de voiture retirés. Rue, trottoir et sol complets derrière le véhicule. |
| 8 | `p08-c04-car-rgba.png` | Vrai calque ImageGen avec alpha : même voiture exacte, au même cadrage/ancrage que la case source, sans détail de personnes à reconstruire, vitrage sombre à silhouettes discrètes. Le moteur déplace/réduit ce véhicule rigide sur le fond7. |

Choix coordonné avec animation : capacité `motionLayers` proposée, poses dessinées à des temps narratifs explicites, images opaques pour coup/sortie ; fond + RGBA pour voiture. Les dessins natifs peuvent dépasser les dimensions de la case : ils sont normalisés au même rectangle494×496(p05c03) ou1000×496(p06c03,p08c04). Toutes les variantes d'un même mouvement doivent partager le même rapport, cadrage et caméra, sans recadrage autonome entre poses. Aucun ajout de scène entre ces phases sans contrat narratif.

Ce plan privilégie trois moments réellement animés avec huit sorties distinctes contrôlables. L'intégrateur a approuvé cette architecture quatre punch/deux sortie/deux voiture le5novembre2026 avant tout appel ; les prompts exacts restent à contre-revoir. Les autres bandes sont réemployées, avec nouveau lettrage dans leurs réserves si les dialogues enrichis le permettent. Il ne demande pas de redessiner tout le lot.

## Références et invariants

Chaque appel joint effectivement les références inspectées et le prédécesseur retenu concerné ; sa simple mention ici n'est pas une preuve d'envoi. Les bases sont `pages-01-08/references/cast-six-v1.png`, les bandes retenues pages5–8 et les nouvelles images déjà sélectionnées. John : cheveux argent très courts ; Franklyn : noirs courts hérissés, taches de rousseur, navy/cyan ; Grover : longue mèche noire ; Abigail : deux tresses noires ; Wendy : bleue asymétrique/violette civile sans écusson ; enfant : civil sombre sans écusson. Letitia/Zachary absents. Le barman conserve identité corpulente/tablier/barbe de la sélection.

Le coup de John ne montre ni mort, ni sang, ni blessure inventée. Une seule batte, une seule main frappante, chaque poignet relié à son bras. Aucun double membre sur les poses de contact. Dans la sortie, exactement six membres, aucune fusion de corps/jambes/poignées. Pour voiture, même MPV bleu-gris trois rangées/six places, bonne orientation et géométrie rigide, aucun volant ou conducteur échangé. Pas de nouveau GPS, borne ou conversion.

## Contrôles avant sélection

Revoir d'abord cadrage/contrat, puis chaque dessin natif, toutes les mains et contacts en agrandissement, enfin la succession des poses dans le moteur. Les poses doivent être réellement différentes et immédiatement compréhensibles : préparation→contact→KO ; seuil→franchissement→sortie ; voiture qui s'éloigne sur fond reconstruit. Les effets d'ambiance ne remplacent pas ces actions.

Le contact doit rester lisible pendant une durée courte réglée par animation, sans image fantôme due à un fondu. La poseKO doit tenir assez pour comprendre ce qui s'est passé. Vérifier que la sortie ne se déroule pas avant sa réplique, que la voiture ne révèle pas un trou derrière elle et que les nouveaux dialogues/bulles ne cachent pas les gestes.

Journaux : dossier neuf par appel sous `art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/`, prompt exact et empreintes des entrées avant soumission, copie native et diagnostic après réponse, coûts/ID fournisseur inconnus s'ils ne sont pas exposés. Anciennes tentatives conservées. Les corrections sont proposées uniquement sur défaut constaté puis imputées à la réserve globale avec accord intégrateur.

## Sélection réellement livrée au montage

Les chemins ci-dessous sont relatifs à `art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/`. Ils désignent des copies exactes des natifs retenus, empreintes recoupées avec le journal source dans `ART-SELECTION.json`. Chaque version ayant servi de référence reste conservée ; aucun correctif n'écrase son prédécesseur.

| Asset retenu | Dimensions natives | État et usage |
| --- | --- | --- |
| `p05-c03-pose-01-preparation-v2.png` | 1254×1254 | READY : deux poings John, barman conscient et batte unique ; néon mural remis au même endroit que les autres poses, occulté correctement par profil John. |
| `p05-c03-pose-02-contact.png` | 1254×1254 | CONTACT : John fait un vrai pas et transfère bassin/torse, bras à portée humaine, un poing touche la joue/haut de tête ; batte lâchée. |
| `p05-c03-pose-03-recoil.png` | 1254×1254 | RECOIL : bras retiré, appuis avancés conservés, barman fléchit et batte descend ; aucun second coup. |
| `p05-c03-pose-04-down.png` | 1254×1254 | DOWN : barman assis affaissé, vivant et visage intact visible ; John mains abaissées, batte au sol. |
| `p06-c03-pose-01-seuil-v2.png` | 1781×883 | Six membres groupés près du seuil, jambes/appuis séparés, quatre écussons cadets restaurés sans toucher civils. |
| `p06-c03-pose-02-franchissement-v2.png` | 1774×887 | Six membres ont avancé avec nouveaux appuis réellement dessinés ; même porte plus ouverte, quatre écussons cadets restaurés. |
| `p08-c04-cleanplate.png` | 1782×883 | Rue entière reconstruite sans véhicule, roues, ombre ou ancien reflet rouge de feu. |
| `p08-c04-car-rgba.png` | 1774×887 | Même MPV arrière trois-quarts, vrai RGBA, objet à sa place relative du canevas, sans sol/décor collé. |

Les quatre punchs sont à normaliser vers494×496 ; les quatre assets larges vers1000×496. Les dimensions natives/rapports varient légèrement : utiliser les dimensions exactes ci-dessus et contrôler le raccord une fois normalisé. Aucun recadrage indépendant au visage ou à la main. Les lettres éditables sont réappliquées après les dessins d'action. Le contrat courant v5 prévoit CONTACT pour le dessin statique/bouton arrêt, READY en lecture animée avant onset/overview puis DOWN après coup ; l'intégration possède cette sélection temporelle.

Toutes les images ont été ouvertes par l'artiste, puis indépendamment par qualité à pleine taille et en agrandissement des mains/poignets/contacts/pieds. Les quatre états ne sont pas des déformations d'un raster : nouveaux bras, pas, bassin, recul et affaissement ont été dessinés. Les deux poses de sortie montrent des configurations de jambes et des positions distinctes pour les six. Voir [QA-IMAGES.md](QA-IMAGES.md) pour les empreintes exactes et les limites de cette revue de sources ; le playback, les lettres et les exports ont leurs contrôles séparés.

## Dépenses et corrections exécutées

**11appels sur plafond12 : huit initiaux et trois corrections ciblées, aucun échec/interruption, une réserve non consommée.** Les16appels du lot précédent restent historiques ; total des deux lots à ce stade27. Coûts monétaires et IDs fournisseur non exposés restent inconnus/null, jamais zéro. Les onze prompts, références réellement jointes et natifs ont été rehashés indépendamment par qualité et correspondent aux journaux.

1. Le néon rond se déplaçait d'environ100px entre READY et CONTACT, alors que les trois poses suivantes étaient cohérentes. Correction autorisée par l'intégrateur : seul fond READY, signe déplacé et ancienne position reconstituée, occlusion derrière John ; tous corps/mains préservés et revus. La version initiale reste intacte pour les références d'appel.
2. Les deux dessins de sortie avaient omis les broderies blanches/or des quatre cadets. Deux corrections autorisées : uniquement manches exposées, sans toucher les mains/appuis ni ajouter un écusson à Wendy/enfant. Chaque correction a été revue en détail. Versions nouvelles suffixées-v2, anciennes conservées.

Le calque voiture a été contrôlé techniquement puis sur composités blanc et gris effectivement ouverts :70,4% de pixels alpha0, coins/zone vide transparents, un seul composant alpha>16, bbox`[643,181,1011,596]`. Le corps du véhicule a principalement alpha253/255, environ99,2% opaque ; aucune chaussée, carreau ou halo visible attaché au véhicule. Les pixels alpha inférieurs à8 éloignés sont invisibles sur ces composités et ne justifient pas une génération supplémentaire. Rapports `car-alpha-audit-v2.json` et `car-alpha-previews-v1/report.json` ; les statistiques de transparence ne remplacent pas la revue du mouvement sur le fond.

Les scripts de préparation, extraction de références, audit alpha et sélection sont conservés dans `prompts/` et ont passé ESLint ciblé. Aucun commit/push. Prochaine étape de ce périmètre : montage et revue des vrais mouvements dans le lecteur ; les sources seules ne prouvent pas leur rythme final.
