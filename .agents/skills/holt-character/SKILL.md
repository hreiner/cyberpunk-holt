---
name: holt-character
description: "Create or modify HOLT MPFB character models, appearance, retargeted poses and shared game rigs."
---

# Personnages HOLT : MPFB vers le jeu

Lire AGENTS.md, docs/INDEX.md et
[pipeline personnages](../../../docs/art/CHARACTER-PIPELINE-FINDINGS.md).
Le build est décrit dans [tools/characters](../../../tools/characters/README.md) ;
les chemins locaux dans [TOOLS](../../../docs/process/TOOLS.md).
Pour une fiche narrative lire 04-CHARACTERS ; pour un portrait 2D employer `$holt-illustration`.

Modifier `tools/characters/specs/<id>.json`, puis `cadetLooks.ts` (LOOKS, CAST_ORDER).
Raccorder CAST_LABELS du pilote si nécessaire. Construire le seul personnage demandé ;
Blender conserve ses préférences MPFB, export applique les morphologies mais supprime les
shape keys inutiles, prune puis WebP restent requis. Ne pas masquer un échec de build en
réutilisant un ancien GLB. Recharger la page après remplacement.

Préférer cheveux natifs ; pas de bouche peinte. Manches : axe bras/coude/poignet et
longueur avant réduction radiale ; décalques skinnés comme le tissu ; contours sur
vêtements, pas peau/cheveux. Lire les réglages exacts dans le pipeline.

Pour un clip manquant, suivre `$holt-mixamo`. Le retarget A-pose/T-pose, les doigts
en repère main et les hanches des clips spéciaux sont des invariants. L'habillage est
synchronisé une fois au préchargement, puis cloné par rig (ADR 0041).

Revoir face/profil/dos, marche et pose, puis exploration/tactique si le rig partagé change.
Mesurer taille et coût/chargement avec méthode explicite. Ajouter attribution et constats
au pipeline ; suivre les checks du dépôt sans prétendre avoir fait une revue visuelle absente.
