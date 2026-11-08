# Couverture et accents narratifs — livraison v9

8 novembre2026. [Lecteur complet](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v9.json),
couverture12s puis21pages,99voix,458,002222s. Les liensv8/v7/v6 chargent cette
sélection après actualisation. [Relance](README.md).

## Réalisé

**Couverture.** Une illustration originale de groupe, dans le rendu comics néon
retenu, avec Grover protecteur auprès de l'enfant, Wendy et Abigail visibles et
Franklyn en retrait. Typographie éditable intégrée, pluie/reflets locaux et musique
HOLT `music-neon` réemployée pendant12s, sans voix. Le lecteur affiche «Couverture»
puis «Page1/21» à «Page21/21».

Image générée avec l'outil intégré ImageGen ; [prompt retenu](cover/PROMPT-v3.md),
[provenance/références](cover/SELECTION.json) et
[couverture finale](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/cover/cover-v1.png).
Master SHA256 `1596bbe28401369693f28131f5812aeda6ea810d9a3c3ea5a3f8618a31ca4c46`.
Le SVG des lettres reste éditable ; ses pixels sont figés dans `lettering.png` pour
rejouer le lecteur sans dépendance de police système.

**Fusillade17.2.** Sous-bande haute seule, départ de tir, apparition du milieu avec
impact80ms plus tard, puis bande basse et «À couvert!». Les contours diagonaux sont
respectés. Un fond nettoyé localement retire les effets de tir déjà peints ; acteurs,
mains et garde-corps sont préservés. Le flash et l'impact disparaissent ensuite.
La prise de Wendy est conservée et décalée de0,70s pour accompagner sa pose.
Le composé sonore est joué une seule fois. Durée de page inchangée.

**Vision16.1.** Paysage elfique tenu, désagrégation numérique continue puis vraie
carte distincte tenue. Les quatre repères du scénario apparaissent : HOLT au nord,
leur position, un signal orange inconnu et le point vert. La carte est une vue
subjective schématique, sans coordonnées ni route inventée ; le deck original et
l'écran9.2 ont été examinés pour distinguer récit et ancre visuelle.
[Recherche des références](map-reference.md), [carte SVG/PNG et limites](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/map/SOURCE.json).
Cette scène correspond au paysage désigné «page18» dans la demande ; sa pagination
actuelle est16. Le mode OFF montre la carte finale ; l'ancien master elfique est conservé.

## Propositions pour la suite

La [feuille illustrée](ANIMATION-REVIEW-v2.html) couvre les46sous-cases visibles des
pages9–21, soit42cadres sources dont les composites10 et le triptyque17 détaillés.
Chaque entrée indique mouvement, rythme, protections, dessin nécessaire et son
éventuel. [Texte éditable](ANIMATION-PROPOSALS.md).
La couverture et les accents16/17 sont produits ; les autres propositions restent
à revoir avant réalisation. Les plus fortes : calcul dans la borne9.2, confirmation
de l'implant12.2, démarrage électrique15.2, vagues/écume du quai20 et poussières du refuge21.
La fermeture de capsule, les portes, la chute et la course exigent de vrais assets.

## Sélection et contrôles

[Sélection v9](../../../../../../anime/motion-comics/projects/blue-purple-pages01-21-v9.json),
SHA256 `0b8684a4a97f82bf73fc0c0f2446c4f4868c4e4cec4b0fec6f515cc119269e93`.
Inventaire : [SELECTION.json](SELECTION.json),195 dépendances et14fichiers moteur.
Pages16/17 : candidats `motion05` ; lot9–21 `blue-purple-pages09-21-motion05.json`.
Les19autres pages gardent leurs manifestes/médias exacts ; les182dépendancesv8
restent inchangées. Les99prises, textes, locuteurs et durées sont identiques ;
seule l'entrée de Wendy17 change après les12s ajoutées à tout le récit.

Le moteur1.2.0 apporte le calque continu `digitalReveal` entre deux vraies images :
[ADR0053](../../../../../process/adr/0053-motion-comics-digital-reveal-and-cover.md).
Une tolérance de frontière de100ps évite un dessin en retard après soustraction des
temps globaux ; elle ne déplace pas les ancres. Avant/exact/après vérifiés à385,64s
pour l'impact et385,99s pour le bas, Wendy à386,02s.

[Contre-revue finale](QA.md) : couverture et phases16/17 réellement ouvertes,
numérotation, pause/mute/seek, tiroir/miniatures, clavier/plein écran et mobile passent.
Les tests du socle, le lint ciblé et les liens de documentation sont contrôlés.
L'orchestrateur a également ouvert les masters, les intervalles, les phases exactes,
le lecteur en couverture et la feuille de revue desktop/mobile. Aucun défaut bloquant.

Le backing conserve exactement le PCM du chapitre hors page17 ; préécoutes AAC
couverture/début et17 décodées sans écrêtage, timing du tir vérifié.
[Mesures/provenance](sound/REVIEW.md). La vérification audio est technique ; aucune
écoute humaine ni acceptation du propriétaire n'est revendiquée.

Trois images reçues : couverture et deux images de nettoyage17 ; deux erreurs réseau
de couverture et un refus de paramètres avant génération sont tracés. Coûts fournisseur
inconnus. Aucune nouvelle voix, génération musicale ou requête SFX ; compteurs audio
inchangés. [Journaux art17](art/p17-clean-REVIEW.md).

## Conservation et sauvegarde

Les sources, films et PDF historiques restent conservés. Cette passe livre le lecteur,
la couverture et les preuves courtes ; elle ne produit aucun nouveau film complet.
Les premiers essais de nettoyage, de contrôle SVG/temps et de chargement des images
de la revue restent tracés ; les rapports finaux désignent les versions retenues.

[Sauvegarde autonome du lecteur v9](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/reader-cover-motion-v9.zip),
[rapport CRC/SHA](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/reader-cover-motion-v9.json).
Le plan explicite inclut médias sélectionnés, sources/prompts/références, SVG,
musique/voix, moteur, contrôles et courtes preuves ; exclut caches de frames,
dépendances et anciens films/ZIP. Les membres sont relus et vérifiés après archivage.

Prochaine action : revue du lecteur et choix des autres effets dans la feuille
illustrée. Aucun exportlong ni nouvel appel média en cours. Aucun commit/push.
