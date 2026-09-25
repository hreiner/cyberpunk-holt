# Orchestration — pilote visuel des dortoirs

**Statut : mandat prêt à exécuter.** Le propriétaire veut éprouver jusqu'où le rendu actuel
peut aller vers une qualité **AA stylisée**, sans achat de licence. Il juge les personnages
actuels peu réussis et les décors encore trop proches de placeholders. La première preuve
sera **un dortoir autonome et jouable, avec Franklyn qui s'y déplace**, avant toute décision
de généralisation ou de changement de moteur. Aucun contexte de conversation n'est requis
pour exécuter ce document.

## 1. Consigne au nouvel agent

Implémente le pilote décrit ici de bout en bout. Lis d'abord [`AGENTS.md`](../../AGENTS.md)
et [`docs/INDEX.md`](../INDEX.md), puis les sources indiquées ci-dessous. Prends les
décisions de réalisation ordinaires, produis les assets et la scène **réellement jouable**,
observe le rendu en mouvement et rapporte les preuves. Une proposition de plan, une image
cible ou un nouveau pipeline d'assets ne constituent pas la livraison.

Ce mandat concerne **le pilote seul**. L'ancien
[`EXPLORATION-VISUAL-DESIGN.md`](../art/EXPLORATION-VISUAL-DESIGN.md) §6 et l'ancienne
[`EXPLORATION-VISUAL-ORCHESTRATION.md`](EXPLORATION-VISUAL-ORCHESTRATION.md) prescrivent une
tranche pilote directement intégrée au chapitre, puis deux cartes complètes. La demande
plus récente du propriétaire choisit ici une **scène autonome d'abord** : elle remplace
ces deux consignes de périmètre pour cette expérience. Les règles artistiques, techniques
et de lisibilité de ces documents restent utiles. Le pilote ne modifie pas la progression
du chapitre 1 et ne décide pas à lui seul de l'intégration finale.

## 2. Contexte suffisant pour commencer

- HOLT est un CRPG cyberpunk **dans le navigateur**, en vue orthographique 3/4 tournable
  par quarts de tour. Franklyn a 17 ans ; il se réveille dans le dortoir de l'académie.
  L'exploration est en temps réel sur grille de 1 m, au clic, à **4 cases/s**. La caméra
  est libre ; `A`/`E` la tournent, `C` recentre, la molette zoome. Le gameplay ne dépend
  jamais du mesh décoratif. Voir [`08-EXPLORATION.md`](../design/08-EXPLORATION.md),
  [`09-MAPS-CHAPTER-1.md`](../design/09-MAPS-CHAPTER-1.md) et
  [ADR 0017](adr/0017-habillage-exploration-declaratif.md).
- Direction voulue : **3D picturale cyberpunk**. L'académie est entretenue, institutionnelle,
  de béton clair sous un soleil des Badlands ; ombres bleu pétrole, métal peint, tissu,
  signalétique et technologie de contrôle d'accès. La pièce doit se lire comme un dortoir
  vécu, ordonné et surveillé, sans néons multicolores ajoutés partout. Les références
  photoréalistes fixent l'identité, pas le style exact du rendu. Voir
  [`ART-DIRECTION.md`](../art/ART-DIRECTION.md),
  [`REFERENCES.md`](../art/REFERENCES.md) et
  [`ROOM-COMPOSITION.md`](../art/ROOM-COMPOSITION.md) §« Dortoirs ».
- Franklyn : adolescent mince, réservé, cheveux châtains foncés courts et légèrement en
  bataille ; blouson NCPD noir bleuté à col montant, épaulettes, équipement cohérent et
  **neuroport discret**. Ses formes et sa posture doivent être reconnaissables au zoom
  normal **sans lire l'étiquette**. La référence est
  [`Frankly.png`](../art/Reference_pictures/Frankly.png), complétée par
  [`04-CHARACTERS.md`](../design/04-CHARACTERS.md) et le
  [portrait actuel](../../public/assets/portraits/franklyn.webp).
- Le jeu possède déjà trois GLB Quaternius riggés, des animations et une présentation
  des six cadets. Ils servent de base de comparaison et éventuellement de squelette de
  travail ; leur présence **ne valide pas** la qualité de Franklyn. Le pipeline, les clips,
  les tailles et les droits existants sont dans
  [`ART-PIPELINE.md`](../art/ART-PIPELINE.md). Les 13 portraits et les illustrations de
  lieux sont déjà présents : ce pilote vise la **3D jouable**.
