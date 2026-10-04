"""Keep the adaptation texts and shot descriptions aligned with reviewed panels."""

import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
storyboard = HERE / "storyboard.json"
data = json.loads(storyboard.read_text(encoding="utf-8"))
for page in data["pages"]:
    for panel in page["panels"]:
        for text in panel.get("texts", []):
            if panel["id"] == "P05-C02" and text["text"] == "Pas aujourd'hui.":
                text["text"] = "Appuie-toi sur nous."
            if panel["id"] == "P09-C02" and text["kind"] == "narration":
                text["text"] = "Franklyn tua Murano pour prendre le camion. Ses mains tremblaient."
        if panel["id"] == "P01-C02":
            panel["texts"][0]["box"] = [0.05, 0.04, 0.9, 0.18]
        edits = {
            "P01-C03": {0: {"tail": [0.11, 0.36]}, 1: {"tail": [0.65, 0.42]}},
            "P02-C01": {0: {"box": [0.56, 0.035, 0.4, 0.15], "tail": [0.3, 0.43]}},
            "P03-C01": {0: {"box": [0.55, 0.78, 0.41, 0.2], "tail": [0.78, 0.48]}},
            "P03-C02": {0: {"tail": [0.32, 0.39]}, 1: {"tail": [0.76, 0.45]}},
            "P03-C03": {0: {"tail": [0.43, 0.41]}},
            "P04-C01": {0: {"box": [0.035, 0.02, 0.36, 0.085], "tail": [0.15, 0.24], "font_size": 64},
                          1: {"box": [0.56, 0.025, 0.4, 0.11], "text": "KRAAAM\nTAK TAK TAK", "font_size": 62}},
            "P05-C01": {0: {"box": [0.56, 0.025, 0.39, 0.145], "tail": [0.72, 0.38]}},
            "P05-C02": {0: {"text": "Appuie-toi sur nous.", "box": [0.04, 0.04, 0.44, 0.18], "tail": [0.30, 0.35]},
                          1: {"text": "J’essaie…", "box": [0.53, 0.04, 0.43, 0.18], "tail": [0.52, 0.40]}},
            "P05-C03": {0: {"tail": [0.5, 0.64]}},
            "P06-C01": {0: {"box": [0.59, 0.03, 0.37, 0.17], "tail": [0.78, 0.45]}},
            "P06-C02": {0: {"box": [0.52, 0.03, 0.43, 0.18], "tail": [0.65, 0.4]}},
            "P07-C03": {0: {"text": "Abi. Reste là.\nFranklyn… ramène-les.", "box": [0.04, 0.04, 0.5, 0.14], "tail": [0.30, 0.60]}},
            "P08-C02": {0: {"box": [0.51, 0.03, 0.44, 0.15], "tail": [0.68, 0.40]}},
            "P10-C01": {0: {"tail": None}},
            "P10-C02": {0: {"box": [0.57, 0.02, 0.39, 0.15], "tail": [0.68, 0.53]}},
            "P11-C01": {0: {"box": [0.56, 0.035, 0.4, 0.15], "tail": [0.72, 0.31]}},
            "P11-C02": {0: {"box": [0.05, 0.035, 0.9, 0.16],
                          "text": "Deux mille crédits. Demain soir. Après, je me paie.", "tail": [0.67, 0.35]}},
            "P11-C03": {0: {"box": [0.05, 0.78, 0.44, 0.17], "tail": [0.2, 0.5]},
                          1: {"box": [0.54, 0.78, 0.43, 0.17], "tail": [0.73, 0.26]}},
        }
        if panel["id"] in ["P11-C02", "P07-C03"]:
            panel["texts"] = panel["texts"][:1]
        for index, values in edits.get(panel["id"], {}).items():
            panel["texts"][index].update(values)
storyboard.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
for filename in ["STORY.md", "PROMPTS.md"]:
    path = HERE / filename
    text = path.read_text(encoding="utf-8")
    text = text.replace("Pas aujourd'hui.", "Appuie-toi sur nous.")
    text = text.replace("Franklyn prit les clés. Il ne retrouva pas ses mains d'avant.",
                        "Franklyn tua Murano pour prendre le camion. Ses mains tremblaient.")
    if filename == "PROMPTS.md":
        for page in data["pages"]:
            for panel in page["panels"]:
                texts = " ; ".join(f"{item['kind']} « {item['text'].replace(chr(10), ' ')} »" for item in panel.get("texts", []))
                pattern = rf"(#### {panel['id']}\n.*?\*\*Focale :\*\* .*?\. \*\*Textes à poser ensuite :\*\* )[^\n]*"
                text = re.sub(pattern, lambda match: match.group(1) + texts + ".", text, flags=re.S)
    path.write_text(text, encoding="utf-8")
