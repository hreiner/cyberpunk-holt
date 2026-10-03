/**
 * Ce qui entoure un personnage sans dépendre de son modèle : anneau au sol, étiquette flottante
 * (nom, « (à terre) », ligne de matériel en tactique) et silhouette « rayon X » de la tactique.
 * Partagé par le rig Quaternius (`cadetRig.ts`) et le rig MPFB (`mpfbCadetRig.ts`), pour que
 * les règles de lisibilité (ART-DIRECTION.md) restent identiques quel que soit le modèle.
 */
import * as THREE from 'three';
import { CARRIED_ITEMS, ITEM_COLORS, ITEM_ICONS } from '@/data/items';
import type { ItemId } from '@/tactical/types';

const LABEL_CANVAS = { width: 224, height: 56 } as const;
/** Etiquette agrandie en tactique : deux lignes (nom + materiel), cf. `draw`. */
const TACTICAL_LABEL_CANVAS = { width: 256, height: 96 } as const;
const LABEL_WORLD_WIDTH = 2.35;
/**
 * Repris a 1,5 m (etait 2,9, environ trois fois la largeur d'un cadet -- signale en revue sur
 * `07-john-tete-hires.png`) : la plaque doit accompagner le personnage, pas le recouvrir.
 */
const TACTICAL_LABEL_WORLD_WIDTH = 1.5;
/** Silhouette "rayon X" : capsule generique dessinee uniquement la ou un conteneur masque le cadet. */
const XRAY_RADIUS = 0.3;

export interface RigOverlayOptions {
  readonly name: string;
  readonly teamColor: number;
  readonly tactical: boolean;
  /** Hauteur affichée du personnage, en mètres (place l'étiquette et la silhouette). */
  readonly height: number;
  readonly showLabel: boolean;
  readonly showRing: boolean;
}

export class RigOverlay {
  private readonly ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private readonly label: THREE.Sprite;
  private readonly labelCanvas: HTMLCanvasElement;
  private readonly labelTexture: THREE.CanvasTexture;
  private readonly owned: { dispose(): void }[] = [];
  private highlighted = false;
  private down = false;
  private items: readonly ItemId[] | null = [];
  private equipmentLineVisible: boolean;

  constructor(
    parent: THREE.Object3D,
    private readonly options: RigOverlayOptions,
  ) {
    this.equipmentLineVisible = options.tactical;
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: options.teamColor,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.43, 0.51, 20), ringMaterial);
    this.owned.push(ringMaterial, this.ring.geometry);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.012;
    this.ring.visible = options.showRing;
    parent.add(this.ring);

    // Silhouette "rayon X" (tactique seulement) : dessinee uniquement la ou un conteneur
    // masque le cadet -- ART-DIRECTION.md, regle de lisibilite 5, "rien ne masque un personnage".
    if (options.tactical) {
      const xrayMaterial = new THREE.MeshBasicMaterial({
        color: options.teamColor,
        transparent: true,
        opacity: 0.5,
        depthFunc: THREE.GreaterDepth,
        depthWrite: false,
      });
      const xrayGeometry = new THREE.CapsuleGeometry(
        XRAY_RADIUS,
        Math.max(0.1, options.height - 2 * XRAY_RADIUS),
        4,
        8,
      );
      this.owned.push(xrayMaterial, xrayGeometry);
      const xray = new THREE.Mesh(xrayGeometry, xrayMaterial);
      xray.position.y = options.height / 2;
      xray.renderOrder = 10;
      parent.add(xray);
    }

    const canvasSize = options.tactical ? TACTICAL_LABEL_CANVAS : LABEL_CANVAS;
    const worldWidth = options.tactical ? TACTICAL_LABEL_WORLD_WIDTH : LABEL_WORLD_WIDTH;
    this.labelCanvas = document.createElement('canvas');
    this.labelCanvas.width = canvasSize.width;
    this.labelCanvas.height = canvasSize.height;
    this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
    this.labelTexture.colorSpace = THREE.SRGBColorSpace;
    const labelMaterial = new THREE.SpriteMaterial({
      map: this.labelTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.owned.push(this.labelTexture, labelMaterial);
    this.label = new THREE.Sprite(labelMaterial);
    this.label.name = 'cadet-label';
    this.label.scale.set(worldWidth, (worldWidth * canvasSize.height) / canvasSize.width, 1);
    this.label.position.y = options.height + (options.tactical ? 0.52 : 0.42);
    this.label.visible = options.showLabel;
    this.label.renderOrder = 20;
    parent.add(this.label);
    this.draw();
  }

  setHighlighted(on: boolean): void {
    if (on === this.highlighted) return;
    this.highlighted = on;
    this.ring.material.opacity = on ? 1 : 0.55;
    if (this.options.tactical) this.draw();
  }

  /** « (à terre) » sur l'étiquette tactique ; l'exploration ne redessine jamais sa plaque. */
  setDown(down: boolean): void {
    if (down === this.down) return;
    this.down = down;
    if (this.options.tactical) this.draw();
  }

  setItems(items: readonly ItemId[] | null): void {
    const same =
      items === null || this.items === null
        ? items === this.items
        : items.length === this.items.length && items.every((item, i) => item === this.items?.[i]);
    this.items = items === null ? null : [...items];
    if (!same && this.options.tactical) this.draw();
  }

  setEquipmentLineVisible(visible: boolean): void {
    if (this.equipmentLineVisible === visible) return;
    this.equipmentLineVisible = visible;
    this.draw();
  }

  dispose(): void {
    for (const item of this.owned) item.dispose();
  }

  /**
   * Etiquette flottante : nom du cadet (bord a la couleur d'equipe), "(à terre)" quand
   * neutralise, et, en tactique (`equipmentLineVisible`), une ligne de pictogrammes du
   * materiel. En exploration, la plaque ne porte que le nom.
   */
  private draw(): void {
    const ctx = this.labelCanvas.getContext('2d');
    if (!ctx) return;
    const width = this.labelCanvas.width;
    const height = this.labelCanvas.height;
    ctx.clearRect(0, 0, width, height);

    const boxHeight = this.equipmentLineVisible ? height - 8 : Math.min(56, height - 8);
    ctx.globalAlpha = this.down ? 0.65 : 1;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.strokeStyle = `#${this.options.teamColor.toString(16).padStart(6, '0')}`;
    ctx.lineWidth = this.highlighted ? 6 : 4;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, boxHeight, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f4f2ea';
    ctx.font = '700 27px "Barlow Semi Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nameY = this.equipmentLineVisible ? 26 : boxHeight / 2 + 1;
    const name = this.options.name;
    ctx.fillText(this.down ? `${name} (à terre)` : name, width / 2, nameY, width - 20);

    if (this.equipmentLineVisible) {
      const items = this.items;
      const carried = items ? CARRIED_ITEMS.filter((item) => items.includes(item)) : [];
      if (items === null || carried.length === 0) {
        ctx.fillStyle = '#9aa0ad';
        ctx.font = '400 19px "Barlow Semi Condensed", sans-serif';
        ctx.fillText(items === null ? 'matériel inconnu' : 'sans matériel', width / 2, 68);
      } else {
        ctx.font = '400 30px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        const step = 46;
        const start = width / 2 - ((carried.length - 1) * step) / 2;
        carried.forEach((item, i) => {
          ctx.fillStyle = `#${ITEM_COLORS[item].toString(16).padStart(6, '0')}`;
          ctx.fillText(ITEM_ICONS[item], start + i * step, 68);
        });
      }
    }
    ctx.globalAlpha = 1;
    this.labelTexture.needsUpdate = true;
  }
}
