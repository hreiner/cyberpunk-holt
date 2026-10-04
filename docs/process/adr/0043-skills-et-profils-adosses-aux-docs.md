# ADR 0043 — Skills et profils d'agents adossés aux docs

**Statut : accepté · Date : 2026-10-04**

## Contexte

Le propriétaire demande une revue des sessions, de `.claude/` et des workflows pour
faciliter personnages, chapitres, médias et ElevenLabs. Les recettes MPFB/Mixamo n'étaient
découvrables que dans Claude ; des instructions historiques contredisaient les livraisons.

## Décision

Les recettes durables vivent dans `docs/`, accessibles par `docs/WORKFLOWS.md` et INDEX.
Les skills HOLT de `.agents/skills/` sont des entrées courtes par tâche. Les procédures
de rôles vivent dans `docs/process/agents/` ; `agent-profiles.json` donne leurs noms.

Un outil Node génère les adaptateurs `.codex/agents/`, `.claude/agents/` et les entrées
Claude des skills HOLT. Les anciens noms utiles sont conservés. Aucun modèle, compte,
permission globale ou lancement automatique de sous-agent n'est imposé. Un contrôle local
vérifie liens, métadonnées de skills et dérive des adaptateurs ; un doctor repère les outils
sans accès compte ni génération. Les reprises audio exigent une cible et offrent un dry-run.
Le constructeur de personnages propage les erreurs Blender avant optimisation ; les scripts
shell conservent LF sur Windows.

## Conséquences

Une recette change dans sa source, puis `npm run agents:sync` et `npm run workflow:check`.
Codex/Claude partagent les mêmes procédures sans deux copies divergentes. Les revues
historiques restent datées. La découverte native et les comptes externes dépendent encore
de l'environnement ; leur présence dans le dépôt ne les provisionne pas.
