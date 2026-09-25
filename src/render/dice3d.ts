/**
 * Lanceur de d10 3D -- pentagone trapezoedrique physique (vraie forme d'un d10,
 * dix faces cerf-volant, numerotees 1-10 -- jamais 0).
 *
 * Le de ne decide jamais rien : il MET EN SCENE un resultat deja tire par le
 * `Rng` seede du moteur de regles (voir src/rules/dice.ts, `PresentedRoll.dice`
 * dans src/narrative/dialogueRunner.ts). Ce module ne consomme donc aucun
 * aleatoire de jeu -- l'animation de toupillage a l'air aleatoire mais est
 * entierement derivee de la valeur et de l'index de chaque de via un hachage
 * deterministe (jamais `Math.random`, regle d'or du projet -- voir AGENTS.md).
 *
 * Autonome par conception : n'importe que `three` et le DOM (autorise pour
 * `src/render`), et lit les couleurs dans les variables CSS du document
 * (`getComputedStyle`) pour rester alignees sur `src/ui/theme.css` sans
 * dependre de son chargement ni de ses classes.
 */

import * as THREE from 'three';
import './dice3d.css';
import { createGameRenderer } from './rendererSetup';

/* ------------------------------------------------------------------------ */
/* API publique                                                              */
/* ------------------------------------------------------------------------ */

export interface DiceRollRequest {
  /** Faces du d10 dans l'ordre : premier de, puis chaque relance (`PresentedRoll.dice`). */
  faces: number[];
  /** Etiquette affichee au-dessus du de, ex. "Education — DV 15". */
  label?: string;
  /** Force le mouvement reduit ; par defaut, lit `prefers-reduced-motion`. */
  reducedMotion?: boolean;
}

export interface DiceRollerOptions {
  /** Le joueur doit cliquer/Espace pour lancer chaque de. Par defaut `true`. */
  manual?: boolean;
}

export class DiceRoller {
  private readonly host: HTMLElement;
  private readonly manual: boolean;

  private readonly overlay: HTMLDivElement;
  private readonly labelEl: HTMLDivElement;
  private readonly canvasWrap: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly stampEl: HTMLDivElement;
  private readonly resultEl: HTMLDivElement;
  private readonly actionButton: HTMLButtonElement;
  private readonly hintEl: HTMLDivElement;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private dieGroup: THREE.Group | null = null;
  /** Sous-groupe touche uniquement par le flottement d'attente (jamais par l'atterrissage). */
  private wobbleGroup: THREE.Group | null = null;
  private dieMesh: THREE.Mesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private atlasTexture: THREE.CanvasTexture | null = null;
  private atlasCanvas: HTMLCanvasElement | null = null;
  private shadowGeometry: THREE.CircleGeometry | null = null;
  private shadowMaterial: THREE.MeshBasicMaterial | null = null;
  private faces: DieFace[] = [];

  private renderLoopActive = false;
  private rafHandle = 0;
  private resizeListener: (() => void) | null = null;

  /** Termine immediatement le toupillage en cours (clic sur le de / debug). */
  private finishSpinNow: (() => void) | null = null;
  /** Resout `waitForActivation()` en cours, si le joueur patiente sur "Lancer"/"Continuer". */
  private pendingActivation: (() => void) | null = null;
  /**
   * Incremente a chaque `roll()` ET par `cancel()` : un `rollInternal` en vol
   * (ou meme pas encore demarre, toujours dans `this.queue`) qui ne porte
   * plus la valeur courante s'arrete au prochain point de controle, sans
   * jamais toucher a l'overlay -- voir `cancel()`.
   */
  private rollGeneration = 0;

  /** Flottement d'attente ("le de respire") tant qu'on patiente sur un bouton. */
  private idleActive = false;
  private idleAllowed = true;
  private idleStart = 0;

  /** Chaine les appels a `roll()` : un seul jet a la fois. */
  private queue: Promise<void> = Promise.resolve();

