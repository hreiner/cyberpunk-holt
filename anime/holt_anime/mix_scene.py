"""Mixage audio local de la scène Blue Purple, à partir de sa chronologie JSON."""
from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path


def mix_scene(project: dict, root: str | Path, output: str | Path, ffmpeg: str = 'ffmpeg') -> Path:
    root, output = Path(root), Path(output)
    if output.exists():
        raise FileExistsError(f'Mix déjà présent : {output}')
    duration = sum(float(shot['duration']) for shot in project['shots'])
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('Durée invalide')
    tracks = project['audio']
    if len(tracks) < 3:
        raise ValueError('Musique, ambiance et au moins une voix sont requises')
    cmd = [str(ffmpeg), '-hide_banner', '-nostdin', '-loglevel', 'error', '-n']
    for index, track in enumerate(tracks):
        file = root / track['path']
        if not file.is_file():
            raise FileNotFoundError(file)
        if index < 2:
            cmd.extend(['-stream_loop', '-1'])
        cmd.extend(['-i', str(file)])
    filters = []
    # Les voix sont placées selon leurs positions déjà mesurées dans le montage.
    voice_labels = []
    for index, track in enumerate(tracks[2:], 2):
        offset = float(track.get('start', 0))
        if not math.isfinite(offset) or offset < 0 or offset >= duration:
            raise ValueError('Début de voix invalide')
        filters.append(f'[{index}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,highpass=f=75,volume=0.9,adelay={round(offset*1000)}:all=1[v{index}]')
        voice_labels.append(f'[v{index}]')
    filters.append(''.join(voice_labels) + f'amix=inputs={len(voice_labels)}:duration=longest:normalize=0,apad=whole_dur={duration},asplit=2[voice][key]')
    # Diminution douce du fond à la parole et respiration quand les voix se taisent.
    filters.append(f'[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.16,atrim=duration={duration},afade=t=in:st=0:d=1,afade=t=out:st={max(0,duration-1.2)}:d=1.2[music]')
    filters.append(f'[1:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.09,atrim=duration={duration},afade=t=in:st=0:d=0.8,afade=t=out:st={max(0,duration-1.2)}:d=1.2[ambience]')
    filters.append('[music][ambience]amix=inputs=2:duration=longest:normalize=0[bed]')
    filters.append('[bed][key]sidechaincompress=threshold=0.025:ratio=3:attack=50:release=600[ducked]')
    filters.append(f'[ducked][voice]amix=inputs=2:duration=longest:normalize=0,atrim=duration={duration},alimiter=limit=0.90[out]')
    output.parent.mkdir(parents=True, exist_ok=True)
    cmd.extend(['-filter_complex', ';'.join(filters), '-map', '[out]', '-t', str(duration), '-c:a', 'aac', '-b:a', '192k', str(output)])
    subprocess.run(cmd, check=True, capture_output=True)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('timeline')
    parser.add_argument('output')
    parser.add_argument('--root', default='.')
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args()
    project = json.loads(Path(args.timeline).read_text(encoding='utf-8'))
    print(mix_scene(project, args.root, args.output, args.ffmpeg))

if __name__ == '__main__':
    main()
