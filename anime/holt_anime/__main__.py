"""Démonstration locale : le document montré par Wendy au Blue Purple."""
import argparse
import json
import subprocess
from pathlib import Path
from .media import compose_placeholder, export_sequence, replace_shot
from .registry import Registry


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', help='Nouveau répertoire de production')
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args()
    root = Path(args.directory)
    root.mkdir(parents=True, exist_ok=False)
    r = Registry(root / 'project.sqlite')
    r.budget(0, 'EUR')
    r.put('project', 'scenario-2', {'source': 'docs/chapters/ch3/SCENARIO.md', 'scene': ['blue-purple', 1]})
    r.put('scene', 'blue-purple', {'project': ['scenario-2', 1], 'source': 'Les chiffres et la vision'})
    r.put('character', 'wendy', {'source': 'docs/chapters/ch3/SCENARIO.md', 'status': 'reference'})
    r.put('asset', 'document', {'type': 'géométrie provisoire', 'provenance': 'création locale FFmpeg', 'rights': 'provisoire local'})
    r.put('shot', 'vision', {'scene': ['blue-purple', 1], 'assets': [['document', 1]], 'duration_seconds': 1, 'selected_render': None})
    r.put('task', 'render-vision', {'shot': ['vision', 1], 'parameters': {'duration': 1}})
    attempt = r.start('render-vision', 1, 'local-ffmpeg', {'color': '0x202030'}, 0, 'EUR')
    r.transition(attempt, 'running')
    try:
        first = compose_placeholder(root / 'vision-v1.mp4', 1, ffmpeg=args.ffmpeg)
        context = compose_placeholder(root / 'bar-v1.mp4', 0.5, '0x301020', ffmpeg=args.ffmpeg)
        r.transition(attempt, 'review', {'actual': 0, 'render': first.name})
        retry = r.start('render-vision', 1, 'local-ffmpeg', {'color': '0x304060'}, 0, 'EUR', retry_of=attempt)
        r.transition(retry, 'running')
        second = compose_placeholder(root / 'vision-v2.mp4', 1, '0x304060', ffmpeg=args.ffmpeg)
        original = export_sequence([context, first], root / 'montage-v1.mp4', ffmpeg=args.ffmpeg)
        revised = export_sequence(replace_shot([context, first], 1, second), root / 'montage-v2.mp4', ffmpeg=args.ffmpeg)
        inspection = subprocess.run([args.ffmpeg, '-hide_banner', '-i', str(revised)], capture_output=True, text=True)
        (root / 'metadata.txt').write_text(inspection.stderr, encoding='utf-8')
        r.transition(retry, 'review', {'actual': 0, 'render': second.name})
        r.put('shot', 'vision', {'scene': ['blue-purple', 1], 'assets': [['document', 1]], 'duration_seconds': 1, 'selected_render': None, 'candidates': [first.name, second.name], 'review': 'à examiner'})
        print(json.dumps({'project': str(root), 'attempt': attempt, 'original': str(original), 'replacement': str(revised), 'inspection': str(root / 'metadata.txt')}, ensure_ascii=False, indent=2))
    except Exception as exc:
        active = locals().get('retry', attempt)
        if r.history(active)[-1]['state'] == 'running':
            r.transition(active, 'failed', {'error': str(exc)})
        raise
    finally:
        r.close()

if __name__ == '__main__': main()