- Le vrai dortoir de HOLT occupe environ `25 × 15` cases, avec lits sur les deux côtés,
  casiers et allée centrale. La carte est dans
  [`holt.ts`](../../src/data/maps/holt.ts) et l'habillage dans
  [`exploreVisuals/holt.ts`](../../src/data/exploreVisuals/holt.ts). Le code existant
  donne le point de départ et les collisions ; le pilote peut recomposer sa copie si la
  qualité visuelle l'exige, en gardant un parcours praticable.

**Discordance à trancher dans le pilote :** le dialogue d'introduction et le brief de
l'[illustration D01](../art/image-generation/briefs/D01-dortoirs.md) parlent de lits
superposés, tandis que la carte et [`ROOM-COMPOSITION.md`](../art/ROOM-COMPOSITION.md)
montrent huit lits simples. Choisis une représentation crédible pour le pilote et note
pourquoi. Si une intégration au chapitre est proposée ensuite, la narration, la carte,
les collisions et le décor devront être mis en cohérence dans le même lot. L'illustration
21:9 à hauteur d'homme sert de référence d'ambiance, pas de cible pixel à pixel pour la
caméra isométrique sans plafond.

## 3. Résultat à livrer

1. Une **URL de développement dédiée** ouvrant directement le dortoir et son seuil, sans
   écran titre ni déroulement narratif. Franklyn apparaît près de son lit et peut marcher
   au clic jusqu'aux casiers, autour des lits et vers les sorties. La page réutilise les
   vrais `ExploreState`, `ExploreView`, `CharacterRig`/rig d'exploration, caméra et réglages
   de rendu. Elle n'écrit pas dans les sauvegardes du chapitre.
2. Un **nouveau résultat artistique visible** pour Franklyn et le dortoir : modèles,
   textures, lumière, composition et animations intégrés dans la scène temps réel. La
   qualité doit tenir pendant le déplacement et dans les quatre orientations, pas
   seulement sur une capture choisie.
3. Un dossier de comparaison comportant captures réelles avant/après à cadrage et
   réglages identiques, contrôle rapproché de Franklyn, observation ou courte capture
   de marche/virage/arrêt, mesures de performance et provenance des nouveaux assets.
   Déposer les masters lourds hors dépôt (`art-masters/`) et ne versionner que les
   ressources légères nécessaires au pilote. Une image générée, si utilisée comme cible,
   doit être nommée distinctement des captures du jeu.
4. Un court avis de fin : qualité obtenue, limites constatées, coût probable pour porter
   le personnage aux cinq autres cadets et le kit au reste de l'académie. La décision
   d'intégrer au chapitre ou de changer de moteur reste ultérieure.

## 4. Bornes techniques et choix d'outils

- **Rester dans Three.js** pour ce pilote. L'objectif est de mesurer ce que le moteur
  actuel sait produire avec de meilleurs assets et une meilleure composition. Blender,
  Mixamo et des ressources gratuites compatibles sont des outils possibles, pas des
  prérequis. Aucun achat de licence. Si un compte tiers ou un upload est nécessaire,
  continuer les travaux indépendants et présenter le besoin concret ; ne pas faire
  dépendre le pilote d'un accès supposé.
- L'agent peut remplacer complètement le mesh actuel de Franklyn. Une simple variation
  de couleur, une texture plus détaillée sur les mêmes formes ou l'ajout de post-traitement
  ne répondent pas à la critique du propriétaire. Évaluer le nouveau modèle à l'échelle
  de jeu **et** en vue rapprochée : silhouette, âge apparent, coupe d'uniforme, cheveux,
  mains, proportions et déformations.
- Si Mixamo est retenu, vérifier sa licence et tester sur **un personnage et un clip**.
  Les fichiers actuels attendent des noms d'os et de clips précis dans
  [`cadetRig.ts`](../../src/render/exploration/cadetRig.ts) : importer un FBX/GLB ne suffit
  pas. Documenter la conversion, le transfert d'animation, le squelette, l'échelle,
  l'orientation `+Z` et la provenance. Les [conditions Adobe](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
  autorisent les jeux et indiquent que le service est gratuit avec un Adobe ID ; vérifier
  les conditions applicables aux fichiers distribués par un jeu web avant publication.
  Le pipeline actuel écarte l'auto-rigging tiers : s'il est adopté, expliquer ce nouveau
  choix dans un ADR et corriger le document de pipeline.
