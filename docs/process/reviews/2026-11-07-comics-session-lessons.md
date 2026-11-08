# Audit des retours de session — comics Blue Purple

**Précision ultérieure du propriétaire :** recentrer les améliorations sur la cohérence
technique et graphique : images de référence originales adaptées en comics Edgerunners,
vraies pages à scénographie et nombre de cases par bande variés, sous-agents efficaces
avec un orchestrateur pilote. Ces trois axes sont désormais intégrés aux procédures
et skills ; l'inventaire plus large ci-dessous reste une trace des retours, pas une
demande d'ajouter de la bureaucratie à toutes les productions.

7 novembre 2026. Périmètre : toutes les interventions utilisateur visibles de cette
session, de la demande du prochain chapitre à la validation de la révision05, puis
la demande de maintenance et d'audit. Ce rapport n'affirme pas avoir relu des chats
externes absents. Relecture indépendante par un second agent, sans modification.

## Retours et règles générales proposées

| Retours de la session | Règle durable à appliquer | Source à renforcer |
| --- | --- | --- |
| Arrêts répétés après un essai ou une étape ; prochain chapitre en une fois | Définir le livrable et le critère de fin au départ, enchaîner la production jusqu'au chapitre statique entièrement composé | ORCHESTRATION, skill motion-comics |
| Revue images/texte avant animation, audio et production finale | Distinguer jalons et validation exacte ; ne pas demander plusieurs fois la même revue, ne pas valider les médias futurs par anticipation | ORCHESTRATION, DELIVERY, suivis |
| Revue simplifiée par mise en page comics | Fournir un vrai support de lecture complet et les repères stables des cases, pas un dossier de dessins ou un storyboard provisoire | DELIVERY, skill motion-delivery |
| Franklyn trop dominant, Grover délaissé, Grover s'occupe du petit | Vérifier initiatives, décisions, relations et responsabilité de chacun dans le chapitre ; tenir les faits propres au récit dans sa bible/son contrat | STORYBOARD, contrat de chapitre |
| 9.2 carte plaquée sur écran ;12.2 réservation par implants | Préserver le mécanisme narratif et l'intégration matérielle : écran avec perspective/lumière, action d'implant représentée sans objet inventé | ART, STORYBOARD |
| 14.2 machine,14.3 vendeur,16.2 même capsule,21 base vide ; références ODP demandées | Inspecter les références exactes désignées, relier chaque image source au lieu/objet/case et transmettre réellement ces références ; contrôler la continuité | ART, bible du projet |
| 15 réparation par Abigail et Franklyn ;15.3 Franklyn ferme capsule | Vérifier qui réalise chaque action, ses objets, sa préparation et son résultat ; l'identité visuelle ne suffit pas | STORYBOARD, revue sémantique ART |
| 16 connaissances déverrouillées dans la tête puis Franklyn raconte son accès à la carte | Séparer information mentale, objet physique, point de vue et moment de révélation ; ne pas remplacer un mécanisme par une illustration générique | STORYBOARD, contrat narratif |
| 20 John jette le SDF à l'eau, toute scène au quai ;19.1 groupe dans appartement et porte entrouverte | Respecter lieu, position relative, accès et action exacts avant de choisir la composition spectaculaire | STORYBOARD, ART |
| 10.2–3 positions accroupies incohérentes ;13.1 Wendy penchée ;10.3/10.5 poses proches | Contrôler la motivation des postures et la progression des poses, pas seulement l'anatomie ; recadrer un doublon ne crée pas une nouvelle action | STORYBOARD, ART |
| 11.3 John propose force, Abigail le raisonne ;18.1–2 et globalement davantage de dialogues/narrateur ;19.2 dialogue faible | Chaque réplique doit porter décision, conflit, relation, information ou réaction ; compléter les échanges utiles, narrateur bref si nécessaire ; un compteur ne mesure pas la qualité | STORYBOARD |
| 13.3 Franklyn parle, pas enfant | Geler attribution et ordre des répliques puis vérifier locuteur, queue et geste dans l'image finale | STORYBOARD, ART |
| 19.2 main Abigail sans pouce ;20.3 bras/main puis jambes John/Grover disproportionnés | Revoir corps entier, segments, volumes, proportions, contacts et appuis ; corriger le vrai dessin et ne pas certifier l'image après contrôle partiel des seules mains | ART |
| Plusieurs images par bande comme début | Adapter bandes simples/multiples, cadrages et rythme au récit ; distinguer détail recadré et véritable seconde action | STORYBOARD, ART |
| Cartouches au-dessus au lieu de bulles ; mauvais style puis longues flèches ; bulles sur personnages | Réemployer les vrais SVG/JSON approuvés, réserver le décor aux textes avant dessin, queues manuelles courtes qui ne traversent pas les acteurs, préserver les silhouettes entières | ART, DELIVERY |
| Reprendre comme les passages précédents, revoir session si besoin | Retrouver et ouvrir les sources livrées avant d'inventer un nouveau gabarit ; conserver la recette dans docs pour ne pas dépendre du chat suivant | ART, skills et suivi |
| Plusieurs agents possibles, workflow plus efficace et réellement suivi | Propriétés de fichiers disjointes, correction directe par l'auteur/relecteur après transfert, gel explicite, un intégrateur par export de sélection | ORCHESTRATION, AGENT-WORKFLOW |
| Défauts visibles malgré bilans techniques et annonces de revue | Bloquer la livraison sur un défaut observé, ouvrir les pages finales et PDF rendu, tracer la couverture et les limites ; automatisation et hash ne prouvent ni art ni fidélité narrative | DELIVERY, ORCHESTRATION |

