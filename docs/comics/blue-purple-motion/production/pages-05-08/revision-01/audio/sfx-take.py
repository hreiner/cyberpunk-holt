"""Appel SFX CLI OAuth ciblé, journalisé et borné ; aucun transfert de jeton."""
import argparse
import hashlib
import json
import os
import subprocess
import time
import uuid
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01'
OUTPUT = MASTER / 'audio-v1/sfx-takes'
PLAN = HERE / 'SFX-PLAN.json'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--id', required=True)
    parser.add_argument('--approved', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    plan = json.loads(PLAN.read_text(encoding='utf-8'))
    candidates = [row for row in plan['sounds'] if row['id'] == args.id]
    if len(candidates) != 1:
        raise ValueError('Son inconnu ou dupliqué.')
    sound = candidates[0]
    previous = [json.loads(path.read_text(encoding='utf-8'))
                for path in MASTER.glob('audio-*/sfx-takes/*.json')]
    if any(row['state'] == 'running' for row in previous):
        raise ValueError('Tentative active : inspecter avant nouvelle soumission.')
    if any(row.get('httpStatus') == 401 for row in previous):
        raise PermissionError('HTTP401 déjà rencontré : appels OAuth SFX arrêtés, repli local requis.')
    if any(row['soundId'] == args.id for row in previous) and not args.retry:
        raise ValueError('Prise existante : reprise ciblée explicite requise.')
    request_count = len(previous) + 1
    duration = sum(row['requestedSeconds'] for row in previous) + sound['durationSeconds']
    if request_count > plan['maxRequests'] or duration > plan['maxRequestedSeconds']:
        raise ValueError('Plafond SFX dépassé : requêtes ou durée demandée.')
    request = {'text': sound['text'], 'duration_seconds': sound['durationSeconds'],
               'model_id': plan['model'], 'prompt_influence': .6, 'loop': False}
    if args.dry_run:
        print(json.dumps({'request': request, 'requestsAfter': request_count,
                          'requestedSecondsAfter': duration, 'state': 'preview'}, ensure_ascii=False))
        return
    if not args.approved or plan['status'] != 'integrator-approved' or args.id not in plan.get('approvedSoundIds', []):
        raise PermissionError('Contre-revue de prompt et autorisation requises.')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    stem = f"{args.id}-{uuid.uuid4().hex[:12]}"
    audio, journal = OUTPUT / f'{stem}.mp3', OUTPUT / f'{stem}.json'
    record = {'schemaVersion': 1, 'soundId': args.id, 'state': 'running',
              'provider': 'ElevenLabs CLI OAuth', 'requestedSeconds': sound['durationSeconds'],
              'request': request, 'promptPlan': PLAN.relative_to(ROOT).as_posix(),
              'promptPlanSha256': hashlib.sha256(PLAN.read_bytes()).hexdigest(),
              'createdUnix': time.time(), 'actualCost': None, 'providerRequestId': None,
              'file': None, 'httpStatus': None}
    journal.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    cli = Path(os.environ.get('HOLT_ELEVENLABS_CLI', str(Path(os.environ['APPDATA']) /
               'npm/node_modules/@elevenlabs/cli/bin/cli.js')))
    command = ['node', str(cli), 'text-to-sound-effects', 'convert', '--json', '-',
               '--output-format', 'mp3_44100_128', '--output', str(audio), '--quiet', '--no-retry']
    try:
        result = subprocess.run(command, input=json.dumps(request), text=True,
                                capture_output=True, timeout=180)
        ok = result.returncode == 0 and audio.exists() and audio.stat().st_size > 0
        record.update({'state': 'review' if ok else 'failed', 'exitCode': result.returncode,
                       'file': audio.name if audio.exists() else None,
                       'error': result.stderr[-2000:] if result.returncode else None,
                       'httpStatus': 401 if '401' in result.stderr else None})
        if ok:
            record['sha256'] = hashlib.sha256(audio.read_bytes()).hexdigest()
    except BaseException as error:
        record.update({'state': 'interrupted' if isinstance(error, KeyboardInterrupt) else 'failed',
                       'error': str(error)})
        raise
    finally:
        record['finishedUnix'] = time.time()
        journal.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        summary = {'schemaVersion': 1, 'requests': request_count, 'requestedSeconds': duration,
                   'maxRequests': plan['maxRequests'], 'maxRequestedSeconds': plan['maxRequestedSeconds'],
                   'actualCost': None, 'providerRequestIds': None,
                   'policy': 'Échecs et interruptions comptés ; pas de nouvel appel après HTTP401.'}
        (OUTPUT.parent / 'sfx-budget.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(record, ensure_ascii=False))
    if record['state'] != 'review':
        raise SystemExit(1)


if __name__ == '__main__':
    main()
