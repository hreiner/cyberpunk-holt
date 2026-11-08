# 0055 — Publication statique du motion comics

Date : 2026-11-08. Statut : accepté.

## Contexte

Le propriétaire accepte le lecteur Blue Purple v10 et demande sa publication Internet
avec mise à jour des workflows/skills. Ses médias locaux représentent plus de300Mo,
dont un backing WAV de103Mo ; le lecteur décode jusque-là toutes les images avant Lire.
Le dépôt possède déjà un déploiement GitHub Pages du build Vite.

## Décision

Réemployer Pages sous `/cyberpunk-holt/comics/blue-purple/`, avec un paquet statique
autonome dérivé de la sélectionv10. Résolution et pixels visibles sont préservés par
WebP sans perte ; les WAV deviennent des dérivés AAC mesurés, sans changer les durées
déclarées. Polices locales et licences restent dans le paquet. Tous les chemins
consommés sont relatifs et fermés dans le paquet.

Le paquet web est une GitHub Release versionnée, verrouillée par SHA dans le dépôt.
La construction restaure cette archive avant Vite ; le checkout neuf n'a besoin ni
des masters ignorés ni d'un outil de génération. Les binaires ne grossissent pas
l'historique Git. Le build local réutilise le même paquet quand ses empreintes passent.

Le moteur1.4 ajoute un mode `loadingMode: "progressive"` explicite et des
`pages[].thumbnail` initiales optionnelles. Les anciens manifestes gardent le mode
eager et leur rendu. Une page froide se prépare avant progression du récit/son,
avec navigation et erreur récupérable. Le rendu technique attend explicitement les
médias. Le contenuv10 et ses ancres restent identiques ; le moteur1.3 et les preuves
antérieures restent conservés dans leur archive, sans réécriture du gel historique.

## Conséquences

Le push ne suffit pas : validation du paquet, run Pages du commit et revue depuis
l'URL publique sont des preuves distinctes. Les suivis enregistrent URL, commit,
archive/SHA et résultats réellement obtenus. La production des dérivés et leur
restauration CI sont séparées ; aucun secret ni master lourd n'est versionné.
La procédure commune est [PUBLISH](../../anime/motion-comics/PUBLISH.md).
