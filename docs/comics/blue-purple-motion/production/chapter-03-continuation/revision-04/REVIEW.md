# Révision 04 — comics composé

Périmètre : suite statique pages 9–21. Les pages 1–8 v5 restent la référence déjà livrée. Le PDF précédent avec textes au-dessus des dessins ne constituait pas une finition conforme au style retenu.

## Changements

- Lettrage intégral refait dans les images : bulles blanches, contours noirs, texte français gras italique, queues vers les locuteurs. Suppression des étiquettes de nom et des bandeaux externes. Textes et positions restent éditables dans `DIALOGUE-FR.json` et `BALLOONS.json`.
- Quai, 20.3 : dessin entièrement refait, John plus mince dans une posture sans fente extrême ; bras, mains et jambes réguliers. Grover debout auprès de l'enfant, jambes reprises.
- Hall, repères utilisateur 10.3/10.5 : deux nouveaux dessins pour varier réellement les poses. Plan large avec Wendy de profil, puis échange rapproché Grover/enfant/Wendy. Le recadrage en double de l'ancien plan large a été supprimé. Identifiants source : `p10-c02`, `p10-c03` ; la page 10 contient désormais trois cases.
- Bandes doubles conservées quand elles servent la scène : échange John/Abigail page 11, détail page 13, deux états page 18. Le détail page 13 reste un recadrage déclaré.

## Procédure appliquée

Trois agents délégués : workflow, assemblage/lettrage, contre-revue. Le premier passage a détecté des visages masqués et des queues ambiguës ; le deuxième a encore détecté des défauts après changement du retour à la ligne. Les placements sont donc corrigés directement par le relecteur avant sélection finale. Une sortie de script réussie ne vaut pas validation artistique.

Sources de procédure renforcées : `docs/anime/motion-comics/ART.md`, `ORCHESTRATION.md`, `LESSONS.md`, skills et adaptateurs synchronisés. Exigences : reprendre une page retenue comme ancre, vérifier corps entier et appuis, varier les poses et livrer toutes les pages avec bulles finies avant revue. La production audio/animation commence après validation des images et textes.

## Fichiers et contrôles

PDF : `output/pdf/blue-purple-chapitre-3-revue-v4.pdf`. HTML, SVG intégrés, images et PNG par page : `art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v4/`. Les versions précédentes restent accessibles.

Le rapport indépendant `QA.md` et le rapport technique de l'export consignent les contrôles de la sélection finale. Trois appels ImageGen ; prompts exacts dans `ART-JOBS.json`, références, sorties et empreintes dans `ART-RESULTS.json`. Prix et identifiants fournisseur inconnus. Aucun nouvel audio. La traduction anglaise reste à aligner sur le français approuvé avant les voix.

Sélection finale : 13 pages, 42 images, 62 bulles ; contrôle des textes et limites réussi, contre-revue des treize PNG et rendu PDF Poppler vérifiés. Archive CBZ disponible dans output/pdf ; empreintes PDF/CBZ/pages et sources dans SELECTION.json. workflow:check passe. Anatomie contrôlée sur les corrections demandées, sans certification exhaustive des anciennes images.
