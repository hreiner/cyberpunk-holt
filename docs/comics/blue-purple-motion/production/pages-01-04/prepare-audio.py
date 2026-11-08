"""Préparer la conduite complète sans accès fournisseur ni dépense."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[5]
HERE = Path(__file__).resolve().parent
TAGGED = {
    5: "[inhales] [firm, controlled urgency] Going back NOW would lead them straight to her. [short pause] [low, grave] And to all of you.",
    6: "[exhales shakily] [tense, insistent] He wants two thousand by tomorrow night. [swallows] [angry, pleading] We can't LEAVE her with him.",
    7: "[sighs] [hesitant, gentle] She'd tell us to get clear first. [short pause] [soft but firm] We won't help her if we're caught.",
    8: "[inhales] [whispers, resolute] We're not forgetting her.",
    9: "[low, warm, serious] No. [short pause] We aren't.",
    10: "[exhales] [uncertain, quietly] This is all I have. [short pause] [cautiously hopeful] I think it's where we start.",
    11: "[softly, hesitant] Franklyn? [short pause] [worried] What's wrong?",
    12: "[inhales sharply] [hesitant, low] I know these. [short pause] [recognizing, intent] Latitude and longitude. [swallows] [quiet, certain] I saw them in the simulation.",
    13: "[focused, urgent] They're old coordinates. [inhales] [clear, determined] We need a terminal to convert them.",
    14: "[exhales] [firm, urgent] Then let's move.",
    15: "[low, puzzled] Where did everybody go? [exhales softly]",
}

page1 = json.loads((ROOT / 'anime/motion-comics/projects/blue-purple-page01-v4-v1.json').read_text(encoding='utf-8'))
lines = []
for index, panel in enumerate(page1['panels'], start=1):
    cue = panel['cues'][0]
    lines.append({'id': f'bp-l{index:03}', 'globalLine': index, 'panel_id': panel['id'],
                  'speaker': cue['speaker'], 'plain_en': cue['textEn'], 'en': cue['ttsText'],
                  'fr': cue['textFr'], 'performance': cue['performance'],
                  'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8},
                  'production': 'reuse', 'reuseManifest': 'anime/motion-comics/projects/blue-purple-page01-v4-v1.json'})
for page in (2, 3, 4):
    contract = json.loads((HERE / f'contracts/page-{page:02}.json').read_text(encoding='utf-8'))
    for panel in contract['panels']:
        for cue in panel['cues']:
            index = cue['globalLine']
            lines.append({'id': cue['id'], 'globalLine': index, 'panel_id': panel['id'],
                          'speaker': cue['speaker'], 'plain_en': cue['textEn'], 'en': TAGGED[index],
                          'fr': cue['textFr'], 'performance': cue['intention'],
                          'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8},
                          'production': 'new'})
assert [line['globalLine'] for line in lines] == list(range(1, 16))
target = HERE / 'AUDIO-DIRECTION.json'
if target.exists():
    raise FileExistsError('Conduite existante : examiner la version avant toute révision explicite.')
target.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'lines': len(lines), 'newLines': sum(line['production'] == 'new' for line in lines),
                  'newCharactersWithTags': sum(len(line['en']) for line in lines if line['production'] == 'new')}, ensure_ascii=False))
