import os
import shutil
import tempfile
import unittest
from pathlib import Path
from holt_anime.animated import render_shot

class AnimationTest(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('HOLT_FFMPEG') or shutil.which('ffmpeg'), 'FFmpeg requis')
    def test_plan_anime_et_fichier_immuable(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'shot.mp4'
            shot = {'duration': .5, 'background': 'public/assets/backdrops/blue-purple.webp', 'portrait': 'public/assets/portraits/franklyn.webp'}
            render_shot(shot, 1, Path.cwd(), target, os.environ.get('HOLT_FFMPEG', 'ffmpeg'))
            data = target.read_bytes()
            self.assertGreater(len(data), 1000)
            with self.assertRaises(FileExistsError):
                render_shot(shot, 1, Path.cwd(), target, os.environ.get('HOLT_FFMPEG', 'ffmpeg'))
            self.assertEqual(data, target.read_bytes())

if __name__ == '__main__': unittest.main()
