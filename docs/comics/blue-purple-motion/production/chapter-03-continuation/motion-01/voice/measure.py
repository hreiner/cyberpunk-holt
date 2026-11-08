"""Mesure float des prises entières, gain constant seulement et mapping stable FR/EN."""
import array
import hashlib
import json
import math
import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
MASTER = ROOT / 'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/voice'
FFMPEG = ROOT / 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return path.relative_to(ROOT).as_posix()


def decode(path):
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-v', 'error', '-xerror',
                             '-err_detect', 'explode', '-i', str(path), '-vn', '-ac', '1', '-ar', '44100',
                             '-c:a', 'pcm_f32le', '-f', 'f32le', 'pipe:1'], capture_output=True)
    if result.returncode or not result.stdout:
        raise ValueError(f'Décodage complet refusé : {path} {result.stderr.decode(errors="replace")}')
    samples = array.array('f')
    samples.frombytes(result.stdout)
    peak = max(abs(v) for v in samples)
    rms = math.sqrt(sum(v * v for v in samples) / len(samples))
    db = lambda value: 20 * math.log10(max(1e-12, value))
    onset = next((i for i, value in enumerate(samples) if abs(value) > 0.01), None)
    return samples, {'duration': len(samples) / 44100, 'pcmSamples': len(samples),
                     'sampleRate': 44100, 'channels': 1, 'peakDb': db(peak), 'meanDb': db(rms),
                     'firstAboveMinus40DbSeconds': onset / 44100 if onset is not None else None,
                     'fullDecodeExit': 0, 'measurementFormat': 'float32-unfiltered'}


def main():
    lines = json.loads((HERE / 'DIRECTION.json').read_text(encoding='utf-8'))
    direction_sha = sha(HERE / 'DIRECTION.json')
    journals = [(p, json.loads(p.read_text(encoding='utf-8'))) for p in sorted((MASTER / 'takes').glob('*.json'))]
    selected = {}
    for path, record in journals:
        if record['state'] == 'review':
            selected[record['line']] = (path, record)
    assert sorted(selected) == list(range(1, len(lines) + 1)), 'Toutes les prises doivent exister.'
    report_path = MASTER / 'SELECTION.json'
    if report_path.exists():
        raise FileExistsError('Sélection existante : créer une révision explicite plutôt que remplacer.')
    prepared = MASTER / 'prepared'
    prepared.mkdir(exist_ok=True)
    cues = []
    audition_cursor = 0
    audition_path = MASTER / 'audition.wav'
    with wave.open(str(audition_path), 'wb') as audition:
        audition.setnchannels(1)
        audition.setsampwidth(2)
        audition.setframerate(44100)
        for local_line, line in enumerate(lines, 1):
            journal, record = selected[local_line]
            assert record['lines_sha256'] == direction_sha and record['text'] == line['en']
            assert record['model'] == 'eleven_v4'
            assert record['voice_settings'] == {'stability': .5, 'similarity_boost': .8}
            source = journal.parent / record['file']
            samples, raw = decode(source)
            assert raw['duration'] >= .2 and raw['meanDb'] > -60
            # Rapprocher les voix très faibles ; ne pas compresser ni étirer.
            # Une marge au pic préserve les consonnes fortes pour le mix final.
            gain = min(-2 - raw['peakDb'], max(0, -22 - raw['meanDb']))
            if raw['peakDb'] > -1.5:
                gain = -1.5 - raw['peakDb']
            gain = round(gain, 3)
            if abs(gain) < .05:
                gain = 0
            target = source
            measured = raw
            if abs(gain) >= .05:
                target = prepared / f"{line['globalLine']:03}-{line['speaker']}-gain-{gain:+.3f}db.wav"
                subprocess.run([str(FFMPEG), '-hide_banner', '-v', 'error', '-n', '-i', str(source),
                                '-af', f'volume={gain}dB', '-ac', '1', '-ar', '44100',
                                '-c:a', 'pcm_s16le', str(target)], check=True)
                samples, measured = decode(target)
                assert measured['pcmSamples'] == raw['pcmSamples']
            cue = {'id': line['id'], 'globalLine': line['globalLine'], 'localLine': local_line,
                   'panel_id': line['panel_id'], 'dialogueIndex': line['dialogueIndex'],
                   'pageId': line['pageId'], 'speaker': line['speaker'],
                   'textFr': line['fr'], 'textEn': line['plain_en'], 'ttsText': line['en'],
                   'performance': line['performance'], 'ttsModel': 'eleven_v4',
                   'voiceId': record['voice_id'], 'audio': rel(target), 'sha256': sha(target),
                   'sourceAudio': rel(source), 'sourceSha256': sha(source),
                   'takeJournal': rel(journal), 'journalSha256': sha(journal),
                   'constantGainDb': gain, 'compression': False, 'timeStretch': False,
                   'production': 'new', 'humanListening': 'not-performed', 'technicalState': 'decoded',
                   'rawMeasurement': raw, 'auditionStartSeconds': audition_cursor, **measured}
            cues.append(cue)
            pcm = array.array('h', (max(-32768, min(32767, round(v * 32767))) for v in samples))
            audition.writeframes(pcm.tobytes())
            audition.writeframes(b'\0' * round(.4 * 44100) * 2)
            audition_cursor += measured['duration'] + .4
    mp3 = MASTER / 'audition.mp3'
    subprocess.run([str(FFMPEG), '-hide_banner', '-v', 'error', '-n', '-i', str(audition_path),
                    '-codec:a', 'libmp3lame', '-b:a', '192k', str(mp3)], check=True)
    counter = json.loads((MASTER / 'COUNTER.json').read_text(encoding='utf-8'))
    report = {'schemaVersion': 1, 'date': '2026-11-07', 'direction': rel(HERE / 'DIRECTION.json'),
              'directionSha256': direction_sha, 'model': 'eleven_v4', 'cues': cues,
              'newAttempts': len(journals), 'selectedTakes': len(cues),
              'speechSeconds': sum(cue['duration'] for cue in cues),
              'audition': rel(mp3), 'auditionSha256': sha(mp3),
              'humanListening': 'not-performed', 'actualCost': None, 'providerRequestIds': None,
              'counter': counter}
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (HERE / 'SELECTION.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'selection': rel(report_path), 'voices': len(cues), 'speechSeconds': report['speechSeconds'],
                      'submittedCharacters': counter['submittedCharacters']}))


if __name__ == '__main__':
    main()
