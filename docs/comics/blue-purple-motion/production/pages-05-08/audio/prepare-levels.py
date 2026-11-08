"""Deux gains constants locaux : préserver le jeu doux en le rendant audible."""
import copy
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
GAINS_DB = {21: 10, 22: 10}


def rel(path):
    return path.relative_to(ROOT).as_posix()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    selected_path = OUTPUT / 'prepared-measurements.json'
    prepared = OUTPUT / 'prepared'
    if selected_path.exists() or prepared.exists():
        raise FileExistsError('Sélection existante conservée : créer une nouvelle révision.')
    original = OUTPUT / 'measurements.json'
    report = copy.deepcopy(json.loads(original.read_text(encoding='utf-8')))
    prepared.mkdir()
    cursor = 0
    with wave.open(str(OUTPUT / 'audition-prepared.wav'), 'wb') as audition:
        audition.setnchannels(1)
        audition.setsampwidth(2)
        audition.setframerate(44100)
        for cue in report['cues']:
            source = ROOT / cue['audio']
            gain = GAINS_DB.get(cue['globalLine'], 0)
            cue.update({'sourceAudio': cue['audio'], 'sourceSha256': sha(source),
                        'constantGainDb': gain, 'compression': False, 'timeStretch': False})
            if gain:
                target = prepared / f"{cue['globalLine']:02}-{cue['speaker']}-gain-plus-{gain}db.wav"
                subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(source),
                                '-af', f'volume={gain}dB', '-ac', '1', '-ar', '44100',
                                '-c:a', 'pcm_s16le', str(target)], check=True)
                cue['audio'] = rel(target)
                cue['sha256'] = sha(target)
            process = subprocess.run([str(FFMPEG), '-hide_banner', '-xerror', '-err_detect', 'explode',
                                      '-i', str(ROOT / cue['audio']), '-vn', '-af', 'volumedetect',
                                      '-ac', '1', '-ar', '44100', '-f', 's16le', 'pipe:1'], capture_output=True)
            assert process.returncode == 0 and process.stdout
            assert len(process.stdout) // 2 == cue['pcmSamples'], 'La préparation a modifié la durée.'
            log = process.stderr.decode('utf-8', errors='replace')
            cue['meanDb'] = float(re.search(r'mean_volume: ([-\d.]+)', log).group(1))
            cue['peakDb'] = float(re.search(r'max_volume: ([-\d.]+)', log).group(1))
            assert cue['peakDb'] <= -1.5, 'Crête excessive.'
            cue['auditionStartSeconds'] = round(cursor, 6)
            audition.writeframes(process.stdout)
            gap_samples = round(.65 * 44100)
            audition.writeframes(b'\0' * gap_samples * 2)
            cursor += cue['duration'] + gap_samples / 44100
    subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(OUTPUT / 'audition-prepared.wav'),
                    '-codec:a', 'libmp3lame', '-b:a', '192k', str(OUTPUT / 'audition-prepared.mp3')], check=True)
    report.update({'selection': 'prepared-v1', 'originalMeasurements': rel(original),
                   'originalMeasurementsSha256': sha(original), 'audition': rel(OUTPUT / 'audition-prepared.mp3'),
                   'localPreparation': 'Gain constant +10dB pour lignes21/22 seulement, PCM16 sans réencodage MP3, sans compression ni étirement. Sources conservées ; durées PCM identiques.',
                   'humanListening': 'not-performed'})
    selected_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'selectedMapping': rel(selected_path), 'gainsDb': GAINS_DB,
                      'durationUnchanged': True, 'newTtsCalls': 0}, ensure_ascii=False))


if __name__ == '__main__':
    main()
