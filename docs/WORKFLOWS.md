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
| Créer une pièce ou une carte 3D              | `$holt-exploration-zone`          | [guide graphique](art/EXPLORATION-GRAPHICS-GUIDE.md)                                 | carte jouable et décor inscrit dans tous les registres       |
| Corriger rendu, picking ou freeze            | `$holt-exploration-review`        | [guide graphique](art/EXPLORATION-GRAPHICS-GUIDE.md), couche concernée               | reproduction, correction, preuve visuelle ou mesure          |
| Réconcilier docs, skills et outils           | `$holt-maintain-docs`             | [audit des workflows](process/WORKFLOW-AUDIT.md)                                     | sources actuelles, liens valides et recettes exécutables     |
| Modifier interface ou commandes tactiles     | aucun skill supplémentaire requis | [UI-DESIGN-SYSTEM](art/UI-DESIGN-SYSTEM.md), [exploration](design/08-EXPLORATION.md) | flux français lisible, clic/glissé/toucher vérifiés          |

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

Un lot d'implémentation reçoit la section de design qui le concerne et sa fiche de reprise.
Lire les fichiers nécessaires aux décisions de ce lot, puis enregistrer les nouveaux
constats dans cette fiche. Le scénario validé et les revues anciennes ne sont pas à relire
à chaque passage. Le chapitre suivant part de [CH2-LEGACY](chapters/CH2-LEGACY.md) ; le
chapitre 3 n'est pas encore implémenté.

L'état courant et les travaux restants vivent dans [ROADMAP](process/ROADMAP.md). Les
mesures et revues datées expliquent une livraison ; elles ne certifient pas une version
ultérieure. Une note « non vérifié » doit être datée ou mise à jour avec sa preuve.

## Livrer une tâche

Vérifier la logique dans Node ou par l'API de debug. Pour ce que cette API contourne
(clic réel sur une entité, invitation au bal, sortie de salle, pause de choix), garder
un parcours au clic pertinent. Une capture sert au cadrage, au style et à la lisibilité ;
elle ne prouve pas l'état logique ni l'absence de freeze. Une écoute réelle est nécessaire
pour juger une voix ou un mix ; un fichier MP3 présent ne suffit pas.

Mettre à jour le document source, puis ses points d'entrée si nécessaire. Avant commit,
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