  constructor(host: HTMLElement, options: DiceRollerOptions = {}) {
    this.host = host;
    this.manual = options.manual ?? true;

    this.overlay = document.createElement('div');
    this.overlay.className = 'dice3d-overlay';
    this.overlay.hidden = true;
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-live', 'polite');
    this.overlay.setAttribute('aria-label', 'Jet de de');

    const scrim = document.createElement('div');
    scrim.className = 'dice3d-scrim';
    this.overlay.appendChild(scrim);

    const stage = document.createElement('div');
    stage.className = 'dice3d-stage';
    this.overlay.appendChild(stage);

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'dice3d-label';
    stage.appendChild(this.labelEl);

    this.canvasWrap = document.createElement('div');
    this.canvasWrap.className = 'dice3d-canvas-wrap';
    stage.appendChild(this.canvasWrap);

    this.stampEl = document.createElement('div');
    this.stampEl.className = 'dice3d-stamp';
    this.stampEl.hidden = true;
    this.canvasWrap.appendChild(this.stampEl);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dice3d-canvas';
    this.canvasWrap.appendChild(this.canvas);

    this.resultEl = document.createElement('div');
    this.resultEl.className = 'dice3d-result';
    stage.appendChild(this.resultEl);

    this.actionButton = document.createElement('button');
    this.actionButton.type = 'button';
    this.actionButton.className = 'dice3d-action';
    this.actionButton.hidden = true;
    stage.appendChild(this.actionButton);

    this.hintEl = document.createElement('div');
    this.hintEl.className = 'dice3d-hint';
    this.hintEl.textContent = 'Espace ou Entree pour valider.';
    this.hintEl.hidden = true;
    stage.appendChild(this.hintEl);

    this.canvas.addEventListener('click', () => this.finishSpinNow?.());

    this.host.appendChild(this.overlay);
  }

  /**
   * Affiche l'overlay, attend le(s) lancer(s) du joueur, toupille ~2s par de
   * et atterrit sur chaque face dans l'ordre. Se resout quand le dernier de
   * s'est pose et que le joueur a valide (ou immediatement apres l'atterrissage
   * si `manual: false`).
   */
  roll(req: DiceRollRequest): Promise<void> {
    const myGen = ++this.rollGeneration;
    const run = () => this.rollInternal(req, myGen);
    this.queue = this.queue.then(run, run);
    return this.queue;
  }

  /** Termine instantanement l'animation en cours (clic pendant le toupillage / debug). */
  skip(): void {
    this.finishSpinNow?.();
  }

  /**
   * Ferme immediatement l'overlay et resout/annule tout jet en attente, quel
   * que soit son etat -- toupillage, attente d'un clic ("Lancer"/"Continuer"),
   * ou encore dans la file d'attente sans avoir meme commence. A la
   * difference de `skip()` (qui ne fait avancer QUE le toupillage courant),
   * `cancel()` termine le jet ENTIER sans attendre le joueur : c'est ce
   * qu'utilise `NarrativeView` quand l'etat du jeu change sous une animation
   * (un test qui pilote `choose()`/`rollInsight()`/`advance()` directement
   * pendant qu'un de tourne a l'ecran -- voir docs/process/DEBUG_API.md).
   * Idempotent : sans jet en cours, ne fait rien de visible.
   */
  cancel(): void {
    this.rollGeneration++;
    this.finishSpinNow?.();
    this.pendingActivation?.();
    this.hideStamp();
    this.hideAction();
    this.hideOverlay();
  }

  dispose(): void {
    this.stopRenderLoop();
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.atlasTexture?.dispose();
    this.shadowGeometry?.dispose();
    this.shadowMaterial?.map?.dispose();
    this.shadowMaterial?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
    this.overlay.remove();
  }

  /* ------------------------------------------------------------------------ */
  /* Deroule d'un jet                                                         */
  /* ------------------------------------------------------------------------ */

  private async rollInternal(req: DiceRollRequest, myGen: number): Promise<void> {
    if (req.faces.length === 0) throw new Error('DiceRoller.roll: faces vide');
    // Annule avant meme d'avoir commence (cancel() appele pendant que ce jet
    // patientait encore dans `this.queue`) : jamais d'overlay montre pour rien.
    if (myGen !== this.rollGeneration) return;

    this.ensureScene();
    this.showOverlay();
    this.labelEl.textContent = req.label ?? '';
    this.resultEl.textContent = '';
    this.hideStamp();
    this.hideAction();

    const reduced = req.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.idleAllowed = !reduced;
    const faces = req.faces;
    const last = faces.length - 1;

    for (let i = 0; i < faces.length; i++) {
      if (myGen !== this.rollGeneration) break;
      const value = faces[i] as number;
      const isFirst = i === 0;
      const isLast = i === last;

      if (this.manual) {
        this.showAction(isFirst ? 'Lancer le dé' : 'Relancer le dé');
        await this.waitForActivation();
        if (myGen !== this.rollGeneration) break;
      }
      this.hideStamp();
      this.hideAction();

      await this.throwDie(value, i, reduced);
      if (myGen !== this.rollGeneration) break;

      this.resultEl.textContent = formatRunningTotal(faces.slice(0, i + 1));

      const critical = !isLast && (value === 10 || value === 1);
      if (critical) {
        this.showStamp(value === 10 ? 'Réussite critique' : 'Échec critique', value === 10 ? 'ok' : 'ko', reduced);
      }

      if (isLast) {
        this.showAction('Continuer');
        if (this.manual) {
          await this.waitForActivation();
          if (myGen !== this.rollGeneration) break;
        } else {
          await delay(CONTINUE_AUTO_DELAY_MS);
        }
        this.hideAction();
      } else if (!this.manual) {
        // Mode automatique : laisse le tampon respirer avant d'enchainer la relance.
        await delay(AUTO_REROLL_DELAY_MS);
      }
    }

    this.hideStamp();
    this.hideOverlay();
  }

