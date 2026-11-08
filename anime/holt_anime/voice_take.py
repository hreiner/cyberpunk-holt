"""Génération ciblée autorisée, sans réutilisation ni extraction des jetons OAuth."""
import argparse
import hashlib
import json
import os
import subprocess
import time
import uuid
from pathlib import Path

DEFAULT_MODEL = 'eleven_v4'
V4_DEFAULT_SETTINGS = {'stability': 0.5, 'similarity_boost': 0.8}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    parser.add_argument('--line', type=int, required=True, help='Numéro de réplique à partir de 1')
    parser.add_argument('--approved', action='store_true', help='Autorisation explicite pour cette prise')
    parser.add_argument('--max-characters', type=int, required=True, help='Plafond cumulé de caractères soumis dans ce dossier')
    parser.add_argument('--retry', action='store_true', help='Autoriser une nouvelle tentative de cette réplique')
    parser.add_argument('--lines', default='anime/projects/blue-purple/lines.json', help='Conduite JSON, avec tags dans en')
    parser.add_argument('--cast', default='anime/projects/blue-purple/cast.json', help='Casting JSON conservant les IDs')
    parser.add_argument('--model', choices=['eleven_v3', 'eleven_v4'], default=DEFAULT_MODEL, help='Modèle TTS ; v4 standard retenu par défaut')
    parser.add_argument('--dry-run', action='store_true', help='Prévisualiser sans réseau ni écriture')
    args = parser.parse_args()
    lines = json.loads(Path(args.lines).read_text(encoding='utf-8'))
    cast = json.loads(Path(args.cast).read_text(encoding='utf-8'))
    if not 1 <= args.line <= len(lines):
        raise ValueError('Réplique inconnue')
    line = lines[args.line - 1]
    voice = cast[line['speaker']]
    target = Path(args.output)
    if not args.approved and not args.dry_run:
        raise PermissionError('Autorisation explicite requise')
    previous = [json.loads(p.read_text(encoding='utf-8')) for p in target.glob('*.json')] if target.exists() else []
    if any(item['line'] == args.line for item in previous) and not args.retry:
        raise ValueError('Tentative existante : reprise explicite requise')
    if args.max_characters < 0 or sum(item['characters'] for item in previous) + len(line['en']) > args.max_characters:
        raise ValueError('Plafond de caractères dépassé')
    attempt = f'{args.line:02}-{line["speaker"]}-{uuid.uuid4().hex[:12]}'
    audio, manifest = target / (attempt + '.mp3'), target / (attempt + '.json')
    record = {'line': args.line, 'speaker': line['speaker'], 'voice_id': voice['id'],
              'model': args.model, 'language': 'en', 'text': line['en'],
              'characters': len(line['en']), 'estimated_cost': None, 'actual_cost': None,
              'provider_request_id': None, 'state': 'running', 'created_unix': time.time(),
              'lines_source': args.lines, 'lines_sha256': hashlib.sha256(Path(args.lines).read_bytes()).hexdigest(),
              'performance': line.get('performance'), 'plain_text': line.get('plain_en'), 'panel_id': line.get('panel_id')}
    cli = Path(os.environ.get('HOLT_ELEVENLABS_CLI', str(Path(os.environ.get('APPDATA', '')) / 'npm/node_modules/@elevenlabs/cli/bin/cli.js')))
    command = ['node', str(cli), 'text-to-speech', 'convert', '--voice-id', voice['id'],
               '--text', line['en'], '--model-id', args.model, '--language-code', 'en',
               '--output-format', 'mp3_44100_128', '--output', str(audio), '--quiet']
    defaults = dict(V4_DEFAULT_SETTINGS) if args.model == 'eleven_v4' else voice['settings']
    settings = line.get('voice_settings', defaults)
    if settings:
        if args.model == 'eleven_v3' and 'voice_settings' not in line:
            settings = {**settings, 'similarity_boost': .8, 'use_speaker_boost': True}
        command += ['--voice-settings', json.dumps(settings)]
    record['voice_settings'] = settings
    if args.dry_run:
        record['state'] = 'preview'
        print(json.dumps(record, ensure_ascii=False))
        return
    target.mkdir(parents=True, exist_ok=True)
    manifest.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=180)
        record['state'] = 'review' if result.returncode == 0 and audio.exists() and audio.stat().st_size else 'failed'
        record['exit_code'] = result.returncode
        record['file'] = audio.name if audio.exists() else None
        record['error'] = result.stderr[-1000:] if result.returncode else None
    except BaseException as error:
        record['state'] = 'interrupted' if isinstance(error, KeyboardInterrupt) else 'failed'
        record['error'] = str(error)
        raise
    finally:
        manifest.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(record, ensure_ascii=False))
    if record['state'] != 'review':
        raise SystemExit(1)

if __name__ == '__main__': main()
