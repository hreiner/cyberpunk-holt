"""Conduite v1 depuis les contrats contre-revus, réemplois et nouveau plafond."""
import hashlib
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    contract_path = HERE.parent / 'CONTRACTS.json'
    contract = json.loads(contract_path.read_text(encoding='utf-8'))
    inventory_path = HERE / 'REUSE-INVENTORY.json'
    inventory = json.loads(inventory_path.read_text(encoding='utf-8'))
    lines = [{**cue, 'production': 'reuse'} for cue in inventory['reused']]
    for page in contract['pages']:
        for panel in page['panels']:
            for cue in panel['cues']:
                assert cue['model'] == 'eleven_v4'
                assert cue['voiceSettings'] == {'stability': .5, 'similarity_boost': .8}
                assert not re.search(r'\[[^\]]*(?:inhale|exhale|breath|swallow|sigh|gasp)[^\]]*\]', cue['annotatedEn'], re.I)
                lines.append({'id': cue['id'], 'globalLine': cue['globalLine'],
                              'panel_id': panel['id'], 'pageId': f"page-{page['page']:02}",
                              'speaker': cue['speaker'], 'plain_en': cue['textEn'],
                              'fr': cue['textFr'], 'en': cue['annotatedEn'],
                              'performance': cue['intention'], 'voice_settings': cue['voiceSettings'],
                              'production': 'new', 'explicitBreathingTags': 0})
    assert [line['globalLine'] for line in lines] == list(range(1, 24))
    characters = sum(len(line['en']) for line in lines if line['production'] == 'new')
    assert characters == contract['audio']['newAnnotatedCharacters'] == 440
    direction = HERE / 'DIRECTION.json'
    budget = HERE / 'BUDGET.json'
    if direction.exists() or budget.exists():
        raise FileExistsError('Conduite/plafond existants conservés ; révision explicite requise.')
    direction.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    policy = {'schemaVersion': 1, 'status': 'awaiting-integrator-approval',
              'date': '2026-11-05', 'globalCharacterCap': 3200,
              'historicalCharacters': 2416, 'proposedNewCharacters': characters,
              'plannedCumulativeCharacters': 2416 + characters,
              'correctionReserveCharacters': 3200 - 2416 - characters,
              'reservePolicy': 'Corrections ciblées après diagnostic seulement ; aucune nouvelle passe automatique.',
              'directionSha256': sha(direction), 'inventorySha256': sha(inventory_path),
              'contractSha256': sha(contract_path),
              'actualCost': None, 'providerRequestIds': None,
              'budgetApproval': None, 'narrativeReview': None}
    budget.write_text(json.dumps(policy, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(policy, ensure_ascii=False))


if __name__ == '__main__':
    main()