- Les clips se jouent **sur place**, sans _root motion_ : la position reste celle de
  `ExploreState`. Couvrir repos, départ, déplacement à 4 m/s, virage et arrêt ; conserver
  le contrat des six états de `CharacterRig` si le rig partagé est remplacé. Une pose ou
  un clip plus lent ne doit pas modifier silencieusement la vitesse du gameplay.
- La grille/`MapDef` reste la vérité des collisions ; les placements visuels ont leur
  emprise et leur visibilité propres. Pas de lit, casier ou meuble solide qui semble
  traversable, ni passage visuellement libre bloqué en réalité. La coupe des murs doit
  garder Franklyn visible sous les quatre orientations.
- Le pilote est isolé du routeur de chapitre. [`explore-lab.html`](../../explore-lab.html)
  et [`src/dev/exploreLab.ts`](../../src/dev/exploreLab.ts) montrent déjà comment assembler
  déplacement, vue et HUD ; `?map=holt` y charge toutefois **toute l'académie** et crée un
  renderer avec d'autres réglages. Préférer une entrée dédiée et le
  [`createGameRenderer`](../../src/render/rendererSetup.ts) du jeu. Une carte pilote
  découpée doit translater ensemble ASCII, salles, apparitions, entités et habillage.
  [`ExploreView`](../../src/render/exploreView.ts) ne charge actuellement l'habillage que
  pour `holt` et `centre-examen` ; raccorder explicitement celui du pilote, sans recopier
  en parallèle tout le moteur d'exploration. Son `buildDormitoryArchitecture()` dépend
  aussi de l'identifiant `holt` et de coordonnées globales pour le sas, sa caméra et ses
  conduites : adapter ces éléments au pilote dans des données ou un raccord réutilisable.
- Préserver les changements déjà présents dans le workspace. Vérifier `git status` au
  début ; pas de reset ou nettoyage global. Ne pas publier ni committer automatiquement.
  Toute décision structurante reçoit un ADR court ; tout texte joueur reste en français.

## 5. Séquence d'exécution et points de passage

### A — Référence actuelle et contrat visuel

Ouvrir **le jeu courant** et capturer le dortoir dans son état réel, avec URL, graine,
viewport, DPR, orientation, zoom et GPU consignés. Une recette de départ est
`/?seed=visual-review&scene=ch1.vers-cantine` à `1600 × 900`, DPR 1 ; ajuster la caméra
pour montrer Franklyn, son lit, son casier et le seuil. Les PNG historiques de
`tmp/exploration-visual-review/` datent d'avant les dernières passes visuelles et ne
remplacent pas cette capture. Observer aussi quelques secondes de déplacement.

Établir une cible réalisable à partir de cette vue et des références du dépôt : une
planche de Franklyn face/dos/profil, une vue du dortoir au zoom normal, les objets qui
portent l'identité HOLT. Une image générée peut aider à fixer le goût, mais la cible
doit respecter l'emprise, les portes, la caméra et les moyens réels d'implémentation.
Consigner le choix lits simples/superposés avant de fabriquer le kit.

### B — Franklyn, puis la pièce

Produire d'abord un **Franklyn de qualité démontrée dans le moteur** : modèle, matériaux,
rig, animation et éclairage de test. Ne pas attendre d'avoir fini tous les meubles pour
constater qu'un nouveau personnage reste peu convaincant. Une fois le personnage lisible
au zoom normal et propre au zoom rapproché, fabriquer le décor avec les mêmes exigences
de matière et de silhouette.

Le dortoir doit présenter des lits et casiers reconnaissables, le coin personnel de
Franklyn, un contrôle d'accès et une circulation claire. Varier par volumes, matériaux,
assemblages et détails d'usage ; éviter la répétition d'un même cube ou d'une même photo
de béton sur toute la pièce. Employer au besoin des éclairages ou occlusions cuits pour
les éléments statiques, puis garder l'ombre et la lecture du personnage mobile. Ajouter
les effets de finition seulement après avoir jugé les modèles et la lumière sans eux.

