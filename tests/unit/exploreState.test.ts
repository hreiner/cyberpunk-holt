import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { createRunState } from '@/narrative';
import type { NarrativeContext } from '@/narrative';
import { ExploreState, LEADER_SPEED } from '@/explore';
import type { MapDef } from '@/explore';
import { CONDITIONED_MAP, SMALL_MAP } from './fixtures/exploreFixtures';

function ctx(): NarrativeContext {
  return { dossier: createDossier(), run: createRunState('test-seed') };
}

describe('ExploreState — mouvement', () => {
  it('marche en continu vers la case cliquée, à 4 cases/s', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    // (2,1) : sol libre, en ligne droite depuis le spawn (2,4) -- une case occupée par une
    // entité est couverte séparément, voir "ExploreState — jamais sur une entité" plus bas.
    const res = state.walkLeaderTo({ x: 2, y: 1 });
    expect(res.ok).toBe(true);
    expect(state.isMoving()).toBe(true);

    // 4 cases/s : au bout de 500 ms, 2 cases parcourues depuis (2,4).
    state.tick(500);
    const pos = state.leaderPosition();
    const distFromStart = Math.hypot(pos.x - 2, pos.y - 4);
    expect(distFromStart).toBeCloseTo(2, 1);
  });

  it('arrive exactement sur la case cible et redevient immobile', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkLeaderTo({ x: 2, y: 1 });
    for (let i = 0; i < 20; i++) state.tick(200);
    expect(state.isMoving()).toBe(false);
    expect(state.leaderCell()).toEqual({ x: 2, y: 1 });
  });

  it('une case inaccessible retombe sur la case franchissable la plus proche', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.walkLeaderTo({ x: 0, y: 0 }); // un mur
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30; i++) state.tick(200);
    expect(state.isMoving()).toBe(false);
  });

  it('est déterministe : la même séquence de dt produit les mêmes positions', () => {
    const dts = [16, 16, 33, 16, 100, 250, 16, 16, 9, 400];

    const run = () => {
      const state = new ExploreState(SMALL_MAP, ctx(), { followerIds: ['f1', 'f2'] });
      state.walkLeaderTo({ x: 9, y: 4 });
      const snapshots: unknown[] = [];
      for (const dt of dts) {
        state.tick(dt);
        snapshots.push({ leader: state.leaderPosition(), followers: state.followerPositions() });
      }
      return snapshots;
    };

    expect(run()).toEqual(run());
  });

  it('les coéquipiers suivent le meneur à distance, sans jamais le rattraper', () => {
    const state = new ExploreState(SMALL_MAP, ctx(), { followerIds: ['f1', 'f2'] });
    state.walkLeaderTo({ x: 9, y: 4 });
    for (let i = 0; i < 40; i++) {
      state.tick(50);
      const leader = state.leaderPosition();
      for (const f of state.followerPositions()) {
        const dist = Math.hypot(leader.x - f.x, leader.y - f.y);
        expect(dist).toBeGreaterThanOrEqual(0);
      }
    }
    const [f1, f2] = state.followerPositions();
    // f2 reste toujours au moins aussi loin du meneur que f1 (ordre de filature respecté).
    const leader = state.leaderPosition();
    const d1 = Math.hypot(leader.x - (f1?.x ?? 0), leader.y - (f1?.y ?? 0));
    const d2 = Math.hypot(leader.x - (f2?.x ?? 0), leader.y - (f2?.y ?? 0));
    expect(d2).toBeGreaterThanOrEqual(d1 - 0.001);
  });

  it("un nouveau clic remplace la destination à tout moment", () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkLeaderTo({ x: 2, y: 2 });
    state.tick(100);
    state.walkLeaderTo({ x: 4, y: 4 });
    for (let i = 0; i < 20; i++) state.tick(200);
    expect(state.leaderCell()).toEqual({ x: 4, y: 4 });
  });
});

