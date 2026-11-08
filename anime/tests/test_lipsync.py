import math
import unittest
from anime.blender.lipsync import envelope

class EnvelopeTests(unittest.TestCase):
    def test_silence_ferme_et_son_ouvre(self):
        silent = [0.0] * 1000
        sound = [0.3 * math.sin(i * .2) for i in range(1000)]
        values = envelope(silent + sound + silent, sample_rate=1000, fps=10)
        self.assertEqual(values[0], 0)
        self.assertGreater(max(values[10:20]), .5)
        self.assertEqual(values[-1], 0)

if __name__ == '__main__': unittest.main()
