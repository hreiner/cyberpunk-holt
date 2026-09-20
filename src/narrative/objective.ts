/**
 * Objectif d'une etape d'exploration (ADR 0013 §4 : "une etape de type
 * `explore` porte : la carte, le point d'apparition, l'objectif, et la
 * condition qui le termine"). Recopie exacte de docs/design/08-EXPLORATION.md
 * "Les objectifs".
 *
 * Type partage entre `src/narrative` (`SceneDef.objective`, sceneRouter.ts)
 * et `src/explore` (`ExploreState.setObjective`) : vit ici, dans `narrative`,
 * plutot que dans `src/explore/types.ts` (qui le reexporte tel quel) pour
 * eviter un cycle narrative -> explore -> narrative -- `src/explore` importe
 * deja `Condition`/`evaluateCondition` de `src/narrative`
 * (docs/process/ARCHITECTURE.md), donc `narrative` doit rester en dessous,
 * jamais au-dessus.
 */

export interface ObjectiveTask {
  id: string;
  label: string;
  entityIds: string[];
}

export interface ObjectiveDef {
  id: string;
  title: string;
  context: string;
  completionTrigger: string;
  tasks?: ObjectiveTask[];
}
