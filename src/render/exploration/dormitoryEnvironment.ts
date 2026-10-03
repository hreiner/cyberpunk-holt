import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Réflexions diffuses du décor du dortoir, préfiltrées une seule fois par session.
 * Le résultat appartient à l'appelant ; aucune scène ne reçoit cet environnement globalement.
 */
export function createDormitoryEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const generator = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  try {
    return generator.fromScene(room, 0.04);
  } finally {
    room.dispose();
    generator.dispose();
  }
}