describe('ExploreState — interactions', () => {
  it('un objet sans dialogue déclenche une réplique brève', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const outcome = state.interact('locker');
    expect(outcome).toEqual({ kind: 'brief-line', entityId: 'locker', text: 'Un vieux casier.' });
  });

  it('un npc avec dialogue déclenche l’ouverture du dialogue', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const outcome = state.interact('guard');
    expect(outcome).toEqual({ kind: 'dialogue', entityId: 'guard', dialogueId: 'test.npc', startNode: 'start' });
  });

  it('une porte ouverte se ferme, une porte fermée s’ouvre', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    expect(state.isDoorOpen('doorAB')).toBe(true);
    const closed = state.interact('doorAB');
    expect(closed).toEqual({ kind: 'door-toggled', entityId: 'doorAB', open: false });
    expect(state.isDoorOpen('doorAB')).toBe(false);
    const opened = state.interact('doorAB');
    expect(opened).toEqual({ kind: 'door-toggled', entityId: 'doorAB', open: true });
  });

  it('une porte verrouillée sans dialogue renvoie sa réplique de verrou', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const outcome = state.interact('secretDoor');
    expect(outcome).toEqual({ kind: 'door-locked', entityId: 'secretDoor', line: 'Verrouillée.' });
    expect(state.isDoorOpen('secretDoor')).toBe(false);
  });

  it('une sortie renvoie un changement de carte', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const outcome = state.interact('gate');
    expect(outcome).toEqual({ kind: 'change-map', entityId: 'gate', targetMapId: 'other', targetSpawn: 'arrivee' });
  });

  it('une entité conditionnée est inactive tant que le drapeau est faux', () => {
    const context = ctx();
    const state = new ExploreState(CONDITIONED_MAP, context);
    expect(state.listInteractables().some((i) => i.id === 'guard')).toBe(false);
    expect(state.interact('guard').kind).toBe('none');

    context.run.flags['discours-fini'] = true;
    expect(state.listInteractables().some((i) => i.id === 'guard')).toBe(true);
    expect(state.interact('guard').kind).toBe('dialogue');
  });

  it('requestInteract marche jusqu’à la case adjacente puis déclenche, via un événement de tick', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.requestInteract('chair');
    expect(res.ok).toBe(true);
    expect(state.isMoving()).toBe(true);

    let fired: unknown = null;
    for (let i = 0; i < 30 && !fired; i++) {
      const events = state.tick(150);
      fired = events.find((e) => e.kind === 'interaction-fired');
    }
    expect(fired).toMatchObject({
      kind: 'interaction-fired',
      entityId: 'chair',
      outcome: { kind: 'dialogue', dialogueId: 'test.seat' },
    });
  });

  it(
    'un npc/object posé sur une case franchissable a une case d’interaction ' +
      'ADJACENTE, jamais sa propre case (on se place à côté, pas dessus)',
    () => {
      const state = new ExploreState(SMALL_MAP, ctx());
      const interactables = state.listInteractables();
      const guard = interactables.find((i) => i.id === 'guard'); // npc, case {2,2} déjà franchissable
      const locker = interactables.find((i) => i.id === 'locker'); // object, case {3,4} déjà franchissable
      expect(guard).toBeDefined();
      expect(locker).toBeDefined();

      for (const info of [guard, locker]) {
        if (!info) continue;
        expect(info.interactionCell).not.toEqual(info.cell);
        const dist = Math.max(Math.abs(info.interactionCell.x - info.cell.x), Math.abs(info.interactionCell.y - info.cell.y));
        expect(dist).toBe(1); // adjacente (8 directions), pas plus loin
      }
    },
  );

  it('un seat a sa case d’interaction SUR sa propre case (on s’assoit dessus) -- exception assumée', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkTo(8, 2); // entre dans "roomB" (découverte pièce par pièce) : "chair" y vit.
    const chair = state.listInteractables().find((i) => i.id === 'chair');
    expect(chair).toBeDefined();
    expect(chair?.interactionCell).toEqual(chair?.cell);
  });

  it('une exit a sa case d’interaction SUR sa propre case (on la franchit) -- exception assumée', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const gate = state.listInteractables().find((i) => i.id === 'gate');
    expect(gate).toBeDefined();
    expect(gate?.interactionCell).toEqual(gate?.cell);
  });

  it('requestInteract fait marcher le meneur à côté du npc, jamais sur sa case', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.requestInteract('guard');
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.leaderCell()).not.toEqual({ x: 2, y: 2 });
    const dist = Math.max(Math.abs(state.leaderCell().x - 2), Math.abs(state.leaderCell().y - 2));
    expect(dist).toBe(1);
  });

  it('interactablesNear filtre par proximité de la case donnée', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const near = state.interactablesNear({ x: 2, y: 2 }, 1);
    expect(near.map((i) => i.id)).toContain('guard');
    expect(near.map((i) => i.id)).not.toContain('gate');
  });
});

