# Missions et profils d'agents

Les skills décrivent une tâche ; les profils décrivent le rôle d'un agent auquel cette
tâche est confiée. Les procédures sont communes à Codex, Claude et tout autre agent.
[AGENTS.md](../../AGENTS.md) garde l'autorité sur le dépôt.

Pour les motion comics, [l'orchestration](../anime/motion-comics/ORCHESTRATION.md)
répartit six étapes sans créer six nouveaux rôles : réalisateur→découpage,
artiste→images/lettres, audio→voix puis bande sonore, animation→mouvements,
montage→lecteur/exports, reviewer→contre-revue des passages. Les skills sont invocables
isolément pour une reprise ciblée. `/holt-motion-comics` dans Claude et
`$holt-motion-comics` dans Codex pointent vers la même procédure. L'invocation seule
n'étend ni les permissions de dépense ni l'autorisation de déléguer de la session.

Une publication motion comics autorisée suit [PUBLISH](../anime/motion-comics/PUBLISH.md).
Répartir préparation des médias web, chargement du lecteur, recettes et contre-revue
sur des fichiers disjoints. L'intégrateur garde la sélection, les empreintes de
release, le push et la vérification du déploiement public. Les anciens gels de
production restent des preuves datées ; le nouveau jalon lie contenu et moteur web.

## Rôles disponibles

| Profil Codex            | Profil Claude           | Mission                                                     | Procédure                                   |
| ----------------------- | ----------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `holt-coordinator`      | `holt-coordinator`      | découper, distribuer les fichiers et intégrer les lots      | [coordination](agents/coordinator.md)       |
| `holt-designer`         | `holt-designer`         | game design ou design technique, chapitre ou combat         | [design](agents/designer.md)                |
| `holt-lot`              | `lot-agent`             | implémenter un lot délimité                                 | [lot](agents/lot.md)                        |
| `holt-character-artist` | `holt-character-artist` | corps, tenue, identité et animation 3D                      | [personnages](agents/character-artist.md)   |
| `holt-audio-director`   | `holt-audio-director`   | musique, ambiances, effets et VO en jeu                     | [audio](agents/audio-director.md)           |
| `holt-art-director`     | `holt-art-director`     | illustrations ou comics cohérents                           | [images](agents/art-director.md)            |
| `holt-visual-reviewer`  | `holt-visual-reviewer`  | corriger un rendu ou mesurer ses performances               | [revue visuelle](agents/visual-reviewer.md) |
| `holt-repo-reviewer`    | `holt-repo-reviewer`    | revue de code/docs et preuve indépendante, en lecture seule | [revue du dépôt](agents/repo-reviewer.md)   |
| `holt-anime-director` | `holt-anime-director` | adaptation, découpage et continuité | [réalisation](agents/anime-director.md) |
| `holt-anime-art-director` | `holt-anime-art-director` | bible visuelle et références | [direction artistique](agents/anime-art-director.md) |
| `holt-anime-animation-director` | `holt-anime-animation-director` | techniques d'animation et rendus | [animation](agents/anime-animation-director.md) |
| `holt-anime-audio-director` | `holt-anime-audio-director` | voix, musique, effets et synchronisation | [audio animé](agents/anime-audio-director.md) |
| `holt-anime-editor` | `holt-anime-editor` | montage et export | [montage](agents/anime-editor.md) |
| `holt-anime-quality-reviewer` | `holt-anime-quality-reviewer` | revue indépendante en lecture seule | [qualité](agents/anime-quality-reviewer.md) |

Les adaptateurs sont générés depuis [agent-profiles.json](agent-profiles.json) :
`.codex/agents/*.toml` et `.claude/agents/*.md`. Ils pointent vers ces procédures, sans
recopier leurs recettes. `npm run agents:sync` les actualise ainsi que les entrées Claude
des skills HOLT ; `npm run workflow:check` détecte une dérive. Les anciens noms
`character-creation`, `mixamo` et `lot-agent` restent utilisables dans Claude.

La découverte Codex repose sur les fichiers TOML de projet, avec `name`, `description`
et `developer_instructions` ([format officiel](https://learn.chatgpt.com/docs/agent-configuration/subagents)).
Les skills de projet vivent dans `.agents/skills/`
([documentation officielle](https://learn.chatgpt.com/docs/build-skills)). Les adaptateurs
Claude suivent ses [profils de sous-agents](https://code.claude.com/docs/en/sub-agents).
Les modèles sont hérités ; aucune configuration globale, aucun compte ni permission
n'est modifié. Si une interface ne sait pas charger un profil, transmettre sa procédure
avec le bloc de mission ci-dessous. La présence d'un profil ne lance aucun agent.

## Bloc de mission

```text
Objectif : <résultat concret et critère de fin>
Phase/lot : <chapitre, numéro, document et section source>
Lire : <procédure de rôle, fiche de reprise et seules références nécessaires>
Toucher : <fichiers ou répertoires dont cet agent est propriétaire>
Coordination : <fichiers partagés, autres travaux à préserver, ordre de passage>
Vérifier : <comportements, parcours, vues ou mesures utiles>
Livrer : <fichiers, preuve, limites et fiche mise à jour>
Ressources : <graine, profil, outils disponibles, budget explicitement donné>
```

Une mission de contenu donne les chemins des sources, pas tout leur texte recopié dans
le prompt. Si la fiche manque, le coordinateur prépare un résumé **vérifié contre le code**
avant de distribuer les lots ; un agent ne doit pas inventer un contrat manquant.

## Propriété et intégration

Par défaut, enchaîner les lots. Paralléliser seulement des fichiers indépendants, si la
délégation est autorisée. `chapter.ts`, les registres, les tests de parcours, les ADR et
`ROADMAP.md` ont un seul rédacteur à la fois. Un artiste peut produire les médias pendant
qu'un développeur prépare leur raccord, avec les noms de fichiers convenus à l'avance.

Chaque agent signale un changement nécessaire hors de son périmètre et sa raison. Le
coordinateur résout la propriété avant deux éditions concurrentes. Aucun agent ne restaure
les modifications d'un autre. Un agent de lot ne committe/pousse pas de son initiative ;
l'intégrateur examine le diff et exécute les vérifications avant une livraison autorisée.

Les workers font les contrôles ciblés ; l'intégrateur exécute `npm run verify` sur le
résultat commun avant commit. Une boucle ou un test de plusieurs minutes sans progrès
se diagnostique : lire son état et sa sortie, borner l'attente et corriger sa cause.
Conserver le sens du contenu ; ne pas réduire une DV pour accélérer un test.

## Rapport de retour

Donner le résultat, les fichiers touchés, les commandes **réellement exécutées**, les
preuves et leurs limites. Pour le récit, ajouter les choix/branches et conséquences ;
pour un asset, sa source, son format et sa revue ; pour les performances, la méthode,
le navigateur/GPU et la différence premières visites/retours. Terminer par la prochaine
action concrète ou le blocage précis, sans revendiquer une validation absente.
