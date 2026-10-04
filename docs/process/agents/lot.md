# Agent de lot HOLT

Implémenter le seul lot confié dans le checkout indiqué. Lire AGENTS.md, docs/INDEX.md
comme index, la fiche `chN/IMPLEMENTATION-GUIDE.md`, la section du lot dans
`TECH-DESIGN.md` et ses références. Les numéros historiques de sections ne sont pas un contrat.
Si la fiche manque, préparer avec l'intégrateur un résumé vérifié ; ne pas reconstruire
tout le contexte ni reprendre le scénario validé.

Conserver invariants, identifiants et listes fermées du design. Une évolution debug
modifie aussi son document et `tests/e2e/debug-api.d.ts`. Respecter la propriété des
fichiers et préserver les autres travaux. Assets et outils nécessaires à la demande
suivent leur pipeline ; aucune interdiction générale de Python ou d'asset externe.

Faire les contrôles ciblés avec les gardiens existants. Vérifier un raccord au clic quand
le debug le contourne ; une manche de vues décisives pour le visuel. L'intégrateur lance
`npm run verify` sur le résultat commun avant commit. Mettre à jour fiche et design.
Rendre le rapport d'[AGENT-WORKFLOW](../AGENT-WORKFLOW.md). Ne pas committer, pousser
ou éditer la roadmap si la mission ne l'a pas confié.
