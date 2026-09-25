# ADR 0020 — Pilote du dortoir isolé et options d'art de la vue

**Statut : accepté · Date : 2026-09-25**

## Contexte

Le pilote AA des dortoirs doit montrer une scène jouable et comparer deux rendus sur la même
carte sans changer la progression du chapitre. `ExploreView` choisissait l'habillage et le rig
par identifiant de carte ; une copie du dortoir aurait donc reçu un décor vide ou obligé à
dupliquer le moteur.

## Décision

Une page Vite de développement charge une copie bornée du dortoir, de son couloir ouest et
de deux seuils sud. Elle utilise `ExploreState`, `ExploreView`, `CharacterRig`, la caméra et
`createGameRenderer`. Aucun objet de sauvegarde du chapitre n'est lu ou écrit.

`ExploreView` accepte des options facultatives pour injecter l'habillage, sa fabrique, le rig
du meneur, une texture de sol et les coordonnées de l'architecture du sas. Sans option, le
chapitre continue d'employer les ressources existantes. L'habillage du pilote reste soumis
aux emprises déclaratives de l'ADR 0017 ; la carte ASCII reste la collision. Le même plan
sert au mode `quality=baseline` et au rendu nouveau.

Le pilote garde les huit lits simples du plan HOLT. Ce choix conserve la circulation du
chapitre et permet de juger les nouveaux volumes sans fausser les collisions. Si cette
direction rejoint le chapitre, le dialogue d'introduction et le brief D01 qui mentionnent
des lits superposés devront être harmonisés avec la carte et les illustrations.

## Conséquences

- Une comparaison à carte, cadrage et réglages identiques devient reproductible.
- Les assets du pilote sont géométriques et procéduraux dans le code, sans nouveau fichier
  lourd ni service tiers. Le rig partage les clips Quaternius sans root motion.
- La page de développement ne décide pas de la généralisation ; un lot ultérieur devra
  évaluer personnage, animation et décor avant toute intégration au chapitre.
