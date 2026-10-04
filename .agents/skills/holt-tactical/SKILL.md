---
name: holt-tactical
description: "Design, implement or balance HOLT tactical combat rules and complete playable encounter flows."
---

# Combat tactique HOLT

Lire AGENTS.md, docs/INDEX.md, [combat](../../../docs/design/05-TACTICAL-COMBAT.md),
[règles](../../../docs/design/02-RULES-CPRED-LITE.md) et le design du lot. Choisir design,
règle, équilibre ou raccord UI selon la demande.

En design seul, comparer des options avec décisions/action/conséquence/coût et exemple
de tour. Le combat livré reste un exercice taser 3 contre 3 ; blessures létales, ennemis
nouveaux ou compétences évolutives ne sont pas des capacités déjà disponibles.

Pour coder, conserver RNG injecté, couches pures, constantes DV et refus français sans
exception. Contenu équilibrable en données. Un nouveau comportement de règle a un test
utile dans le gardien existant, prioritairement sous forme de cas/table ou propriété globale.
Le rendu reste derrière CharacterRig ; le DOM et Three.js ne rentrent pas dans tactical.

Après changement de règles, fiches, terrain ou IA, mesurer avec
`npx tsx scripts/simulate.ts 200 equilibrage` et documenter résultat/méthode. Vérifier
partie complète, fin/note, premier tour IA et actions illégales ; pour toucher/picking,
examiner le vrai geste en plus du debug. Le résultat automatique de QA ne prouve pas que
le combat est amusant. Mettre à jour design/ADR/debug si leurs contrats évoluent.
