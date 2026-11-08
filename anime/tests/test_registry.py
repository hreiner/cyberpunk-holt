import tempfile
import unittest
from pathlib import Path
from holt_anime.registry import Registry
from holt_anime.providers import MockProvider

class RegistryTests(unittest.TestCase):
    def test_persistence_transitions_and_retries(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'project.sqlite'
            r = Registry(p)
            r.budget(100, 'EUR')
            r.put('project', 'episode', {'source': 'docs/chapters/ch3/SCENARIO.md'})
            r.put('asset', 'numbers', {'provenance': 'élément provisoire local', 'version': 1})
            r.put('task', 'render', {'shot': {'id': 'vision', 'version': 1}})
            a = r.start('render', 1, 'mock', {'seed': 1}, 60, 'EUR')
            r.transition(a, 'running')
            r.transition(a, 'interrupted')
            with self.assertRaises(ValueError): r.transition(a, 'running')
            r.close()
            r = Registry(p)
            self.assertEqual(r.get('asset', 'numbers')['data']['provenance'], 'élément provisoire local')
            with self.assertRaises(ValueError): r.start('render', 1, 'mock', {}, 41, 'EUR')
            b = r.start('render', 1, 'mock', {}, 40, 'EUR')
            r.transition(b, 'running')
            result = MockProvider().submit({})
            r.transition(b, 'review', {'actual': result['actual'], 'provider_id': result['provider_id']})
            r.transition(b, 'approved', {'render': 'shot-v2.mp4'})
            self.assertEqual([e['state'] for e in r.history(a)], ['queued', 'running', 'interrupted'])
            self.assertEqual(r.history(b)[-1]['state'], 'approved')
            with self.assertRaises(PermissionError): r.start('render', 1, 'other', {}, 0, 'EUR', external=True)
            r.close()

    def test_budget_and_versions(self):
        with tempfile.TemporaryDirectory() as d:
            r = Registry(Path(d) / 'a.sqlite')
            r.put('task', 't', {'v': 1})
            r.put('task', 't', {'v': 2})
            self.assertEqual(r.get('task', 't', 1)['data']['v'], 1)
            with self.assertRaises(ValueError): r.start('t', 1, 'mock', {}, 0, 'EUR')
            r.budget(10, 'EUR')
            a = r.start('t', 1, 'mock', {}, 10, 'EUR')
            r.transition(a, 'running')
            r.transition(a, 'failed', {'actual': 12})
            with self.assertRaises(ValueError): r.start('t', 2, 'mock', {}, 0, 'EUR')
            r.close()

if __name__ == '__main__': unittest.main()
