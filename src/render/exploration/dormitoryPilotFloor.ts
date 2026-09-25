/** Maintained, gently brushed concrete with 4 m expansion seams. Generated locally. */
import * as THREE from 'three';
import { createRng } from '@/core/rng';

export function createDormitoryPilotFloor(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;
  const rng = createRng('dormitory-pilot-floor');
  ctx.fillStyle = '#a8ada8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 180; i++) {
    const x = rng.next() * canvas.width;
    const y = rng.next() * canvas.height;
    const w = 40 + rng.next() * 190;
    ctx.fillStyle = rng.next() < 0.5 ? 'rgba(255,244,219,0.018)' : 'rgba(21,47,53,0.025)';
    ctx.fillRect(x, y, w, 1 + rng.next() * 4);
  }
  const metresX = canvas.width / 25;
  const metresY = canvas.height / 15;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(45,59,61,0.20)';
  for (let x = 4; x < 25; x += 4) {
    ctx.beginPath();
    ctx.moveTo(x * metresX, 0);
    ctx.lineTo(x * metresX, canvas.height);
    ctx.stroke();
  }
  for (let y = 3; y < 15; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y * metresY);
    ctx.lineTo(canvas.width, y * metresY);
    ctx.stroke();
  }
  // Warm light edge: the windows are outside the cutaway but the sun falls into the room.
  const light = ctx.createLinearGradient(0, 0, 0, canvas.height);
  light.addColorStop(0, 'rgba(255,238,191,0.10)');
  light.addColorStop(0.6, 'rgba(255,238,191,0)');
  light.addColorStop(1, 'rgba(34,52,58,0.04)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}