  /* ------------------------------------------------------------------------ */
  /* Scene three.js -- creation paresseuse, reutilisee entre les jets         */
  /* ------------------------------------------------------------------------ */

  private ensureScene(): void {
    if (this.renderer) return;

    const colors = readDiceColors();
    const built = buildDieGeometry();
    this.geometry = built.geometry;
    this.faces = built.faces;

    const { texture, canvas } = buildFaceAtlas(built.faces, colors);
    this.atlasTexture = texture;
    this.atlasCanvas = canvas;

    this.material = new THREE.MeshStandardMaterial({
      map: this.atlasTexture,
      roughness: 0.4,
      metalness: 0.12,
    });
    // Amelioration non bloquante : si les polices auto-hebergees de theme.css
    // finissent de charger apres ce premier dessin, on redessine l'atlas avec
    // la vraie typographie du design system au lieu du repli generique.
    void document.fonts?.ready?.then(() => {
      if (!this.atlasCanvas || !this.atlasTexture) return;
      drawFaceAtlas(this.atlasCanvas, built.faces, colors);
      this.atlasTexture.needsUpdate = true;
    });

    this.dieMesh = new THREE.Mesh(this.geometry, this.material);
    this.dieMesh.castShadow = false;
    this.dieMesh.receiveShadow = false;

    this.wobbleGroup = new THREE.Group();
    this.wobbleGroup.add(this.dieMesh);
    this.dieGroup = new THREE.Group();
    this.dieGroup.add(this.wobbleGroup);

    this.scene = new THREE.Scene();
    this.scene.add(this.dieGroup);

    // Ombre de contact : ancre le de au sol de la mise en scene, sinon il
    // flotte sans repere -- flou radial pur (alpha 0 bien avant le bord du
    // disque) pour ne jamais lire comme un rectangle sombre. Rayon et recul
    // modestes : un halo discret sous la piece, jamais un plan reel (il n'y a
    // pas de decor ici, juste le scrim).
    this.shadowGeometry = new THREE.CircleGeometry(0.55, 32);
    this.shadowMaterial = buildShadowMaterial();
    const shadow = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.02;
    shadow.renderOrder = -1;
    this.scene.add(shadow);

    // Lumiere physiquement correcte (three >= 0.155) : des intensites basses
    // laisseraient des faces quasi noires, indiscernables du scrim d'encre
    // derriere le canevas transparent -- d'ou des valeurs plus hautes ici que
    // dans la scene tactique (src/render/yardView.ts, mode heritage).
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff2df, 3.2);
    key.position.set(2.2, 2.8, 3.4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe8e0, 1.0);
    fill.position.set(-2.6, -1.2, 1.8);
    this.scene.add(fill);
    // Contre-jour : accroche un fin liseré lumineux sur les aretes arrieres,
    // pour que le solide se detache du scrim sombre (esprit "premium").
    const rim = new THREE.DirectionalLight(0xffe27a, 1.4);
    rim.position.set(-1.2, 1.6, -3.2);
    this.scene.add(rim);