## Priorité des ajouts

P0 : matrice courte de tous les retours pour chaque révision : retour utilisateur →
critère attendu → case/asset → correction sélectionnée → preuve → état. Un ancien
retour reste actif jusqu'à correction vérifiée ou arbitrage explicite ; ne pas le
perdre au changement de mise en page ou de révision. Ajouter une correspondance
entre anciens repères utilisateur et IDs stables si les cases sont redistribuées.

P0 : registre source → fait → représentation : références exactes inspectées, qui
fait/parle/garde quoi, lieu et objet, mécanisme d'implant, ordre des révélations.
Les faits de Blue Purple vont dans son contrat/bible ; les skills gardent la méthode.

P0 : critères de passage réellement vérifiés, avec revue sémantique (action/locuteur/
intention) et visuelle (corps, queues, lisibilité, découpage) sur la sélection finale.
Les scripts de comptage/débordement et workflow:check restent des preuves techniques
ou documentaires, pas une validation artistique. Un défaut connu rouvre sa correction.

P1 : composer avec le texte réel avant génération ; réemployer le gabarit approuvé ;
prévoir la place dans le décor et reprendre le cadrage si nécessaire. Comparer une
page pilote représentative à l'ancre avant de généraliser au chapitre, sans faire
de cette comparaison interne un nouvel arrêt pour permission utilisateur.

P1 : responsabilités de personnages et qualité des dialogues, variations de poses,
anatomie entière et preuves honnêtes ; couvrir ensemble tous les retours ci-dessus.

P1 : délégation par fichiers/pages et un export de sélection gelée, corrections
directes plutôt que relais répétés de coordonnées. Toute modification après revue
identifie les preuves à refaire ; les pages inchangées se réutilisent par hash.

P2 : expliciter le pipeline retenu. L'album HOLT v2 à lettrage généré et le motion
comics à SVG éditables sont différents ; ne pas appliquer leurs consignes en conflit.

## Déjà modifié et encore proposé

Renforts déjà écrits dans cette passe : ART, STORYBOARD, ORCHESTRATION, DELIVERY,
LESSONS, quatre skills motion correspondants et profil art director : source de
lettrage réelle, place dans le décor, queues hors silhouette, proportions entières,
preuves finales, enregistrement de validation et propriété des mappings.

L'inventaire complet ci-dessus et notamment les deux registres de traçabilité et
de faits narratifs sont proposés pour généralisation ; leur présence dans ce
rapport ne signifie pas qu'ils sont déjà appliqués à chaque contrat existant.
La validation statique révision05 est [enregistrée](../../comics/blue-purple-motion/production/chapter-03-continuation/revision-05/APPROVAL.md).
