"""Conduite révision01 : 23 lignes conservées, 14 nouvelles, historique non réinitialisé."""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
PREVIOUS = HERE.parents[1] / 'audio'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rel(path):
    return path.relative_to(ROOT).as_posix()


def main():
    contract_path = HERE.parent / 'CONTRACTS.json'
    contract = json.loads(contract_path.read_text(encoding='utf-8'))
    original_inventory = PREVIOUS / 'REUSE-INVENTORY.json'
    old = json.loads(original_inventory.read_text(encoding='utf-8'))
    previous_counter = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/global-budget.json'
    counter = json.loads(previous_counter.read_text(encoding='utf-8'))
    assert counter['historicalCharacters'] == 2416 and counter['newCharacters'] == 440
    assert counter['submittedCharacters'] == 2856
    attempts = old['attempts'] + counter['newAttempts']
    assert sum(row['characters'] for row in attempts) == 2856
    for row in attempts:
        assert row['state'] != 'running'
        assert sha(ROOT / row['journal']) == row['sha256']
    lines = json.loads((PREVIOUS / 'DIRECTION.json').read_text(encoding='utf-8'))
    for row in lines:
        row['production'] = 'reuse'
    measured = ROOT / 'art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/prepared-measurements.json'
    for cue in json.loads(measured.read_text(encoding='utf-8'))['cues']:
        row = lines[cue['globalLine'] - 1]
        row.update({key: cue[key] for key in ('audio', 'duration', 'sha256', 'takeJournal')})
        assert sha(ROOT / row['audio']) == row['sha256']
    additions = []
    for page in contract['pages']:
        for panel in page['panels']:
            for cue in panel.get('cues', []):
                assert cue['model'] == 'eleven_v4'
                assert cue['voiceSettings'] == {'stability': .5, 'similarity_boost': .8}
                if cue['production'] == 'reuse':
                    row = lines[cue['globalLine'] - 1]
                    assert (row['en'], row['plain_en'], row['fr'], row['speaker']) == (
                        cue['annotatedEn'], cue['textEn'], cue['textFr'], cue['speaker'])
                    continue
                assert not re.search(r'\[[^\]]*(?:inhale|exhale|breath|swallow|sigh|gasp)[^\]]*\]', cue['annotatedEn'], re.I)
                additions.append({'id': cue['id'], 'globalLine': cue['globalLine'],
                                  'panel_id': panel['id'], 'pageId': f"page-{page['page']:02}",
                                  'speaker': cue['speaker'], 'plain_en': cue['textEn'],
                                  'fr': cue['textFr'], 'en': cue['annotatedEn'],
                                  'performance': cue['intention'], 'voice_settings': cue['voiceSettings'],
                                  'production': 'new', 'explicitBreathingTags': 0})
    lines += sorted(additions, key=lambda row: row['globalLine'])
    assert [row['globalLine'] for row in lines] == list(range(1, 38))
    assert len(additions) == 14
    characters = sum(len(row['en']) for row in additions)
    assert characters == contract['audio']['newAnnotatedCharacters'] == 538
    direction, budget, inventory = [HERE / name for name in ('DIRECTION.json', 'BUDGET.json', 'INVENTORY.json')]
    if any(path.exists() for path in (direction, budget, inventory)):
        raise FileExistsError('Préparation existante : nouvelle version explicite requise.')
    inventory.write_text(json.dumps({'schemaVersion': 1, 'historicalCharacters': 2856,
                         'attempts': attempts, 'previousCounter': rel(previous_counter),
                         'previousCounterSha256': sha(previous_counter),
                         'previousSelection': rel(measured), 'previousSelectionSha256': sha(measured),
                         'originalInventory': rel(original_inventory), 'originalInventorySha256': sha(original_inventory),
                         'reusedLines': lines[:23]}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    direction.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    policy = {'schemaVersion': 1, 'date': '2026-11-05', 'status': 'awaiting-integrator-approval',
              'globalCharacterCap': 4800, 'historicalCharacters': 2856,
              'proposedNewCharacters': characters, 'plannedCumulativeCharacters': 2856 + characters,
              'correctionReserveCharacters': 444, 'submissionCharacterLimit': 2856 + characters + 444,
              'unallocatedCharacters': 4800 - 2856 - characters - 444,
              'reservePolicy': 'Réserve444 maximum, corrections ciblées sur diagnostic seulement ; marge non allouée ne peut pas être dépensée automatiquement.',
              'directionSha256': sha(direction), 'inventorySha256': sha(inventory),
              'contractSha256': sha(contract_path), 'actualCost': None, 'providerRequestIds': None,
              'budgetApproval': None, 'narrativeReview': None}
    budget.write_text(json.dumps(policy, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(policy, ensure_ascii=False))


if __name__ == '__main__':
    main()
