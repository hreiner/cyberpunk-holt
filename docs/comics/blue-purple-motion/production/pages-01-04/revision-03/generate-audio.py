"""Reprises ciblées, compteur cumulé historique + révision, sans migration de jeton."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
LEGACY = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-04/voices-v4-v1'
OUTPUT = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/takes'
SUMMARY = OUTPUT.parent / 'global-budget.json'
POLICY = HERE / 'AUDIO-BUDGET.json'


def records(directory):
    result = []
    for path in sorted(directory.glob('*.json')):
        record = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(record.get('characters'), int) or record['characters'] < 0:
            raise ValueError(f'Journal de dépense invalide : {path}')
        result.append({'journal': path.relative_to(ROOT).as_posix(),
                       'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                       'line': record['line'], 'characters': record['characters'],
                       'state': record['state']})
    return result


def accounting(cap):
    old, new = records(LEGACY), records(OUTPUT)
    historic = sum(item['characters'] for item in old)
    if len(old) != 11 or historic != 1044:
        raise ValueError('Historique changé : recompter et obtenir un nouveau plafond avant toute soumission.')
    total = historic + sum(item['characters'] for item in new)
    if total > cap:
        raise ValueError('Plafond cumulé dépassé avant soumission.')
    return {'schemaVersion': 1, 'scope': 'blue-purple-pages01-04-all-tts-attempts',
            'globalCharacterCap': cap, 'historicalCharacters': historic,
            'revisionCharacters': total - historic, 'submittedCharacters': total,
            'remainingCharacters': cap - total, 'attempts': old + new,
            'actualCost': None, 'providerRequestIds': None}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--line', type=int, required=True)
    parser.add_argument('--cap', type=int, required=True)
    parser.add_argument('--approved', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    if not args.approved and not args.dry_run:
        raise PermissionError('Feu vert intégrateur requis pour cette dépense.')
    policy = json.loads(POLICY.read_text(encoding='utf-8'))
    if args.cap != policy['globalCharacterCap']:
        raise ValueError('Plafond différent de la politique enregistrée.')
    if not args.dry_run and policy['status'] != 'integrator-approved':
        raise PermissionError('Nouveau plafond cumulé encore à approuver.')
    before = accounting(args.cap)
    historic_hashes = {row['journal']: row['sha256'] for row in before['attempts']
                       if row['journal'].startswith(LEGACY.relative_to(ROOT).as_posix() + '/')}
    if historic_hashes != policy['historicalJournalHashes']:
        raise ValueError('Les journaux historiques diffèrent du relevé de référence.')
    if any(item['state'] == 'running' for item in before['attempts']):
        raise ValueError('Tentative running : inspecter son résultat avant toute nouvelle dépense.')
    lines_path = HERE / 'AUDIO-DIRECTION.json'
    if hashlib.sha256(lines_path.read_bytes()).hexdigest() != policy['directionSha256']:
        raise ValueError('Conduite modifiée : refaire compte et revue avant soumission.')
    lines = json.loads(lines_path.read_text(encoding='utf-8'))
    if not 1 <= args.line <= len(lines):
        raise ValueError('Indice de réplique inconnu.')
    selected = lines[args.line - 1]
    if selected['production'] != 'new':
        raise ValueError('Cette ligne est un réemploi, aucune génération prévue.')
    required = len(selected['en'])
    if required > before['remainingCharacters']:
        raise ValueError('Plafond global insuffisant pour cette réplique, tags compris.')
    sys.path.insert(0, str(ROOT / 'anime'))
    from holt_anime import voice_take
    sys.argv = ['voice_take', '--line', str(args.line), '--lines', str(lines_path),
                '--cast', str(ROOT / 'anime/projects/blue-purple/cast.json'),
                '--output', str(OUTPUT), '--max-characters', str(args.cap - before['historicalCharacters']),
                '--model', 'eleven_v4']
    sys.argv += ['--dry-run'] if args.dry_run else ['--approved']
    if args.retry:
        sys.argv.append('--retry')
    if args.dry_run:
        voice_take.main()
        print(json.dumps({'cumulativeBefore': before['submittedCharacters'],
                          'thisAttempt': required, 'cumulativeAfter': before['submittedCharacters'] + required,
                          'globalCap': args.cap}))
        return
    SUMMARY.parent.mkdir(parents=True, exist_ok=True)
    try:
        voice_take.main()
    finally:
        SUMMARY.write_text(json.dumps(accounting(args.cap), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
