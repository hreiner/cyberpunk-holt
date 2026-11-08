"""Prépare les 62 répliques retenues, sans aucun appel au fournisseur."""
import hashlib
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(path for path in HERE.parents if (path / 'AGENTS.md').is_file())
SOURCE = HERE.parents[1] / 'revision-05/DIALOGUE-FR.json'

# L'ordre suit les cases effectivement composées, pas l'ordre d'insertion JSON.
# Texte anglais fidèle, tags de jeu sans souffle ajouté systématiquement.
TEXT = {
 '09-1': [
  ("I'll keep an eye on the street. Be quick.", "[watchful, low] I'll keep an eye on the street. [firm] Be quick.", "Grover surveille et donne l'impulsion sans abandonner l'enfant."),
  ("Everyone else stays in the car.", "[quiet, decisive] Everyone else stays in the car.", "Wendy fixe une règle de protection, sobre et précise.")],
 '09-2': [("There... a megabuilding.", "[hesitant, recognizing] There... a megabuilding.", "Franklyn reconnaît le résultat, encore secoué ; petite découverte, pas triomphe.")],
 '09-3': [("We've got a direction. That's enough to keep moving.", "[reassuring, determined] We've got a direction. [firm] That's enough to keep moving.", "Grover soutient le groupe puis relance l'action.")],
 '10-1': [("All of that is one building?", "[awed, uneasy] All of that is ONE building?", "L'enfant mesure l'échelle avec émerveillement inquiet.")],
 '10-2': [
  ("Look at those elevators. Fifty people in each car.", "[observant, serious] Look at those elevators. [low] Fifty people in each car.", "Wendy évalue un accès et son exposition."),
  ("And cameras at every door.", "[wary, quietly] And cameras at EVERY door.", "Grover remarque le danger concret des caméras.")],
 '10-3': [
  ("If they see us in there, they'll find us.", "[grave, controlled urgency] If they see us in there, they'll FIND us.", "Wendy conclut sans panique la menace de repérage."),
  ("Stay with me. We'll find another way in.", "[gentle, protective] Stay with me. [quiet, determined] We'll find another way in.", "Grover parle à l'enfant, rassure puis promet une solution réaliste.")],
 '11-1': [
  ("A service entrance. Fewer people.", "[alert, cautiously hopeful] A service entrance. Fewer people.", "Grover propose lui-même une piste."),
  ("Let's see what they want.", "[practical, guarded] Let's see what they want.", "Wendy décide d'approcher pour négocier.")],
 '11-2': [("Is that price for six people, or are you trying to rob us?", "[incredulous, dry] Is that price for six people, [sharper] or are you trying to ROB us?", "Wendy négocie avec mordant mais se contrôle.")],
 '11-3a': [("We can move them aside. We force our way in.", "[impatient, forceful] We can move them aside. [hard] We FORCE our way in.", "John propose la force, impulsif et frontal, sans joie de violence.")],
 '11-3b': [
  ("They outnumber us, John. We'd draw attention.", "[firm, restrained] They outnumber us, John. [warning, low] We'd draw attention.", "Abigail raisonne John, ferme sans le ridiculiser."),
  ("...All right. We'll find something else.", "[reluctant, subdued] ...All right. [gruff] We'll find something else.", "John ravale son impatience et cède réellement.")],
 '12-1': [
  ("What about a room? We could enter with the residents.", "[thoughtful, quietly] What about a room? [tentatively hopeful] We could enter with the residents.", "Grover apporte une solution de contournement."),
  ("A room... That could work.", "[considering] A room... [quiet, decisive] That could work.", "Wendy saisit l'idée et prend le relais.")],
 '12-2': [("I'll book a room through my implant. It'll be more discreet.", "[focused, low] I'll book a room through my implant. [reassuring] It'll be more discreet.", "Réservation en ligne par implant, aucune action physique inventée.")],
 '12-3': [
  ("Are we staying together?", "[small, worried] Are we staying together?", "L'enfant cherche une garantie personnelle."),
  ("Always. Stay close to me.", "[warm, certain] Always. [gentle, protective] Stay close to me.", "Grover s'adresse à l'enfant, engagement net, chaleur discrète.")],
 '13-1': [
  ("It changes as we go up.", "[uneasy, puzzled] It changes as we go up.", "Franklyn décrit une perception, pas une maîtrise soudaine."),
  ("Can you feel the direction?", "[attentive, gently questioning] Can you feel the direction?", "Wendy aide Franklyn à préciser ce qu'il ressent.")],
 '13-2': [("We try one floor at a time. Nobody goes alone.", "[steady, practical] We try one floor at a time. [firm, protective] Nobody goes alone.", "Grover organise le groupe et protège sa cohésion.")],
 '13-3': [
  ("There. The shop with the lights.", "[recognizing, urgent quietly] There. The shop with the lights.", "C'est Franklyn qui identifie la boutique."),
  ("Then maybe it's in there.", "[cautious, attentive] Then maybe it's in there.", "Abigail prend acte sans transformer l'intuition en certitude.")],
 '14-1': [("Braindances. We look. We don't touch anything.", "[wary, matter-of-fact] Braindances. [firm, low] We look. We don't touch anything.", "Wendy fixe une limite de prudence dans la boutique.")],
 '14-2': [
  ("That one's different from the others.", "[curious, focused] That one's different from the others.", "Abigail repère la singularité technique de la machine."),
  ("I think I can use it.", "[hesitant, drawn in] I think I can use it.", "Franklyn attiré par une connaissance latente, pas vantard.")],
 '14-3': [
  ("Can we take a look at that old machine?", "[polite, guarded] Can we take a look at that old machine?", "Wendy négocie avec le vendeur sans révéler leur but."),
  ("If you can get it started.", "[dry, skeptical] If you can get it started.", "Vendeur adulte blasé, permission conditionnelle sans menace.")],
 '15-1': [("The contact's loose. Franklyn, hold the panel.", "[focused, precise] The contact's loose. [directing, brisk] Franklyn, hold the panel.", "Abigail dirige la réparation, compétence concrète.")],
 '15-2': [
  ("Like this?", "[concentrating, questioning] Like this?", "Franklyn coopère avec Abigail, vérifie son appui."),
  ("Yes. I'm reconnecting the contact.", "[focused, reassuring] Yes. I'm reconnecting the contact.", "Abigail effectue le raccord technique.")],
 '15-3': [
  ("I'm closing the capsule. Let me try.", "[quiet, resolved] I'm closing the capsule. [determined] Let me try.", "Franklyn annonce sa propre fermeture puis l'essai."),
  ("I'm staying with you.", "[low, sincere] I'm staying with you.", "Grover assure à Franklyn sa présence, sans déplacer la garde de l'enfant.")],
 '16-1': [("I recognize this place...", "[shaken, recognizing] I recognize this place...", "Franklyn retrouve une connaissance ; trouble et reconnaissance.")],
 '16-2': [("It's coming back... I understand now.", "[strained, searching] It's coming back... [awed, low] I understand now.", "Déverrouillage intérieur progressif, pas simple lecture d'un écran.")],
 '16-3': [("I can access a map. I can see HOLT, our position, and other points. One of them is green.", "[astonished, low] I can access a map. [finding words] I can see HOLT, our position, and other points. [intent, quietly] One of them is GREEN.", "Franklyn raconte ensuite l'accès mental à la carte, en découvrant ses détails.")],
 '17-1': [("Wendy... at the far end.", "[tense, hushed] Wendy... at the far end.", "Abigail repère la menace et avertit discrètement." )],
 '17-2': [("Take cover!", "[urgent, commanding] Take COVER!", "Alerte franche de Wendy, brève et projetée.")],
 '17-3': [("This way! Stay together!", "[urgent, protective] This way! [calling firmly] Stay TOGETHER!", "Grover mène la fuite en gardant l'enfant près de lui.")],
 '18-1': [
  ("What are you doing?", "[startled, alarmed] What are you doing?", "Habitante surprise par l'intrusion, elle s'adresse aux arrivants."),
  ("Sorry... We don't have a choice.", "[strained, apologetic] Sorry... [low, hard] We don't have a choice.", "John agit sous pression ; excuse courte et décision regrettable.")],
 '18-2': [
  ("Will she wake up?", "[frightened, quietly] Will she wake up?", "L'enfant s'inquiète pour l'habitante inerte."),
  ("Yes. We had to disappear.", "[reassuring, strained] Yes. [defensive, low] We had to disappear.", "John rassure puis se justifie sans satisfaction."),
  ("Stay close to me.", "[gentle, hushed] Stay close to me.", "Grover protège l'enfant dans l'appartement, voix basse tendue.")],
 '18-3': [("They're passing... Wait a little longer.", "[whispering, tense] They're passing... [cautious] Wait a little longer.", "Abigail écoute la patrouille, pas de départ anticipé.")],
 '19-1': [
  ("The hallway's empty. For now.", "[hushed, watchful] The hallway's empty. [warning, low] For now.", "Grover regarde par l'entrebâillement depuis l'appartement."),
  ("We take the residents' elevator again.", "[low, decisive] We take the residents' elevator again.", "Wendy fixe le trajet après le passage de la patrouille.")],
 '19-2': [
  ("Have they lost our trail?", "[wary, quietly questioning] Have they lost our trail?", "John demande si la fuite a fonctionné, tension résiduelle."),
  ("For now. Let's not give them a second chance.", "[serious, low] For now. [firm, urgent quietly] Let's not give them a second chance.", "Wendy accepte un répit provisoire et relance.")],
 '19-3': [("The green point's that way.", "[quiet, certain] The green point's that way.", "Franklyn suit le point vert de sa perception interne.")],
 '20-1': [
  ("What's that smell?", "[uneasy, quietly] What's that smell?", "L'enfant remarque l'odeur sur le quai."),
  ("Stay close to me.", "[low, protective, tense] Stay close to me.", "Grover vigilant sur le quai ; tension plus dure que dans l'appartement.")],
 '20-2': [("Step back.", "[low, commanding] Step back.", "John demande aux autres de reculer avant de dégager le passage.")],
 '20-3': [
  ("We keep moving.", "[gruff, clipped] We keep moving.", "John après son geste brutal, phrase sèche sans triomphe."),
  ("Don't look. Come on.", "[hushed, protective] Don't look. [gentle, firm] Come on.", "Grover détourne l'enfant du geste et l'entraîne à l'écart.")],
 '21-1': [
  ("Did you hear that?", "[alert, low] Did you hear that?", "Abigail entend le mécanisme de la porte."),
  ("Wait. The door's opening.", "[cautious, controlled] Wait. [quietly] The door's opening.", "Wendy temporise pour laisser l'ouverture se faire.")],
 '21-2': [("It's empty... but we can take shelter here.", "[weary, assessing] It's empty... [cautiously relieved] but we can take shelter here.", "Grover constate une base vide, soulagement prudent sans glorification.")],
 '21-3': [
  ("We stop here. Just long enough to figure things out.", "[tired, decisive] We stop here. [low, measured] Just long enough to figure things out.", "Wendy offre une pause provisoire, pas une résolution finale."),
  ("I'll stay with him.", "[soft, steadfast] I'll stay with him.", "Grover confirme qu'il garde l'enfant, calme protecteur de fin de chapitre.")]
}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if any((HERE / name).exists() for name in ('DIRECTION.json', 'CAST.json', 'PLAN.json')):
        raise FileExistsError('Préparation existante conservée ; créer une révision explicite.')
    source = json.loads(SOURCE.read_text(encoding='utf-8-sig'))
    cast = json.loads((ROOT / 'anime/projects/blue-purple/cast.json').read_text(encoding='utf-8'))
    cast['vendeur'] = {'id': 'GLSWsaquVBsIPLPPRi2s', 'source': 'src/data/ch1HallVoices.ts instructor ; voix existante disponible, rôle secondaire adulte différent', 'settings': None}
    cast['habitante'] = {'id': 'EXAVITQu4vr4xnSDxMaL', 'source': 'CLI OAuth voices search --voice-type default --gender female, 2026-11-07 ; Sarah - Mature, Reassuring, Confident', 'settings': None}
    lines = []
    for key, adaptations in TEXT.items():
        assert len(source[key]) == len(adaptations), key
        for index, (fr, adaptation) in enumerate(zip(source[key], adaptations)):
            plain, annotated, intention = adaptation
            global_line = 38 + len(lines)
            lines.append({'id': f'bp-l{global_line:03}', 'globalLine': global_line,
                          'panel_id': key, 'dialogueIndex': index, 'pageId': f'page-{key[:2]}',
                          'speaker': fr['speaker'].lower(), 'fr': fr['text'].strip(),
                          'plain_en': plain, 'en': annotated, 'performance': intention,
                          'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8},
                          'production': 'new', 'model': 'eleven_v4', 'explicitBreathingTags': 0})
    assert len(lines) == 62
    assert sum(len(v) for v in source.values()) == len(lines)
    assert all(line['speaker'] in cast for line in lines)
    history_path = ROOT / 'art-masters/motion-comics/blue-purple/pages-05-08/revision-01/audio-v1/global-budget.json'
    history = json.loads(history_path.read_text(encoding='utf-8'))
    old_path = ROOT / 'docs/comics/blue-purple-motion/production/pages-05-08/revision-01/audio/DIRECTION.json'
    old_lines = json.loads(old_path.read_text(encoding='utf-8'))
    assert history['submittedCharacters'] == 3394
    matches = []
    for line in lines:
        for old in old_lines:
            if old['speaker'] == line['speaker'] and old['plain_en'] == line['plain_en']:
                matches.append({'line': line['globalLine'], 'previous': old['globalLine']})
    characters = sum(len(line['en']) for line in lines)
    plan = {'schemaVersion': 1, 'scope': 'blue-purple-pages09-21-motion01-voices',
            'status': 'awaiting-integrator-allocation',
            'staticSource': SOURCE.relative_to(ROOT).as_posix(), 'staticSourceSha256': sha(SOURCE),
            'historicalCharacters': 3394, 'historicalCounter': history_path.relative_to(ROOT).as_posix(),
            'historicalCounterSha256': sha(history_path), 'lines': len(lines),
            'newAnnotatedCharacters': characters, 'plannedCumulativeCharacters': 3394 + characters,
            'proposedReserveCharacters': (characters + 3) // 4,
            'model': 'eleven_v4', 'castCounts': dict(Counter(line['speaker'] for line in lines)),
            'exactPriorTextMatches': matches,
            'reuseDecision': 'Aucune prise antérieure ne porte les nouveaux textes. Les deux Stay close to me de Grover ont intentions distinctes appartement/quai ; deux prises ciblées prévues.',
            'oauthStatus': 'Windows Credential Manager actif vérifié hors sandbox, aucun jeton lu ni transféré.',
            'actualCost': None, 'providerRequestIds': None,
            'listening': 'Aucune écoute revendiquée à la préparation.'}
    for name, data in [('DIRECTION.json', lines), ('CAST.json', cast), ('PLAN.json', plan)]:
        (HERE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(plan, ensure_ascii=False))


if __name__ == '__main__':
    main()
