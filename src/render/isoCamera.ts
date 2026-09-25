/**
 * Camera isometrique 3/4.
 *
 * Choix de design (ADR 0001) : camera orthographique fixe, orientable par pas
 * de 90 degres, zoom limite. Pas de camera libre : la lisibilite du combat au
 * tour par tour prime, et cela evite d'avoir a soigner les personnages vus de
 * pres (donc pas d'animation faciale).
 */

import * as THREE from 'three';

export const ISO_ELEVATION_DEG = 35.264; // arctan(1/sqrt(2)) : vraie isometrie
export const MIN_ZOOM = 18;
export const MAX_ZOOM = 70;
/** Distance (unites monde) entre la camera et sa cible : fixe, seul le zoom (taille du frustum) change. */
export const CAMERA_DISTANCE = 120;
/** Vivacite de la rotation animee (plus grand = plus rapide). */
const ROTATE_SHARPNESS = 12;
/** Duree du recentrage amorti (`animateTargetTo`, `prefers-reduced-motion` mis a part). */
const RECENTER_DURATION_S = 0.45;
/** Part minimale de l'ecran consideree comme libre, quoi que couvre le HUD (voir `applyZoom`). */
const MIN_FREE_FRACTION = 0.3;

export interface ZoomBounds {
  min: number;
  max: number;
}

export class IsoCamera {
  readonly camera: THREE.OrthographicCamera;
  /** Cible de la rotation, en quarts de tour (continu : peut depasser 0..3). */
  private quarter = 0;
  /** Angle affiche, en quarts de tour : rattrape `quarter` en douceur. */
  private shownQuarter = 0;
  private zoom = 34;
  private readonly minZoom: number;
  private readonly maxZoom: number;
  private target = new THREE.Vector3(0, 0, 0);
  /** Recentrage amorti en cours (`animateTargetTo`), `null` si aucun. */
  private recenter: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null = null;
  /**
   * Marge reservee a un HUD opaque fixe en pixels (panneaux lateraux, bandeaux
   * haut/bas) : `target` reste le centre LOGIQUE du gameplay, mais le rendu se
   * recentre dans la zone encore visible pour qu'aucune etiquette flottante ne
   * finisse sous un panneau. Nul par defaut (exploration, qui n'appelle jamais
   * `setSafeAreaInsetsPx`) : voir `GameApp` pour l'unique appelant.
   */
  private insetsPx = { left: 0, right: 0, top: 0, bottom: 0 };
  private viewportHeightPx = 1;
  /** Dernier `aspect` recu : `setSafeAreaInsetsPx` doit pouvoir refaire l'echelle sans qu'on le lui repasse. */
  private lastAspect = 1;

