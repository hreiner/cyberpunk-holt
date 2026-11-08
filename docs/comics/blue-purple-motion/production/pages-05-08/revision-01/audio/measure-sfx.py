"""Décodage et préparation de niveau des SFX OAuth, sources et journaux conservés."""
import array
import argparse
import hashlib
import json
import math
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
OUTPUT = ROOT / 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1'
FFMPEG = ROOT / 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
PEAKS = {'punch-wood': -10, 'gun-glass': -8, 'rear-door': -18,
         'footsteps': -22, 'engine-start': -18, 'tire-departure': -18}


def rel(path):
    return path.relative_to(ROOT).as_posix()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decode(path):
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-xerror', '-err_detect', 'explode',
                             '-i', str(path), '-ac', '2', '-ar', '44100',
                             '-f', 'f32le', 'pipe:1'], capture_output=True)
    if result.returncode or not result.stdout:
        raise ValueError(f'SFX impossible à décoder : {path}')
    samples = array.array('f')
    samples.frombytes(result.stdout)
    actual_peak = max(abs(value) for value in samples)
    rms = math.sqrt(sum(value * value for value in samples) / len(samples))
    return samples, {'meanDb': 20 * math.log10(rms) if rms else None,
                     'peakDb': 20 * math.log10(actual_peak) if actual_peak else None,
                     'duration': round(len(samples) / (44100 * 2), 6),
                     'pcmFrames': len(samples) // 2, 'sampleRate': 44100, 'channels': 2,
                     'decodeExit': result.returncode}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', type=int, default=1)
    args = parser.parse_args()
    suffix = '' if args.version == 1 else f'-v{args.version}'
    target, prepared = OUTPUT / f'sfx-measurements{suffix}.json', OUTPUT / f'sfx-prepared{suffix}'
    if target.exists() or prepared.exists():
        raise FileExistsError('Préparation existante conservée, nouvelle révision requise.')
    rows = [(path, json.loads(path.read_text(encoding='utf-8')))
            for path in sorted((OUTPUT / 'sfx-takes').glob('*.json'))]
    assert len(rows) == 6 and all(row['state'] == 'review' for _, row in rows)
    assert {row['soundId'] for _, row in rows} == set(PEAKS)
    prepared.mkdir()
    selection = []
    for journal, record in rows:
        source = journal.parent / record['file']
        assert sha(source) == record['sha256']
        pcm, measures = decode(source)
        gain = round(PEAKS[record['soundId']] - measures['peakDb'], 2)
        output = prepared / f"{record['soundId']}.wav"
        subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(source),
                        '-af', f'volume={gain}dB', '-ac', '2', '-ar', '44100',
                        '-c:a', 'pcm_s16le', str(output)], check=True)
        final_pcm, final = decode(output)
        assert final['pcmFrames'] == measures['pcmFrames']
        # Repérage purement technique de l'activité par blocs10ms, sans inférer le contenu entendu.
        block = 441 * 2
        rms = [math.sqrt(sum(value * value for value in final_pcm[offset:offset + block]) /
                         len(final_pcm[offset:offset + block]))
               for offset in range(0, len(final_pcm), block)]
        threshold = max(rms) * .025
        active = [index for index, value in enumerate(rms) if value >= threshold]
        selection.append({'id': record['soundId'], 'audio': rel(output), 'sha256': sha(output),
                          'sourceAudio': rel(source), 'sourceSha256': sha(source),
                          'takeJournal': rel(journal), 'journalSha256': sha(journal),
                          'provider': 'ElevenLabs CLI OAuth', 'model': record['request']['model_id'],
                          'requestedSeconds': record['requestedSeconds'], 'constantGainDb': gain,
                          'targetPeakDb': PEAKS[record['soundId']], 'sourceMeasures': measures,
                          'activeStartSeconds': active[0] * .01 if active else None,
                          'activeEndSeconds': min(final['duration'], (active[-1] + 1) * .01) if active else None,
                          'humanListening': 'not-performed', 'contentAudit': 'prompt-and-technical-only',
                          'actualCost': None, 'providerRequestId': None, **final})
    report = {'schemaVersion': 1, 'version': args.version, 'date': '2026-11-05', 'requests': len(rows),
              'requestedSeconds': sum(row['requestedSeconds'] for _, row in rows),
              'maxRequests': 8, 'maxRequestedSeconds': 24, 'remainingRequests': 2,
              'remainingRequestedSeconds': 4, 'actualCost': None, 'providerRequestIds': None,
              'humanListening': 'not-performed', 'sounds': selection}
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'report': rel(target), 'requests': report['requests'],
                      'requestedSeconds': report['requestedSeconds'], 'sounds': len(selection)}))


if __name__ == '__main__':
    main()
