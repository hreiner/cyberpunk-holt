"""Freeze an explicit file inventory for the corrected reader, without film caches."""
from __future__ import annotations

import hashlib
import json
import os
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[5]
MASTER = ROOT / "art-masters/motion-comics/blue-purple/chapter-03-continuation"
selected: set[Path] = set()


def add(file: Path) -> None:
    file = file.resolve()
    if not file.is_relative_to(ROOT) or not file.is_file():
        raise ValueError(f"Fichier hors dépôt ou manquant : {file}")
    if file.suffix.lower() in (".zip", ".mp4") or any(
        part in ("frames", "node_modules", "__pycache__") for part in file.parts
    ):
        raise ValueError(f"Inclusion interdite : {file}")
    selected.add(file)


def tree(folder: Path) -> None:
    for file in folder.rglob("*"):
        if file.is_file():
            add(file)


def sha(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


current = json.loads((HERE / "SELECTION.json").read_text(encoding="utf-8-sig"))
old = json.loads((HERE.parent / "motion-01/SOURCE-LOCK-v2.json").read_text(encoding="utf-8-sig"))
for entry in current["files"] + old["files"] + old["engine"]:
    file = ROOT / entry["file"]
    if sha(file) != entry["sha256"]:
        raise ValueError(f"Source sélectionnée modifiée : {file}")
    add(file)

for name in ("blue-purple-pages01-21-v8.json", "blue-purple-pages01-21-v7.json", "blue-purple-pages09-21-motion04.json"):
    add(ROOT / "anime/motion-comics/projects" / name)
for file in (ROOT / "anime/motion-comics").iterdir():
    if file.is_file():
        add(file)
tree(ROOT / "anime/motion-comics/assets")
tree(MASTER / "format-01/selected")
tree(MASTER / "format-01/qa-independent")
tree(MASTER / "format-01/qa-motion-v1")
add(MASTER / "format-01/seek16-diagnostic.json")
tree(HERE)
tree(HERE.parent / "revision-05")
for file in (HERE.parent / "motion-01").glob("*.json"):
    add(file)
for file in (HERE.parent / "motion-01/export").glob("*.cjs"):
    add(file)
add(HERE.parent / "motion-01/export/backup.py")
add(HERE.parent / "motion-01/animation/check-integrated.cjs")
for file in (ROOT / "anime/motion-comics/production/pages-05-08/revision-03").glob("*.cjs"):
    add(file)
add(ROOT / "anime/motion-comics/production/pages-05-08/backup.py")


class Images(HTMLParser):
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "img":
            src = dict(attrs)["src"]
            if not src or ":" in src:
                raise ValueError("Source de dessin non locale.")
            add(html.parent / unquote(src))


html = MASTER / "comic-review-v5/index.html"
add(html)
Images().feed(html.read_text(encoding="utf-8-sig"))
for file in (
    "AGENTS.md", "package.json", "package-lock.json", "docs/INDEX.md",
    "docs/WORKFLOWS.md", "docs/design/MOTION-COMICS-READER.md",
    "docs/anime/motion-comics/ART.md", "docs/anime/motion-comics/DELIVERY.md",
    "docs/anime/motion-comics/LESSONS.md", "docs/anime/motion-comics/PROGRESS.md",
    "docs/comics/blue-purple-motion/production/chapter-03-continuation/PROGRESS.md",
):
    add(ROOT / file)

frozen = [{"file": file.relative_to(ROOT).as_posix(), "bytes": file.stat().st_size,
           "sha256": sha(file)} for file in sorted(selected)]
plan = {
    "output": os.path.relpath(MASTER / "format-01/reader-format-v8.zip", HERE).replace("\\", "/"),
    "purpose": "Lecteur v8 autonome, sources de recomposition et preuves ; films historiques conservés séparément.",
    "include": [os.path.relpath(file, HERE).replace("\\", "/") for file in sorted(selected)],
    "frozenFiles": frozen,
}
with (HERE / "BACKUP-PLAN.json").open("x", encoding="utf-8") as output:
    json.dump(plan, output, ensure_ascii=False, indent=2)
print(json.dumps({"files": len(frozen), "bytes": sum(e["bytes"] for e in frozen),
                  "forbiddenFiles": 0, "output": plan["output"]}, ensure_ascii=False))
