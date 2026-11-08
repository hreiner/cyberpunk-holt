"""Prépare une chronologie à partir des prises vérifiées et de leurs durées."""
import argparse
import json
import re
import subprocess
from pathlib import Path


def duration(path, ffmpeg):
    info = subprocess.run([ffmpeg, '-hide_banner', '-i', str(path)], capture_output=True, text=True).stderr
    match = re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)', info)
    if not match:
        raise ValueError(f'Durée illisible : {path}')
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('voices')
    parser.add_argument('output')
    parser.add_argument('--ffmpeg', required=True)
    args = parser.parse_args()
    output, folder = Path(args.output), Path(args.voices)
    if output.exists():
        raise FileExistsError(output)
    lines = json.loads(Path('anime/projects/blue-purple/lines.json').read_text(encoding='utf-8'))
    manifests = [json.loads(p.read_text(encoding='utf-8')) for p in folder.glob('*.json')]
    project = {'source': 'docs/anime/SCREENPLAY.md : S01', 'status': 'prises à revoir', 'shots': [], 'subtitles': [],
               'audio': [{'path': 'public/assets/audio/background/music-neon.mp3', 'loop': True, 'volume': .10},
                         {'path': 'public/assets/audio/background/ambience-night-city.mp3', 'loop': True, 'volume': .07}]}
    names = {'wendy': 'Wendy', 'enfant': "L’enfant", 'franklyn': 'Franklyn', 'john': 'John', 'grover': 'Grover', 'abigail': 'Abigail'}
    position = 0.0
    for index, line in enumerate(lines, 1):
        matching = [m for m in manifests if m['line'] == index and m['state'] == 'review' and m['text'] == line['en']]
        if len(matching) != 1:
            raise ValueError(f'Une prise candidate attendue pour la réplique {index}, {len(matching)} trouvée(s)')
        audio = folder / matching[0]['file']
        seconds = duration(audio, args.ffmpeg)
        shot_length = round(seconds + 1.0, 2)
        portrait = 'inconnue' if line['speaker'] == 'wendy' else line['speaker']
        project['shots'].append({'duration': shot_length, 'background': 'public/assets/backdrops/blue-purple-rencontre.webp', 'portrait': f'public/assets/portraits/{portrait}.webp'})
        project['audio'].append({'path': str(audio), 'start': round(position + .3, 2), 'volume': .9})
        project['subtitles'].append({'start': round(position + .15, 2), 'end': round(position + shot_length - .1, 2), 'text': f"{names[line['speaker']]} : {line['fr']}"})
        position += shot_length
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(project, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(lines)} répliques, {position:.1f} secondes ; {output}')

if __name__ == '__main__': main()
