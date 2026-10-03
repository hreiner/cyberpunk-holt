import * as THREE from 'three';
import { expect, it, vi } from 'vitest';
import { ExploreDressing } from '@/render/exploration/dressing';
import type { ExploreVisualPlacement } from '@/data/exploreVisualTypes';

it('ouvre une fermeture spécialisée sans fusionner ses pièces ni dévoiler sa salle', () => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  const roots: THREE.Group[] = [];
  const factory = {
    create(_placement: ExploreVisualPlacement) {
      const root = new THREE.Group();
      const frame = new THREE.Mesh(geometry, material);
      const closure = new THREE.Group();
      closure.name = 'door-closure';
      closure.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
      root.add(frame, closure);
      roots.push(root);
      return root;
    },
    dispose: vi.fn(),
  };
  const dressing = new ExploreDressing(
    {
      mapId: 'test',
      placements: [
        { id: 'fan', model: 'duct-fan', cell: { x: 1, y: 1 }, roomId: 'labo', doorStateId: 'ventilateur' },
        {
          id: 'other-fan',
          model: 'duct-fan',
          cell: { x: 2, y: 1 },
          visibility: 'exterior',
          doorStateId: 'autre',
        },
      ],
    },
    factory,
  );
  try {
    const closure = roots[0]!.getObjectByName('door-closure')!;
    expect(closure.children).toHaveLength(2);
    dressing.syncVisibility({ discoveredRoomIds: new Set(), visibleEntityIds: new Set() });
    dressing.setDoorOpen('ventilateur', true);
    expect(closure.visible).toBe(false);
    expect(roots[0]!.visible).toBe(false);
    expect(roots[1]!.getObjectByName('door-closure')!.visible).toBe(true);
    dressing.syncVisibility({ discoveredRoomIds: new Set(['labo']), visibleEntityIds: new Set() });
    expect(roots[0]!.visible).toBe(true);
    expect(closure.visible).toBe(false);
    dressing.setDoorOpen('ventilateur', false);
    expect(closure.visible).toBe(true);
    expect(roots[0]!.children).toHaveLength(2);
  } finally {
    dressing.dispose();
    geometry.dispose();
    material.dispose();
  }
});

it('synchronise les lots fusionnés avec la découverte et leur étape précalculées', () => {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  const factory = {
    create(_placement: ExploreVisualPlacement) {
      return new THREE.Mesh(geometry, material);
    },
    dispose: vi.fn(),
  };
  const dressing = new ExploreDressing(
    {
      mapId: 'test',
      placements: [
        { id: 'desk-a', model: 'duct-fan', cell: { x: 1, y: 1 }, roomId: 'labo', etape: 'bal' },
        { id: 'desk-b', model: 'duct-fan', cell: { x: 2, y: 1 }, roomId: 'labo', etape: 'bal' },
      ],
    },
    factory,
  );
  try {
    const [instances] = dressing.root.children.filter(
      (child): child is THREE.InstancedMesh => child instanceof THREE.InstancedMesh,
    );
    expect(instances).toBeDefined();
    dressing.syncVisibility({ discoveredRoomIds: new Set(), visibleEntityIds: new Set(), etape: 'bal' });
    expect(instances?.visible).toBe(false);
    dressing.syncVisibility({ discoveredRoomIds: new Set(['labo']), visibleEntityIds: new Set(), etape: 'fuite' });
    expect(instances?.visible).toBe(false);
    dressing.syncVisibility({ discoveredRoomIds: new Set(['labo']), visibleEntityIds: new Set(), etape: 'bal' });
    expect(instances?.visible).toBe(true);
  } finally {
    dressing.dispose();
    geometry.dispose();
    material.dispose();
  }
});
