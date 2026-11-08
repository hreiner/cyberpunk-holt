"""Prise v4 révision01, historique2856 et réserve444 bornés sur tous dossiers."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01'
OUTPUT = MASTER / 'audio-v1/takes'
DIRECTION = HERE / 'DIRECTION.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def accounting(policy):
    history = json.loads((HERE / 'INVENTORY.json').read_text(encoding='utf-8'))
    assert history['historicalCharacters'] == 2856
    assert sha(ROOT / history['previousCounter']) == history['previousCounterSha256']
    for row in history['attempts']:
        assert sha(ROOT / row['journal']) == row['sha256']
    current = []
    for path in sorted(MASTER.glob('audio-*/takes/*.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(record.get('characters'), int) or record['characters'] < 0:
            raise ValueError(f'Journal invalide : {path}')
        current.append({'journal': path.relative_to(ROOT).as_posix(), 'sha256': sha(path),
                        'line': record['line'], 'characters': record['characters'], 'state': record['state']})
    actual = sum(row['characters'] for row in current)
    submitted = 2856 + actual
    if submitted > min(policy['globalCharacterCap'], policy['submissionCharacterLimit']):
        raise ValueError('Plafond global ou réserve allouée dépassé.')
    return {'schemaVersion': 1, 'scope': 'blue-purple-pages05-08-revision01-all-tts-attempts',
            'globalCharacterCap': policy['globalCharacterCap'], 'historicalCharacters': 2856,
            'newCharacters': actual, 'submittedCharacters': submitted,
            'remainingCharacters': policy['globalCharacterCap'] - submitted,
            'submissionCharacterLimit': policy['submissionCharacterLimit'],
            'remainingAllocatedCharacters': policy['submissionCharacterLimit'] - submitted,
            'newAttempts': current, 'actualCost': None, 'providerRequestIds': None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--line', type=int, required=True)
    parser.add_argument('--approved', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    policy = json.loads((HERE / 'BUDGET.json').read_text(encoding='utf-8'))
    if not args.dry_run and (not args.approved or policy['status'] != 'integrator-approved'):
        raise PermissionError('Contre-revue et feu vert intégrateur requis.')
    if sha(DIRECTION) != policy['directionSha256'] or sha(HERE / 'INVENTORY.json') != policy['inventorySha256']:
        raise ValueError('Conduite ou inventaire modifié : refaire revue/compte avant appel.')
    before = accounting(policy)
    if any(row['state'] == 'running' for row in before['newAttempts']):
        raise ValueError('Tentative running : inspecter avant nouvelle soumission.')
    lines = json.loads(DIRECTION.read_text(encoding='utf-8'))
    if not 24 <= args.line <= len(lines) or lines[args.line - 1]['production'] != 'new':
        raise ValueError('Réemploi ou indice inconnu : génération refusée.')
    required = len(lines[args.line - 1]['en'])
    if required > before['remainingAllocatedCharacters']:
        raise ValueError('Plafond/réserve insuffisant, tags compris.')
    other = sum(row['characters'] for row in before['newAttempts']
                if not (ROOT / row['journal']).parent == OUTPUT)
    sys.path.insert(0, str(ROOT / 'anime'))
    from holt_anime import voice_take
    sys.argv = ['voice_take', '--line', str(args.line), '--lines', str(DIRECTION),
                '--cast', str(ROOT / 'anime/projects/blue-purple/cast.json'),
                '--output', str(OUTPUT), '--max-characters', str(policy['submissionCharacterLimit'] - 2856 - other),
                '--model', 'eleven_v4']
    sys.argv += ['--dry-run'] if args.dry_run else ['--approved']
    if args.retry:
        sys.argv.append('--retry')
    if args.dry_run:
        voice_take.main()
        print(json.dumps({'cumulativeBefore': before['submittedCharacters'], 'thisAttempt': required,
                          'cumulativeAfter': before['submittedCharacters'] + required,
                          'globalCharacterCap': policy['globalCharacterCap'],
                          'submissionCharacterLimit': policy['submissionCharacterLimit']}))
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    lock = MASTER / 'audio-generation.lock'
    with lock.open('x', encoding='utf-8') as handle:
        handle.write(str(args.line))
    try:
        voice_take.main()
    finally:
        (OUTPUT.parent / 'global-budget.json').write_text(
            json.dumps(accounting(policy), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        lock.unlink()


if __name__ == '__main__':
    main()
