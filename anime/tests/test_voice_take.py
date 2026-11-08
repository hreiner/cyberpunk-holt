import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from holt_anime import voice_take


class VoiceTakeTests(unittest.TestCase):
    def test_selected_model_reaches_provider_and_journal_with_same_performance(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'takes'
            args = ['voice_take', '--line', '1', '--lines', 'anime/motion-comics/projects/blue-purple-page01-performance-v1.json',
                    '--output', str(target), '--max-characters', '1000', '--model', 'eleven_v4', '--approved']
            captured = []
            def fake_provider(command, **_kwargs):
                captured.append(command)
                Path(command[command.index('--output') + 1]).write_bytes(b'simulated audio')
                return SimpleNamespace(returncode=0, stderr='')
            with patch('sys.argv', args), patch.object(voice_take.subprocess, 'run', side_effect=fake_provider), contextlib.redirect_stdout(io.StringIO()):
                voice_take.main()
            command = captured[0]
            self.assertEqual(command[command.index('--model-id') + 1], 'eleven_v4')
            record = json.loads(next(target.glob('*.json')).read_text(encoding='utf-8'))
            self.assertEqual(record['model'], 'eleven_v4')
            self.assertEqual(record['text'], command[command.index('--text') + 1])
            self.assertEqual(record['voice_settings'], {'stability': 0.5, 'similarity_boost': 0.8})
            self.assertEqual(record['state'], 'review')

    def test_preview_does_not_write_or_call_provider(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'takes'
            args = ['voice_take', '--line', '1', '--lines', 'anime/motion-comics/projects/blue-purple-page01-performance-v1.json',
                    '--output', str(target), '--max-characters', '1000', '--dry-run']
            stream = io.StringIO()
            with patch('sys.argv', args), patch.object(voice_take.subprocess, 'run') as provider, contextlib.redirect_stdout(stream):
                voice_take.main()
            provider.assert_not_called()
            self.assertFalse(target.exists())
            result = json.loads(stream.getvalue())
            self.assertEqual(result['state'], 'preview')
            self.assertEqual(result['model'], 'eleven_v4')
            self.assertIn('[sighs]', result['text'])
            self.assertEqual(result['voice_settings']['stability'], 0.5)
            self.assertEqual(result['voice_id'], 'W3C2vBPukr5b5jvoXhPK')

    def test_v4_defaults_do_not_reuse_v3_only_cast_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            args = ['voice_take', '--line', '2', '--output', str(Path(directory) / 'takes'),
                    '--max-characters', '1000', '--dry-run']
            for option, expected_model in [([], 'eleven_v4'), (['--model', 'eleven_v3'], 'eleven_v3')]:
                with self.subTest(model=expected_model):
                    stream = io.StringIO()
                    with patch('sys.argv', args + option), patch.object(voice_take.subprocess, 'run') as provider, contextlib.redirect_stdout(stream):
                        voice_take.main()
                    provider.assert_not_called()
                    result = json.loads(stream.getvalue())
                    self.assertEqual(result['model'], expected_model)
                    if expected_model == 'eleven_v4':
                        self.assertEqual(result['voice_settings'], {'stability': 0.5, 'similarity_boost': 0.8})
                    else:
                        self.assertEqual(result['voice_settings']['style'], 0.1)
                        self.assertTrue(result['voice_settings']['use_speaker_boost'])

    def test_budget_counts_tags_and_previous_failed_attempts(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / 'failed.json').write_text(json.dumps({'line': 2, 'characters': 950, 'state': 'failed'}), encoding='utf-8')
            args = ['voice_take', '--line', '1', '--lines', 'anime/motion-comics/projects/blue-purple-page01-performance-v1.json',
                    '--output', str(target), '--max-characters', '1000', '--approved']
            with patch('sys.argv', args), patch.object(voice_take.subprocess, 'run') as provider:
                with self.assertRaisesRegex(ValueError, 'Plafond'):
                    voice_take.main()
            provider.assert_not_called()
            self.assertEqual(len(list(target.iterdir())), 1)

    def test_retry_and_authorization_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            (target / 'previous.json').write_text(json.dumps({'line': 1, 'characters': 80, 'state': 'review'}), encoding='utf-8')
            args = ['voice_take', '--line', '1', '--output', str(target), '--max-characters', '1000']
            with patch('sys.argv', args), patch.object(voice_take.subprocess, 'run') as provider:
                with self.assertRaises(PermissionError):
                    voice_take.main()
            with patch('sys.argv', args + ['--approved']), patch.object(voice_take.subprocess, 'run') as provider:
                with self.assertRaisesRegex(ValueError, 'reprise explicite'):
                    voice_take.main()
            provider.assert_not_called()


if __name__ == '__main__':
    unittest.main()
