"""After final freeze only: create an explicit v10 backup plan, never the archive.

Run from the repository root:
  python docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/prepare-backup.py
Inspect BACKUP-PLAN.json, then run the existing motion-01/export/backup.py on it.
The latter rechecks frozen hashes and verifies every archived member by CRC and SHA.
No generation, rendering, rewriting of sources, or recursive legacy-media collection.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / "AGENTS.md").is_file())
MASTER = ROOT / "art-masters/motion-comics/blue-purple/chapter-03-continuation"
MEDIA = MASTER / "motion-03"
DESTINATION = MEDIA / "reader-motion-v10.zip"
EXCLUDED_PARTS = {"frames", "clip-frames", "node_modules", "dependencies", "__pycache__"}
FORBIDDEN_MEDIA_NAMES = {"water-and-door-unbounded-apad-failed.m4a"}
DIAGNOSTIC_MEDIA_NAMES = {"sdf-mask-review.png", "sdf-mask-detail.png"}
RUNTIME = (
    "reader.html", "reader.css", "reader.js", "core.js", "effects.js", "layers.js",
    "sequence.js", "assets/holt-display.woff2", "assets/holt-text.woff2",
    "render.cjs", "project.cjs", "sequence.cjs", "audio.cjs", "package.json",
)


def inside(file: Path) -> Path:
    file = file.resolve()
    if not file.is_relative_to(ROOT):
        raise ValueError(f"Chemin hors dépôt : {file}")
    return file


def digest(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def document(file: Path) -> dict:
    return json.loads(file.read_text(encoding="utf-8-sig"))


def main() -> None:
    plan_file = HERE / "BACKUP-PLAN.json"
    if plan_file.exists() or DESTINATION.exists() or DESTINATION.with_suffix(".json").exists():
        raise FileExistsError("Plan ou sauvegarde v10 existant : choisir une nouvelle version.")
    selected: dict[Path, set[str]] = {}
    omitted: list[dict] = []
    required_dependencies: set[Path] = set()
    failed_runs: set[Path] = set()
    for report in MEDIA.rglob("report.json"):
        if any(part.startswith(("qa", "proof")) for part in report.parts):
            info = document(report)
            if info.get("status") == "failed":
                failed_runs.add(report.parent.resolve())

    def forbidden(file: Path) -> bool:
        failed_old_mix = MASTER / "motion-02/sound/soundtrack-v1"
        return (file.suffix.lower() == ".zip"
                or file.name in FORBIDDEN_MEDIA_NAMES
                or (file.name in DIAGNOSTIC_MEDIA_NAMES and file.resolve() not in required_dependencies)
                or any(p.lower() in EXCLUDED_PARTS for p in file.parts)
                or file.resolve().is_relative_to(failed_old_mix.resolve()))

    def add(file: Path, group: str, expected: str | None = None) -> None:
        file = inside(file)
        if not file.is_file() or forbidden(file):
            raise ValueError(f"Inclusion interdite ou absente : {file}")
        if file.suffix.lower() == ".mp4" and not file.is_relative_to(MEDIA):
            raise ValueError(f"Film historique interdit : {file}")
        if expected and digest(file).lower() != expected.lower():
            raise ValueError(f"Source gelée modifiée : {file}")
        selected.setdefault(file, set()).add(group)

    def short_proof(file: Path) -> bool:
        # Read duration, never encode; skip any new full movie as well as old movies.
        ffmpeg = Path(os.environ.get("HOLT_FFMPEG", str(
            ROOT / "art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe")))
        if not ffmpeg.is_file():
            raise FileNotFoundError("HOLT_FFMPEG requis pour borner les MP4 de preuve.")
        result = subprocess.run([str(ffmpeg), "-hide_banner", "-i", str(file)],
                                capture_output=True, timeout=30)
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)",
                          result.stderr.decode("utf-8", errors="replace"))
        if not match:
            raise ValueError(f"Durée MP4 illisible : {file}")
        seconds = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
        if seconds > 60:
            omitted.append({"file": file.relative_to(ROOT).as_posix(),
                            "reason": "MP4 supérieur à 60 s", "seconds": seconds})
            return False
        return True

    def bounded_tree(folder: Path, group: str) -> None:
        folder = inside(folder)
        if not folder.is_dir():
            raise FileNotFoundError(folder)
        for file in sorted(folder.rglob("*")):
            if not file.is_file():
                continue
            if file.name != "report.json" and any(file.resolve().is_relative_to(run) for run in failed_runs):
                omitted.append({"file": file.relative_to(ROOT).as_posix(), "reason": "média de QA échouée ; rapport conservé"})
                continue
            if forbidden(file) or file.name in {"BACKUP-PLAN.json", "reader-cover-motion-v10.json"}:
                omitted.append({"file": file.relative_to(ROOT).as_posix(), "reason": "exclusion"})
                continue
            if file.suffix.lower() == ".mp4" and not short_proof(file):
                continue
            add(file, group)

    current_path = HERE / "SELECTION.json"
    current = document(current_path)
    previous_path = HERE.parent / "motion-02/SELECTION.json"
    previous = document(previous_path)
    if len(current["files"]) != 317:
        raise ValueError("Le verrou v10 attendu doit contenir exactement 317 dépendances.")
    required_dependencies.update(inside(ROOT / e["file"]) for e in current["files"] + previous["files"])
    add(current_path, "selection-v10")
    add(previous_path, "selection-v9")
    for entry in current["files"] + current["engine"]:
        add(ROOT / entry["file"], "selection-v10", entry["sha256"])
    if len(previous["files"]) != 195:
        raise ValueError("Le verrou v9 attendu doit contenir exactement 195 fichiers.")
    for entry in previous["files"]:
        add(ROOT / entry["file"], "selection-v9", entry["sha256"])
    projects = ROOT / "anime/motion-comics/projects"
    full = projects / "blue-purple-pages01-21-v10.json"
    add(full, "selection-v10", current["selectedSha256"])
    add(projects / "blue-purple-pages01-21-v9.json", "selection-v9", previous["selectedSha256"])
    for name in ("blue-purple-pages09-21-motion06.json", "blue-purple-cover-preview-v1.json",
                 "blue-purple-cover-v1.json", "blue-purple-page16-motion06.json", "blue-purple-page17-motion06.json"):
        add(projects / name, "manifests")
    expected_engine = {e["file"] for e in current["engine"]}
    for name in RUNTIME:
        file = ROOT / "anime/motion-comics" / name
        if file.relative_to(ROOT).as_posix() not in expected_engine:
            raise ValueError(f"Runtime non couvert par le gel v10 : {file}")
        add(file, "runtime")
    # Fonts and their licence files, bounded to this runtime asset directory.
    bounded_tree(ROOT / "anime/motion-comics/assets", "fonts-licences")
    bounded_tree(ROOT / "anime/motion-comics/tests", "runtime-tests")
    add(ROOT / "anime/motion-comics/cli.cjs", "runtime-tools")
    for folder, group in ((HERE, "sources-motion03"), (MEDIA, "masters-preuves-motion03")):
        bounded_tree(folder, group)

    # Exact local source references from this production's journals, without walking
    # previous master trees. External generated-image paths remain documentary only.
    def refs(value):
        if isinstance(value, dict):
            for entry in value.values():
                refs(entry)
        elif isinstance(value, list):
            for entry in value:
                refs(entry)
        elif isinstance(value, str):
            normalized = value.replace(chr(92), "/")
            if normalized.startswith(("docs/", "art-masters/", "anime/")) and "\n" not in value:
                candidate = ROOT / normalized
                if candidate.is_file() and candidate.suffix.lower() not in (".zip", ".odp") and not forbidden(candidate):
                    if candidate.name != "report.json" and any(candidate.resolve().is_relative_to(run) for run in failed_runs):
                        return
                    if candidate.suffix.lower() != ".mp4" or (candidate.is_relative_to(MEDIA) and short_proof(candidate)):
                        add(candidate, "exact-journal-reference")
    for journal in sorted(HERE.rglob("*.json")):
        if journal.name != "BACKUP-PLAN.json":
            refs(document(journal))
    # The unchanged cover's source and identity references are retained explicitly.
    cover = document(HERE.parent / "motion-02/cover/SELECTION.json")
    for entry in cover["references"]:
        add(ROOT / entry["file"], "references-cover", entry["sha256"])
    bounded_tree(HERE.parent / "motion-02/cover", "cover-source-journals")
    bounded_tree(MASTER / "motion-02/cover", "cover-masters")
    # Keep the original deck's useful extracted images, not its entire 145MB archive.
    bounded_tree(MASTER / "motion-02/map-reference", "original-deck-extracts")
    for name in ("p17-clean-attempt-01.json", "p17-clean-attempt-02.json"):
        journal = HERE.parent / "motion-02/art" / name
        attempt = document(journal)
        add(journal, "references-p17")
        add(journal.parent / attempt["prompt"], "references-p17")
        ref = attempt["reference"]
        add(ROOT / ref["path"], "references-p17", ref["sha256"])
        add(ROOT / attempt["output"], "references-p17", attempt["output_sha256"])

    # Source lock is useful provenance, but its historical engine hashes are not current.
    add(HERE.parent / "motion-01/SOURCE-LOCK-v2.json", "provenance-v9")
    for name in ("FORMAT.json", "prepare-backup.py", "SELECTION.json"):
        add(HERE.parent / "format-01" / name, "provenance-v9")
    add(HERE.parent / "motion-02/README.md", "provenance-v9")
    add(HERE.parent / "motion-01/export/backup.py", "backup-tools")
    add(ROOT / "anime/motion-comics/production/pages-05-08/backup.py", "backup-tools")
    for name in (
        "AGENTS.md", "package.json", "package-lock.json", "eslint.config.js", "docs/INDEX.md", "docs/WORKFLOWS.md",
        "docs/design/MOTION-COMICS-READER.md", "anime/motion-comics/README.md",
        "docs/anime/MOTION-COMICS-TECHNICAL.md", "docs/anime/MOTION-COMICS-EFFECTS.md", "docs/chapters/ch3/SCENARIO.md",
        "docs/anime/motion-comics/ART.md", "docs/anime/motion-comics/ANIMATION.md",
        "docs/anime/motion-comics/DELIVERY.md", "docs/anime/motion-comics/ORCHESTRATION.md",
        "docs/anime/motion-comics/LESSONS.md", "docs/anime/motion-comics/PROGRESS.md",
        "docs/process/adr/0053-motion-comics-digital-reveal-and-cover.md",
        "docs/process/adr/0054-motion-comics-masks-and-narrative-reveals.md",
        "docs/comics/blue-purple-motion/production/chapter-03-continuation/PROGRESS.md",
    ):
        add(ROOT / name, "documentation")
    if not (HERE / "README.md").is_file():
        raise FileNotFoundError("README.md de relance motion-03 requis avant gel.")

    frozen = [{"file": f.relative_to(ROOT).as_posix(), "bytes": f.stat().st_size,
               "sha256": digest(f), "groups": sorted(selected[f])} for f in sorted(selected)]
    # Check locked selections again after inventory, catching concurrent edits during preparation.
    for entries in (current["files"], current["engine"], previous["files"]):
        for entry in entries:
            add(ROOT / entry["file"], "verified", entry["sha256"])
    add(full, "verified", current["selectedSha256"])
    add(projects / "blue-purple-pages01-21-v9.json", "verified", previous["selectedSha256"])
    if document(current_path) != current or document(previous_path) != previous:
        raise ValueError("Sélection modifiée pendant la préparation.")
    counts = Counter()
    sizes = Counter()
    for entry in frozen:
        for group in entry["groups"]:
            counts[group] += 1
            sizes[group] += entry["bytes"]
    plan = {
        "output": os.path.relpath(DESTINATION, HERE).replace("\\", "/"),
        "purpose": "Lecteur v10 autonome : couverture, 21 pages, runtime courant, sources et preuves courtes.",
        "include": [os.path.relpath(f, HERE).replace("\\", "/") for f in sorted(selected)],
        "frozenFiles": frozen,
        "inspection": {"files": len(frozen), "bytes": sum(e["bytes"] for e in frozen),
                       "groupsOverlap": True, "countsByGroup": dict(counts),
                       "bytesByGroup": dict(sizes), "omitted": omitted,
                       "previousFiles": len(previous["files"]), "runtimeFiles": len(RUNTIME),
                       "currentDependencies": len(current["files"]),
                       "forbiddenMediaNames": sorted(FORBIDDEN_MEDIA_NAMES),
                       "unpromotedDiagnosticsExcluded": sorted(DIAGNOSTIC_MEDIA_NAMES),
                       "failedRunsReportsOnly": [p.relative_to(ROOT).as_posix() for p in sorted(failed_runs)],
                       "noRecursiveLegacyMedia": True, "maxProofMp4Seconds": 60},
    }
    with plan_file.open("x", encoding="utf-8") as output:
        json.dump(plan, output, ensure_ascii=False, indent=2)
    summary = {"plan": plan_file.relative_to(ROOT).as_posix(),
               "output": plan["output"], **plan["inspection"]}
    summary["omittedFiles"] = len(summary.pop("omitted"))
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
