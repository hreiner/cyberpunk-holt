"""Freeze and re-read every member of the autonomous web release (no masters in Git)."""
import gzip
import hashlib
import json
import pathlib
import subprocess
import tarfile

ROOT = pathlib.Path(__file__).resolve().parents[6]
HERE = pathlib.Path(__file__).resolve().parent
PUBLIC = ROOT / "public/comics/blue-purple/v11"
OUT = ROOT / "art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/package/release-v1"
ARCHIVE = OUT / "blue-purple-v11-web.tar.gz"


def sha(file):
    return hashlib.file_digest(open(file, "rb"), "sha256").hexdigest()


def main():
    subprocess.run(["node", "anime/motion-comics/publish.cjs", "--check", str(PUBLIC)], cwd=ROOT, check=True)
    if ARCHIVE.exists():
        raise RuntimeError("Archive existante conservée")
    files = sorted(file for file in PUBLIC.rglob("*") if file.is_file())
    if len(files) != 345 or any(file.is_symlink() for file in PUBLIC.rglob("*")):
        raise RuntimeError("Paquet différent ou lien interdit")
    OUT.mkdir(parents=True, exist_ok=True)
    with open(ARCHIVE, "xb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, compresslevel=6, mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w|", format=tarfile.USTAR_FORMAT) as archive:
                for file in files:
                    info = archive.gettarinfo(str(file), arcname="v11/" + file.relative_to(PUBLIC).as_posix())
                    info.uid = info.gid = info.mtime = 0
                    info.uname = info.gname = ""
                    info.mode = 0o644
                    with open(file, "rb") as content:
                        archive.addfile(info, content)
    checked = 0
    with tarfile.open(ARCHIVE, "r:gz") as archive:
        for member in archive:
            if not member.isfile() or not member.name.startswith("v11/"):
                raise RuntimeError("Membre inattendu")
            expected = PUBLIC / pathlib.PurePosixPath(member.name).relative_to("v11")
            if hashlib.sha256(archive.extractfile(member).read()).hexdigest() != sha(expected):
                raise RuntimeError("Membre relu différent")
            checked += 1
    if checked != len(files):
        raise RuntimeError("Archive incomplète")
    selection = json.loads((HERE / "SELECTION.json").read_text(encoding="utf-8"))
    config = {
        "schemaVersion": 1, "version": 11, "directory": "public/comics/blue-purple/v11",
        "sourceManifest": selection["selected"], "sourceSha256": selection["selectedSha256"],
        "publicationSha256": sha(PUBLIC / "PUBLICATION.json"),
        "release": {
            "tag": "blue-purple-v11-web-20261117",
            "url": "https://github.com/hreiner/cyberpunk-holt/releases/download/blue-purple-v11-web-20261117/blue-purple-v11-web.tar.gz",
            "sha256": sha(ARCHIVE), "bytes": ARCHIVE.stat().st_size,
        },
    }
    report = {"status": "archive-verified", "members": checked, "archive": ARCHIVE.relative_to(ROOT).as_posix(), **config}
    (HERE / "package/ARCHIVE.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    (OUT / "web-release.json").write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
