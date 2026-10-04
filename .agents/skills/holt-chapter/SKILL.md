---
name: holt-chapter
description: "Design or implement a HOLT chapter using the scenario, game design, technical design and lot handoff workflow."
---

# Concevoir ou livrer un chapitre HOLT

Lire AGENTS.md, docs/INDEX.md et [le processus](../../../docs/chapters/README.md).
Choisir la phase demandée ; ne pas charger les trois phases par défaut.

- Scénario/game design : conserver le texte du propriétaire dans `chN/SCENARIO.md`,
  lire CAPABILITIES et `CH<N-1>-LEGACY.md` (CH2 pour le prochain chapitre), puis le
  gabarit GAME-DESIGN. Décrire choix, jets, échecs intéressants, lectures du dossier et coûts.
  Une absence de scénario est une information nécessaire, pas une invitation à l'inventer.
- Technique : partir du game design retenu, ENGINE-COUPLING et ARCHITECTURE ; vérifier
  seulement les contrats nécessaires. Prévoir `ChapterId`, registres, dossier/archives,
  profils, Chance reportée, cartes/dialogues, voix/fond et bilan. Un nouveau contrat = ADR.
- Implémentation : lire la fiche de reprise, section du lot et ses références. Si la fiche
  manque, la préparer avec les contrats vérifiés avant de distribuer les lots. Les fichiers
  partagés ont un rédacteur. Une mission déjà autorisée ne redemande pas une validation historique.

Actualiser design, fiche, palette et héritage si leurs contrats changent. Vérifier les
branches sur profil et archive réels, y compris un raccord au clic que le debug contourne.
Suivre [AGENT-WORKFLOW](../../../docs/process/AGENT-WORKFLOW.md) pour une délégation autorisée.
Une demande de design seul s'arrête au livrable de design ; ne pas lancer du code.
