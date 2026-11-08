# Étape 5 — animation locale et états narratifs

Entrées : dessins/calques approuvés, ancres mesurées et zones protégées. Sorties : plans
de données et preuves réelles des mouvements. Formats/types actuels dans le
[socle](../MOTION-COMICS-TECHNICAL.md) et le [répertoire](../MOTION-COMICS-EFFECTS.md).

Avant les réglages, appliquer la [direction du mouvement](MOTION-DESIGN.md) : sujet
principal, anticipation, accent, récupération, tenue lisible et courbe justifiée.
Réemployer les assets compatibles et choisir le mécanisme autour de leur géométrie.
Échantillonner aussi l'intervalle entre poses ; une tenue finale ne valide pas le trajet.

Choisir une méthode par intention : poses dessinées pour un vrai coup/franchissement,
variante intacte/brisée et éclats pour une vitre, effets de matière dans un décor libre,
microdéformation d'une mèche. Éviter de fabriquer un geste par déformation globale du
corps ou fondu qui dédouble les doigts. Les bandes lumineuses restent ponctuelles.

Pour les cheveux, inspecter les pointes et placer de petites régions déformables ;
protéger crâne, sommet, front, yeux, bouche et col. Les bords de la région restent fixes.
Comparer les deux extrêmes avec les mêmes cadrage/contexte : le mouvement des mèches
doit être perceptible et les parties rigides rester identiques. Ne pas augmenter une
grande région de coiffure simplement pour atteindre un compte de pixels.

Ne pas déplacer automatiquement un véhicule dessiné. Si le rendu 2D paraît flottant,
privilégier, selon l'intention retenue, une voiture fixe et du vent/particules dans les
zones libres. Protéger carrosserie, roues, ombre et bulles. Un déplacement réellement
demandé requiert RGBA/fond reconstruit, perspective et contacts/ombre plausibles ; les
roues non tournantes ou le sprite rigide sont des limites à déclarer, pas une animation
corporelle complète. Vérifier l'ancrage à la résolution de sortie, pas seulement en planche.

Les états avant/impact/après et révélations suivent le temps narratif local. Pause les
fige ; une ambiance peut continuer sur son horloge séparée après son gate narratif.
Tester juste avant, à l'instant exact et après l'événement, y compris en vue page et
miniature. Respecter la convention OFF/mouvements réduits du master statique et la
documenter. Ne pas avancer le récit parce que la phase ambiante continue.

Composer dessin/poses → effets sur le dessin courant → lettres. Restaurer les protections
depuis l'art courant, sans réinjecter une ancienne main/pose. Employer un SVG de queues
adapté si les locuteurs changent de position. Vérifier masques, coutures, alpha et limites
de case ; conserver les mêmes contacts de mobilier dans les variantes d'état.

Le moteur1.1.2 accepte cette chaîne avec `motionBaseImage` et `letteringImage`
même sans poses corporelles ; aucun calque factice ne doit être créé pour activer le
lettrage final. Si une nouvelle rasterisation SVG change l'anticrénelage d'une sélection
approuvée, des plaques opaques de pixels du master peuvent protéger les bulles/queues
exactes, en gardant le SVG éditable et en documentant la base réellement utilisée.
Voir [ADR0052](../../process/adr/0052-motion-comics-separated-lettering.md).

Depuis1.2.0, une révélation entre deux vraies images peut employer `digitalReveal` :
deux `frames`, durée de révélation bornée, grille et déplacement local de fragments.
Les états initial/final restent exacts et les lettres passent après la transition.
Ce mode convient à une vision subjective ; il ne fabrique pas un geste corporel.
Le vieux `digitalVision` garde sa fonction et ses coordonnées propres à page3.
[Décision et contraintes](../../process/adr/0053-motion-comics-digital-reveal-and-cover.md).

Depuis1.3.0, `clipPolygon` suit la surface réelle d'un effet ou calque :3–16points
normalisés dans la page, contenus dans son rectangle. Un effet de matière borné
`clock: "story"` accepte `envelope: {attackSeconds, releaseSeconds}` ; leur somme
doit tenir dans son intervalle. `wave` anime seulement les crêtes d'eau et l'écume,
sans déplacer les acteurs ni le quai. La pluie nouvellement paramétrée utilise
`rainFlow:true` ; sans ce champ, même les anciens paramètres ignorés conservent
strictement le rendu historique. [ADR0054](../../process/adr/0054-motion-comics-masks-and-narrative-reveals.md).

`panelReveals: [{panelId, atSeconds}]` masque la case future après la composition
des lettres, dans le lecteur et ses miniatures. Tester avant/exact/après avec les
vraies images, texte inclus. OFF reste le master statique. Une porte ou un panneau
qui ferme exige de comparer ses dimensions, poignée et contacts entre toutes les
poses : une nouvelle pose peut créer une croissance ou un rebond malgré des mains
plausibles. Rejeter l'état incohérent ; si le récit le permet, choisir explicitement
une ellipse franche entre quelques dessins cohérents plutôt qu'un faux morphing.

Revoir la matière dans la composition finale avec lettres et protections, pas seulement
dans son calque isolé : un accent peut être entièrement couvert par une bulle, comme
en13.1 avant correction. Pour une impulsion, ouvrir avant, pic et retour ; pour une chute,
regarder accélération, premier contact, occlusion puis eau seule ; pour des battants,
regarder plusieurs angles et le fond qui reste fixe. Une tenue suivie d'une révélation
peut être le bon montage, mais la décrire comme telle, sans revendiquer une animation
corporelle continue. Les [contre-revues motion03](../../process/reviews/2026-11-08-motion03-workflow-lessons.md)
distinguent ces choix des défauts corrigés.

Avant d'allonger une suite jugée rapide, mesurer transitions, tenues réellement
calculées, budget de lecture et prises du passage apprécié. Écrire un contrat commun
de rythme ; recaler les voix à pente1, puis reconstruire musique/ambiances sur les
nouvelles ancres. Les exceptions utiles sont explicites : révélation avant parole,
contact, fermeture ou ouverture tenue. Ne pas recopier un chiffre universel.

Contrôler déterminisme, sources inchangées, pause, arrêt, master exact, tenue finale et
reprise. Utiliser un contexte de lecture Canvas comparable pour les comparaisons exactes :
une lecture GPU et une autre CPU peuvent donner un faux écart. Pour les frontières
flottantes, tester l'instant contractuel et construire les données à partir de la même
ancre ; ne pas déplacer arbitrairement l'événement pour faire passer le test.

Les seuils numériques détectent une absence de mouvement, pas sa qualité. Si deux phases
d'une pulsation se ressemblent, conserver la trace et ajouter un échantillon explicite
à récit figé, avec même seuil et phases documentées. Ne pas masquer un échec par un seuil
abaissé. La revue visuelle décide cadrage, naturel et lisibilité ; la preuve de calque
physique doit être rattachée aux bons médias/configuration, pas une fixture géométrique.

Passage : quelques vues décisives réellement ouvertes, mouvement perceptible par case
concernée, protections vérifiées et rapports/hashs exacts. Garder captures/MP4 sous
`art-masters/`. Une correction rouvre cette vue, pas toutes les pages déjà inchangées.
