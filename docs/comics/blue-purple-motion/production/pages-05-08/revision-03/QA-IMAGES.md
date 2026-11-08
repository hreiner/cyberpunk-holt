# Contre-revue des bras de John — 7 novembre 2026

**Verdict de gel : favorable à la correction composite exacte ci-dessous.** Le défaut signalé par le propriétaire est confirmé dans le raster RECOIL historique. Les trois poses voisines et le master papier ont été revus séparément ; aucune duplication comparable n'y a été observée.

Périmètre de cette contre-revue : lecture seule des médias, aucune génération d'image et aucune édition d'asset/manifeste. Seul ce rapport est écrit dans le dépôt. Skills/procédures appliqués : `holt-motion-art`, `holt-motion-animation`, étapes ART et ANIMATION, direction du mouvement. Les crops agrandis de travail sont hors assets, dans le répertoire de visualisation de session `C:/Users/hadri/.codex/visualizations/2026/11/05/01a1ad2b-71c2-7d92-909c-ef923d8c1bbc/revision03-art-review/`.

## Méthode réellement exécutée

Ouverture des quatre dessins natifs entiers1254×1254 puis agrandissements des épaules, manches, coudes, poignets et mains de John. Pour chaque pose, traçage visuel de la chaîne épaule→coude→poignet, au lieu de simplement compter les mains. Agrandissement séparé des deux mains du barman dans les quatre états. Master page5 entier puis case du coup agrandie. Enfin ouverture entière du natif corrigé et du composite final, puis agrandissement de sa jonction bras/torse/fond.

Un contrôle Canvas indépendant du rapport intégrateur a également décodé l'ancien RECOIL et le composite avec deux contextes `willReadFrequently:true`, puis comparé chaque canal RGBA. Aucun fichier source n'a été modifié. La revue de sources ne revendique ni visionnage intégral des nouveaux MP4, ni validation du rythme du prototype, ni écoute.

## Dessins historiques inspectés

Tous les chemins suivants sont relatifs à `art-masters/motion-comics/blue-purple/pages-05-08/revision-01/`.

| État / fichier | SHA256 | Constat anatomique |
| --- | --- | --- |
| READY `art/p05-c03-pose-01-preparation-v2.png` | `eb5248a9504f00f46d03884f9fceba35e496e1d219df619ee26dd0b48d65b717` | Bras proche replié depuis l'épaule à écusson vers poing devant poitrine ; autre manche/main descend du côté opposé du buste. Les deux insertions se distinguent. Aucune branche supplémentaire observée. |
| CONTACT `art/p05-c03-pose-02-contact.png` | `7922f57e2d19cec1a0e6412fa1ca34267325644b5337fcb5232f3d8bfadb2309` | Un bras part de l'épaule opposée et s'étend vers la joue du barman ; l'autre bras descend depuis l'épaule à écusson. Deux chaînes distinctes, poignet de contact et poing bas plausibles, pas de main fusionnée avec le visage. |
| RECOIL historique `art/p05-c03-pose-03-recoil.png` | `86bfee60052c196080051bae272601aedfd649818996e331da7cb1051d5476ce` | **Défectueux.** Sous l'épaule proche à écusson, le bras se plie devant le torse, mais une seconde manche/poing descend depuis la même zone du coude. La main pendante autour de x235,y700 ne se rattache pas à une seconde épaule crédible. Le seul compte de deux mains ne révèle pas cette insertion dédoublée. |
| DOWN `art/p05-c03-pose-04-down.png` | `830ba159fe58237dcae1c1f3f228f1b8051b57a15f9ba6f91c56380d2ffeeba2` | Deux bras abaissés, chacun de son côté du buste, coudes et poignets reliés ; occultation partielle du bras éloigné par le torse admissible. Aucune branche supplémentaire observée. |
| Papier `page-05/page-v2.png` | `d0e5c6ac1377ac399578fcaa08abc99fa939515e8f8ca55196a3d78e097875b9` | La case3 représente CONTACT, pas RECOIL. Ses deux bras se lisent comme dans le natif CONTACT ; les bulles ne cachent pas une duplication. Les autres cases ont été ouvertes avec la page entière ; aucune nouvelle anomalie de membre n'a été repérée dans ce périmètre. |

Les mains du barman ont été revues dans les quatre états : prise sur batte et paume ouverte READY, deux mains ouvertes après lâcher CONTACT/RECOIL, mains reposées DOWN. Les doigts visibles et les pouces/occultations sont cohérents ; chaque poignet rejoint son propre avant-bras. La batte reste unique. Aucun autre défaut anatomique précis justifiant une génération supplémentaire n'a été observé.

Cette nouvelle revue invalide l'ancienne conclusion favorable concernant **l'insertion des bras de RECOIL** : elle avait laissé passer ce défaut. Les validations de doigts prises isolément ne prouvaient pas que les deux membres rejoignaient des épaules différentes.

## Correction effectivement ouverte

Natif fourni par l'intégrateur : `revision-03/art/p05-c03-recoil-generated-v1.png`, SHA256`3cbf6af0408feb333abeedd4ec8547dd80f0344f57dd14f6923f12841848d9df`. Le dessin supprime la manche et le poing pendants et conserve un bras proche replié lisible ; l'autre bras est occulté derrière le buste. Cette occultation est anatomiquement admissible, elle ne doit pas être confondue avec un membre manquant imposant d'en redessiner un autre.

**Sélection à intégrer :** `art-masters/motion-comics/blue-purple/pages-05-08/revision-03/art/p05-c03-recoil-corrected-v1.png`,1254×1254, SHA256 **`c263491e07a1dbb4e4791f0f50aa494a73a5e26593ab1aef7ff355b119e921ad`**.

Le composite final a été ouvert entièrement et dans le crop `recoil-final.png` agrandi. La branche superflue a disparu sur toute sa longueur, y compris sa jonction haute : aucune manche vide ni poing flottant résiduel. Le bras proche relie épaule/coude/poignet sans bifurcation ; le poing initial reste intact. Les contours de taille et les plis retombent de manière lisible, sans couture de masque observée. Les appuis, deux jambes de John, corps/mains du barman et batte restent cohérents avec la source.

Le masque éditable `p05-c03-recoil-composite-v2.svg`, SHA256`3f4c390add8acdefffda7de703d229a1a9938adc1193ade89f44e790fb1548dc`, couvre `[170,388,300,367]` dans le natif. Cette zone englobe la jonction de manche fautive, pas seulement le poing du bas. Le rectangle du poing replié `[362,559,90,74]` est rétabli depuis l'original.

Résultat indépendant retrouvé : **102608 pixels changés,0 hors masque,0 dans le poing protégé**. Les mains du barman, visage/coiffure de John, décor et autres éléments hors zone gardent donc leurs pixels source. La preuve indépendante est dans `revision03-art-review/independent-composite-proof.json` du répertoire de visualisation ; elle recoupe les valeurs du `revision-03/art/composite-v1-report.json` lu pendant cette revue.

## Passage à l'intégration

Le composite nommé et empreinté ci-dessus peut remplacer uniquement la référence RECOIL du prototype et de la séquence courante. Les trois autres poses et le master papier ne nécessitent pas de retouche dans ce périmètre. Ne pas écraser l'ancienne pose citée par les journaux historiques.

Aucun deuxième appel ImageGen n'est justifié par cette contre-revue de source. L'intégrateur doit encore vérifier l'image réellement chargée aux temps de recul, l'enchaînement avec CONTACT/DOWN et les nouveaux encodages avant de déclarer la livraison complète corrigée. Le présent verdict porte sur les fichiers exacts vus, pas sur des exports encore à produire.
