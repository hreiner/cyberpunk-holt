"""Rendu d'une plage Blender et montage local de son mix et ses sous-titres.

Le rendu saute volontairement des images si --step > 1. La sortie à 24 i/s duplique
les images calculées : ce n'est pas un rendu complet à 24 images distinctes par seconde.
"""
import argparse
import json
import math
import subprocess
import time
from pathlib import Path

FPS = 24


def timestamp(seconds):
    ms = max(0, round(seconds * 1000))
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}'


def subtitles_for(project, start, end):
    cues = []
    for cue in project['subtitles']:
        a, b = max(start, float(cue['start'])), min(end, float(cue['end']))
        if a < b:
            cues.append(f'{len(cues)+1}\n{timestamp(a-start)} --> {timestamp(b-start)}\n{cue["text"]}\n')
    return '\n'.join(cues)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--blend', required=True)
    parser.add_argument('--output-dir', required=True, help='Nouveau dossier pour cet essai')
    parser.add_argument('--blender', required=True)
    parser.add_argument('--ffmpeg', required=True)
    parser.add_argument('--project', default='art-masters/anime/blue-purple/scene-v1.json')
    parser.add_argument('--audio', default='art-masters/anime/blue-purple/mix-scene-v2.m4a')
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=48)
    parser.add_argument('--step', type=int, default=3)
    parser.add_argument('--percentage', type=int, default=50)
    parser.add_argument('--samples', type=int, default=4)
    args = parser.parse_args()
    if args.start < 1 or args.end < args.start or args.step < 1 or not 1 <= args.percentage <= 100 or args.samples < 1:
        parser.error('Plage ou paramètres de rendu invalides')
    root = Path(args.output_dir).resolve()
    root.mkdir(parents=True, exist_ok=False)
    frames = root / 'frames'
    frames.mkdir()
    duration = (args.end - args.start + 1) / FPS
    offset = (args.start - 1) / FPS
    project = json.loads(Path(args.project).read_text(encoding='utf-8'))
    srt = root / 'sous-titres-fr.srt'
    subtitles = subtitles_for(project, offset, offset + duration)
    if subtitles:
        srt.write_text(subtitles, encoding='utf-8')
    override = (f'import bpy; s=bpy.context.scene; s.render.resolution_percentage={args.percentage}; '
                f's.cycles.samples={args.samples}; s.render.image_settings.file_format="PNG"')
    blender = [args.blender, '-b', str(Path(args.blend).resolve()), '--python-expr', override,
               '-o', str(frames / 'frame_'), '-F', 'PNG', '-s', str(args.start), '-e', str(args.end),
               '-j', str(args.step), '-a']
    started = time.monotonic()
    subprocess.run(blender, check=True)
    pictures = sorted(frames.glob('frame_*.png'))
    expected = math.ceil((args.end - args.start + 1) / args.step)
    if len(pictures) != expected:
        raise RuntimeError(f'{len(pictures)} images trouvées ; {expected} attendues')
    playlist = root / 'frames.txt'
    playlist.write_text(''.join(f"file '{p.as_posix()}'\nduration {args.step/FPS:.9f}\n" for p in pictures)
                        + f"file '{pictures[-1].as_posix()}'\n", encoding='utf-8')
    out = root / 'preview.mp4'
    cmd = [args.ffmpeg, '-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-f', 'concat', '-safe', '0',
           '-i', str(playlist), '-ss', str(offset), '-i', args.audio]
    if subtitles: cmd += ['-i', str(srt)]
    cmd += ['-map', '0:v:0', '-map', '1:a:0']
    if subtitles: cmd += ['-map', '2:s:0', '-c:s', 'mov_text', '-metadata:s:s:0', 'language=fra']
    cmd += ['-t', str(duration), '-r', str(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
            '-movflags', '+faststart', str(out)]
    subprocess.run(cmd, check=True)
    print(json.dumps({'video': str(out), 'source_frames': len(pictures), 'duration': duration,
                      'render_seconds': round(time.monotonic()-started, 2)}, ensure_ascii=False))

if __name__ == '__main__':
    main()
