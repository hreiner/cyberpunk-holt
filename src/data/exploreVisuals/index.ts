/**
 * Registre des réglages de rendu d'exploration par carte (ADR 0024 §4). Avant ce lot,
 * `ExploreView` comparait `MapDef.id` à `'holt'`/`'centre-examen'` à plusieurs endroits pour
 * choisir la palette (chaude/froide), la matière des murs et l'architecture du dortoir --
 * une carte nouvelle (le chapitre 2 en ajoute plusieurs) sortait donc sans habillage tant que
 * personne n'allait modifier `exploreView.ts` à la main.
 *
 * `EXPLORE_VISUALS[MapDef.id]` déplace ce choix en données ; une carte absente du registre
 * reçoit `DEFAULT_EXPLORE_VISUALS` (palette chaude, pas d'architecture de dortoir) plutôt que
 * de ne rien afficher. Le rectangle de conteneurs empilés (cour du centre d'examen) N'EST PAS
 * ici : il se déduit directement de `MapDef.tacticalArea` (voir `ExploreView.isContainerYardCell`),
 * qui porte déjà cette information -- la dupliquer dans ce registre aurait pu désynchroniser
 * les deux.
 *
 * Sans rapport avec `ExploreVisualMapDef`/`src/data/exploreVisualTypes.ts` (le placement du
 * mobilier, epic 4) : ce registre-ci ne porte que des réglages globaux à la carte.
 */

export interface ExploreVisuals {
  /**
   * Palette froide : éclairage plus dur (`addExplorationLighting`), matière de mur
   * `coldConcreteWall`, bande murale et teinte de sol assorties. L'académie (holt) est
   * entretenue et chaude ; le centre d'examen abandonné est froid.
   */
  coldPalette: boolean;
  /**
   * Mezzanine, caméra de surveillance et lits superposés du dortoir
   * (`ExploreView.buildDormitoryArchitecture`) : vrai seulement à holt (positions câblées en
   * dur sur SA géométrie, jamais généralisées à une autre carte par ce booléen seul).
   */
  dormitoryArchitecture: boolean;
  /**
   * Sol « extérieur » sous toute la carte, entre les pièces (`ExploreView.floorPlane`) : absent
   * (`false`) quand rien n'existe entre les pièces -- les conduits (lot 5.9), creusés dans le
   * noir, où un sol continu entre deux conduits se lisait comme une cour à ciel ouvert. Le plan
   * reste la cible des clics de déplacement, simplement non dessiné. Omis : `true`.
   */
  exteriorGround?: boolean;
}

export const DEFAULT_EXPLORE_VISUALS: ExploreVisuals = {
  coldPalette: false,
  dormitoryArchitecture: false,
};

export const EXPLORE_VISUALS: Record<string, ExploreVisuals> = {
  holt: {
    coldPalette: false,
    dormitoryArchitecture: true,
  },
  'centre-examen': {
    coldPalette: true,
    dormitoryArchitecture: false,
  },
  // Variante de nuit (lot 5.8) : même bâtiment que `holt`, mêmes réglages -- l'ADR 0024 dit
  // « habillage choisi par registre », pas « par condition sur l'heure du jour » ; la nuit
  // elle-même se voit dans la lumière ambiante (`ExploreView`, réglage global, pas par carte)
  // et dans la narration, jamais dans ce booléen.
  'holt-nuit': {
    coldPalette: false,
    dormitoryArchitecture: true,
  },
  // Le campement (lot 5.10) : un extérieur de nuit adossé aux murs d'une station-service en
  // ruine -- béton froid (`coldConcreteWall`), comme le centre d'examen abandonné, jamais la
  // peinture crème de l'académie.
  // Les conduits et la cantine des petits (lot 5.9) : tôle et béton de service, jamais la peinture
  // crème des salles de l'académie -- la palette froide, que la cantine en feu réchauffe par sa
  // seule lumière (`setNightMood('cantine')`).
  conduits: {
    coldPalette: true,
    dormitoryArchitecture: false,
    exteriorGround: false,
  },
  campement: {
    coldPalette: true,
    dormitoryArchitecture: false,
  },
};

/** Réglages de `mapId`, ou le repli neutre si la carte n'est pas déclarée. */
export function exploreVisualsFor(mapId: string): ExploreVisuals {
  return EXPLORE_VISUALS[mapId] ?? DEFAULT_EXPLORE_VISUALS;
}
