"""Passe autorisée séquentielle, conserve les réussites et s'arrête au premier échec."""
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/voice'


def main():
    lines = json.loads((HERE / 'DIRECTION.json').read_text(encoding='utf-8'))
    records = [json.loads(p.read_text(encoding='utf-8')) for p in (MASTER / 'takes').glob('*.json')]
    if any(row['state'] != 'review' for row in records):
        raise ValueError('Échec ou interruption à diagnostiquer avant toute reprise de lot.')
    done = {row['line'] for row in records}
    for number in range(1, len(lines) + 1):
        if number in done:
            continue
        result = subprocess.run([sys.executable, str(HERE / 'generate.py'), '--line', str(number), '--approved'],
                                capture_output=True, text=True, encoding='utf-8', errors='replace')
        (MASTER / 'batch-log.txt').open('a', encoding='utf-8').write(result.stdout + result.stderr)
        if result.returncode:
            print(json.dumps({'localLine': number, 'globalLine': lines[number - 1]['globalLine'],
                              'exitCode': result.returncode, 'state': 'stopped-on-failure'}), flush=True)
            print(result.stderr[-1500:], flush=True)
            raise SystemExit(result.returncode)
        print(json.dumps({'localLine': number, 'globalLine': lines[number - 1]['globalLine'],
                          'speaker': lines[number - 1]['speaker'], 'state': 'generated'}), flush=True)


if __name__ == '__main__':
    main()
