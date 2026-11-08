"""Conduite révision 3 : émotions dirigées, aucune respiration imposée."""
import json
import re
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
TAGGED = {
    1: "[calm, reassuring] I'm Wendy. I was sent in case something went wrong. [curious, gently] Tell me what happened after HOLT?",
    2: "[shaken, exhausted] We ran. [bitter, barely contained] They kept coming.",
    3: "[serious, controlled urgency] The Academy sent me as a last resort. [low, firm] You're being HUNTED. [urgent, quietly] If they followed you here, we don't have much time.",
    4: "[sad, voice trembling] Letitia's at a ripperdoc. [angry, restrained] He's keeping her there.",
    5: "[firm, controlled urgency] Going back now would lead them straight to her. [grave] And to ALL of you.",
    6: "[furious, hurt] He wants two thousand credits by tomorrow night! [voice breaking, angry] Are we just leaving her to DIE in there?",
    7: "[gentle, sorrowful] She'd tell us to get clear first. [soft but firm] We won't help her if we're caught.",
    8: "[shaken, defeated] All right… [voice trembling, painful] I’ll help you. [quiet, determined] But we’re coming BACK for her.",
    9: "[grave, sincere] We will.",
    10: "[uncertain, quietly] This is all I have. [cautiously hopeful] I think it's where we start.",
    11: "[softly, hesitant] Franklyn? [worried] What's wrong?",
    12: "[shaken, hesitant] I know these. [recognizing, low] Latitude and longitude. [struggling, quiet] I saw them in the simulation.",
    13: "[tense, focused] They're old coordinates. [trying to be steady] We need a terminal to convert them.",
    14: "[firm, urgent] Then let's move.",
    15: "[low, puzzled] Where did everybody go?",
}


def words(text):
    return re.findall(r"[a-z0-9]+", re.sub(r'\[[^\]]*\]', '', unicodedata.normalize('NFKC', text)).lower())


page1 = json.loads((ROOT / 'anime/motion-comics/projects/blue-purple-page01-v4-v1.json').read_text(encoding='utf-8'))
lines = []
for index, panel in enumerate(page1['panels'], 1):
    cue = panel['cues'][0]
    lines.append({'id': f'bp-l{index:03}', 'globalLine': index, 'panel_id': panel['id'],
                  'speaker': cue['speaker'], 'plain_en': cue['textEn'], 'fr': cue['textFr'],
                  'performance': [
                      'Calme adressé puis question vigilante ; aucune expiration ou soupir imposé.',
                      'Épuisement et souvenir de fuite, rudesse amère ; aucune expiration imposée.',
                      'Urgence contrôlée et menace concrète ; aucune inspiration ajoutée entre les phrases.',
                      'Chagrin contenu devenu colère envers le charcudoc, sans déglutition ni inspiration imposées.',
                  ][index - 1]})
for page in (2, 3, 4):
    contract = json.loads((HERE / f'contracts/page-{page:02}.json').read_text(encoding='utf-8'))
    for panel in contract['panels']:
        for cue in panel['cues']:
            lines.append({'id': cue['id'], 'globalLine': cue['globalLine'], 'panel_id': panel['id'],
                          'speaker': cue['speaker'], 'plain_en': cue['textEn'], 'fr': cue['textFr'],
                          'performance': cue['intention']})
assert [line['globalLine'] for line in lines] == list(range(1, 16))
for line in lines:
    line.update({'en': TAGGED[line['globalLine']], 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8},
                 'production': 'new', 'revision': 3, 'explicitBreathingTags': 0})
    assert words(line['en']) == words(line['plain_en']), line['id']
    assert not re.search(r'\[[^\]]*(?:inhale|exhale|breath|swallow|sigh|gasp)[^\]]*\]', line['en'], re.I)
target = HERE / 'AUDIO-DIRECTION.json'
if target.exists():
    raise FileExistsError('Conserver la conduite existante ; révision explicite requise.')
target.write_text(json.dumps(lines, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'lines': len(lines), 'newCharactersWithTags': sum(len(line['en']) for line in lines),
                  'historicalCharacters': 1044, 'cumulativeAfterOnePass': 1044 + sum(len(line['en']) for line in lines)}, ensure_ascii=False))
