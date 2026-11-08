"""Décoder toutes les prises sélectionnées, préserver les huit réemplois et ajuster seulement les niveaux nouveaux trop bas."""
import copy
import hashlib
import json
import re
import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
OUTPUT = ROOT / 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1'
FFMPEG = ROOT / 'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def rel(path):
    return path.relative_to(ROOT).as_posix()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decode(path):
    result = subprocess.run([str(FFMPEG), '-hide_banner', '-xerror', '-err_detect', 'explode',
                             '-i', str(path), '-vn', '-af', 'volumedetect,silencedetect=noise=-45dB:d=0.2',
                             '-ac', '1', '-ar', '44100', '-f', 's16le', 'pipe:1'], capture_output=True)
    if result.returncode or not result.stdout:
        raise ValueError(f'Échec décodage complet : {path}')
    log = result.stderr.decode('utf-8', errors='replace')
    return result.stdout, {'meanDb': float(re.search(r'mean_volume: ([-\d.]+)', log).group(1)),
                           'peakDb': float(re.search(r'max_volume: ([-\d.]+)', log).group(1)),
                           'silenceEvents': re.findall(r'silence_(?:start|end|duration): [\d.]+', log),
                           'duration': round(len(result.stdout) / (44100 * 2), 6),
                           'pcmSamples': len(result.stdout) // 2, 'sampleRate': 44100,
                           'channels': 1, 'decodeExit': result.returncode}


def main():
    selected_path, raw_path = OUTPUT / 'prepared-measurements.json', OUTPUT / 'raw-measurements.json'
    prepared = OUTPUT / 'prepared'
    if any(path.exists() for path in (selected_path, raw_path, prepared)):
        raise FileExistsError('Preuves existantes conservées ; nouvelle révision explicite requise.')
    lines = json.loads((HERE / 'DIRECTION.json').read_text(encoding='utf-8'))
    digest = sha(HERE / 'DIRECTION.json')
    contract = json.loads((HERE.parent / 'CONTRACTS.json').read_text(encoding='utf-8'))
    previous = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/prepared-measurements.json'
    selected = {cue['globalLine']: copy.deepcopy(cue)
                for cue in json.loads(previous.read_text(encoding='utf-8'))['cues']}
    for cue in selected.values():
        cue['production'] = 'reuse'
        assert sha(ROOT / cue['audio']) == cue['sha256']
    journals = [(path, json.loads(path.read_text(encoding='utf-8')))
                for path in sorted((OUTPUT / 'takes').glob('*.json'))]
    assert len(journals) == 14 and sorted(row['line'] for _, row in journals) == list(range(24, 38))
    new_raw = []
    prepared.mkdir()
    for journal, record in journals:
        line = lines[record['line'] - 1]
        assert record['state'] == 'review' and record['model'] == 'eleven_v4'
        assert record['lines_sha256'] == digest and record['text'] == line['en']
        assert record['voice_settings'] == {'stability': .5, 'similarity_boost': .8}
        source = journal.parent / record['file']
        pcm, measures = decode(source)
        assert measures['meanDb'] > -60 and measures['duration'] >= .2
        cue = {'id': line['id'], 'globalLine': line['globalLine'], 'panel_id': line['panel_id'],
               'speaker': line['speaker'], 'audio': rel(source), 'sha256': sha(source),
               'textEn': line['plain_en'], 'textFr': line['fr'], 'ttsText': line['en'],
               'performance': line['performance'], 'ttsModel': record['model'],
               'takeJournal': rel(journal), 'journalSha256': sha(journal),
               'production': 'new', 'humanListening': 'not-performed',
               'technicalState': 'decoded', **measures}
        new_raw.append(copy.deepcopy(cue))
        gain = 0
        if measures['peakDb'] > -1.5:
            gain = round(-1.5 - measures['peakDb'], 1)
        elif measures['meanDb'] < -25:
            gain = round(max(0, min(-22 - measures['meanDb'], -2 - measures['peakDb'])), 1)
        cue.update({'sourceAudio': cue['audio'], 'sourceSha256': cue['sha256'],
                    'constantGainDb': gain, 'compression': False, 'timeStretch': False})
        if gain:
            target = prepared / f"{line['globalLine']:02}-{line['speaker']}-gain-{gain:+.1f}db.wav"
            subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(source), '-af', f'volume={gain}dB',
                            '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', str(target)], check=True)
            pcm, revised = decode(target)
            assert revised['pcmSamples'] == measures['pcmSamples']
            cue.update({**revised, 'audio': rel(target), 'sha256': sha(target)})
        selected[line['globalLine']] = cue
    order = [cue['globalLine'] for page in contract['pages'] for panel in page['panels'] for cue in panel['cues']]
    assert len(order) == 22 and len(set(order)) == 22
    cues, cursor = [], 0
    with wave.open(str(OUTPUT / 'audition.wav'), 'wb') as audition:
        audition.setnchannels(1)
        audition.setsampwidth(2)
        audition.setframerate(44100)
        for number in order:
            cue = selected[number]
            pcm, current = decode(ROOT / cue['audio'])
            assert current['pcmSamples'] == cue['pcmSamples']
            cue['auditionStartSeconds'] = round(cursor, 6)
            audition.writeframes(pcm)
            gap = round(.45 * 44100)
            audition.writeframes(b'\0' * gap * 2)
            cursor += cue['duration'] + gap / 44100
            cues.append(cue)
    subprocess.run([str(FFMPEG), '-v', 'error', '-n', '-i', str(OUTPUT / 'audition.wav'),
                    '-codec:a', 'libmp3lame', '-b:a', '192k', str(OUTPUT / 'audition.mp3')], check=True)
    budget = json.loads((OUTPUT / 'global-budget.json').read_text(encoding='utf-8'))
    report = {'schemaVersion': 1, 'revision': 1, 'date': '2026-11-05', 'source': rel(HERE / 'DIRECTION.json'),
              'sourceSha256': digest, 'model': 'eleven_v4', 'historicalCharacters': 2856,
              **{key: budget[key] for key in ('newCharacters', 'submittedCharacters', 'globalCharacterCap', 'remainingCharacters')},
              'newAttempts': 14, 'reusedTakes': 8, 'failedAttempts': 0, 'actualCost': None,
              'providerRequestIds': None, 'humanListening': 'not-performed',
              'audition': rel(OUTPUT / 'audition.mp3'), 'speechSeconds': round(sum(cue['duration'] for cue in cues), 6),
              'cues': cues}
    raw_path.write_text(json.dumps({'schemaVersion': 1, 'newCues': new_raw}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    selected_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for cue in cues:
        print(json.dumps({key: cue.get(key) for key in ('id', 'duration', 'meanDb', 'peakDb', 'constantGainDb', 'production')}))
    print(json.dumps({'selection': rel(selected_path), 'speechSeconds': report['speechSeconds']}))


if __name__ == '__main__':
    main()
