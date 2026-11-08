# Travailler sur HOLT

Lire [AGENTS.md](../AGENTS.md), puis choisir **une ligne** ci-dessous. Le dépôt contient
les décisions et les recettes nécessaires ; les anciens chats servent à un audit, pas au
démarrage d'un lot. [INDEX.md](INDEX.md) est le catalogue, ce document est le parcours de travail.

## Choisir la tâche

| Demande                                      | Skill du dépôt                    | Première lecture                                                                     | Résultat attendu                                             |
| -------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Concevoir ou implémenter un chapitre         | `$holt-chapter`                   | [chapters/README](chapters/README.md), phase concernée                               | scénario conservé, design puis lots et fiche de reprise      |
| Revoir combat, règles ou équilibrage         | `$holt-tactical`                  | [05-TACTICAL-COMBAT](design/05-TACTICAL-COMBAT.md)                                   | décision de design, comportement testé, mesure d'équilibrage |
| Créer/modifier un personnage 3D              | `$holt-character`                 | [pipeline personnages](art/CHARACTER-PIPELINE-FINDINGS.md)                           | spec MPFB, GLB optimisé, apparence et rig raccordés          |
| Chercher/télécharger une animation           | `$holt-mixamo`                    | [procédure Mixamo](art/MIXAMO-WORKFLOW.md)                                           | FBX vérifié, attribution et branchement si demandé           |
| Produire musique, ambiance, bruitage ou voix | `$holt-audio`                     | [production audio](art/AUDIO-WORKFLOW.md)                                            | conduite, prise ciblée, provenance et mix en jeu             |
| Monter une cinématique                       | `$holt-cinematic`                 | [CINEMATIC-SCENES](process/CINEMATIC-SCENES.md)                                      | chronologie, vrais choix, voix/musique et retour jouable     |
| Produire portraits, décors ou icônes         | `$holt-illustration`              | [orchestrateur d'images](art/image-generation/ORCHESTRATOR.md)                       | brief, références, image revue et manifeste                  |
| Adapter le récit en comics                   | `$holt-comics`                    | [édition v2](comics/holt-12-pages/v2/README.md)                                      | scénario, découpage, pages lettrées et livre vérifié         |
| Produire un motion comics sonore | `$holt-motion-comics` | [fabrication](anime/MOTION-COMICS-WORKFLOW.md), [socle et commandes](anime/MOTION-COMICS-TECHNICAL.md), [idées d'effets](anime/MOTION-COMICS-EFFECTS.md) | pages VF, voix EN, effets locaux, lecteur et export MP4 |
| Découper et rythmer un motion comics | `$holt-motion-storyboard` | [contrats et états](anime/motion-comics/STORYBOARD.md) | cases, textes FR/EN et ancres d'action |
| Dessiner et lettrer ses cases | `$holt-motion-art` | [images et bulles](anime/motion-comics/ART.md) | références, mains revues, variantes/calques et lettres FR |
| Produire ou réemployer ses voix | `$holt-motion-voice` | [voix et mesures](anime/motion-comics/VOICE.md) | prises EN expressives, durées et compteur cumulé |
| Mixer sa musique et ses bruitages | `$holt-motion-sound` | [segments et accents](anime/motion-comics/SOUND.md) | onsets alignés, backings et mix réel contrôlé |
| Animer ses mèches, états et décors | `$holt-motion-animation` | [mouvements et protections](anime/motion-comics/ANIMATION.md) | effets adaptés, rigidité anatomique et phases vérifiées |
| Monter, contrôler et livrer le lot | `$holt-motion-delivery` | [lecteur, exports et sauvegarde](anime/motion-comics/DELIVERY.md) | fichiers rejouables, preuves et limites réelles |
| Créer une pièce ou une carte 3D              | `$holt-exploration-zone`          | [guide graphique](art/EXPLORATION-GRAPHICS-GUIDE.md)                                 | carte jouable et décor inscrit dans tous les registres       |
| Corriger rendu, picking ou freeze            | `$holt-exploration-review`        | [guide graphique](art/EXPLORATION-GRAPHICS-GUIDE.md), couche concernée               | reproduction, correction, preuve visuelle ou mesure          |
| Réconcilier docs, skills et outils           | `$holt-maintain-docs`             | [audit des workflows](process/WORKFLOW-AUDIT.md)                                     | sources actuelles, liens valides et recettes exécutables     |
| Dessiner ou améliorer une interface web HOLT | `$holt-frontend-design` | [direction frontend](design/FRONTEND-DESIGN.md), puis le design de l'interface concernée | plan visuel, interface responsive et critique sur captures |
| Modifier l'interface du jeu ou ses commandes tactiles | `$holt-frontend-design` | [UI-DESIGN-SYSTEM](art/UI-DESIGN-SYSTEM.md), [exploration](design/08-EXPLORATION.md) | flux français lisible, clic/glissé/toucher vérifiés |

Point d'entrée du lot motion comics : [orchestration réutilisable](anime/motion-comics/ORCHESTRATION.md),
avec étapes ciblées et [corrections à préserver](anime/motion-comics/LESSONS.md).
Priorités précisées par le propriétaire : références originales inspectées et adaptées
en comics Edgerunners, scénographie et nombre de cases par bande variés, sous-agents
coordonnés par un [orchestrateur qui reste pilote](anime/motion-comics/ORCHESTRATION.md#trois-priorités-de-cohérence).
L'[audit complet des retours comics du 7 novembre](process/reviews/2026-11-07-comics-session-lessons.md)
distingue règles déjà renforcées et ajouts proposés : traçabilité des retours, faits
narratifs, références exactes, composition et critères de passage effectifs.
Commande Claude : `/holt-motion-comics <périmètre>` ; invocation Codex :
`$holt-motion-comics <périmètre>`. Les [anciens contrats de lot](anime/MOTION-COMICS-ORCHESTRATOR.md)
restent des précédents datés. Un plan/audit seul ne déclenche pas la production. Pour un chapitre complet, enchaîner jusqu’au chapitre statique complet, puis attendre la revue du propriétaire sur images et texte avant audio, animation et livraison finale.

Exemple : « Utilise `$holt-audio` pour ajouter une ambiance au prochain lieu, en réemployant
le fond existant si possible. » Les skills se découvrent dans `.agents/skills/` avec Codex ;
les entrées Claude sont générées dans `.claude/skills/`. Rouvrir une session si le catalogue
ne montre pas les nouvelles entrées. Les recettes complètes restent dans `docs/`.

## Démarrer et vérifier

Depuis la racine du dépôt, dans PowerShell ou Bash :

```sh
npm install
npm run doctor
npm run dev
npm run workflow:check
npm run verify
```

Ouvrir **http://localhost:5173/cyberpunk-holt/** ; le préfixe vient de `vite.config.ts` et
sert aussi au déploiement Pages. `doctor` est local et en lecture seule : il ne se connecte
pas à un compte, ne génère pas de média et ne prouve pas qu'OAuth est encore valide.
`npm run doctor -- --scope=audio` ou `--scope=characters` montre seulement les prérequis utiles.

| Besoin de QA                | Entrée                                                                          |
| --------------------------- | ------------------------------------------------------------------------------- |
| Rejouer une partie          | `?seed=revue` ; ajouter `&ai=0` pour accélérer le tactique                      |
| Aller à une scène           | `?scene=ch1.centre-hall&seed=revue`, ou sélecteur de scènes de l'accueil        |
| Commencer le chapitre 2     | `?chapter=2&seed=revue` ; profils de départ ou archive du chapitre 1            |
| Examiner la distribution 3D | `dormitory-aaa.html?lead=franklyn`, `?cast=1`, `?pose=talk`                     |
| Lire l'état exact           | [API de debug](process/DEBUG_API.md) et `tests/e2e/debug-api.d.ts`              |
| Parcours complets           | `npm run test:e2e` ; ciblage : `npx playwright test tests/e2e/chapter2.spec.ts` |
| Équilibrage tactique        | `npx tsx scripts/simulate.ts 200 equilibrage`                                   |

Pour les assets, utiliser la résolution d'URL du jeu (`import.meta.env.BASE_URL` ou les
helpers existants), sans supposer `/assets/` à la racine du domaine.

## Reprendre sans redécouvrir

Pour le motion comics, commencer par le [suivi courant](anime/motion-comics/PROGRESS.md) :
livré, sélection exacte, point du récit, points ouverts et consigne de prochaine session.
Sa mise à jour est obligatoire aux jalons et avant de terminer chaque session, y compris
un plan, un audit ou une correction du lecteur ; voir la [procédure](anime/motion-comics/ORCHESTRATION.md#suivi-et-passage-de-session).

Un lot d'implémentation reçoit la section de design qui le concerne et sa fiche de reprise.
Lire les fichiers nécessaires aux décisions de ce lot, puis enregistrer les nouveaux
constats dans cette fiche. Le scénario validé et les revues anciennes ne sont pas à relire
à chaque passage. Le chapitre suivant part de [CH2-LEGACY](chapters/CH2-LEGACY.md) ; le
chapitre 3 n'est pas encore implémenté.

L'état courant et les travaux restants vivent dans [ROADMAP](process/ROADMAP.md). Les
mesures et revues datées expliquent une livraison ; elles ne certifient pas une version
ultérieure. Une note « non vérifié » doit être datée ou mise à jour avec sa preuve.

## Livrer une tâche

Pour publier un motion comics, appliquer [PUBLISH](anime/motion-comics/PUBLISH.md)
avec `$holt-motion-delivery` : sélection acceptée, dérivés web à empreintes,
chargement progressif, restauration depuis release au build, push et contrôle de
l'URL réellement déployée. Un lecteur `localhost` est une livraison locale ; le
suivi distingue acceptation, paquet, commit et preuve Internet. L'autorisation de
publication donnée pour la tâche reste valable pour ces actions nécessaires.

Vérifier la logique dans Node ou par l'API de debug. Pour ce que cette API contourne
(clic réel sur une entité, invitation au bal, sortie de salle, pause de choix), garder
un parcours au clic pertinent. Une capture sert au cadrage, au style et à la lisibilité ;
elle ne prouve pas l'état logique ni l'absence de freeze. Une écoute réelle est nécessaire
pour juger une voix ou un mix ; un fichier MP3 présent ne suffit pas.

Mettre à jour le document source et le suivi actif avec les résultats réels, les points
ouverts et la prochaine action, puis les points d'entrée concernés si nécessaire. Avant commit,
`npm run verify` doit passer ; après changement de documentation ou de profils,
`npm run workflow:check` aussi. Choisir les e2e selon le parcours modifié, sans relancer
la suite navigateur pour une correction purement documentaire. Aucun commit ou push
n'est déclenché par les outils de maintenance des workflows.

## Travailler avec plusieurs agents

Les rôles prêts à l'emploi, le format de mission et la propriété des fichiers sont dans
[AGENT-WORKFLOW](process/AGENT-WORKFLOW.md). Utiliser les agents pour des lots délimités
lorsque la demande ou les instructions applicables autorisent la délégation. Une tâche
courte se réalise directement. Le modèle et son effort restent ceux de la session, sauf
choix explicite ; aucun ancien nom de modèle n'est nécessaire pour reprendre le projet.

## Outils externes

Node et les dépendances npm suffisent pour travailler sur le jeu. Blender/MPFB, Python,
FFmpeg et les comptes Mixamo/ElevenLabs ne servent qu'à leurs productions. Les chemins
du poste existant et les limites d'accès sont dans [TOOLS](process/TOOLS.md).
Les masters ignorés dans `art-masters/` peuvent manquer sur un nouveau checkout :
les briefs et attributions sont versionnés, les MP3/GLB/images légers servis le sont aussi.
