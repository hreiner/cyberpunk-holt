# Variante vitre intacte — révision 02

6 novembre 2026. Périmètre artistique unique : produire une variante intacte du dessin déjà retenu de p05-c04, puis laisser le lecteur révéler le bris original au temps narratif fixé par la réalisation. Aucun autre dessin ni voix n'est généré. Toutes les sources précédentes sont conservées.

Source exacte confirmée par montage et réellement ouverte : `art-masters/motion-comics/blue-purple/page-05/band-03-v1.png`. Cette bande sans lettres est placée dans le master révision01 p05 `page-raw-v2.png` au rectangle `[12,1028,1000,496]`. Elle montre **trois personnages cadrés** : Franklyn derrière la banquette à gauche, Abigail protectrice au centre, l'enfant civil devant. Wendy, John et Grover restent hors cadre ; le groupe narratif compte toujours six personnes. Ne pas ajouter les trois absents dans l'image.

Une seule cible d'édition : réparer le vitrage droit en une surface entière continue, sans trou/fissure, et retirer tous les éclats déjà présents dans la vitre, devant elle, sur le mur/sol et dans les reflets immédiats du verre. Préserver exactement les trois visages, les deux mains visibles et leurs appuis, cheveux/vêtements/écussons, poses, caméra/cadrage, banquette, table/chaise, structure de fenêtre, lumières et décor. Le caractère protecteur des poses reste cohérent après la sommation précédente, avant le tir ; aucun nouveau geste n'est inventé.

Le dessin reste complet sans lettres ni bulle. La source brisée est jointe réellement à ImageGen comme cible d'édition unique ; son journal garde prompt exact et empreintes d'entrée avant l'appel, natif et diagnostic après. Toute correction conserve la tentative précédente et requiert un défaut observé ainsi qu'une revue du nouveau prompt.

Plafond : **1 appel initial +2 corrections ciblées maximum,3 appels pour cette révision**. Historique images des deux productions précédentes27 ; maximum cumulé30. Coûts monétaires et identifiants fournisseur non exposés restent inconnus/null. Le script existant `image-attempt.cjs` enregistre les tentatives neuves sous `revision-02/art/`.

Contrôles : dessin entier puis agrandissement des mains/visages et détail de toute la fenêtre/sol droit ; comparer variante intacte et source brisée sans lettres. Vérifier continuité du vitrage et absence de fragment restant, que la banquette/table/chaise n'ont pas changé, et que les deux mains ont conservé leurs doigts, pouces, poignets et contacts. La source seule ne prouve pas l'onset, le son ou la transition du lecteur : ces contrôles appartiennent à animation/montage/qualité.

## Production et sélection

**Une requête ImageGen réellement exécutée, aucune correction payante ;1/3 pour révision02,28 appels cumulés, deux réserves intactes.** Prompt initial et référence unique contre-revus avant soumission. Le contrat cible est `CONTRACTS.json` v1 : intacte visible0,50s en cadre stable, bris à16,40s, sans nouvelle pose. Les médias des autres cases sont préservés.

La sortie native `art/p05-c04-intact/attempt-01/band-v1.png`, SHA256`d8deac05c7f14d02ad93defba3343a282d9a5dcb1b41b5da0500c9641e9e31fc`, a réparé tout le vitrage et retiré les éclats. La revue entière et les agrandissements des mains/fenêtre/sol ont trouvé l'anatomie et le verre conformes. Toutefois, une comparaison RGBA a constaté des retouches fines diffuses hors verre ; ne pas présenter ce natif comme pixel-identique aux acteurs source.

Conformément à l'arbitrage intégrateur, le dessin retenu assemble **uniquement le verre et le fond couvert de débris générés** sur le raster source original. Le masque éditable est conservé dans `art/p05-c04-intact-composite-v1.svg`, avec reprise exacte de la chaise d'avant-plan, tandis que le fond entre ses pieds est nettoyé. Aucune suppression de blanc, aucun repaint de main par code ni masque cachant un défaut : les mains et visages proviennent intégralement de la source déjà livrée. L'image générée fournit réellement la fenêtre réparée et les portions de fond auparavant couvertes de verre.

Sélection finale immuable : `art-masters/motion-comics/blue-purple/pages-05-08/revision-02/art/p05-c04-intact-v1.png`, **1774×887**, SHA256`1da76f06e5f71d241626b2a50d42f1e27601930b00c26a936a9c51af5e10c55e`. Copie exacte de `p05-c04-intact-composite-v1.png`. Le dessin brisé reste la bande historique d'origine, inchangée.

## Contrôles exécutés

- Dessin entier et grands détails fenêtre/mur/chaise/sol réellement ouverts : vitrage continu, aucun trou/fissure ni fragment attaché, volant, entre ou sous pieds de chaise ; aucune couture visible. Deux mains, trois visages, vêtements et appuis inchangés.
- Comparaison exacte RGBA native : **922480 pixels de toute la zone acteurs0..1040×887 ont0diff**, contrôlés également de manière indépendante par qualité. Les régions des deux mains, trois visages, table, pied de table et cœur de chaise ont0diff. La preuve est `window-composite-proof-v1.json` ; les différences du natif fournisseur rejeté hors verre sont conservées dans `window-native-difference-v1.json`.
- Après normalisation identique des deux images à1000×496, toutes ces régions protégées ont encore0diff : `window-normalized-proof-v1.json`. Le switch ne doit donc pas faire bouger mains/têtes/meubles dans ces régions.
- Prompt, référence, natif, SVG et composite identifiés par empreintes. Le journal `p05-c04-intact/attempt-01/journal.json` garde l'appel unique et ses paramètres. Coût monétaire et identifiant fournisseur non exposés : inconnus/null. Source, natif fournisseur et fichiers intermédiaires conservés.
- Scripts de comparaison/assemblage et vérification normalisée passés sous ESLint ciblé. Les preuves de timing lecteur/MP4, miniature, son et effets restent celles des autres périmètres et ne sont pas revendiquées ici.

Le composite exact a reçu le verdict final favorable de qualité après ouverture entière et agrandissement de toute la zone droite/sol/chaise ; aucune autre génération justifiée. Montage et animation reçoivent le PNG final sans lettres pour superposition avant impact. Aucun commit/push.
