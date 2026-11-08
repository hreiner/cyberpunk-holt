"""Montage local déclaratif : fonds, portraits, pistes audio et sous-titres."""
import json
import math
import subprocess
import tempfile
import textwrap
from pathlib import Path


def _time(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def render(project, root, output, ffmpeg='ffmpeg'):
    root, output = Path(root), Path(output)
    if output.exists():
        raise FileExistsError(output)
    shots = project['shots']
    if not shots:
        raise ValueError('La chronologie est vide.')
    total = 0.0
    args = [str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-nostdin', '-n']
    filters, video = [], []
    for i, shot in enumerate(shots):
        duration = float(shot['duration'])
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError('Durée de plan invalide')
        for key in ('background', 'portrait'):
            file = root / shot[key]
            if not file.is_file():
                raise FileNotFoundError(file)
            args += ['-loop', '1', '-framerate', '24', '-t', str(duration), '-i', str(file)]
        filters += [f'[{i*2}:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540,setsar=1[bg{i}]',
                    f'[{i*2+1}:v]scale=240:320,setsar=1[p{i}]',
                    f'[bg{i}][p{i}]overlay=30:160:shortest=1,format=yuv420p[v{i}]']
        video.append(f'[v{i}]')
        total += duration
    filters.append(''.join(video) + f'concat=n={len(shots)}:v=1:a=0[vout]')
    audio_labels = []
    input_index = len(shots) * 2
    for track in project.get('audio', []):
        file = root / track['path']
        if not file.is_file():
            raise FileNotFoundError(file)
        offset = float(track.get('start', 0))
        volume = float(track.get('volume', 1))
        if not math.isfinite(offset) or offset < 0 or not math.isfinite(volume) or volume < 0:
            raise ValueError('Piste audio invalide')
        if track.get('loop', False):
            args += ['-stream_loop', '-1']
        args += ['-i', str(file)]
        filters.append(f'[{input_index}:a]volume={volume},adelay={round(offset*1000)}:all=1[a{input_index}]')
        audio_labels.append(f'[a{input_index}]')
        input_index += 1
    if audio_labels:
        filters.append(''.join(audio_labels) + f'amix=inputs={len(audio_labels)}:duration=longest:normalize=0,atrim=duration={total},alimiter=limit=0.95[aout]')
    cues = project.get('subtitles', [])
    subtitles = []
    for i, cue in enumerate(cues, 1):
        start, end = float(cue['start']), float(cue['end'])
        if not 0 <= start < end <= total or '\n' in cue['text']:
            raise ValueError('Sous-titre invalide')
        wrapped = textwrap.fill(cue['text'], width=48, break_long_words=False, break_on_hyphens=False)
        subtitles.append(f'{i}\n{_time(start)} --> {_time(end)}\n{wrapped}\n')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        if cues:
            srt = Path(temp) / 'fr.srt'
            srt.write_text('\n'.join(subtitles), encoding='utf-8')
            args += ['-i', str(srt)]
        args += ['-filter_complex', ';'.join(filters), '-map', '[vout]']
        if audio_labels:
            args += ['-map', '[aout]', '-c:a', 'aac']
        if cues:
            args += ['-map', f'{input_index}:0', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=fra']
        args += ['-t', str(total), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(output)]
        subprocess.run(args, check=True, capture_output=True)
    return output


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('project')
    parser.add_argument('output')
    parser.add_argument('--root', default='.')
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args()
    with open(args.project, encoding='utf-8') as file:
        render(json.load(file), args.root, args.output, args.ffmpeg)

if __name__ == '__main__':
    main()
