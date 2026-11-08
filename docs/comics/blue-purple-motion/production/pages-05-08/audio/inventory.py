"""Inventaire local sans réseau des quinze voix conservées et de leur historique."""
import hashlib
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return path.relative_to(ROOT).as_posix()


def inventory():
    sequence = ROOT / 'anime/motion-comics/projects/blue-purple-pages01-04-v4.json'
    document = json.loads(sequence.read_text(encoding='utf-8'))
    reused = []
    for page in document['pages']:
        manifest = (sequence.parent / page['manifest']).resolve()
        scene = json.loads(manifest.read_text(encoding='utf-8'))
        for panel in scene['panels']:
            for cue in panel.get('cues', []):
                audio = (manifest.parent / cue['audio']).resolve()
                journal = (manifest.parent / cue['takeJournal']).resolve()
                record = json.loads(journal.read_text(encoding='utf-8'))
                assert record['state'] == 'review'
                assert record['model'] == cue['ttsModel'] == 'eleven_v4'
                assert audio.is_file() and audio.stat().st_size > 0
                reused.append({**cue, 'pageId': page['id'], 'panel_id': panel['id'],
                               'production': 'reuse', 'en': cue['ttsText'],
                               'plain_en': cue['textEn'], 'fr': cue['textFr'],
                               'audio': relative(audio), 'takeJournal': relative(journal),
                               'audioSha256': sha(audio), 'journalSha256': sha(journal),
                               'pageManifest': relative(manifest), 'manifestSha256': sha(manifest)})
    assert [cue['globalLine'] for cue in reused] == list(range(1, 16))
    history = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/global-budget.json'
    accounting = json.loads(history.read_text(encoding='utf-8'))
    assert accounting['submittedCharacters'] == 2416
    for attempt in accounting['attempts']:
        path = ROOT / attempt['journal']
        assert sha(path) == attempt['sha256'], path
        assert attempt['state'] != 'running', path
    return {'schemaVersion': 1, 'date': '2026-11-05', 'historicalCharacters': 2416,
            'historicalBudget': relative(history), 'historicalBudgetSha256': sha(history),
            'sequence': relative(sequence), 'sequenceSha256': sha(sequence),
            'attempts': accounting['attempts'], 'reused': reused}


if __name__ == '__main__':
    target = HERE / 'REUSE-INVENTORY.json'
    if target.exists():
        raise FileExistsError('Inventaire existant conservé ; créer une révision explicite.')
    report = inventory()
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'reusedLines': len(report['reused']),
                      'historicalCharacters': report['historicalCharacters'],
                      'model': 'eleven_v4', 'report': relative(target)}))
