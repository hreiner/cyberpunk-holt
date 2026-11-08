# Étape 1 — récit, cases et rythme

Entrées : périmètre utilisateur, scénario/bible, dernière sélection et corrections
[applicables](LESSONS.md). Sorties : contrats, répliques et conduite des événements.
Cette étape seule ne soumet ni image ni TTS.

## Une page de comics, une scénographie choisie

Composer la page pour sa lecture avant d'adapter l'outil d'assemblage. Indiquer par
bande le nombre de cases, leurs tailles relatives et l'ordre de lecture. Varier ce
nombre selon la scène : grande case de situation, plusieurs cases d'échange ou
d'action, détail ou réaction quand ils servent la progression. Ne pas imposer trois
panoramas empilés, trois bandes fixes ou la même grille à tout le chapitre parce
qu'un ancien script le fait : l'outil suit le découpage.

Varier distance, angle, profondeur, gestes, point de vue et foyer d'attention. Chaque
case apporte action, information, réaction ou rythme ; recadrer la même pose ne
suffit pas. Réserver le décor des bulles dès ce travail. Revoir le chapitre en vue
d'ensemble puis lire les enchaînements : variété, raccords spatiaux et ordre de
lecture. Ne pas remplacer ce jugement par un quota artificiel de variations.

Pour chaque case, fixer ID stable, source narrative, présents/absents, lieu/tenue,
cadrage, action lisible, état initial/final, émotion, textes FR exacts/EN adressés,
locuteur et ordre de lecture. Préserver les incertitudes du scénario ; ne pas ajouter
poursuite, blessure ou identité pour rendre une image plus spectaculaire.

Nommer aussi le gabarit de lettrage déjà retenu (source SVG/JSON et page finale),
réserver les espaces de décor pour les répliques réelles et indiquer les zones occupées
par les personnages/gestes. Tester la place avant de soumettre le dessin ; voir
[composition et contrôle du lettrage](ART.md#composer-avant-de-dessiner-et-contrôler-avant-de-livrer).
Varier le nombre de cases par bande et les poses selon la scène. Un doublon recadré
ne constitue pas une nouvelle pose. Garder les responsabilités propres aux personnages
dans le contrat/bible du projet et répartir les initiatives entre les membres du groupe ;
ne pas transformer une correction propre à une histoire en règle de tous les récits.

Une action décisive doit avoir une représentation : préparation/contact/retrait/issue
ou variante avant/après et éclats, pas seulement une réplique ou un bruit. Prévoir ces
assets dès le contrat. Distinguer intention (ex. fuite) et méthode (voiture mobile ou
voiture fixe avec particules), selon ce qui se lit réellement bien.

Construire une matrice case → enjeu → mouvement → asset/masque → protection → son.
Varier les familles et rythmes ; réserver les bandes lumineuses à une source ponctuelle
justifiée. Le mouvement ne remplace pas les échanges nécessaires au récit.
Préciser le foyer d'attention et les phases anticipation/accent/récupération/tenue,
la direction et le rôle de la courbe selon la [direction du mouvement](MOTION-DESIGN.md).
Éviter deux accents concurrents ; partager les temps de preuve avec les ancres sonores.

Estimer d'abord le temps de lecture français, puis recalculer sur les prises mesurées
sans les accélérer. Retirer les attentes vides tout en gardant compréhension, action et
réaction. Ne pas inventer de nouvelles lignes seulement pour remplir un silence utile.

Pour un événement, définir une ancre partagée à précision d'une image : avant → impact
→ après → réaction. Exemple de méthode, pas de temps universel : laisser la vitre entière
dans le cadre stable, déclencher tir/bris ensemble, faire démarrer la réaction ensuite.
`panel.leadInSeconds` peut réserver cette attente dans la tenue ; `gapSeconds` suit
une prise et n'est pas un décalage avant elle. Pas de fausse prise de silence.

Vérifier aussi vue de page et miniature : aucune révélation anticipée en mode animé.
Spécifier séparément le master papier des modes OFF/mouvements réduits ; le socle
actuel y garde le master statique, qui peut représenter l'état final.

Passage : textes et attribution cohérents, accents UTF-8 réels (pas de mojibake),
états réalisables avec assets nommés, chronologie calculable et responsabilités fixées.
Les durées provisoires restent marquées comme telles jusqu'aux mesures des voix.
