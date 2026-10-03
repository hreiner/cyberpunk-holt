# ADR 0037 — Enveloppe et profils visuels de toute l'académie

- Date : 2026-10-01
- Statut : accepté, plan de déploiement autorisé par le propriétaire

## Contexte

Après validation du dortoir fidèle au pilote, le propriétaire autorise le
[plan pièce par pièce](../HOLT-AAA-ROLLOUT-PLAN.md). Il demande le même niveau de
qualité dans toute l'école, avec les murs intérieurs et des portes dans le thème.
Les façades nord/est du dortoir restent la référence ; ses deux autres côtés et
les seuils doivent d'abord être complétés.

## Décision

Étendre progressivement les profils de rendu à HOLT/HOLT-nuit. La carte ASCII
reste l'unique source de collision et de passages. Un layout pur décrit les
cellules de murs et les ouvertures possédées par chaque profil ; le renderer
remplace leurs anciens blocs, avec une structure commune par séparation et
des finitions distinctes par face si nécessaire. Les façades pilotes du dortoir
conservent leur constructeur et ne sont pas doublées par le nouveau socle.

Les portes sans entité restent ouvertes. Les portes interactives reprennent
leurs identifiants, conditions et état d'ouverture ; la décoration ne crée
aucune nouvelle règle. Les panneaux, tableaux, équipements muraux et fenêtres
suivent la coupe ; les contenus et effets suivent découverte et étape.
Les finitions de portes sont choisies par la destination, indépendamment de
l'ordre d'enregistrement des profils. Les soubassements diffèrent par face
(médical clair, service métallique, peinture HOLT) sans doubler la dalle.
Les accès à deux rangées de murs reçoivent un seuil et des jambages continus,
avec uniquement les vantaux réellement interactifs dans ce passage.
La structure des murs partagés reste en béton, indépendamment de l'ordre des
profils ; les façades extérieures du garage peuvent employer la tôle nervurée.
Les baies des corridors peuvent être déclarées sur leur région toujours visible ;
les baies donnant dans une autre pièce conservent la découverte des deux voisins.

Les murs extérieurs et les façades sur la cour restent hauts de 4,9 m ; les
cloisons partagées entre pièces ou couloirs font 2,45 m dès leur construction.
Leurs finitions restent propres à chaque face. Une géométrie pure donne à chaque
cellule le centre canonique de son run contigu : les murs, baies et accessoires
muraux utilisent le même plan, sans saut d'un demi-mètre aux seuils. Les façades
du pilote du dortoir sont prolongées à leurs extrémités pour rejoindre proprement
les murs voisins.

Les profils réemploient matériaux, environnement, caméra perspective et
compositeur du dortoir. La caméra vise désormais depuis un décalage vertical de
13 m (environ 40° vers le bas), contre 8,5 m (environ 29°) dans le pilote initial.
Le budget de lumières et la réflexion planaire sont mutualisés, avec une seule
réflexion active. Survol, clic et projection HTML emploient la caméra affichée.
Les modèles et animations de personnages restent hors périmètre.
Le recentrage en perspective vise directement la case demandée, avec les bornes
de navigation habituelles, pour garder les petites pièces périphériques centrées.
Pour HOLT/HOLT-nuit, la coupe des cloisons intérieures ne dépend ni de la pièce
occupée, ni de la région active, ni de la découverte ; leur orientation reste
stable au changement de salle. Les façades conservent une coupe stable selon
l'orientation de la caméra. Seuls les tronçons intérieurs contenant des cellules dont le volume coupe réellement
le rayon caméra–meneur sont abaissés à 0,4 m. Ce complément suit déplacement,
rotation et panoramique, sans révéler le décor d'une pièce non découverte. Les
autres cartes gardent leur règle de coupe actuelle.
Le miroir conserve son gain en cadrage rapproché, décroît entre zoom 26 et 34,
puis est coupé à partir du zoom 34 ; les matières et l'environnement restent
visibles dans les vues larges. Les sols mats de l'armurerie et des archives
utilisent uniquement cet environnement.

Les jardinières emploient l'occupation visuelle `vegetation` pour remplacer les
cellules `~` existantes. Le validateur vérifie leur emprise sur ces cellules,
comme il le fait déjà pour les meubles sur `o/T` ; la collision reste celle de
la carte. Le bassin peut déclarer une surface de réflexion locale réaffectée
au même miroir que les sols, sans cumuler les passes.

## Conséquences

Le déploiement suit H1–H15, avec revue avant la zone suivante. Les composants de
chaque profil possèdent leurs géométries, cibles et matériaux propres ; ils
empruntent les ressources communes et libèrent uniquement les leurs. La cible
reste p95 ≤ 33,3 ms à 1080p sur GTX 1070, DPR consigné. Mesures et preuves sont
ajoutées au plan au fil des livraisons, sans extrapoler celles du seul dortoir.
