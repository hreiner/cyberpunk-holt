import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from holt_anime.animatic import render

class AnimaticTest(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('HOLT_FFMPEG') or shutil.which('ffmpeg'), 'FFmpeg requis')
    def test_compose_image_audio_sous_titre_sans_ecraser(self):
        ffmpeg = os.environ.get('HOLT_FFMPEG', 'ffmpeg')
        root = Path.cwd()
        project = {'shots': [{'duration': 1, 'background': 'public/assets/backdrops/blue-purple.webp', 'portrait': 'public/assets/portraits/franklyn.webp'}],
                   'audio': [{'path': 'public/assets/audio/background/music-neon.mp3', 'volume': .1}],
                   'subtitles': [{'start': .1, 'end': .9, 'text': 'Ça va ?'}]}
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'film.mp4'
            render(project, root, target, ffmpeg)
            before = target.read_bytes()
            metadata = subprocess.run([ffmpeg, '-i', str(target)], capture_output=True, text=True).stderr
            self.assertIn('h264', metadata)
            self.assertIn('Audio: aac', metadata)
            self.assertIn('Subtitle: mov_text', metadata)
            with self.assertRaises(FileExistsError): render(project, root, target, ffmpeg)
            self.assertEqual(before, target.read_bytes())

if __name__ == '__main__': unittest.main()