    // Cadrage : distance derivee de la sphere englobante reelle de la
    // geometrie (jamais une constante devinee) + la borne du rebond d'atterrissage,
    // avec une marge angulaire -- le de ne doit JAMAIS toucher les bords du
    // frustum, quelle que soit son orientation pendant le toupillage.
    this.geometry.computeBoundingSphere();
    const boundingRadius = this.geometry.boundingSphere?.radius ?? 1.05;
    const effectiveRadius = boundingRadius + BOUNCE_AMPLITUDE;
    const halfFov = THREE.MathUtils.degToRad(CAMERA_FOV_DEG / 2);
    const distance = effectiveRadius / (Math.sin(halfFov) * CAMERA_FRUSTUM_MARGIN);

    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV_DEG, 1, 0.1, 30);
    const elevation = THREE.MathUtils.degToRad(20);
    this.camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
    this.camera.lookAt(0, 0, 0);

    this.renderer = createGameRenderer({ canvas: this.canvas, alpha: true });
    this.renderer.setClearColor(0x000000, 0);

    this.syncRendererSize();
    this.resizeListener = () => this.syncRendererSize();
    window.addEventListener('resize', this.resizeListener);
  }

  private syncRendererSize(): void {
    if (!this.renderer || !this.camera) return;
    const w = this.canvas.clientWidth || DICE_CANVAS_CSS_PX;
    const h = this.canvas.clientHeight || DICE_CANVAS_CSS_PX;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this.renderLoopActive) this.renderer.render(this.scene as THREE.Scene, this.camera);
  }

  private startRenderLoop(): void {
    if (this.renderLoopActive) return;
    this.renderLoopActive = true;
    const tick = (now: number) => {
      if (!this.renderLoopActive || !this.renderer || !this.scene || !this.camera) return;
      if (this.idleActive && this.wobbleGroup) {
        const t = (now - this.idleStart) / 1000;
        this.wobbleGroup.position.y = Math.sin(t * 1.6) * 0.045;
        this.wobbleGroup.rotation.z = Math.sin(t * 1.1) * 0.035;
        this.wobbleGroup.rotation.x = Math.sin(t * 0.8 + 1) * 0.02;
      }
      this.renderer.render(this.scene, this.camera);
      this.rafHandle = requestAnimationFrame(tick);
    };
    tick(performance.now());
  }

  private stopRenderLoop(): void {
    this.renderLoopActive = false;
    cancelAnimationFrame(this.rafHandle);
  }

  /* ------------------------------------------------------------------------ */
  /* Toupillage et atterrissage                                              */
  /* ------------------------------------------------------------------------ */

  private throwDie(value: number, index: number, reduced: boolean): Promise<void> {
    const face = this.faces.find((f) => f.value === value);
    if (!face) throw new Error(`DiceRoller: aucune face ne porte la valeur ${value}`);
    const group = this.dieGroup;
    if (!group) throw new Error('DiceRoller: scene non initialisee');

    const targetQuat = faceTargetQuaternion(face);

    if (reduced) {
      group.quaternion.copy(targetQuat);
      group.position.set(0, 0, 0);
      group.scale.setScalar(1);
      this.canvas.classList.add('dice3d-fade-in');
      this.startRenderLoop();
      this.renderer?.render(this.scene as THREE.Scene, this.camera as THREE.PerspectiveCamera);
      // Un seul reflow suffit a faire jouer la transition CSS d'opacite.
      void this.canvas.offsetWidth;
      this.canvas.classList.remove('dice3d-fade-in');
      return delay(REDUCED_FADE_MS).then(() => this.stopRenderLoop());
    }

    return new Promise((resolve) => {
      const { axisA, axisB, turnsA, turnsB } = tumbleParams(value, index);
      const start = performance.now();
      let done = false;

      this.startRenderLoop();

      const finish = () => {
        if (done) return;
        done = true;
        group.quaternion.copy(targetQuat);
        group.position.set(0, 0, 0);
        this.finishSpinNow = null;
        this.stopRenderLoop();
        this.renderer?.render(this.scene as THREE.Scene, this.camera as THREE.PerspectiveCamera);
        resolve();
      };
      this.finishSpinNow = finish;

      const qa = new THREE.Quaternion();
      const qb = new THREE.Quaternion();
      const step = (now: number) => {
        if (done) return;
        const p = Math.min(1, (now - start) / DICE_SPIN_MS);
        const eased = 1 - Math.pow(1 - p, 3);
        const remaining = 1 - eased;

        qa.setFromAxisAngle(axisA, turnsA * Math.PI * 2 * remaining);
        qb.setFromAxisAngle(axisB, turnsB * Math.PI * 2 * remaining);
        group.quaternion.copy(targetQuat).multiply(qa).multiply(qb);

        // Petit rebond tactile a l'arrivee.
        const bounce = Math.sin(p * Math.PI) * (1 - p) * BOUNCE_AMPLITUDE;
        group.position.set(0, bounce, 0);

        if (p >= 1) {
          finish();
          return;
        }
        this.rafHandle = requestAnimationFrame(step);
      };
      this.rafHandle = requestAnimationFrame(step);
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Overlay DOM                                                              */
  /* ------------------------------------------------------------------------ */

  private showOverlay(): void {
    this.overlay.hidden = false;
  }

  private hideOverlay(): void {
    this.overlay.hidden = true;
  }

  private showAction(text: string): void {
    this.actionButton.textContent = text;
    this.actionButton.hidden = false;
    this.hintEl.hidden = false;
    this.actionButton.focus();
    if (this.idleAllowed && this.renderer) {
      this.idleStart = performance.now();
      this.idleActive = true;
      this.startRenderLoop();
    }
  }

  private hideAction(): void {
    this.actionButton.hidden = true;
    this.hintEl.hidden = true;
    if (this.idleActive) {
      this.idleActive = false;
      this.wobbleGroup?.position.set(0, 0, 0);
      this.wobbleGroup?.rotation.set(0, 0, 0);
      this.stopRenderLoop();
    }
  }

  private showStamp(text: string, kind: 'ok' | 'ko', reduced: boolean): void {
    this.stampEl.textContent = text;
    this.stampEl.className = `dice3d-stamp dice3d-stamp--${kind}`;
    this.stampEl.hidden = false;
    if (!reduced) {
      this.canvasWrap.classList.add(kind === 'ok' ? 'dice3d-flash' : 'dice3d-shake');
    }
  }

  private hideStamp(): void {
    this.stampEl.hidden = true;
    this.canvasWrap.classList.remove('dice3d-flash', 'dice3d-shake');
  }

  private waitForActivation(): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        this.actionButton.removeEventListener('click', done);
        window.removeEventListener('keydown', onKey);
        if (this.pendingActivation === done) this.pendingActivation = null;
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          done();
        }
      };
      this.actionButton.addEventListener('click', done);
      window.addEventListener('keydown', onKey);
      this.pendingActivation = done;
    });
  }
}

