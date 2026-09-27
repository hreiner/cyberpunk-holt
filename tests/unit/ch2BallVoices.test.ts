import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CH2_BALL_VOICE_CUES } from '@/data/ch2BallVoices';
import { CH2_ZACHARY_VOICE_CUES } from '@/data/ch2ZacharyVoices';
import { DIALOGUES } from '@/data/dialogues/registry';

describe('voix du bal', () => {
  it('chaque prise possède un fichier et chaque prise liée au dialogue vise un nœud existant', () => {
    const ids = new Set<string>();
    const files = new Set<string>();
    for (const cue of CH2_BALL_VOICE_CUES) {
      expect(ids.has(cue.id), `prise répétée : ${cue.id}`).toBe(false);
      expect(files.has(cue.file), `fichier répété : ${cue.file}`).toBe(false);
      ids.add(cue.id);
      files.add(cue.file);
      const path = resolve('public/assets/audio/voices/ch2-bal', `${cue.file}.mp3`);
      expect(existsSync(path), `prise absente : ${cue.file}`).toBe(true);
      expect(statSync(path).size, `prise vide : ${cue.file}`).toBeGreaterThan(1024);
      if (cue.id.startsWith('slow.')) continue; // plans horodatés, pas nœuds du DialogueRunner
      const [dialogueId, nodeId] = cue.id.split('#');
      expect(DIALOGUES[dialogueId!]?.nodes[nodeId!], `nœud absent : ${cue.id}`).toBeDefined();
    }
  });

  it('la narration cesse avant les portes et ne revient pas pendant la fusillade', () => {
    expect(CH2_BALL_VOICE_CUES.some((cue) => cue.id === 'slow.doors')).toBe(false);
    expect(
      CH2_BALL_VOICE_CUES.some((cue) => cue.id.startsWith('ch2.slow#') && cue.voice === 'narrator'),
    ).toBe(false);
    expect(CH2_BALL_VOICE_CUES.find((cue) => cue.id === 'ch2.slow#zachary-se-releve')?.voice).toBe('zachary');
  });
});

describe('voix de la mort de Zachary', () => {
  it('chaque branche des derniers mots et les deux répliques d’Abigail ont une prise locale', () => {
    const ids = new Set<string>();
    const files = new Set<string>();
    for (const cue of CH2_ZACHARY_VOICE_CUES) {
      expect(ids.has(cue.id), `prise répétée : ${cue.id}`).toBe(false);
      expect(files.has(cue.file), `fichier répété : ${cue.file}`).toBe(false);
      ids.add(cue.id);
      files.add(cue.file);
      const path = resolve('public/assets/audio/voices/ch2-egouts', `${cue.file}.mp3`);
      expect(existsSync(path), `prise absente : ${cue.file}`).toBe(true);
      expect(statSync(path).size, `prise vide : ${cue.file}`).toBeGreaterThan(1024);
      if (cue.id === 'zachary.open') continue;
      const [dialogueId, nodeId] = cue.id.split('#');
      expect(DIALOGUES[dialogueId!]?.nodes[nodeId!], `nœud absent : ${cue.id}`).toBeDefined();
    }
    for (const nodeId of [
      'franklyn-loyal-proche',
      'franklyn-loyal',
      'franklyn-proche',
      'franklyn-froid',
      'franklyn-neutre',
    ]) {
      expect(ids.has(`ch2.egouts#${nodeId}`), `derniers mots muets : ${nodeId}`).toBe(true);
    }
    expect(ids.has('ch2.egouts#mort')).toBe(true);
    expect(ids.has('ch2.egouts#refus')).toBe(true);
    expect(CH2_ZACHARY_VOICE_CUES.filter((cue) => cue.voice === 'narrator').map((cue) => cue.id)).toEqual([
      'zachary.open',
      'ch2.egouts#soins',
    ]);
  });
});