  /**
   * `initialZoom` : point de depart different du defaut (34), sans toucher aux bornes
   * `zoomBounds` (la molette continue d'aller de l'une a l'autre). L'exploration ne le passe
   * jamais -- son cadrage d'entree est inchange ; seule la vue tactique l'utilise pour demarrer
   * plus pres (voir `GameApp`, lisibilite des cadets a la distance de jeu par defaut).
   */
  constructor(aspect: number, zoomBounds?: ZoomBounds, initialZoom?: number) {
    this.minZoom = zoomBounds?.min ?? MIN_ZOOM;
    this.maxZoom = zoomBounds?.max ?? MAX_ZOOM;
    if (initialZoom !== undefined) this.zoom = initialZoom;
    this.zoom = THREE.MathUtils.clamp(this.zoom, this.minZoom, this.maxZoom);
    this.camera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, -500, 1000);
    this.applyZoom(aspect);
    this.update();
  }

  /** Deplace la cible immediatement (panoramique libre) et annule un recentrage amorti en cours. */
  setTarget(x: number, z: number): void {
    this.recenter = null;
    this.target.set(x, 0, z);
    this.update();
  }

  getTarget(): { x: number; z: number } {
    return { x: this.target.x, z: this.target.z };
  }

  lookAtCell(x: number, z: number): void {
    this.setTarget(x, z);
  }

  /**
   * Recentre la cible sur `(x, z)`. Amorti par defaut ; `instant` (mouvement
   * reduit, 08-EXPLORATION.md "Accessibilite") saute directement a la cible.
   */
  animateTargetTo(x: number, z: number, instant: boolean): void {
    if (instant) {
      this.setTarget(x, z);
      return;
    }
    this.recenter = { from: this.target.clone(), to: new THREE.Vector3(x, 0, z), t: 0 };
  }

  /** Tourne la camera de `step` quarts de tour ; la rotation est animee par `tick()`. */
  rotate(step: number): void {
    this.quarter += step;
  }

  /** Fait avancer la rotation et le recentrage amortis. Renvoie true tant que la camera bouge. */
  tick(dt: number): boolean {
    let moving = false;
    const gap = this.quarter - this.shownQuarter;
    if (Math.abs(gap) < 0.001) {
      if (gap !== 0) {
        this.shownQuarter = this.quarter;
        this.update();
      }
    } else {
      // Lissage exponentiel : rapide au debut, doux a l'arrivee.
      this.shownQuarter += gap * (1 - Math.exp(-ROTATE_SHARPNESS * dt));
      this.update();
      moving = true;
    }
    if (this.recenter) {
      this.recenter.t = Math.min(1, this.recenter.t + dt / RECENTER_DURATION_S);
      const eased = 1 - (1 - this.recenter.t) ** 3; // ease-out cubique
      this.target.lerpVectors(this.recenter.from, this.recenter.to, eased);
      this.update();
      moving = true;
      if (this.recenter.t >= 1) this.recenter = null;
    }
    return moving;
  }

  zoomBy(delta: number, aspect: number): void {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, this.minZoom, this.maxZoom);
    this.applyZoom(aspect);
  }

  getZoom(): number {
    return this.zoom;
  }

  /**
   * Zoom ABSOLU, borné comme `zoomBy`. Le pincement à deux doigts raisonne en facteur d'échelle
   * (« les doigts se sont écartés de 20 % »), pas en incrément : lui faire passer par `zoomBy`
   * obligerait l'appelant à refaire la multiplication à l'envers.
   */
  setZoom(value: number, aspect: number): void {
    this.zoom = THREE.MathUtils.clamp(value, this.minZoom, this.maxZoom);
    this.applyZoom(aspect);
  }

  /** Direction "vers le haut de l'ecran", dans le plan XZ, a l'angle affiche courant (panoramique relatif a l'ecran). */
  screenUpXZ(): { x: number; z: number } {
    const azimuth = THREE.MathUtils.degToRad(45 + this.shownQuarter * 90);
    return { x: -Math.cos(azimuth), z: -Math.sin(azimuth) };
  }

  /** Direction "vers la droite de l'ecran", dans le plan XZ, a l'angle affiche courant. */
  screenRightXZ(): { x: number; z: number } {
    const azimuth = THREE.MathUtils.degToRad(45 + this.shownQuarter * 90);
    return { x: Math.sin(azimuth), z: -Math.cos(azimuth) };
  }

  /** `viewportHeightPx` : hauteur reelle du canevas, necessaire pour convertir les marges de
   *  `setSafeAreaInsetsPx` (en pixels) en unites monde. Optionnel : l'exploration ne le fournit
   *  pas et n'appelle jamais `setSafeAreaInsetsPx`, donc l'omission est sans effet pour elle. */
  resize(aspect: number, viewportHeightPx?: number): void {
    if (viewportHeightPx !== undefined) this.viewportHeightPx = viewportHeightPx;
    this.applyZoom(aspect);
  }

  /**
   * Reserve des marges opaques de HUD (panneaux lateraux fixes en pixels) : la cible logique
   * (`target`, `lookAtCell`...) ne bouge pas, mais le point rendu au centre de l'ecran se decale
   * pour que le gameplay tienne dans la zone encore visible. Sans cet appel (exploration),
   * marges nulles -- comportement inchange. Voir `GameApp.resize`.
   */
  setSafeAreaInsetsPx(insets: { left: number; right: number; top: number; bottom: number }): void {
    this.insetsPx = insets;
    // Les marges changent la taille de la zone libre, donc l'echelle -- pas seulement le centre.
    this.applyZoom(this.lastAspect);
    this.update();
  }

  /**
   * `zoom` est l'etendue visible, en metres, le long du cote le plus court de la ZONE LIBRE --
   * l'ecran moins les panneaux opaques du HUD (`setSafeAreaInsetsPx`).
   *
   * Deux corrections en une, dictees par le jeu sur tablette :
   *
   * 1. Le zoom gouvernait la HAUTEUR de l'ecran, quelle que soit la forme de la fenetre. En
   *    portrait (aspect 0,75) la meme valeur ne laissait voir que 25 m de large -- on jouait
   *    dans un couloir. Indexe sur le cote court, un meme zoom montre la meme chose que
   *    l'appareil soit tenu dans un sens ou dans l'autre.
   * 2. Les marges de HUD ne decalaient que le CENTRE de l'image (`effectiveTarget`), jamais
   *    l'echelle : sur une tablette en paysage, la fiche a gauche et le journal a droite
   *    mangeaient plus de la moitie de la largeur, et il restait une fente ou le terrain
   *    paraissait minuscule. En calculant l'echelle sur la zone REELLEMENT visible, le terrain
   *    y garde la taille qu'il aurait eue sur un ecran nu.
   *
   * Tout se calcule en "unites de hauteur d'ecran" (hauteur = 1, largeur = `aspect`) : seuls
   * les rapports comptent, et les marges en pixels s'y ramenent via `viewportHeightPx`. Sans
   * marges (l'exploration n'en pose aucune), la formule redonne exactement la regle du cote
   * court.
   */
  private applyZoom(aspect: number): void {
    this.lastAspect = aspect;
    const perUnit = Math.max(1, this.viewportHeightPx); // pixels par unite de hauteur
    const insetLeft = this.insetsPx.left / perUnit;
    const insetRight = this.insetsPx.right / perUnit;
    const insetTop = this.insetsPx.top / perUnit;
    const insetBottom = this.insetsPx.bottom / perUnit;
    // Plancher : un HUD qui couvrirait (presque) tout ne doit pas faire exploser l'echelle.
    const freeWidth = Math.max(MIN_FREE_FRACTION * aspect, aspect - insetLeft - insetRight);
    const freeHeight = Math.max(MIN_FREE_FRACTION, 1 - insetTop - insetBottom);
    const metresPerUnit = this.zoom / Math.min(freeWidth, freeHeight);
    const halfHeight = metresPerUnit / 2;
    const halfWidth = halfHeight * aspect;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
  }

  private update(): void {
    const azimuth = THREE.MathUtils.degToRad(45 + this.shownQuarter * 90);
    const elevation = THREE.MathUtils.degToRad(ISO_ELEVATION_DEG);
    const distance = CAMERA_DISTANCE;
    const horizontal = Math.cos(elevation) * distance;
    const { x: effX, z: effZ } = this.effectiveTarget();
    this.camera.position.set(
      effX + Math.cos(azimuth) * horizontal,
      Math.sin(elevation) * distance,
      effZ + Math.sin(azimuth) * horizontal,
    );
    this.camera.lookAt(effX, 0, effZ);
    this.camera.updateMatrixWorld();
  }

  /**
   * `target` decale de la moitie de la difference des marges opposees (voir
   * `setSafeAreaInsetsPx`), pour que le POINT VISE (rendu au centre exact de
   * l'ecran) laisse `target` apparaitre au centre de la zone encore libre au
   * lieu du centre du canevas entier.
   */
  private effectiveTarget(): { x: number; z: number } {
    const { left, right: rightPx, top, bottom } = this.insetsPx;
    if (left === 0 && rightPx === 0 && top === 0 && bottom === 0) return { x: this.target.x, z: this.target.z };
    const worldPerPixel = this.zoom / Math.max(1, this.viewportHeightPx);
    const dPxRight = (left - rightPx) / 2;
    const dPxDown = (top - bottom) / 2;
    const rightDir = this.screenRightXZ();
    const upDir = this.screenUpXZ();
    return {
      x: this.target.x - dPxRight * worldPerPixel * rightDir.x + dPxDown * worldPerPixel * upDir.x,
      z: this.target.z - dPxRight * worldPerPixel * rightDir.z + dPxDown * worldPerPixel * upDir.z,
    };
  }
}
