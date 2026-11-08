"""Fabrication locale de plans 2,5D à partir de tableaux fixes.

Ce moteur anime la caméra et l'étalonnage ; il ne fabrique ni jeu d'acteur ni lèvres.
Les fichiers de sortie sont nouveaux, les sources et montages antérieurs restent intacts.
"""
import argparse
from collections import deque
import json
import math
import subprocess
import tempfile
from pathlib import Path

FPS = 24


def run(args):
    try:
        subprocess.run(args, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(exc.stderr[-4000:]) from exc


def cut_background(source, crop, output, ffmpeg):
    """N'enlève que le blanc relié aux bords, pas les yeux ni les écussons."""
    x, y, w, h = crop
    raw = subprocess.run([str(ffmpeg), '-loglevel', 'error', '-i', str(source),
                          '-vf', f'crop={w}:{h}:{x}:{y},format=rgba', '-frames:v', '1',
                          '-f', 'rawvideo', 'pipe:1'], check=True, capture_output=True).stdout
    pixels = bytearray(raw)
    seen = bytearray(w*h)
    queue = deque()
    def offer(i):
        if seen[i]: return
        seen[i] = 1
        j = i*4
        r, g, b = pixels[j:j+3]
        if min(r, g) >= 225 and b >= 215 and max(r,g,b)-min(r,g,b) <= 30:
            queue.append(i)
    for xx in range(w):
        offer(xx); offer((h-1)*w+xx)
    for yy in range(h):
        offer(yy*w); offer(yy*w+w-1)
    def component():
        found = []
        while queue:
            i = queue.popleft()
            found.append(i)
            xx, yy = i%w, i//w
            if xx: offer(i-1)
            if xx+1 < w: offer(i+1)
            if yy: offer(i-w)
            if yy+1 < h: offer(i+w)
        return found
    for i in component(): pixels[i*4+3] = 0
    # Grandes poches de fond fermées par les tresses d'Abigail ou la chevelure
    # de Grover. Les petits îlots (yeux, lettres et insignes) sont conservés.
    if crop[1] == 512:
        for seed in range(w*h):
            if not seen[seed]:
                offer(seed)
                if queue:
                    region = component()
                    is_hair_gap = (crop[0] == 0 and len(region) >= 20 and
                                   all(120 < i % w < 400 and i // w > 200 for i in region))
                    is_grover_edge = (crop[0] == 1100 and len(region) >= 10 and
                                      (all(i // w < 90 for i in region) or
                                       all(i % w > 340 and i // w < 240 for i in region)))
                    if len(region) >= 700 or is_hair_gap or is_grover_edge:
                        for i in region: pixels[i*4+3] = 0
    subprocess.run([str(ffmpeg), '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba',
                    '-s', f'{w}x{h}', '-i', 'pipe:0', '-frames:v', '1', '-y', str(output)],
                    input=bytes(pixels), check=True, capture_output=True)



def render_shot(shot, index, root, output, ffmpeg='ffmpeg'):
    """Construit un plan autonome, aux dimensions et cadence communes."""
    root, output = Path(root), Path(output)
    if output.exists():
        raise FileExistsError(output)
    duration = float(shot['duration'])
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('Durée invalide')
    frames = shot.get("_frames", max(1, round(duration * FPS)))
    # Les plans portant un visuel dédié utilisent celui-ci ; sinon champ/contrechamp
    # sur portrait, avec quelques respirations sur le décor établi.
    visual = shot.get('image') or (shot['background'] if index in (0, 9) else shot['portrait'])
    anchor = 'art-masters/comics/holt-12-pages/v2/references/CAST-ANCHOR.png'
    anchor_crops = {'franklyn': (0, 0, 512, 480), 'john': (1024, 0, 512, 480),
                    'abigail': (0, 512, 512, 466), 'grover': (1100, 512, 436, 466)}
    person = Path(shot.get('portrait', '')).stem
    anchor_crop = anchor_crops.get(person) if not shot.get('image') else None
    if anchor_crop and (root / anchor).is_file():
        visual = anchor
    path = root / visual
    if not path.is_file():
        raise FileNotFoundError(path)
    # Cadrage centré sur le haut du portrait (yeux) ; va-et-vient de caméra discret.
    direction = 1 if index % 2 == 0 else -1
    x = "(iw-iw/zoom)/2" + (f"+{direction}*(iw-iw/zoom)*0.07*sin(on/{frames}*PI)")
    y = "(ih-ih/zoom)*0.22" if visual == shot.get('portrait') else "(ih-ih/zoom)/2"
    z = f"1.05+0.07*on/{frames}"
    # Un cadrage source optionnel permet de puiser une case dans une planche.
    crop = shot.get('crop') or anchor_crop
    prefix = ''
    if crop:
        if len(crop) != 4 or any(not isinstance(v, int) or v < 0 for v in crop) or not crop[2] or not crop[3]:
            raise ValueError('Cadrage invalide')
        x0, y0, w, h = crop
        prefix = f'crop={w}:{h}:{x0}:{y0},'
    # Évocation abstraite de la vision numérique ; aucune coordonnée réelle.
    vision = ''
    if index in (10, 11, 12):
        vision = ("drawgrid=w=120:h=90:t=1:color=cyan@0.18,"
                  "drawbox=x=80:y=80:w=800:h=380:color=cyan@0.45:t=2,")
    doc_path = root / 'art-masters/anime/blue-purple/coordinate-document.png'
    if index == 9 and not doc_path.is_file():
        vision = ('drawbox=x=270:y=130:w=420:h=270:color=0xddd8c8@0.94:t=fill,'
                  'drawbox=x=310:y=180:w=270:h=8:color=0x273146:t=fill,'
                  'drawbox=x=310:y=215:w=230:h=8:color=0x273146:t=fill,'
                  'drawbox=x=310:y=250:w=295:h=8:color=0x273146:t=fill,')
    grade = 'colorbalance=rh=-0.10:gh=-0.06:bh=0.12,' if anchor_crop else ''
    vf = (prefix + grade + f"scale=1440:810:force_original_aspect_ratio=increase,crop=1440:810:(iw-1440)/2:(ih-810)*0.22,"
          f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=960x540:fps={FPS},"
          "eq=contrast=1.04:saturation=1.08:brightness=-0.015," + vision +
          "drawbox=x=0:y=0:w=iw:h=28:color=black@1:t=fill,"
          "drawbox=x=0:y=512:w=iw:h=28:color=black@1:t=fill,"
          "format=yuv420p")
    output.parent.mkdir(parents=True, exist_ok=True)
    mask_temp = tempfile.TemporaryDirectory() if anchor_crop else None
    if anchor_crop:
        mask_path = Path(mask_temp.name) / 'mask.png'
        cut_background(path, anchor_crop, mask_path, ffmpeg)
        path = mask_path
    args = [str(ffmpeg), '-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-i', str(path)]
    if anchor_crop:
        # Retire le fond clair de la planche ; le décor vide évite de dédoubler Wendy.
        backdrop = root / 'public/assets/backdrops/blue-purple.webp'
        if not backdrop.is_file():
            raise FileNotFoundError(backdrop)
        args += ['-i', str(backdrop)]
        x0, y0, w, h = anchor_crop
        full = ('[0:v]format=rgba,scale=864:810[fg];'
                '[1:v]scale=1440:810:force_original_aspect_ratio=increase,crop=1440:810[bg];'
                '[bg][fg]overlay=(W-w)/2:0:format=auto,'
                f"zoompan=z='{z}':x='{x}':y='(ih-ih/zoom)/2':d={frames}:s=960x540:fps={FPS},"
                'eq=contrast=1.04:saturation=1.08:brightness=-0.015,' + vision +
                'drawbox=x=0:y=0:w=iw:h=28:color=black:t=fill,'
                'drawbox=x=0:y=512:w=iw:h=28:color=black:t=fill,format=yuv420p[v]')
        args += ['-filter_complex', full, '-map', '[v]']
    elif index == 9 and doc_path.is_file():
        args += ['-i', str(doc_path)]
        graph = (f'[0:v]{vf}[base];[1:v]format=rgba,scale=840:472[doc];'
                 '[base][doc]overlay=60:68:format=auto,format=yuv420p[v]')
        args += ['-filter_complex', graph, '-map', '[v]']
    else:
        args += ['-vf', vf]
    args += ['-frames:v', str(frames), '-an', '-c:v', 'libx264', '-preset', 'veryfast',
             '-crf', '19', '-pix_fmt', 'yuv420p', str(output)]
    try:
        run(args)
    finally:
        if mask_temp:
            mask_temp.cleanup()
    return output


def render(project, root, output, ffmpeg='ffmpeg', audio_source=None):
    """Monte les plans successifs et reprend éventuellement audio et sous-titres synchronisés."""
    output = Path(output)
    if output.exists():
        raise FileExistsError(output)
    if not project.get('shots'):
        raise ValueError('Aucun plan')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        temp = Path(temp)
        parts = []
        elapsed = 0.0
        previous_frame = 0
        for i, shot in enumerate(project['shots']):
            elapsed += float(shot['duration'])
            boundary = round(elapsed * FPS)
            count = boundary - previous_frame
            if count < 1:
                raise ValueError('Plan trop court pour la cadence')
            part = temp / f'{i:03}.mp4'
            render_shot({**shot, '_frames': count}, i, root, part, ffmpeg)
            previous_frame = boundary
            parts.append(part)
        playlist = temp / 'parts.txt'
        playlist.write_text(''.join(f"file '{p.as_posix()}'\n" for p in parts), encoding='utf-8')
        args = [str(ffmpeg), '-nostdin', '-hide_banner', '-loglevel', 'error', '-n',
                '-f', 'concat', '-safe', '0', '-i', str(playlist)]
        if audio_source:
            args += ['-i', str(audio_source), '-map', '0:v:0', '-map', '1:a?', '-map', '1:s?', '-c', 'copy']
        else:
            args += ['-map', '0:v:0', '-c', 'copy']
        args += ['-movflags', '+faststart', str(output)]
        run(args)
    return output


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('project')
    p.add_argument('output')
    p.add_argument('--ffmpeg', default='ffmpeg')
    p.add_argument('--root', default='.')
    p.add_argument('--audio-source', help='MP4 existant contenant le mix et les sous-titres')
    p.add_argument('--shot', type=int, help='Ne rendre que ce plan (1-indexé, sans audio)')
    args = p.parse_args()
    project = json.loads(Path(args.project).read_text(encoding='utf-8'))
    if args.shot is not None:
        if not 1 <= args.shot <= len(project['shots']):
            p.error('Numéro de plan hors limites')
        render_shot(project['shots'][args.shot - 1], args.shot - 1, args.root, args.output, args.ffmpeg)
    else:
        render(project, args.root, args.output, args.ffmpeg, args.audio_source)

if __name__ == '__main__':
    main()
