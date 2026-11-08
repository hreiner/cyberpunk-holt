"""Soumissions v4 ciblées, traçables et bornées par l'allocation de l'orchestrateur."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/voice'
OUTPUT = MASTER / 'takes'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def accounting():
    plan = json.loads((HERE / 'PLAN.json').read_text(encoding='utf-8'))
    previous = ROOT / plan['historicalCounter']
    assert sha(previous) == plan['historicalCounterSha256']
    current = []
    for path in sorted(OUTPUT.glob('*.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        current.append({'journal': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
                        'line': record['line'], 'characters': record['characters'],
                        'state': record['state']})
    total = sum(row['characters'] for row in current)
    return {'historicalCharacters': plan['historicalCharacters'],
            'newAnnotatedCharacters': total,
            'submittedCharacters': plan['historicalCharacters'] + total,
            'newAttempts': current, 'actualCost': None, 'providerRequestIds': None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--line', type=int, required=True, help='Indice local 1–62, global38–99 dans DIRECTION')
    parser.add_argument('--approved', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    policy = json.loads((HERE / 'ALLOCATION.json').read_text(encoding='utf-8'))
    assert sha(HERE / 'DIRECTION.json') == policy['directionSha256']
    assert sha(HERE / 'CAST.json') == policy['castSha256']
    if not args.dry_run and (not args.approved or policy['status'] != 'integrator-approved'):
        raise PermissionError('Allocation intégrateur et soumission autorisée requises.')
    lines = json.loads((HERE / 'DIRECTION.json').read_text(encoding='utf-8'))
    if not 1 <= args.line <= len(lines):
        raise ValueError('Indice local hors conduite')
    before = accounting()
    if any(row['state'] == 'running' for row in before['newAttempts']):
        raise ValueError('Tentative running à diagnostiquer avant tout nouvel appel.')
    if before['newAnnotatedCharacters'] + len(lines[args.line - 1]['en']) > policy['newCharacterLimit']:
        raise ValueError('Allocation initiale et réserve dépassées, tags/échecs compris.')
    sys.path.insert(0, str(ROOT / 'anime'))
    from holt_anime import voice_take
    sys.argv = ['voice_take', '--line', str(args.line), '--lines', str(HERE / 'DIRECTION.json'),
                '--cast', str(HERE / 'CAST.json'), '--model', 'eleven_v4',
                '--output', str(OUTPUT), '--max-characters', str(policy['newCharacterLimit'])]
    sys.argv += ['--dry-run'] if args.dry_run else ['--approved']
    if args.retry:
        sys.argv.append('--retry')
    if args.dry_run:
        voice_take.main()
        return
    MASTER.mkdir(parents=True, exist_ok=True)
    lock = MASTER / 'generation.lock'
    with lock.open('x', encoding='utf-8') as handle:
        handle.write(str(args.line))
    try:
        voice_take.main()
    finally:
        (MASTER / 'COUNTER.json').write_text(json.dumps(accounting(), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        lock.unlink()


if __name__ == '__main__':
    main()
