"""Télécharge les préécoutes officielles CC0 du manifeste, sans remplacer un master."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen


root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--asset")
opts = parser.parse_args()
sources = json.loads((root / "docs/art/audio-generation/ambience-sources.json").read_text(encoding="utf-8"))
if opts.asset and opts.asset not in {source["id"] for source in sources}:
    raise RuntimeError(f"Son inconnu : {opts.asset}")
destination = root / "art-masters/audio/background"
destination.mkdir(parents=True, exist_ok=True)
for source in sources:
    if opts.asset and source["id"] != opts.asset:
        continue
    output = destination / source["file"]
    if output.exists():
        continue
    request = Request(source["downloadUrl"], headers={"User-Agent": "HOLT-audio-production/1.0"})
    with urlopen(request, timeout=60) as response:
        data = response.read()
    digest = hashlib.sha256(data).hexdigest()
    expected = source.get("sha256")
    if expected and digest.lower() != expected.lower():
        raise RuntimeError(f"La source a changé : {source['id']} ({digest}). Revoir le manifeste.")
    output.write_bytes(data)
    print(f"Téléchargé : {source['id']} ({len(data)} octets)", flush=True)
