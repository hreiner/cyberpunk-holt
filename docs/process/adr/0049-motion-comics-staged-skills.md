# 0049 — Étapes ciblées et orchestration motion comics

## Contexte

Le 7 novembre 2026, le propriétaire demande d'intégrer les corrections successives
aux skills et de séparer création des pages, audio et animation en étapes précises,
avec une commande d'orchestration. Les preuves des 5–6 novembre restent locales et
datées ; elles ne doivent pas devenir des constantes de production pour tout futur lot.

## Décision

`holt-motion-comics` devient le point d'entrée d'une procédure commune dans
`docs/anime/motion-comics/ORCHESTRATION.md`. Six skills courts ciblent découpage,
images/bulles, voix, musique/SFX, animation et livraison. Chaque recette documente ses
entrées, sa sortie et les contrôles qui permettent de poursuivre. Les corrections et
leurs preuves sont reliées dans `LESSONS.md`, sans nouvelle copie de l'historique.

La slash command Claude est le skill généré `/holt-motion-comics`, conformément au
format actuel où skills et commandes sont réunis. Codex utilise son invocation native
`$holt-motion-comics` ou son sélecteur de skills. Aucun prompt global déprécié ni
faux répertoire de commandes Codex n'est ajouté. `agents:sync` existant produit les
adaptateurs ; les profils anime renvoient aux étapes utiles sans dupliquer les recettes.

## Conséquences

Une correction ne rouvre que ses dépendances ; les textes/prises et images approuvés
restent réemployables. Les passages sont des vérifications sur preuves, sans demande
systématique d'une nouvelle confirmation humaine pour une production déjà autorisée.
Les permissions, plafonds cumulés et limites de délégation restent ceux de la session.
Un plan/audit ne devient pas une génération payante. Aucun moteur, média ou export livré
n'est modifié par cette mise à jour des workflows.
