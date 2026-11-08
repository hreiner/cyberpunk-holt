"""Décoder et mesurer les reprises sans modifier les prises ni appeler de fournisseur."""
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
OUTPUT = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-04/audio-v3'
TAKES = OUTPUT / 'takes'
FFMPEG = ROOT / 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def rel(path):
    return path.relative_to(ROOT).as_posix()


def main():
    source = HERE / 'AUDIO-DIRECTION.json'
    lines = json.loads(source.read_text(encoding='utf-8'))
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    budget = json.loads((OUTPUT / 'global-budget.json').read_text(encoding='utf-8'))
    journals = [(path, json.loads(path.read_text(encoding='utf-8'))) for path in sorted(TAKES.glob('*.json'))]
    assert len(journals) == 15, 'Nombre de tentatives différent du plan : revue explicite requise.'
    assert sorted(record['line'] for _, record in journals) == list(range(1, 16))
    assert all(record['state'] == 'review' and record['lines_sha256'] == digest for _, record in journals)
    assert budget['historicalCharacters'] == 1044 and budget['revisionCharacters'] == 1372
    assert budget['submittedCharacters'] == 2416 and budget['globalCharacterCap'] == 3000
    report_path = OUTPUT / 'measurements.json'
    audition_wav = OUTPUT / 'audition.wav'
    audition_mp3 = OUTPUT / 'audition.mp3'
    assert not any(path.exists() for path in (report_path, audition_wav, audition_mp3)), 'Ne pas écraser les preuves.'
    cues = []
    with wave.open(str(audition_wav), 'wb') as audition:
        audition.setnchannels(1)
        audition.setsampwidth(2)
        audition.setframerate(44100)
        for journal, record in journals:
            line = lines[record['line'] - 1]
            audio = TAKES / record['file']
            result = subprocess.run([str(FFMPEG), '-hide_banner', '-i', str(audio), '-vn',
                                     '-af', 'volumedetect,silencedetect=noise=-45dB:d=0.2',
                                     '-ac', '1', '-ar', '44100', '-f', 's16le', 'pipe:1'], capture_output=True)
            assert result.returncode == 0 and len(result.stdout) > 0, audio
            log = result.stderr.decode('utf-8', errors='replace')
            mean = float(re.search(r'mean_volume: ([-\d.]+)', log).group(1))
            peak = float(re.search(r'max_volume: ([-\d.]+)', log).group(1))
            cue = {'id': line['id'], 'globalLine': record['line'], 'panel_id': line['panel_id'],
                   'speaker': line['speaker'], 'audio': rel(audio),
                   'duration': round(len(result.stdout) / (44100 * 2), 6),
                   'textEn': line['plain_en'], 'textFr': line['fr'], 'ttsText': line['en'],
                   'performance': line['performance'], 'ttsModel': 'eleven_v4',
                   'takeJournal': rel(journal), 'sha256': hashlib.sha256(audio.read_bytes()).hexdigest(),
                   'meanDb': mean, 'peakDb': peak, 'pcmSamples': len(result.stdout) // 2,
                   'sampleRate': 44100, 'channels': 1, 'decodeExit': result.returncode,
                   'silenceEvents': re.findall(r'silence_(?:start|end|duration): [\d.]+', log),
                   'explicitBreathingTags': 0, 'technicalState': 'decoded',
                   'humanListening': 'not-performed', 'transcriptionStatus': 'source-script-not-auditory-validated'}
            assert cue['meanDb'] > -60, f'Prise presque muette : {audio}'
            cues.append(cue)
            audition.writeframes(result.stdout)
            audition.writeframes(b'\0' * round(0.65 * 44100) * 2)
    subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(audition_wav),
                    '-codec:a', 'libmp3lame', '-b:a', '192k', str(audition_mp3)], check=True)
    report = {'schemaVersion': 1, 'revision': 3, 'date': '2026-11-05', 'source': rel(source),
              'sourceSha256': digest, 'model': 'eleven_v4', 'globalCharacterCap': 3000,
              'historicalCharacters': 1044, 'revisionCharacters': 1372,
              'submittedCharacters': 2416, 'remainingCharacters': 584, 'attemptsThisRevision': 15,
              'failedAttemptsThisRevision': 0, 'actualCost': None, 'providerRequestIds': None,
              'humanListening': 'not-performed', 'audition': rel(audition_mp3), 'cues': cues}
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for cue in cues:
        print(json.dumps({key: cue[key] for key in ('id', 'speaker', 'duration', 'meanDb', 'peakDb')}))
    print(rel(report_path))


if __name__ == '__main__':
    main()