/* ------------------------------------------------------------------------ */
/* Mise en texte de la chaine de des                                        */
/* ------------------------------------------------------------------------ */

/** Reproduit le formatage de src/rules/dice.ts (explosion additionne, implosion soustrait). */
function formatRunningTotal(faces: number[]): string {
  if (faces.length === 1) return `${faces[0]}`;
  const first = faces[0] as number;
  if (first === 1) {
    let total = first;
    const parts: string[] = [`${first}`];
    for (let i = 1; i < faces.length; i++) {
      const f = faces[i] as number;
      total -= f;
      parts.push(`− ${f}`);
    }
    return `${parts.join(' ')} = ${signed(total)}`;
  }
  // Explosion (premier de = 10), ou chaine degenerescente : on additionne.
  const total = faces.reduce((s, f) => s + f, 0);
  return `${faces.join(' + ')} = ${signed(total)}`;
}

function signed(n: number): string {
  return n < 0 ? `−${Math.abs(n)}` : `${n}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DICE_SPIN_MS = 2000;
const REDUCED_FADE_MS = 160;
const AUTO_REROLL_DELAY_MS = 700;
const CONTINUE_AUTO_DELAY_MS = 500;
/** Amplitude max du rebond tactile a l'atterrissage (throwDie) -- reprise dans le cadrage camera. */
const BOUNCE_AMPLITUDE = 0.12;
/** Champ de vision vertical de la mini-camera du de. */
const CAMERA_FOV_DEG = 30;
/**
 * Fraction du demi-champ de vision reservee a la sphere englobante du de :
 * < 1 pour laisser une marge et garantir qu'aucune orientation de toupillage
 * ne fasse toucher les bords du cadre (defaut visuel signale en revue).
 */
const CAMERA_FRUSTUM_MARGIN = 0.8;
/** Repli si le CSS n'a pas encore mis en page le canevas (voir dice3d.css, `.dice3d-canvas-wrap`). */
const DICE_CANVAS_CSS_PX = 360;

/* ------------------------------------------------------------------------ */
/* Toupillage deterministe -- jamais Math.random (AGENTS.md, regle 1)       */
/* ------------------------------------------------------------------------ */

/** Hachage 32 bits deterministe : (valeur, index) -> [0, 1). Jamais Math.random. */
function hash01(a: number, b: number, salt: number): number {
  let h = Math.imul(a + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + salt, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 15), 0x27d4eb2f);
  h ^= h >>> 13;
  h = Math.imul(h, 0x165667b1);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function hashAxis(value: number, index: number, salt: number): THREE.Vector3 {
  const x = hash01(value, index, salt) * 2 - 1;
  const y = hash01(value, index, salt + 101) * 2 - 1;
  const z = hash01(value, index, salt + 202) * 2 - 1;
  const v = new THREE.Vector3(x, y, z);
  return v.lengthSq() > 1e-6 ? v.normalize() : new THREE.Vector3(0, 1, 0);
}

function tumbleParams(
  value: number,
  index: number,
): { axisA: THREE.Vector3; axisB: THREE.Vector3; turnsA: number; turnsB: number } {
  const axisA = hashAxis(value, index, 1);
  const axisB = hashAxis(value, index, 4);
  const turnsA = 2.2 + hash01(value, index, 7) * 1.6; // 2.2 a 3.8 tours
  const turnsB = 0.4 + hash01(value, index, 9) * 0.5; // secousse secondaire plus courte
  return { axisA, axisB, turnsA, turnsB };
}

/* ------------------------------------------------------------------------ */
/* Geometrie -- pentagone trapezoedrique (dix faces cerf-volant)            */
/*                                                                           */
/* 12 sommets : deux pôles + un anneau equatorial en zigzag de dix points.  */
/* Chaque face est un cerf-volant : un pôle + trois sommets consecutifs de  */
/* l'anneau. Les pôles alternent (pair -> pôle sud, impair -> pôle nord)    */
/* pour obtenir un solide convexe (verifie numeriquement lors du design).  */
/* ------------------------------------------------------------------------ */

interface DieFace {
  index: number;
  value: number;
  corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
  centroid: THREE.Vector3;
  normal: THREE.Vector3;
  up: THREE.Vector3;
  right: THREE.Vector3;
}

/** Faces numerotees 1-10, opposees deux a deux en somme 11 (comme un vrai d10). */
const FACE_VALUES = [1, 2, 3, 4, 5, 10, 9, 8, 7, 6];
const RING_COUNT = 10;
const RING_Z = 0.105;
const NORTH = new THREE.Vector3(0, 0, 1);
const SOUTH = new THREE.Vector3(0, 0, -1);

function ringVertex(i: number): THREE.Vector3 {
  const n = ((i % RING_COUNT) + RING_COUNT) % RING_COUNT;
  const angle = n * ((Math.PI * 2) / RING_COUNT);
  const z = RING_Z * (n % 2 === 0 ? -1 : 1);
  return new THREE.Vector3(Math.cos(angle), Math.sin(angle), z);
}

function buildDieGeometry(): { geometry: THREE.BufferGeometry; faces: DieFace[] } {
  const faces: DieFace[] = [];
  const positions: number[] = [];
  const uvs: number[] = [];

  for (let i = 0; i < RING_COUNT; i++) {
    const a = ringVertex(i);
    const b = ringVertex(i + 1);
    const c = ringVertex(i + 2);
    const even = i % 2 === 0;
    const pole = even ? SOUTH : NORTH;
    // Ordre choisi pour un enroulement (winding) sortant correct dans les
    // deux cas -- verifie numeriquement (voir scratchpad de conception).
    const corners: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = even
      ? [pole.clone(), c.clone(), b.clone(), a.clone()]
      : [pole.clone(), a.clone(), b.clone(), c.clone()];

    const centroid = corners
      .reduce((sum, v) => sum.add(v), new THREE.Vector3())
      .multiplyScalar(1 / corners.length);
    const normal = new THREE.Vector3()
      .subVectors(corners[1], corners[0])
      .cross(new THREE.Vector3().subVectors(corners[2], corners[0]))
      .normalize();
    const poleDir = new THREE.Vector3().subVectors(pole, centroid);
    const up = poleDir
      .clone()
      .sub(normal.clone().multiplyScalar(normal.dot(poleDir)))
      .normalize();
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();

    const face: DieFace = { index: i, value: FACE_VALUES[i] as number, corners, centroid, normal, up, right };
    faces.push(face);

    // Chaque sommet du buffer (non indexe) porte sa PROPRE paire UV, calculee
    // dans le meme passage que sa position -- une correspondance separee
    // position/UV par sommet a plante une fois ici (4 UV pour 6 sommets par
    // face) : desormais les deux tableaux avancent strictement ensemble.
    const cellUv = (corner: THREE.Vector3) => faceCornerUv(face, corner);

    // Diagonale pôle -> sommet median : preserve la symetrie du cerf-volant.
    const [p0, p1, mid, p3] = corners;
    for (const p of [p0, p1, mid]) {
      positions.push(p.x, p.y, p.z);
      uvs.push(...cellUv(p));
    }
    for (const p of [p0, mid, p3]) {
      positions.push(p.x, p.y, p.z);
      uvs.push(...cellUv(p));
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return { geometry, faces };
}

/** Disque flou (degrade radial -> transparent) utilise comme ombre de contact. */
function buildShadowMaterial(): THREE.MeshBasicMaterial {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  // depthTest a false + renderOrder negatif (pose avant le de) : le flou se
  // voit dans la marge autour du solide et disparait naturellement sous lui,
  // sans dependre d'un cadrage de camera qui laisserait la place en dessous.
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false });
}

/* ------------------------------------------------------------------------ */
/* Atlas de texture -- un canevas, une cellule par face                    */
/* ------------------------------------------------------------------------ */

const ATLAS_COLS = 5;
const ATLAS_ROWS = 2;
const CELL_PX = 220;

interface DiceColors {
  body: string;
  edge: string;
  digit: string;
  misreg: string;
}

function readDiceColors(): DiceColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const v = style.getPropertyValue(name).trim();
    return v || fallback;
  };
  return {
    body: read('--red', '#e2262f'),
    edge: read('--ink', '#140d0e'),
    digit: read('--bone', '#efe4d4'),
    misreg: read('--red-deep', '#8c1219'),
  };
}

interface FaceCellLayout {
  /** Coin haut-gauche de la cellule carree dans l'atlas (fond + filet seulement). */
  cellX: number;
  cellY: number;
  /** Les 4 coins du cerf-volant en pixels ATLAS absolus, meme ordre que `face.corners`. */
  corners: [number, number][];
  /** Centre du chiffre : pousse vers la base large du cerf-volant, jamais vers le pole. */
  anchor: [number, number];
  /** Plus grand rayon centre sur `anchor` qui reste entierement dans le cerf-volant. */
  safeRadius: number;
}

/**
 * Calcule une fois, pour une face donnee, la position pixel de ses 4 coins
 * dans l'atlas ainsi qu'une ancre de texte sure -- partagee par le placement
 * UV (par sommet, cote geometrie) et le dessin du chiffre (cote canevas),
 * pour que les deux restent strictement coherents.
 */
function faceCellLayout(face: DieFace): FaceCellLayout {
  const col = face.index % ATLAS_COLS;
  const row = Math.floor(face.index / ATLAS_COLS);
  const cellX = col * CELL_PX;
  const cellY = row * CELL_PX;
  const cx = cellX + CELL_PX / 2;
  const cy = cellY + CELL_PX / 2;

  // Etendue locale du cerf-volant dans sa base (right, up) pour caler
  // l'echelle du motif sans le deformer davantage que necessaire.
  let maxExtent = 0;
  const local: [number, number][] = face.corners.map((c) => {
    const d = new THREE.Vector3().subVectors(c, face.centroid);
    const du = d.dot(face.right);
    const dv = d.dot(face.up);
    maxExtent = Math.max(maxExtent, Math.abs(du), Math.abs(dv));
    return [du, dv];
  });
  const scale = (CELL_PX * 0.46) / (maxExtent || 1);
  const corners: [number, number][] = local.map(([du, dv]) => [cx + du * scale, cy - dv * scale]);
  const [p0, p1, mid, p3] = corners as [[number, number], [number, number], [number, number], [number, number]];

  // Ancre du chiffre : le pole (p0) forme la pointe etroite du cerf-volant,
  // les trois autres coins forment sa base large -- on centre le texte sur
  // cette base plutot que sur le centroide brut des 4 sommets, pour laisser
  // la pointe vide et eviter tout debordement de ce cote la.
  const baseCenter: [number, number] = [(p1[0] + mid[0] + p3[0]) / 3, (p1[1] + mid[1] + p3[1]) / 3];
  const centroid4: [number, number] = [
    (p0[0] + p1[0] + mid[0] + p3[0]) / 4,
    (p0[1] + p1[1] + mid[1] + p3[1]) / 4,
  ];
  const anchor: [number, number] = [
    centroid4[0] + (baseCenter[0] - centroid4[0]) * 0.35,
    centroid4[1] + (baseCenter[1] - centroid4[1]) * 0.35,
  ];

  // Rayon inscrit : distance minimale de l'ancre aux quatre aretes du
  // cerf-volant (droites porteuses -- le cerf-volant est convexe, donc c'est
  // aussi la distance aux segments pour un point interieur). C'est la place
  // reellement disponible pour le chiffre, pas la taille de la cellule carree.
  const edges: [[number, number], [number, number]][] = [
    [p0, p1],
    [p1, mid],
    [mid, p3],
    [p3, p0],
  ];
  let safeRadius = Infinity;
  for (const [a, b] of edges) safeRadius = Math.min(safeRadius, pointToLineDistance(anchor, a, b));

  return { cellX, cellY, corners, anchor, safeRadius };
}

function pointToLineDistance(p: [number, number], a: [number, number], b: [number, number]): number {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const len = Math.hypot(abx, aby) || 1;
  const cross = (p[0] - a[0]) * aby - (p[1] - a[1]) * abx;
  return Math.abs(cross) / len;
}

/**
 * UV d'un sommet donne au sein de la cellule d'atlas de sa face, en espace
 * canevas (0..1) -- `flipY = false` sur la texture, donc pas d'inversion a
 * gerer. Appelee une fois par sommet EMIS (pas par coin unique) pour rester
 * en phase avec le tableau de positions non indexe.
 */
function faceCornerUv(face: DieFace, corner: THREE.Vector3): [number, number] {
  const atlasW = ATLAS_COLS * CELL_PX;
  const atlasH = ATLAS_ROWS * CELL_PX;
  const layout = faceCellLayout(face);
  const idx = face.corners.indexOf(corner);
  const [px, py] = layout.corners[idx >= 0 ? idx : 0] as [number, number];
  return [px / atlasW, py / atlasH];
}

function buildFaceAtlas(faces: DieFace[], colors: DiceColors): { texture: THREE.CanvasTexture; canvas: HTMLCanvasElement } {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * CELL_PX;
  canvas.height = ATLAS_ROWS * CELL_PX;
  drawFaceAtlas(canvas, faces, colors);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { texture, canvas };
}

function drawFaceAtlas(canvas: HTMLCanvasElement, faces: DieFace[], colors: DiceColors): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const face of faces) {
    drawFaceCell(ctx, faceCellLayout(face), face.value, colors);
  }
}

function drawFaceCell(ctx: CanvasRenderingContext2D, layout: FaceCellLayout, value: number, colors: DiceColors): void {
  ctx.save();

  // Corps du de (le carre entier ; seule la portion mappee sur le cerf-volant
  // 3D est effectivement echantillonnee, le reste sert de marge de securite
  // au filtrage bilineaire).
  ctx.fillStyle = colors.body;
  ctx.fillRect(layout.cellX, layout.cellY, CELL_PX, CELL_PX);

  // Filet d'encre (bord de la face, en repli de l'arete reelle).
  const inset = CELL_PX * 0.07;
  ctx.strokeStyle = colors.edge;
  ctx.lineWidth = CELL_PX * 0.028;
  ctx.strokeRect(layout.cellX + inset, layout.cellY + inset, CELL_PX - inset * 2, CELL_PX - inset * 2);

  // Chiffre : ancre et taille calees sur le rayon reellement inscrit dans le
  // cerf-volant (`safeRadius`), pas sur la cellule carree -- sinon il deborde
  // des aretes obliques et vient cogner le chiffre de la face voisine (defaut
  // signale en revue). ~57 % du diametre inscrit, marge confortable.
  const [cx, cy] = layout.anchor;
  const fontSize = Math.round(layout.safeRadius * 1.15);
  const fontStack = "'Big Shoulders Display', 'Arial Narrow', 'Segoe UI', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${fontSize}px ${fontStack}`;

  const label = String(value);

  // Leger defaut de reperage : une ombre du chiffre decalee, ecole "Encre rouge".
  ctx.fillStyle = colors.misreg;
  ctx.fillText(label, cx + fontSize * 0.03, cy + fontSize * 0.036);

  // Chiffre principal : contour d'encre + remplissage os.
  ctx.lineWidth = fontSize * 0.09;
  ctx.strokeStyle = colors.edge;
  ctx.lineJoin = 'round';
  ctx.strokeText(label, cx, cy);
  ctx.fillStyle = colors.digit;
  ctx.fillText(label, cx, cy);

  // 6 et 9 se confondent en tete-beche : un soulignement leve l'ambiguite.
  if (value === 6 || value === 9) {
    const uw = fontSize * 0.5;
    const uy = cy + fontSize * 0.42;
    ctx.strokeStyle = colors.digit;
    ctx.lineWidth = fontSize * 0.045;
    ctx.beginPath();
    ctx.moveTo(cx - uw / 2, uy);
    ctx.lineTo(cx + uw / 2, uy);
    ctx.stroke();
  }

  ctx.restore();
}

/* ------------------------------------------------------------------------ */
/* Orientation -- aligne la normale de la face cible vers la camera, son    */
/* "haut" (cote pôle) vers le haut monde, pour un atterrissage lisible.     */
/* ------------------------------------------------------------------------ */

function faceTargetQuaternion(face: DieFace): THREE.Quaternion {
  const m = new THREE.Matrix4().makeBasis(face.right, face.up, face.normal);
  m.transpose(); // base orthonormee : la transposee est l'inverse.
  return new THREE.Quaternion().setFromRotationMatrix(m);
}
