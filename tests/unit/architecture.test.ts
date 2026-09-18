/**
 * Tests de garde-fou architecturaux.
 *
 * Ils existent pour qu'un agent (ou un humain presse) ne casse pas
 * silencieusement les invariants du projet decrits dans
 * docs/process/ARCHITECTURE.md.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRAITS } from '@/rules/character';
import type { TraitId } from '@/rules/character';

const SRC = join(process.cwd(), 'src');

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

describe('separation des couches', () => {
  const logicDirs = ['core', 'rules', 'tactical'];

  it("la logique de jeu n'importe jamais three.js", () => {
    for (const dir of logicDirs) {
      for (const file of filesUnder(join(SRC, dir))) {
        const content = readFileSync(file, 'utf8');
        expect(content, `${file} importe three`).not.toMatch(/from ['"]three['"]/);
      }
    }
  });

  it("la logique de jeu n'appelle jamais Math.random", () => {
    for (const dir of logicDirs) {
      for (const file of filesUnder(join(SRC, dir))) {
        const content = readFileSync(file, 'utf8');
        // `randomSeedLabel` accepte une source d'entropie par defaut : c'est la
        // seule exception, et elle n'est utilisee que pour fabriquer un libelle.
        if (file.endsWith('rng.ts')) continue;
        expect(content, `${file} appelle Math.random`).not.toMatch(/Math\.random\(/);
      }
    }
  });

  it("le module tactique ne touche pas au DOM", () => {
    for (const file of filesUnder(join(SRC, 'tactical'))) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} touche au DOM`).not.toMatch(/\b(document|window)\./);
    }
  });
});

describe('traits', () => {
  it('tout trait marque comme tactique est reellement cable dans le moteur', () => {
    // On ne regarde QUE le moteur tactique : `rules/character.ts` contient la
    // declaration de tous les traits, l'y inclure rendrait le test vide de sens.
    const tacticalSources = filesUnder(join(SRC, 'tactical'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');

    const tacticalTraits = (Object.keys(TRAITS) as TraitId[]).filter((id) => TRAITS[id].tactical);
    for (const id of tacticalTraits) {
      expect(tacticalSources, `le trait ${id} est annonce tactique mais n'est cable nulle part`).toContain(
        `'${id}'`,
      );
    }
  });
});
