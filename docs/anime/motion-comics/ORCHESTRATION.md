# Orchestrer un lot de motion comics

Procédure courante du 7 novembre 2026. Elle reprend les corrections du propriétaire
dans les [critères de continuité](LESSONS.md). Les livraisons datées sont des preuves ;
la sélection à reprendre et la prochaine action se trouvent dans le [suivi courant](PROGRESS.md),
accessible depuis [INDEX](../../INDEX.md). Les détails restent dans les livraisons liées.

## Trois priorités de cohérence

Le propriétaire précise les priorités techniques et graphiques :

1. Ouvrir les images originales utiles, conserver leur esprit et leurs éléments
   caractéristiques, adapter le rendu en comics Edgerunners selon la
   [double référence sujet/style](ART.md#références-dorigine-et-adaptation-comics-edgerunners).
2. Produire de vraies pages de comics : scénographie et nombre de cases par bande
   choisis et variés selon le récit ; [le découpage pilote l'outil](STORYBOARD.md#une-page-de-comics-une-scénographie-choisie).
3. Employer les sous-agents lorsque cela aide, en gardant l'orchestrateur **pilote
   du résultat complet** : déléguer ne transfère pas la responsabilité finale.

Le pilote choisit références et ancres communes, cadre le découpage, attribue les
périmètres indépendants et tranche les raccords. Il examine les images et retours
des agents, fait corriger les défauts puis ouvre personnellement le comics composé
entier : style, identités, objets/lieux, proportions, scénographie, bandes et lettres.
Il garde sélection et export final. Un avis favorable de sous-agent ne remplace pas
ce contrôle d'ensemble.

Toute mission déléguée transmet références exactes inspectées, ancres de style et
de lettrage, cases voisines utiles et critères de raccord ; éviter de laisser chaque
agent inventer sa propre version visuelle avec un brief vague.

Pour une reprise répartie entre lots, fixer aussi le rythme commun avant leurs travaux :
comparer caméra, tenues réellement calculées, lecture et respirations au passage retenu,
puis partager durées et correspondance des anciennes/nouvelles horloges. Garder les
prises à vitesse native. Une exception tardive nécessaire à la causalité image/parole
est arbitrée par le pilote, versionnée et transmise aux autres lots et au mix ; elle ne
devient pas une modification locale silencieuse. Les paramètres de motion03 sont un
[précédent documenté](../../process/reviews/2026-11-08-motion03-workflow-lessons.md), pas un gabarit universel.

## Invocation

Dans Codex : `$holt-motion-comics <objectif et périmètre>` ; le sélecteur `/skills`
permet aussi de choisir ce skill dans les clients qui l'exposent. Dans Claude Code :
`/holt-motion-comics <objectif et périmètre>`. Le skill Claude généré constitue la
slash command ; aucun second fichier de commande avec le même nom n'est nécessaire.

Exemples de consignes :

```text
$holt-motion-comics Prépare le découpage des quatre prochaines pages, sans génération.
$holt-motion-comics Produis le lot défini dans ce contrat jusqu'au lecteur et au MP4 vérifiés.
$holt-motion-comics Reprends uniquement les animations et sons signalés, conserve le reste.
```

Lire l'objectif après le nom du skill comme la demande utilisateur. Une demande de plan
ou d'audit reste un plan ou un audit ; elle n'autorise pas une production de médias.
Pour une demande de chapitre complet, poursuivre sans arrêt entre récit, contrats, dessins,
corrections, lettrage et assemblage jusqu'au **chapitre statique complet**, prêt à lire.
Une limite technique ou une allocation interne n'est pas un jalon de livraison : poursuivre,
ajuster l'allocation et consigner les faits, sans s'arrêter après un essai ou une page.
Si un obstacle réel empêche la suite, épuiser les solutions disponibles et signaler exactement
ce qui manque ; ne pas présenter une production partielle comme terminée.

Le propriétaire demande une **revue humaine des images et textes du chapitre entier** avant
les voix, le son, l'animation et la production finale. Ce jalon s'applique par défaut aux
nouveaux chapitres motion comics, sauf instruction explicite différente. Livrer le chapitre
statique complet et ses sources, puis attendre ses retours ; corriger et resoumettre jusqu'à
validation. Ne pas produire de nouvelles voix, sons ou animations avant cette validation.
Après validation, enchaîner les étapes audio, animation et livraison sans demander de nouveau
feu vert à chaque sous-étape, dans la limite des instructions de la session. Une correction
ciblée, un audit ou une commande explicitement limitée garde son propre périmètre.

## Reprise et contrat du lot

Lire AGENTS, INDEX, le [suivi courant](PROGRESS.md), puis les seules sources du récit
et de la sélection concernée. Ne pas exiger l'ancien chat pour reconstituer l'état.
Inventorier les fichiers réellement présents, anciennes tentatives et `running` avant
toute nouvelle soumission. Empreinter les sources à préserver, dont images et prises.
Un master local manquant se signale ; ne pas le recréer implicitement depuis une revue.

Créer ou reprendre le dossier de production et sa nouvelle révision :

- `PROGRESS.md` du lot : demande, périmètre, responsabilités, état et prochaine action ;
  journal détaillé lié depuis le suivi courant, sans le remplacer.
- `CONTRACTS.json` ou équivalent lisible : cases, personnages, textes FR/EN, états
  avant/après, événements, durée de lecture, son et intention de mouvement.
- `BUDGET.json` : historique cumulé, allocation du lot, réserve, tentatives/échecs
  inclus ; coût/ID fournisseur absent = inconnu. Les valeurs d'un ancien lot ne sont
  pas le plafond automatique du suivant.
- `REVIEW.md`, `DELIVERY.md` : preuves effectivement obtenues, fichiers, limites et relance.

Les décisions de cadrage ordinaires relèvent de l'agent. Réutiliser les autorisations
de la session ; demander une précision seulement si une information nécessaire manque.
Ne pas activer un fournisseur ou une génération payante hors du périmètre autorisé.

## Suivi et passage de session

L'intégrateur maintient le [suivi courant](PROGRESS.md) comme point d'entrée unique.
Sa mise à jour fait partie du travail : au démarrage après vérification de l'état,
à chaque jalon qui change sélection/avancement/décision, après un échec ou un blocage,
et avant toute fin de session ou livraison, y compris pour une passe UI, un plan ou un audit.
Si une reprise intervient au milieu d'un travail, consigner aussi les essais `running`,
leurs dossiers et la marche à suivre ; ne pas les relancer sans diagnostic.

Garder un résumé court et lisible avec : date/périmètre/statut, ce qui est livré et
ses liens exacts, sélection/versions à préserver, point de continuité narrative,
points ouverts et prochaine action, derniers contrôles/limites et compteurs cumulés
avec leur source. Distinguer fait, en cours et proposé ; ne pas annoncer fini un contrôle
non exécuté. Donner une consigne prête à copier pour la session suivante.

Actualiser les rubriques courantes plutôt qu'empiler les comptes rendus. Les journaux
des lots, budgets, prompts, références et revues datées restent les preuves détaillées.
Une nouvelle session commence par ce résumé et ouvre seulement les références utiles.
Un changement de suivi ne crée pas une autorisation de production ou de dépense.

## Jalon de revue du chapitre statique

Avant de demander la revue, assembler toutes les pages du chapitre dans leur ordre narratif,
avec images, états représentatifs et lettrage français éditable. Fournir un livre ou lecteur
statique local qui permet réellement de lire le chapitre complet, ainsi que les pages, les
sources et un relevé des éventuels défauts. Vérifier présence, ordre, rendu des pages, lisibilité,
accents, attribution et destination des bulles, continuité des personnages et anatomie ; relire
le récit contre sa source. Préparer les variantes d'action nécessaires pour ne pas promettre un
mouvement irréalisable, et les rendre accessibles à la revue si elles modifient l'image.
La revue du propriétaire porte sur l'ensemble images et texte, pas sur un storyboard isolé ni
une poignée d'essais. Conserver la sélection soumise et ses empreintes ; le suivi indique
« en attente de revue du propriétaire » uniquement lorsque ces éléments existent réellement.

Le chapitre statique soumis est un **comics composé dans le style déjà retenu**, avec
ses bulles et queues définitives pour la sélection soumise. Les sources restent éditables
pour les retours suivants. Des cartouches de dialogue placés au-dessus des images ne
remplacent pas ce travail ; la revue humaine n'est pas une étape préalable au lettrage.

L'intégrateur contrôle avant soumission, avec une preuve par page dans la revue :

- comparaison visuelle à une page antérieure retenue, ancre explicitement nommée ;
- réemploi de sa source de lettrage ; place réservée dans le décor, aucune silhouette
  masquée par un corps de bulle, queues courtes sans traverser cheveux, visage ou membre ;
- images et dialogues présents, ordre de lecture, bulles lisibles et queues attribuées ;
- proportions du corps entier, chaînes des bras et jambes, mains et appuis examinés ;
- cases voisines sans répétition de pose injustifiée, bandes adaptées au récit et
  correspondance des identifiants après une nouvelle mise en page ;
- PDF réellement rendu et toutes ses pages ouvertes, vérification des pages corrigées
  à une taille permettant de juger le texte et les membres ;
- sélection et sources préservées, empreintes, contrôles exécutés et limites consignés.

Un contrôle automatique de débordement ne remplace pas ces examens visuels. Un défaut
observé de bulle, d'anatomie ou de continuité rouvre la correction concernée avant la
soumission. Ne pas annoncer « prêt pour revue » avec une finition volontairement différée.

Lorsqu'un retour valide une version, enregistrer date, périmètre et hash exacts dans
le dossier de sélection et mettre à jour les suivis courants : ne pas continuer à
demander la revue déjà obtenue. Distinguer cette validation des images/textes de celle
d'un futur mix ou film. Pour Blue Purple, la [révision statique 05 est validée](../../comics/blue-purple-motion/production/chapter-03-continuation/revision-05/APPROVAL.md).

## Étapes et passages

| Étape | Skill ciblé | Entrée → résultat qui permet de continuer |
| --- | --- | --- |
| 1. Récit et rythme | `$holt-motion-storyboard` | Sources + sélection → contrats FR/EN, états et ancres temporelles cohérents |
| 2. Dessins et bulles | `$holt-motion-art` | Contrats + références exactes → dessins/calques approuvés et lettrage FR éditable |
| 3. Voix | `$holt-motion-voice` | Textes/casting gelés + historique → prises sélectionnées, durées et compteur réel |
| 4. Bande sonore | `$holt-motion-sound` | Chronologie mesurée + prises/SFX → accents alignés, backings et mix vérifiés |
| 5. Animation | `$holt-motion-animation` | Dessins/calques + ancres → mouvements bornés, états/miniature/protections vérifiés |
| 6. Montage et livraison | `$holt-motion-delivery` | Candidats contre-revus → sélection, lecteur, exports et sauvegarde vérifiés |

Les étapes 1 et 2 s’enchaînent jusqu’au chapitre statique complet et à la revue du propriétaire.
Après validation, audio et animation partagent les mêmes durées et ancres mesurées. Une correction
ne rouvre que ses dépendances : déplacer un tir rouvre timing/mix/états, pas la TTS
réemployée ni les mains inchangées. Ne pas régénérer un lot entier pour un défaut local.

Si la délégation est autorisée, attribuer les fichiers selon les profils anime du
[contrat de mission](../../process/AGENT-WORKFLOW.md) : réalisation, art, audio,
animation, montage et contre-revue. L'intégrateur garde seul les manifestes sélectionnés,
les fichiers partagés et la livraison. Chaque agent préserve les autres travaux.
Pour une passe de lettrage, attribuer les mappings de pages disjointes à leurs auteurs.
Le relecteur corrige directement son mapping attribué après transfert explicite de
propriété, plutôt que multiplier les relais de coordonnées. Un seul intégrateur lance
les exports d'une même sélection ; les agents confirment leurs fichiers prêts puis
contrôlent les pages concernées du même export. Éviter les exports qui lisent des
mappings encore en écriture et les retouches de fichiers déjà approuvés sans révision.
Sans délégation disponible ou autorisée, exécuter ces périmètres successivement.

## Gel et fin

Contre-revoir contrats avant soumission, images avant assemblage et mouvement réel avant
les longs exports. Réserver les captures aux vues décisives et distinguer leur jugement
des assertions de chronologie. Une revue favorable vaut pour les fichiers/hashes vus.

Geler images, configuration et moteur avant export ; deux exports simultanés maximum.
Un défaut après gel conserve ses traces et rouvre les seules preuves concernées avant
un nouveau dossier/version. Ne pas modifier silencieusement un export en cours.
Le propriétaire du moteur et celui du lot signalent leur stabilité avant la contre-revue
croisée ; celle-ci empreinte aussi les médias chargés. Si le moteur ou un masque change,
le pilote réutilise les preuves encore exactes et fait reprendre les autres. Il ouvre les
raccords et intervalles décisifs du résultat intégré avant de conclure, même si les avis
de lots sont favorables.

Terminer par les fichiers demandés présents et contrôlés, lecteur testé, limites
d'écoute/revue explicites et sauvegarde des masters ignorés par Git. Pour un plan/audit,
livrer le plan/rapport sans annoncer des médias produits. Aucun commit/push implicite.
Mettre à jour le suivi courant avec les fichiers réels, les points ouverts et la prochaine
action avant de conclure ; pour une production, le faire avant le gel documentaire et la sauvegarde.

## Compatibilité des commandes

Sources officielles consultées le 7 novembre 2026 : [skills Codex](https://learn.chatgpt.com/docs/build-skills),
[prompts Codex dépréciés](https://learn.chatgpt.com/docs/custom-prompts),
[skills et slash commands Claude](https://code.claude.com/docs/en/skills).
Le dépôt utilise `.agents/skills` et les adaptateurs `.claude/skills` synchronisés.
Il n'installe pas de prompt global Codex. Si une interface n'affiche pas encore un
nouveau skill, recharger la session ; la procédure reste invocable par son chemin.
