/**
 * Garde-fou architectural propre au socle d'exploration (lot 3.5, ADR 0013
 * §5). Fichier séparé de `tests/unit/architecture.test.ts` (qui ne couvre
 * que `core`/`rules`/`tactical`/`narrative`) pour ne pas toucher un fichier
 * partagé avec le reste de l'epic 3.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('src/explore — séparation des couches (ADR 0013 §5)', () => {
  const dir = join(process.cwd(), 'src', 'explore');

  it("n'importe jamais three.js", () => {
    for (const file of filesUnder(dir)) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} importe three`).not.toMatch(/from ['"]three['"]/);
    }
  });

  it("ne touche jamais au DOM (document/window)", () => {
    for (const file of filesUnder(dir)) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} touche au DOM`).not.toMatch(/\b(document|window)\./);
    }
  });

  it("n'appelle jamais Math.random", () => {
    for (const file of filesUnder(dir)) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} appelle Math.random`).not.toMatch(/Math\.random\(/);
    }
  });
});

describe('src/ui/objectiveHud.ts — pas de three.js dans le HUD (règle générale ui/)', () => {
  it("n'importe jamais three.js", () => {
    const file = join(process.cwd(), 'src', 'ui', 'objectiveHud.ts');
    const content = readFileSync(file, 'utf8');
    expect(content).not.toMatch(/from ['"]three['"]/);
  });
});
