"""Décodage complet, durées PCM et audition séquentielle ; aucune écoute prétendue."""
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
OUTPUT = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-08/audio-v1'
FFMPEG = ROOT / 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return path.relative_to(ROOT).as_posix()


def main():
    direction = HERE / 'DIRECTION.json'
    lines = json.loads(direction.read_text(encoding='utf-8'))
    expected = {row['globalLine'] for row in lines if row['production'] == 'new'}
    budget = json.loads((OUTPUT / 'global-budget.json').read_text(encoding='utf-8'))
    journals = [(path, json.loads(path.read_text(encoding='utf-8')))
                for path in sorted((OUTPUT / 'takes').glob('*.json'))]
    if {row['line'] for _, row in journals} != expected or len(journals) != len(expected):
        raise ValueError('Tentatives différentes du plan : sélection explicite requise.')
    targets = [OUTPUT / name for name in ('measurements.json', 'audition.wav', 'audition.mp3')]
    if any(path.exists() for path in targets):
        raise FileExistsError('Mesures existantes conservées ; nouvelle révision requise.')
    cues = []
    audition_cursor = 0
    with wave.open(str(OUTPUT / 'audition.wav'), 'wb') as audition:
        audition.setnchannels(1)
        audition.setsampwidth(2)
        audition.setframerate(44100)
        for journal, record in journals:
            line = lines[record['line'] - 1]
            assert record['state'] == 'review' and record['lines_sha256'] == sha(direction)
            assert record['model'] == 'eleven_v4'
            assert record['voice_settings'] == {'stability': 0.5, 'similarity_boost': 0.8}
            assert record['text'] == line['en']
            audio = journal.parent / record['file']
            process = subprocess.run([str(FFMPEG), '-hide_banner', '-xerror', '-err_detect', 'explode',
                                      '-i', str(audio), '-vn', '-af',
                                      'volumedetect,silencedetect=noise=-45dB:d=0.2',
                                      '-ac', '1', '-ar', '44100', '-f', 's16le', 'pipe:1'], capture_output=True)
            if process.returncode or not process.stdout:
                raise ValueError(f'Échec décodage complet : {audio}')
            log = process.stderr.decode('utf-8', errors='replace')
            duration = len(process.stdout) / (44100 * 2)
            mean = float(re.search(r'mean_volume: ([-\d.]+)', log).group(1))
            peak = float(re.search(r'max_volume: ([-\d.]+)', log).group(1))
            if mean < -60 or duration < .2:
                raise ValueError(f'Prise anormalement faible ou brève : {audio}')
            cue = {'id': line['id'], 'globalLine': line['globalLine'], 'panel_id': line['panel_id'],
                   'speaker': line['speaker'], 'audio': rel(audio), 'duration': round(duration, 6),
                   'textEn': line['plain_en'], 'textFr': line['fr'], 'ttsText': line['en'],
                   'performance': line['performance'], 'ttsModel': record['model'],
                   'takeJournal': rel(journal), 'sha256': sha(audio), 'journalSha256': sha(journal),
                   'meanDb': mean, 'peakDb': peak, 'pcmSamples': len(process.stdout) // 2,
                   'sampleRate': 44100, 'channels': 1, 'decodeExit': process.returncode,
                   'silenceEvents': re.findall(r'silence_(?:start|end|duration): [\d.]+', log),
                   'auditionStartSeconds': round(audition_cursor, 6),
                   'humanListening': 'not-performed', 'technicalState': 'decoded',
                   'transcriptionStatus': 'source-script-not-auditory-validated'}
            cues.append(cue)
            audition.writeframes(process.stdout)
            gap_samples = round(.65 * 44100)
            audition.writeframes(b'\0' * gap_samples * 2)
            audition_cursor += duration + gap_samples / 44100
    subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(OUTPUT / 'audition.wav'),
                    '-codec:a', 'libmp3lame', '-b:a', '192k', str(OUTPUT / 'audition.mp3')], check=True)
    report = {'schemaVersion': 1, 'date': '2026-11-05', 'source': rel(direction),
              'sourceSha256': sha(direction), 'model': 'eleven_v4',
              **{key: budget[key] for key in ('historicalCharacters', 'newCharacters',
                   'submittedCharacters', 'globalCharacterCap', 'remainingCharacters')},
              'attemptsThisLot': len(journals), 'failedAttemptsThisLot': 0,
              'actualCost': None, 'providerRequestIds': None, 'humanListening': 'not-performed',
              'audition': rel(OUTPUT / 'audition.mp3'), 'cues': cues}
    (OUTPUT / 'measurements.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for cue in cues:
        print(json.dumps({key: cue[key] for key in ('id', 'speaker', 'duration', 'meanDb', 'peakDb')}))
    print(rel(OUTPUT / 'measurements.json'))


if __name__ == '__main__':
    main()
