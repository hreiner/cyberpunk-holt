"""Check the frozen exact-file inventory, then use the existing CRC/SHA backup tool."""
from __future__ import annotations
import hashlib
import json
import runpy
import sys
from pathlib import Path

ROOT = next(parent for parent in Path(__file__).resolve().parents if (parent / "AGENTS.md").exists())
plan_file = Path(sys.argv[1]).resolve()
if not plan_file.is_relative_to(ROOT):
    raise ValueError("Plan hors dépôt.")
plan = json.loads(plan_file.read_text(encoding="utf-8-sig"))
for entry in plan["frozenFiles"]:
    file = (ROOT / entry["file"]).resolve()
    if not file.is_relative_to(ROOT):
        raise ValueError("Source hors dépôt.")
    with file.open("rb") as source:
        actual = hashlib.file_digest(source, "sha256").hexdigest()
    if actual != entry["sha256"]:
        raise ValueError(f"Source gelée modifiée : {file}")
for entry in plan["include"]:
    file = (plan_file.parent / entry).resolve()
    if not file.is_relative_to(ROOT) or not file.is_file():
        raise ValueError(f"Inclusion autre qu'un fichier explicite : {file}")
    if file.suffix.lower() == ".zip" or any(part in ("frames", "node_modules", "__pycache__") for part in file.parts):
        raise ValueError(f"Inclusion interdite : {file}")
runpy.run_path(str(ROOT / "anime/motion-comics/production/pages-05-08/backup.py"), run_name="__main__")
