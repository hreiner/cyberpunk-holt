"""Create and CRC-verify a versioned autonomous delivery backup, excluding frames."""
from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]


def inside(value: Path) -> Path:
    value = value.resolve()
    if not value.is_relative_to(ROOT):
        raise ValueError(f"Chemin hors dépôt : {value}")
    return value


def digest(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def main() -> None:
    plan_file = inside(Path(sys.argv[1]))
    plan = json.loads(plan_file.read_text(encoding="utf-8-sig"))
    destination = inside(plan_file.parent / plan["output"])
    if destination.exists():
        raise FileExistsError("Choisir une nouvelle version de sauvegarde.")
    selected = set()
    for entry in plan["include"]:
        source = inside(plan_file.parent / entry)
        if source.is_file():
            selected.add(source)
            continue
        for candidate in source.rglob("*"):
            relative = candidate.relative_to(source)
            if candidate.is_file() and not any(part in ("frames", "__pycache__", "node_modules") for part in relative.parts):
                if candidate.resolve() != destination:
                    selected.add(inside(candidate))
    entries = []
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, mode="x", compression=zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
        for file in sorted(selected):
            name = file.relative_to(ROOT).as_posix()
            archive.write(file, name)
            entries.append({"file": name, "bytes": file.stat().st_size, "sha256": digest(file)})
        archive.writestr("BACKUP-MANIFEST.json", json.dumps({"files": entries}, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(destination, mode="r") as archive:
        bad = archive.testzip()
        if bad is not None:
            raise ValueError(f"CRC incorrect : {bad}")
        saved_manifest = json.loads(archive.read("BACKUP-MANIFEST.json"))
        for entry in saved_manifest["files"]:
            with archive.open(entry["file"], "r") as member:
                actual = hashlib.file_digest(member, "sha256").hexdigest()
            if actual != entry["sha256"]:
                raise ValueError(f"SHA-256 archivé incorrect : {entry['file']}")
    report = {"status": "completed", "zip": str(destination.relative_to(ROOT)), "bytes": destination.stat().st_size, "files": len(entries), "crcVerified": True, "manifestSha256Verified": True, "sha256": digest(destination)}
    report_file = destination.with_suffix(".json")
    with report_file.open("x", encoding="utf-8") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
