"""Prise ciblée v4, plafond global incluant l'historique et toutes les tentatives."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-08'
OUTPUT = MASTER / 'audio-v1/takes'
POLICY = HERE / 'BUDGET.json'
DIRECTION = HERE / 'DIRECTION.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def accounting(cap):
    historic = json.loads((HERE / 'REUSE-INVENTORY.json').read_text(encoding='utf-8'))
    assert historic['historicalCharacters'] == 2416
    assert sha(ROOT / historic['historicalBudget']) == historic['historicalBudgetSha256']
    for attempt in historic['attempts']:
        assert sha(ROOT / attempt['journal']) == attempt['sha256']
    current = []
    for path in sorted(MASTER.glob('audio-*/takes/*.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(record.get('characters'), int) or record['characters'] < 0:
            raise ValueError(f'Journal invalide : {path}')
        current.append({'journal': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
                        'line': record['line'], 'characters': record['characters'], 'state': record['state']})
    submitted = 2416 + sum(row['characters'] for row in current)
    if submitted > cap:
        raise ValueError('Plafond cumulé dépassé.')
    return {'schemaVersion': 1, 'scope': 'blue-purple-pages01-08-tts-production',
            'globalCharacterCap': cap, 'historicalCharacters': 2416,
            'newCharacters': submitted - 2416, 'submittedCharacters': submitted,
            'remainingCharacters': cap - submitted, 'newAttempts': current,
            'historicalInventory': (HERE / 'REUSE-INVENTORY.json').relative_to(ROOT).as_posix(),
            'actualCost': None, 'providerRequestIds': None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--line', type=int, required=True)
    parser.add_argument('--approved', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    policy = json.loads(POLICY.read_text(encoding='utf-8'))
    cap = policy['globalCharacterCap']
    if not args.dry_run and (not args.approved or policy['status'] != 'integrator-approved'):
        raise PermissionError('Contre-revue et feu vert intégrateur requis.')
    if sha(DIRECTION) != policy['directionSha256']:
        raise ValueError('Conduite changée : recompter et revoir avant soumission.')
    if sha(HERE / 'REUSE-INVENTORY.json') != policy['inventorySha256']:
        raise ValueError('Inventaire historique changé.')
    before = accounting(cap)
    if any(row['state'] == 'running' for row in before['newAttempts']):
        raise ValueError('Tentative running : inspecter avant toute nouvelle soumission.')
    lines = json.loads(DIRECTION.read_text(encoding='utf-8'))
    if not 16 <= args.line <= len(lines) or lines[args.line - 1]['production'] != 'new':
        raise ValueError('Réemploi ou indice inconnu : génération refusée.')
    required = len(lines[args.line - 1]['en'])
    if required > before['remainingCharacters']:
        raise ValueError('Plafond global insuffisant, tags compris.')
    other = sum(row['characters'] for row in before['newAttempts']
                if not (ROOT / row['journal']).parent == OUTPUT)
    sys.path.insert(0, str(ROOT / 'anime'))
    from holt_anime import voice_take
    sys.argv = ['voice_take', '--line', str(args.line), '--lines', str(DIRECTION),
                '--cast', str(ROOT / 'anime/projects/blue-purple/cast.json'),
                '--output', str(OUTPUT), '--max-characters', str(cap - 2416 - other),
                '--model', 'eleven_v4']
    sys.argv += ['--dry-run'] if args.dry_run else ['--approved']
    if args.retry:
        sys.argv.append('--retry')
    if args.dry_run:
        voice_take.main()
        print(json.dumps({'cumulativeBefore': before['submittedCharacters'],
                          'thisAttempt': required, 'cumulativeAfter': before['submittedCharacters'] + required,
                          'globalCharacterCap': cap}))
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    lock = MASTER / 'audio-generation.lock'
    with lock.open('x', encoding='utf-8') as handle:
        handle.write(str(args.line))
    try:
        voice_take.main()
    finally:
        (OUTPUT.parent / 'global-budget.json').write_text(
            json.dumps(accounting(cap), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        lock.unlink()


if __name__ == '__main__':
    main()
