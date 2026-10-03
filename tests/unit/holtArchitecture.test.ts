import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { HOLT_MAP } from '@/data/maps/holt';
import { HOLT_NUIT_MAP } from '@/data/maps/holt-nuit';
import { ExploreMap } from '@/explore';
import { buildHoltArchitectureLayout } from '@/render/exploration/holtArchitectureLayout';
import {
  HOLT_DORMITORY_ARCHITECTURE,
  HOLT_STAGED_ARCHITECTURE_PROFILES,
} from '@/render/exploration/holtRoomProfiles';
import { createHoltArchitecture } from '@/render/exploration/holtArchitecture';
import type { DormitoryMaterials } from '@/render/exploration/dormitoryMaterials';
import type { EnvironmentMaterials } from '@/render/exploration/materials';
import { ExploreView } from '@/render/exploreView';
import { HOLT_RENDER_PROFILES } from '@/render/exploration/holtRenderProfiles';
import { buildHoltWallGeometry } from '@/render/exploration/holtWallGeometry';
import { explorationSceneProfile } from '@/render/exploration/explorationSceneProfiles';

describe('enveloppe HOLT', () => {
  it('réduit le miroir au dézoom puis le rétablit seulement dans la pièce découverte', () => {
    let zoom = 16;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        reflectionGain: { value: 0 },
        surface: { value: null },
        surfaceRepeat: { value: new THREE.Vector2() },
      },
    });
    const geometry = new THREE.PlaneGeometry(25, 15);
    const mirror = new THREE.Mesh(geometry, material);
    const discovered = new Set(['dortoirs']);
    const view = Object.assign(Object.create(ExploreView.prototype) as object, {
      def: HOLT_MAP,
      visuals: { dormitoryArchitecture: true },
      enhancedSceneProfile: explorationSceneProfile('holt'),
      dormitoryFloorReflection: mirror,
      activeRoomId: 'dortoirs',
      roomsById: new Map(HOLT_MAP.rooms.map((room) => [room.id, room])),
      discoveredRoomIds: discovered,
      map: new ExploreMap(HOLT_MAP),
      camera: { getZoom: () => zoom },
      dormitoryMaterials: { getTexture: () => null },
    }) as unknown as { syncHoltFloorReflection(): void };
    for (const [distance, visible, gain] of [
      [16, true, 1],
      [30, true, 0.5],
      [34, false, null],
      [16, true, 1],
    ] as const) {
      zoom = distance;
      view.syncHoltFloorReflection();
      expect(mirror.visible).toBe(visible);
      if (gain !== null) expect(material.uniforms.reflectionGain!.value).toBe(gain);
    }
    discovered.clear();
    view.syncHoltFloorReflection();
    expect(mirror.visible).toBe(false);
    geometry.dispose();
    material.dispose();
  });

  it('conserve toutes les parois à leur hauteur construite quels que soient le déplacement et la caméra', () => {
    const layout = buildHoltArchitectureLayout(HOLT_MAP, HOLT_STAGED_ARCHITECTURE_PROFILES);
    const geometry = buildHoltWallGeometry(layout);
    const view = Object.assign(Object.create(ExploreView.prototype) as object, {
      holtArchitecture: { layout, geometry },
      holtCutCellKeys: new Set(['17,27', '38,62']),
      holtAccessoryCutCellKeys: new Set(['17,28']),
      syncHoltArchitecture: vi.fn(),
      syncHoltRoomRendering: vi.fn(),
      quarter: 0,
      activeRoomId: null as string | null,
      activeHoltZoneId: 'couloir-est',
      leaderCell: { x: 21, y: 27 },
    }) as unknown as {
      quarter: number;
      activeRoomId: string | null;
      activeHoltZoneId: string;
      leaderCell: { x: number; y: number };
      holtCutCellKeys: Set<string>;
      holtAccessoryCutCellKeys: Set<string>;
      isCut(sides: string[]): boolean;
      updateHoltCutaway(): void;
    };
    for (const quarter of [0, 1, 2, 3]) {
      view.quarter = quarter;
      for (const room of [null, 'armurerie', 'cour-interieure', 'garage']) {
        view.activeRoomId = room;
        view.activeHoltZoneId = room ?? 'couloir-est';
        view.leaderCell = room === 'garage' ? { x: 38, y: 56 } : { x: 21, y: 27 };
        view.updateHoltCutaway();
        expect(view.holtCutCellKeys.size).toBe(0);
        expect(view.holtAccessoryCutCellKeys.size).toBe(0);
        expect(view.isCut(['north', 'south', 'east', 'west'])).toBe(false);
      }
    }
  });
  it('conserve les trois vrais accès du dortoir, puis couvre les parois de toutes les pièces sans doubler les séparations', () => {
    for (const map of [HOLT_MAP, HOLT_NUIT_MAP]) {
      const dormitory = buildHoltArchitectureLayout(map, HOLT_DORMITORY_ARCHITECTURE);
      const openings = dormitory.cells.filter((cell) => cell.kind === 'opening');
      expect(openings.map((cell) => `${cell.x},${cell.y}`).sort()).toEqual(['25,7', '31,16', '44,16']);
      expect(dormitory.cells.every((cell) => cell.x === 25 || cell.y === 16)).toBe(true);
      expect(
        dormitory.cells.every(
          (cell) => map.ascii[cell.y]?.[cell.x] === (cell.kind === 'opening' ? '+' : '#'),
        ),
      ).toBe(true);
      const full = buildHoltArchitectureLayout(map, {
        id: 'all-rooms',
        roomIds: map.rooms.map((room) => room.id),
        sides: ['north', 'south', 'east', 'west'],
        regions: HOLT_RENDER_PROFILES.filter((profile) => profile.rect).map((profile) => ({
          id: profile.zoneId,
          rect: profile.rect!,
          sides: ['north', 'south', 'east', 'west'],
          alwaysVisible: profile.visibility === 'always',
        })),
      });
      expect(new Set(full.cells.map((cell) => cell.id)).size).toBe(full.cells.length);
      for (const room of map.rooms) {
        const { origin, width, height } = room.rect;
        for (let y = origin.y - 1; y <= origin.y + height; y++) {
          for (let x = origin.x - 1; x <= origin.x + width; x++) {
            if (x !== origin.x - 1 && x !== origin.x + width && y !== origin.y - 1 && y !== origin.y + height)
              continue;
            const mark = map.ascii[y]?.[x];
            if (mark === '#' || mark === '+') expect(full.replacedCellKeys.has(`${x},${y}`)).toBe(true);
          }
        }
      }
      for (const opening of full.cells.filter((cell) => cell.kind === 'opening')) {
        const door = map.entities.find(
          (entity) => entity.type === 'door' && entity.cell.x === opening.x && entity.cell.y === opening.y,
        );
        expect(opening.doorId).toBe(door?.id);
      }
      const staged = buildHoltArchitectureLayout(map, HOLT_STAGED_ARCHITECTURE_PROFILES);
      expect(new Set(HOLT_RENDER_PROFILES.map((profile) => profile.zoneId))).toEqual(
        new Set([
          ...map.rooms.filter((room) => room.id !== 'dortoirs').map((room) => room.id),
          'couloir-ouest',
          'couloir-est',
          'couloir-ceinture',
        ]),
      );
      expect(new Set(HOLT_RENDER_PROFILES.map((profile) => profile.zoneId)).size).toBe(
        HOLT_RENDER_PROFILES.length,
      );
      // Vérifier les profils réellement livrés : une paroi partagée déjà présente ne
      // doit pas masquer l'oubli de sa seconde face. Le pilote possède seul nord/est.
      for (const cell of full.cells)
        for (const face of cell.faces) {
          if (face.roomId === 'dortoirs' && (face.side === 'north' || face.side === 'east')) continue;
          expect(
            staged.cells.some(
              (candidate) =>
                candidate.id === cell.id &&
                candidate.faces.some((owner) => owner.roomId === face.roomId && owner.side === face.side),
            ),
          ).toBe(true);
        }
      expect(staged.windows.length).toBe(
        HOLT_STAGED_ARCHITECTURE_PROFILES.reduce(
          (count, profile) => count + (profile.windows?.length ?? 0),
          0,
        ),
      );
      for (const window of staged.windows) {
        expect(map.ascii[window.cell.y]?.[window.cell.x]).toBe('#');
        expect(
          staged.cells.some(
            (cell) =>
              cell.kind === 'wall' &&
              cell.x === window.cell.x &&
              cell.y === window.cell.y &&
              cell.faces.some((face) => face.roomId === window.roomId && face.side === window.side),
          ),
        ).toBe(true);
        expect(window.width).toBeGreaterThan(0);
        expect(window.width).toBeLessThanOrEqual(0.9);
        expect(window.sillHeight + window.height).toBeLessThan(4.9);
        const face = staged.cells
          .find((cell) => cell.x === window.cell.x && cell.y === window.cell.y)
          ?.faces.find((candidate) => candidate.roomId === window.roomId && candidate.side === window.side);
        // Une baie « Badlands » dans une cloison entre salles produirait une fausse vue extérieure.
        expect(face?.neighborIds[1]).toBe(window.exterior === 'badlands' ? 'exterior' : window.viewRoomId);
      }
    }
  });

  it('actualise un état mutable et libère ses ressources une fois sans détruire les matériaux empruntés', () => {
    const borrowed = new THREE.MeshStandardMaterial();
    const materialDisposed = vi.fn();
    borrowed.addEventListener('dispose', materialDisposed);
    const materials = { get: () => borrowed };
    const environment = new THREE.Texture();
    const environmentDisposed = vi.fn();
    environment.addEventListener('dispose', environmentDisposed);
    const architecture = createHoltArchitecture({
      map: new ExploreMap(HOLT_NUIT_MAP),
      dormitoryMaterials: materials as unknown as DormitoryMaterials,
      environmentMaterials: materials as unknown as EnvironmentMaterials,
      wallTint: 0xaaa9a2,
      wallPaintTint: 0x31545d,
      // Shared room/corridor ownership, paired thresholds and real courtyard apertures.
      // Only landscape painting needs a DOM; retaining courtyard windows exercises their ownership in Node.
      profiles: HOLT_STAGED_ARCHITECTURE_PROFILES.map((profile) => ({
        ...profile,
        windows: profile.windows?.filter((window) => window.exterior === 'courtyard'),
      })),
    });
    // The two ASCII rows separating cantine and classroom must yield one physical slab/crown.
    const target = architecture.geometry.get('horizontal:42,31')!;
    expect(target.center).toEqual(architecture.geometry.get('horizontal:42,32')!.center);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    let slabs = 0;
    let crowns = 0;
    const paintSides = new Set<number>();
    architecture.group.traverse((object) => {
      if (!(object instanceof THREE.InstancedMesh)) return;
      for (let index = 0; index < object.count; index++) {
        object.getMatrixAt(index, matrix);
        matrix.decompose(position, rotation, scale);
        const sameColumn =
          Math.abs(position.x - (target.center.x - (HOLT_NUIT_MAP.ascii[0]!.length - 1) / 2)) < 0.01;
        const deltaZ = position.z - (target.center.y - (HOLT_NUIT_MAP.ascii.length - 1) / 2);
        if (!sameColumn) continue;
        if (Math.abs(deltaZ) < 0.01 && Math.abs(scale.y - 2.45) < 0.01 && Math.abs(scale.z - 0.34) < 0.01)
          slabs++;
        if (Math.abs(deltaZ) < 0.01 && Math.abs(scale.y - 0.07) < 0.01 && Math.abs(scale.z - 0.39) < 0.01)
          crowns++;
        if (Math.abs(scale.z - 0.018) < 0.002 && scale.y > 0.5 && Math.abs(deltaZ) < 0.25)
          paintSides.add(Math.sign(deltaZ));
      }
    });
    expect(slabs).toBe(1);
    expect(crowns).toBe(1);
    expect(paintSides).toEqual(new Set([-1, 1]));
    const ownedStandardMaterials = new Set<THREE.MeshStandardMaterial>();
    architecture.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials)
        if (material instanceof THREE.MeshStandardMaterial && material !== borrowed)
          ownedStandardMaterials.add(material);
    });
    expect(ownedStandardMaterials.size).toBeGreaterThan(0);
    const reflectiveWindowMaterial = [...ownedStandardMaterials].find(
      (material) => material instanceof THREE.MeshPhysicalMaterial,
    );
    expect(reflectiveWindowMaterial).toBeDefined();
    architecture.setEnvironment(environment);
    expect(reflectiveWindowMaterial?.envMap).toBe(environment);
    expect(reflectiveWindowMaterial?.envMapIntensity).toBe(0.12);
    expect(
      [...ownedStandardMaterials]
        .filter((material) => material !== reflectiveWindowMaterial)
        .every((material) => material.envMap === null),
    ).toBe(true);
    expect(borrowed.envMap).toBeNull();
    architecture.setEnvironment(null);
    expect(reflectiveWindowMaterial?.envMap).toBeNull();
    expect(
      [...ownedStandardMaterials]
        .filter((material) => material !== reflectiveWindowMaterial)
        .every((material) => material.envMap === null),
    ).toBe(true);
    architecture.setEnvironment(environment);
    const geometries = new Set<THREE.BufferGeometry>();
    architecture.group.traverse((object) => {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry);
    });
    const disposed = vi.fn();
    for (const geometry of geometries) geometry.addEventListener('dispose', disposed);
    const discovered = new Set(HOLT_NUIT_MAP.rooms.map((room) => room.id));
    const cuts = new Set<string>();
    const state = { active: true, discoveredRoomIds: discovered, cutCellKeys: cuts };
    architecture.setState(state);
    const visibleFullBefore: THREE.Object3D[] = [];
    architecture.group.traverseVisible((object) => {
      if (object.name.includes('full-height')) visibleFullBefore.push(object);
    });
    expect(visibleFullBefore.length).toBeGreaterThan(0);
    for (const cell of architecture.layout.cells) cuts.add(`${cell.x},${cell.y}`);
    architecture.setState(state);
    expect(visibleFullBefore.every((object) => !object.visible)).toBe(true);
    architecture.setState({ ...state, activeDoorIds: new Set(), isDoorOpen: () => false });
    const closedLeaves: THREE.Object3D[] = [];
    architecture.group.traverseVisible((object) => {
      if (object.name.endsWith('-holt-door-leaf')) closedLeaves.push(object);
    });
    // Une porte hors étape reste fermée en décor : seule son interaction est désactivée.
    expect(closedLeaves.length).toBeGreaterThan(0);
    for (const root of architecture.pickables)
      root.traverse((object) => {
        if (object instanceof THREE.Mesh) expect(object.layers.mask).toBe(0);
      });
    architecture.dispose();
    architecture.dispose();
    expect(disposed).toHaveBeenCalledTimes(geometries.size);
    expect(materialDisposed).not.toHaveBeenCalled();
    expect(environmentDisposed).not.toHaveBeenCalled();
    environment.dispose();
    borrowed.dispose();
  });
});