describe('ExploreState — on ne marche jamais sur une entité (08-EXPLORATION.md "Contrôles")', () => {
  it('un ordre de déplacement vers la case d’un npc aboutit à sa case d’interaction, jamais dessus', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.walkLeaderTo({ x: 2, y: 2 }); // case du npc "guard"
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.leaderCell()).not.toEqual({ x: 2, y: 2 });
    const dist = Math.max(Math.abs(state.leaderCell().x - 2), Math.abs(state.leaderCell().y - 2));
    expect(dist).toBe(1); // arrêté juste à côté, pas plus loin
  });

  it('un ordre de déplacement vers la case d’un object aboutit à sa case d’interaction, jamais dessus', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.walkLeaderTo({ x: 3, y: 4 }); // case de l'objet "locker"
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.leaderCell()).not.toEqual({ x: 3, y: 4 });
    const dist = Math.max(Math.abs(state.leaderCell().x - 3), Math.abs(state.leaderCell().y - 4));
    expect(dist).toBe(1);
  });

  it('un seat reste une exception assumée : un ordre de déplacement peut aboutir sur sa case', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const res = state.walkLeaderTo({ x: 8, y: 2 }); // case du seat "chair"
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.leaderCell()).toEqual({ x: 8, y: 2 });
  });

  it('une entité d’une pièce non découverte ne dévie pas un ordre de déplacement (rien ne fuite)', () => {
    // "chair" (seat, case (8,2)) est de toute façon exempté -- ici on vise un npc/object mis en
    // scène dans "roomB", non découverte depuis le spawn (roomA) : le meneur doit pouvoir
    // marcher DESSUS sans détour tant que la pièce n'a pas été visitée.
    const map = {
      ...SMALL_MAP,
      id: 'test-small-hidden-object',
      entities: [
        ...SMALL_MAP.entities.filter((e) => e.id !== 'chair'),
        { id: 'hiddenProp', type: 'object' as const, cell: { x: 8, y: 2 }, line: 'Un objet caché.' },
      ],
    };
    const state = new ExploreState(map, ctx());
    expect(state.listInteractables().some((i) => i.id === 'hiddenProp')).toBe(false);
    const res = state.walkLeaderTo({ x: 8, y: 2 });
    expect(res.ok).toBe(true);
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.leaderCell()).toEqual({ x: 8, y: 2 });
  });
});

describe('ExploreState — la découverte des lieux (08-EXPLORATION.md "La découverte des lieux")', () => {
  it('la pièce d’apparition est découverte d’emblée', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    expect(state.isRoomDiscovered('roomA')).toBe(true);
    expect(state.isRoomDiscovered('roomB')).toBe(false);
  });

  it('une entité npc/object/seat d’une pièce non découverte n’apparaît ni dans les interactables ni au parcours clavier', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    // "chair" (seat) vit dans "roomB", non découverte depuis le spawn (roomA).
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(false);
    // Le Tab clavier (ObjectiveHud) ne fait que parcourir listInteractables() -- une entité
    // absente de cette liste est donc mécaniquement absente du parcours clavier aussi.
  });

  it('entrer dans une pièce la découvre, et elle le reste après en être ressorti', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(false);

    state.walkLeaderTo({ x: 8, y: 3 }); // entre dans "roomB" (via la porte)
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.isRoomDiscovered('roomB')).toBe(true);
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(true);

    state.walkLeaderTo({ x: 2, y: 4 }); // ressort vers "roomA"
    for (let i = 0; i < 30 && state.isMoving(); i++) state.tick(150);
    expect(state.isRoomDiscovered('roomB')).toBe(true); // reste découverte
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(true);
  });

  it('entrer dans une pièce émet un événement "room-discovered" une seule fois', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkLeaderTo({ x: 8, y: 3 });
    let discoveries = 0;
    for (let i = 0; i < 30; i++) {
      discoveries += state.tick(150).filter((e) => e.kind === 'room-discovered' && e.roomId === 'roomB').length;
    }
    expect(discoveries).toBe(1);

    // Ressortir puis rerentrer ne redéclenche pas l'événement.
    state.walkLeaderTo({ x: 2, y: 4 });
    for (let i = 0; i < 30; i++) state.tick(150);
    state.walkLeaderTo({ x: 8, y: 3 });
    let secondPass = 0;
    for (let i = 0; i < 30; i++) {
      secondPass += state.tick(150).filter((e) => e.kind === 'room-discovered').length;
    }
    expect(secondPass).toBe(0);
  });

  it('reprendre une sauvegarde avec des pièces déjà découvertes ne les re-cache pas', () => {
    const state = new ExploreState(SMALL_MAP, ctx(), { discoveredRooms: ['roomB'] });
    expect(state.isRoomDiscovered('roomB')).toBe(true);
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(true);
  });

  it('une pièce alwaysDiscovered (ex. la cour de containers) est toujours visible, sans jamais être visitée', () => {
    const map = {
      ...SMALL_MAP,
      id: 'test-small-always-discovered',
      rooms: SMALL_MAP.rooms.map((r) => (r.id === 'roomB' ? { ...r, alwaysDiscovered: true } : r)),
    };
    const state = new ExploreState(map, ctx());
    expect(state.isRoomDiscovered('roomB')).toBe(true);
    expect(state.listInteractables().some((i) => i.id === 'chair')).toBe(true);
  });

  it('les couloirs et les extérieurs (hors MapDef.rooms) sont toujours visibles', () => {
    // Petite carte dédiée : deux pièces d'une case reliées par une case de couloir (2,2), hors
    // de tout `RoomDef` -- exactement le cas "couloirs/extérieurs : jamais une pièce".
    const map: MapDef = {
      id: 'test-corridor',
      title: 'Carte de test',
      ascii: ['#####', '#...#', '##.##', '#...#', '#####'],
      rooms: [
        { id: 'roomTop', title: 'Haut', rect: { origin: { x: 1, y: 1 }, width: 3, height: 1 } },
        { id: 'roomBottom', title: 'Bas', rect: { origin: { x: 1, y: 3 }, width: 3, height: 1 } },
      ],
      entities: [{ id: 'corridorNpc', type: 'npc', cell: { x: 2, y: 2 }, line: 'Un passant.' }],
      spawns: { start: { x: 2, y: 1 } }, // dans "roomTop"
    };
    const state = new ExploreState(map, ctx());
    expect(state.isRoomDiscovered('roomTop')).toBe(true); // pièce d'apparition
    expect(state.isRoomDiscovered('roomBottom')).toBe(false);
    // "corridorNpc" (2,2) est hors des deux `RoomDef` : toujours visible, jamais à visiter.
    expect(state.listInteractables().some((i) => i.id === 'corridorNpc')).toBe(true);
  });
});

