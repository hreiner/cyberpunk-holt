# Direction du mouvement — HOLT

7 novembre 2026. Complément de [l'étape animation](ANIMATION.md), adapté aux comics
narratifs et au moteur Canvas existant. Les références externes sont comparées dans
[l'audit daté](../../process/reviews/2026-11-07-motion-design-skills.md).

## Décider avant d'animer

Pour chaque case, compléter la matrice du storyboard avec : sujet que l'œil doit suivre,
motif du mouvement, état initial, anticipation, accent, récupération, tenue lisible,
horloge, direction, courbe, amplitude et régions immobiles. Un accent principal à la fois ;
réduire l'ambiance autour d'un geste décisif. Le silence visuel peut préparer l'impact.

Choisir le mécanisme autour des assets réellement disponibles. Un mouvement corporel
requiert des poses ou des calques préparés ; une courbe élégante ne répare pas une main
incorrecte. Le même trait animé ne doit pas servir indistinctement le verre, la peau,
la pluie, une voiture et un écran. Préserver les [corrections acquises](LESSONS.md).

## Petite grammaire adaptée au récit

| Intention | Mouvement et rythme | Limite HOLT |
| --- | --- | --- |
| Coup / contact | Préparation lisible, contact bref, recul, résultat tenu ; accent unique | Poses dessinées distinctes, sans morphing ni dédoublement de doigts |
| Verre / objet cassé | État intact tenu, bascule franche à l'ancre, débris puis disparition | Même ancre pour image/SFX, aucune révélation dans la miniature |
| Arrivée / révélation d'un élément | Décélération vers un état stable, puis temps de lecture | Lettres fixes pendant leur lecture ; pas d'animation mot par mot des bulles |
| Sortie | Accélération vers la sortie, sans arrêt artificiel à mi-parcours | Direction cohérente avec le plan suivant ; pas de balayage générique |
| Déplacement régulier | Vitesse constante une fois établie | Linéaire pertinent pour pluie, dérive et mouvement continu |
| Vitesse autour d'un sujet fixe | Montée progressive du flux, croisière, extinction douce | Carrosserie/roues/ombre immobiles ; particules uniquement dans le décor libre |
| Écran, borne ou carte future | Révélation courte puis information stabilisée | À concevoir depuis le récit ; n'ajouter ni coordonnées ni événement non établis |

Le temps de lecture et les voix mesurées gouvernent le rythme. Une durée de publicité,
un BPM ou un ressort de widget ne devient pas une règle pour un dialogue HOLT. Ne pas
couper une réaction ou accélérer une voix pour faire rentrer une animation décorative.
Les raccords suivent le regard, la direction et les objets présents ; un chevauchement
audio n'autorise pas deux états contradictoires ou deux mains superposées.

## Courbes et déterminisme

Décrire l'intention de la courbe avant son nom : accélérer, freiner, traverser à vitesse
stable. Les calques livrés acceptent actuellement `linear` et `smoothstep`, sur la clé
d'arrivée. Toute autre courbe du prototype reste expérimentale jusqu'à ajout explicite
au schéma, au moteur et aux tests. Ne pas écrire `easeOutCubic` dans un manifeste livré
en supposant que le moteur la comprend.

Le [prototype corrigé de référence](../../../anime/motion-comics/prototypes/motion-design-v2/README.md)
explore une enveloppe d'intensité et une montée de vitesse avec fonctions de temps explicites.
Le propriétaire a apprécié cette direction de mouvement ; la version 2 corrige le bras
de la pose de recul. Réemployer anticipation/contact/récupération/tenue, état intact→bris
et flux progressif autour du sujet fixe comme méthodes. Adapter les valeurs à la scène
et aux sons mesurés, sans recopier les durées muettes du prototype sur le film sonore.
Pour un flux variable, intégrer la vitesse pour obtenir le déplacement : multiplier
simplement le temps par une vitesse changeante crée des sauts. Calculer une traînée
depuis le déplacement ou la vitesse effective, pas depuis une horloge indépendante.
Conserver les valeurs bornées, les bords doux et les protections.

Chaque image est calculable directement au temps demandé, sans dépendre des images
précédentes. Tester les seeks dans un ordre différent et un retour à zéro. Les actions
suivent le temps narratif ; l'ambiance peut continuer en pause après son déclenchement.
L'interface peut avoir ses transitions CSS ; elles ne pilotent pas les pixels exportés.

## Regarder les intervalles, pas seulement les poses

Définir des temps de preuve nommés dans le contrat : ouverture, fin d'anticipation,
avant/contact/après à la cadence réelle, récupération, tenue finale ; pour une boucle,
deux extrêmes explicites à récit figé. Partager les ancres avec le son, sans second
fichier de temps divergent. Les secondes et leur conversion en images restent traçables.

Pour une nouveauté, produire une petite planche horodatée de l'intervalle concerné et
un clip court si la vitesse doit être jugée. Ouvrir la planche, puis les vues rapprochées
nécessaires : mains/appuis, crâne, lettres/queues, coutures de masque et contact au sol.
Vérifier aussi à largeur mobile. Une pose finale correcte ne suffit pas à valider le trajet.
Regrouper cette revue sur les vues décisives, corriger puis rouvrir seulement les vues
touchées ; pas de capture pour une logique vérifiable dans les données.

Les contrôles existants `check-motion-layers.cjs`, `check-effects.cjs` et
`check-panel-animation.cjs` restent les preuves de production ; ils ne sont pas remplacés
par une démonstration. Joindre les hashes/configurations et distinguer source Canvas,
MP4 effectivement encodé, mesures, revue visuelle et écoute. Un prototype muet ne prouve
pas une synchronisation sonore. Mettre à jour le [suivi](PROGRESS.md) avec le statut réel.
