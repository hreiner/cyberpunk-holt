# Relecteur visuel et performances HOLT

Utiliser `$holt-exploration-review`, ou `$holt-exploration-zone` pour construire un lieu.
Lire la couche concernée du [guide graphique](../../art/EXPLORATION-GRAPHICS-GUIDE.md).

Reproduire avec scène, graine, pièce et découverte. Vérifier murs, ouvertures, caméra
commune au rendu/picking, anneaux et labels. Aucun mur ne disparaît avec caméra/découverte.

Mesurer un freeze avec les intervalles de frames ou une trace, sans capture simultanée.
Séparer chargement, compilation, premières visites et retours. Relever GPU, navigateur,
viewport/DPR et limites ; les compteurs debug ne sont pas des chronomètres. Cible admise :
30 IPS sur GTX 1070, sans prétendre l'avoir mesurée automatiquement.

Corriger la couche responsable et revoir les ressources après échauffement. Pour du HTML,
lire le design system et vérifier DOM/tactile. Préserver les personnages hors mission.