### C — Assemblage jouable et revue

Brancher la scène autonome sur les vrais contrôles. Vérifier plusieurs trajets au clic,
les casiers et les sorties, les quatre orientations, le zoom, le cadrage à 1280 × 720,
la coupe des murs, l'occlusion et l'absence de fuites de lumière depuis une zone cachée.
Observer le repos, la marche, le virage et l'arrêt en mouvement ; une capture immobile
ne valide pas l'animation. Faire une petite manche de captures décisives, lister les
**trois écarts visuels dominants**, les corriger, puis refaire la même comparaison.

## 6. Critères de sortie et mesures

| Sujet       | Preuve attendue                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Franklyn    | Reconnaissable sans étiquette au cadrage normal ; silhouette adolescente et uniforme HOLT identifiables sous quatre angles ; pas de déformation manifeste en vue rapprochée.                                                                                                                                                                                                                                                           |
| Mouvement   | Clic jusqu'aux points majeurs du dortoir ; vitesse visuelle cohérente avec 4 m/s ; pieds sans glissement visible, orientation et transitions crédibles.                                                                                                                                                                                                                                                                                |
| Décor       | Fonction de la pièce et ancre narrative lisibles sans HUD ; matériaux béton/métal/tissu distincts ; aucun gros placeholder dominant la vue ; passage clair et collisions cohérentes.                                                                                                                                                                                                                                                   |
| Jouabilité  | Pas de régression des clics, du zoom, de la coupe des murs et de la visibilité sous les quatre orientations. Le chapitre existant démarre et fonctionne toujours.                                                                                                                                                                                                                                                                      |
| Performance | Sur le GPU identifié, relever temps d'image médian et p95, appels de dessin, triangles, mémoire/textures et taille téléchargée après chargement. Cible de référence : 60 fps à 1920 × 1080, DPR 1, GTX 1070. Les alertes actuelles sont 250 appels de dessin et 300 000 triangles visibles ; elles guident l'optimisation, elles ne prouvent pas les 60 fps. Ne pas annoncer la cible matérielle atteinte sans mesure sur cette carte. |

Une scène plus riche peut d'abord dépasser les budgets anciens pendant la recherche
artistique : enregistrer le coût, puis produire une version web optimisée et comparer
son image à la version qualité. Les optimisations de GLB/textures sont possibles dans
Three.js ([chargement glTF](https://threejs.org/docs/pages/GLTFLoader.html)). Ne pas
dégrader silencieusement le résultat artistique juste pour respecter un chiffre isolé.

Les captures du dortoir actuel et du pilote peuvent être comparées visuellement à cadrage
équivalent. Leurs **mesures de performance ne sont pas directement comparables** si l'une
rend l'académie entière et l'autre une petite carte autonome. Rapporter alors chaque coût
avec son périmètre. Pour chiffrer un gain ou une perte avant/après, mesurer l'ancien et le
nouveau décor sur **la même carte pilote**, avec les mêmes réglages et le même trajet.

Ajouter uniquement les tests qui protègent un risque réel : cohérence globale des
emprises et accès si la carte pilote change, puis une vérification navigateur du trajet
complet. Les captures servent au jugement visuel, les assertions/états au gameplay.
Exécuter `npm run verify` après les dernières modifications et les contrôles navigateur
pertinents ; rapporter les résultats exacts et les limites de matériel ou d'outillage.

## 7. Dossier de livraison

Le compte rendu durable va dans `docs/art/DORMITORY-AA-PILOT-REVIEW.md` : recette de
lancement, choix artistiques, conflit des lits tranché, sources/licences des assets,
réglages des captures, métriques par scène et comparaison à périmètre égal si disponible,
limites et chemin d'intégration proposé.
Conserver une petite paire de captures réelles avant/après et quelques vues de contrôle
à côté de ce rapport, compressées et légères ; placer les captures de travail et masters
volumineux dans les dossiers ignorés du dépôt. Fournir un moyen de revoir le mouvement
(courte vidéo locale ou séquence reproductible avec URL et trajet décrits).

**Fin de mission :** une scène 3D autonome, jouable et visiblement améliorée, son dossier
de preuves, et une recommandation argumentée sur la généralisation. Aucun score « AA »
auto-attribué ne remplace la comparaison des images réelles et du mouvement.
