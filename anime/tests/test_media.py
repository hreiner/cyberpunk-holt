import shutil
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from holt_anime.media import compose_placeholder, export_sequence, probe, replace_shot


class MontageTest(unittest.TestCase):
    def test_remplacement_conserve_chronologie_initiale(self):
        original = ["a.mp4", "b.mp4"]
        self.assertEqual(replace_shot(original, 1, "c.mp4"), ["a.mp4", "c.mp4"])
        self.assertEqual(original, ["a.mp4", "b.mp4"])
        with self.assertRaises(IndexError):
            replace_shot(original, -1, "c.mp4")

    @unittest.skipUnless(os.environ.get("HOLT_FFMPEG") or shutil.which("ffmpeg"), "FFmpeg requis")
    def test_export_et_conservation_des_essais(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            ffmpeg = os.environ.get("HOLT_FFMPEG", "ffmpeg")
            a = compose_placeholder(root / "a.mp4", 0.5, ffmpeg=ffmpeg)
            b = compose_placeholder(root / "b.mp4", 0.5, "0xff0000", ffmpeg=ffmpeg)
            out = export_sequence([a, b], root / "montage.mp4", ffmpeg=ffmpeg)
            info = subprocess.run([ffmpeg, "-hide_banner", "-i", str(out)], capture_output=True, text=True).stderr
            self.assertIn("h264", info)
            self.assertIn("640x360", info)
            c = compose_placeholder(root / "c.mp4", 0.5, "0x00ff00", ffmpeg=ffmpeg)
            prior = out.read_bytes()
            original = [a, b]
            updated = replace_shot(original, 1, c)
            export_sequence(updated, root / "montage2.mp4", ffmpeg=ffmpeg)
            self.assertEqual(original, [a, b])
            self.assertEqual(a, updated[0])
            self.assertEqual(out.read_bytes(), prior)
            before = a.read_bytes()
            with self.assertRaises(Exception):
                compose_placeholder(a, 0.5, ffmpeg=ffmpeg)
            self.assertEqual(a.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
