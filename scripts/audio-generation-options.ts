/** Options communes : une reprise coûteuse doit nommer sa cible. */
export function generationOptions(argv: string[], selector: 'file' | 'asset') {
  const allowed = new Set(['--force', '--dry-run', ...(selector === 'asset' ? ['--music-only'] : [])]);
  const prefix = `--${selector}=`;
  for (const arg of argv) {
    if (!allowed.has(arg) && !arg.startsWith(prefix)) throw new Error(`Option inconnue : ${arg}`);
  }
  const selections = argv.filter((arg) => arg.startsWith(prefix));
  if (selections.length > 1 || selections.some((arg) => arg.length === prefix.length)) {
    throw new Error(`Une seule cible --${selector}=<identifiant> est attendue.`);
  }
  const selected = selections[0]?.slice(prefix.length);
  const force = argv.includes('--force');
  if (force && !selected) throw new Error(`La régénération exige --${selector}=<identifiant>.`);
  return { selected, force, dryRun: argv.includes('--dry-run'), musicOnly: argv.includes('--music-only') };
}
