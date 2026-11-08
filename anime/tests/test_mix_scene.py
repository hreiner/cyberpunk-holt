import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from holt_anime.mix_scene import mix_scene


class TestMixScene(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('HOLT_FFMPEG') or shutil.which('ffmpeg'), 'FFmpeg requis')
    def test_mix_fin_conservee_et_source_preservee(self):
        ffmpeg = os.environ.get('HOLT_FFMPEG', 'ffmpeg')
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            music = Path.cwd() / 'public/assets/audio/background/music-neon.mp3'
            voice = root / 'voice.wav'
            subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.2', '-y', str(voice)], check=True)
            scene = {'shots': [{'duration': 1.5}], 'audio': [{'path': str(music)}, {'path': str(music)}, {'path': str(voice), 'start': .1}]}
            output = root / 'mix.m4a'
            mix_scene(scene, root, output, ffmpeg)
            metadata = subprocess.run([ffmpeg, '-hide_banner', '-i', str(output)], capture_output=True, text=True).stderr
            match = re.search(r'Duration: 00:00:(\d+\.\d+)', metadata)
            self.assertIsNotNone(match)
            self.assertAlmostEqual(float(match.group(1)), 1.5, delta=.05)
            old = output.read_bytes()
            with self.assertRaises(FileExistsError):
                mix_scene(scene, root, output, ffmpeg)
            self.assertEqual(old, output.read_bytes())

if __name__ == '__main__': unittest.main()