describe('ExploreState — zones', () => {
  it('une zone se déclenche une seule fois', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkLeaderTo({ x: 8, y: 3 }); // dans "trapzone"
    let triggeredCount = 0;
    for (let i = 0; i < 30; i++) {
      const events = state.tick(150);
      triggeredCount += events.filter((e) => e.kind === 'zone-triggered').length;
    }
    expect(triggeredCount).toBe(1);

    // Ressortir puis rerentrer ne redéclenche pas.
    state.walkLeaderTo({ x: 2, y: 4 });
    for (let i = 0; i < 30; i++) state.tick(150);
    state.walkLeaderTo({ x: 8, y: 3 });
    let secondPass = 0;
    for (let i = 0; i < 30; i++) {
      const events = state.tick(150);
      secondPass += events.filter((e) => e.kind === 'zone-triggered').length;
    }
    expect(secondPass).toBe(0);
  });
});

describe('ExploreState — objectifs', () => {
  it('se termine quand le déclencheur déclaré est déclenché', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.setObjective({ id: 'obj1', title: 'Sortir', context: 'Contexte.', completionTrigger: 'gate' });
    expect(state.objectiveStatus()?.complete).toBe(false);
    state.interact('gate');
    expect(state.objectiveStatus()?.complete).toBe(true);
  });

  it('les tâches facultatives comptent chaque entité une seule fois', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.setObjective({
      id: 'obj1',
      title: 'Explorer',
      context: 'Contexte.',
      completionTrigger: 'gate',
      tasks: [{ id: 't1', label: 'parler aux occupants', entityIds: ['guard', 'chair'] }],
    });
    state.interact('guard');
    state.interact('guard'); // ne recompte pas
    let status = state.objectiveStatus();
    expect(status?.tasks[0]).toMatchObject({ count: 1, target: 2, done: false });

    state.interact('chair');
    status = state.objectiveStatus();
    expect(status?.tasks[0]).toMatchObject({ count: 2, target: 2, done: true });
  });

  it('completeStep() force la complétion sans attendre le vrai déclencheur (développement)', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.setObjective({ id: 'obj1', title: 'Sortir', context: 'Contexte.', completionTrigger: 'gate' });
    state.completeStep();
    expect(state.objectiveStatus()?.complete).toBe(true);
  });
});

describe('ExploreState — API de debug', () => {
  it('explore() renvoie un instantané cohérent', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const snap = state.explore();
    expect(snap.mapId).toBe('test-small');
    expect(snap.leader).toEqual({ x: 2, y: 4 });
    expect(snap.interactables.some((i) => i.id === 'guard')).toBe(true);
  });

  it('walkTo() téléporte sans animation', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    state.walkTo(8, 2);
    expect(state.isMoving()).toBe(false);
    expect(state.leaderCell()).toEqual({ x: 8, y: 2 });
  });

  it('interact() déclenche sans marcher', () => {
    const state = new ExploreState(SMALL_MAP, ctx());
    const outcome = state.interact('gate');
    expect(outcome.kind).toBe('change-map');
    // Le meneur n'a pas bougé.
    expect(state.leaderCell()).toEqual({ x: 2, y: 4 });
  });
});

// Vitesse : sanity check sur la constante documentée (08-EXPLORATION.md "Contrôles").
describe('LEADER_SPEED', () => {
  it('vaut 4 cases par seconde', () => {
    expect(LEADER_SPEED).toBe(4);
  });
});
