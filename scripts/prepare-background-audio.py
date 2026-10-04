"""Raccord circulaire, normalisation mesurée et MP3 légers (FFmpeg requis)."""
import argparse
import array
import io
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import wave


ROOT = Path(__file__).resolve().parent.parent
MASTER_DIR = ROOT / "art-masters/audio/background"
OUTPUT_DIR = ROOT / "public/assets/audio/background"


def run(ffmpeg, *args):
    result = subprocess.run([str(ffmpeg), "-hide_banner", "-nostdin", *map(str, args)],
                            capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.decode("utf-8", errors="replace")[-3000:])
    return result


def pcm(ffmpeg, path, channels=1):
    result = run(ffmpeg, "-loglevel", "error", "-i", path, "-ac", channels,
                 "-ar", 44100, "-c:a", "pcm_s16le", "-f", "wav", "pipe:1")
    with wave.open(io.BytesIO(result.stdout)) as decoded:
        samples = array.array("h", decoded.readframes(decoded.getnframes()))
    return samples


def loudness(ffmpeg, path, target):
    result = run(ffmpeg, "-i", path, "-af",
                 f"loudnorm=I={target}:TP=-2:LRA=11:print_format=json", "-f", "null", "-")
    matches = re.findall(r'\{\s*"input_i"[\s\S]*?\}', result.stderr.decode("utf-8"))
    return json.loads(matches[-1])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--asset")
    parser.add_argument("--ffmpeg")
    parser.add_argument("--force", action="store_true")
    opts = parser.parse_args()
    bundled = list((ROOT / "art-masters/tools/audio-python/imageio_ffmpeg/binaries").glob("ffmpeg*.exe"))
    ffmpeg = opts.ffmpeg or os.environ.get("FFMPEG_BINARY") or shutil.which("ffmpeg")
    ffmpeg = ffmpeg or (bundled[0] if bundled else None)
    if not ffmpeg:
        raise RuntimeError("FFmpeg absent : fournir --ffmpeg=<chemin>.")
    briefs = json.loads((ROOT / "docs/art/audio-generation/background.json").read_text(encoding="utf-8"))
    sources_path = ROOT / "docs/art/audio-generation/ambience-sources.json"
    sources = json.loads(sources_path.read_text(encoding="utf-8")) if sources_path.exists() else []
    if isinstance(sources, dict):
        sources = sources.get("assets", sources.get("sources", []))
    by_id = {source["id"]: source for source in sources}
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = MASTER_DIR / "measurements.json"
    report = json.loads(report_path.read_text()) if report_path.exists() else {}
    for asset in briefs["assets"]:
        name = asset["id"]
        if opts.asset and name != opts.asset:
            continue
        output = OUTPUT_DIR / f"{name}.mp3"
        if output.exists() and not opts.force:
            continue
        source = by_id.get(name, {})
        raw = MASTER_DIR / source.get("file", f"{name}.mp3")
        if not raw.exists():
            if opts.asset:
                raise RuntimeError(f"Master absent : {raw}")
            continue
        start = float(source.get("startSeconds", 0))
        seconds = min(asset["seconds"], len(pcm(ffmpeg, raw)) / 44100 - start)
        cross = asset["crossfadeSeconds"]
        if seconds <= 3 * cross:
            raise RuntimeError(f"Master trop court : {name} ({seconds:.2f} s).")
        music = asset["kind"] == "music"
        target = -20 if music else -24
        channels = 2 if music else 1
        intermediate = MASTER_DIR / f"{name}-loop.wav"
        treatment = "highpass=f=35"
        if name == "ambience-fire":
            # Une crépitation isolée ne doit pas devenir un impact au premier plan.
            treatment += ",lowpass=f=4500,alimiter=limit=0.0625:level=false"
        filters = (
            f"[0:a]atrim=start={start}:end={start + seconds},asetpts=PTS-STARTPTS,"
            f"{treatment},asplit=3[a][b][c];"
            f"[a]atrim=start={cross}:end={seconds - cross},asetpts=PTS-STARTPTS[m];"
            f"[b]atrim=start={seconds - cross}:end={seconds},asetpts=PTS-STARTPTS[t];"
            f"[c]atrim=start=0:end={cross},asetpts=PTS-STARTPTS[h];"
            # acrossfade peut jeter deux segments de durée exactement égale à d.
            # Mélanger explicitement les enveloppes conserve tout le raccord.
            f"[t]afade=t=out:st=0:d={cross}[tf];"
            f"[h]afade=t=in:st=0:d={cross}[hf];"
            f"[tf][hf]amix=inputs=2:normalize=0:duration=longest[j];"
            # 10 ms aux extrémités évitent la discontinuité ajoutée par l'encodage MP3.
            f"[m][j]concat=n=2:v=0:a=1[loop];"
            f"[loop]afade=t=in:d=0.01,afade=t=out:st={seconds - cross - 0.01}:d=0.01[out]"
        )
        run(ffmpeg, "-y", "-i", raw, "-filter_complex", filters, "-map", "[out]",
            "-ac", channels, "-ar", 44100, "-c:a", "pcm_s16le", intermediate)
        measurement = loudness(ffmpeg, intermediate, target)
        normalize = (
            f"loudnorm=I={target}:TP=-2:LRA=11:linear=true:"
            f"measured_I={measurement['input_i']}:measured_TP={measurement['input_tp']}:"
            f"measured_LRA={measurement['input_lra']}:measured_thresh={measurement['input_thresh']}:"
            f"offset={measurement['target_offset']}"
        )
        run(ffmpeg, "-y", "-i", intermediate, "-af", normalize, "-ac", channels,
            "-ar", 44100, "-c:a", "libmp3lame", "-b:a", "96k" if music else "64k",
            "-map_metadata", "-1", output)
        final = loudness(ffmpeg, output, target)
        samples = pcm(ffmpeg, output)
        rms = math.sqrt(sum(value * value for value in samples) / len(samples)) / 32768
        report[name] = {
            "durationSeconds": round(len(samples) / 44100, 3),
            "bytes": output.stat().st_size,
            "integratedLufs": float(final["input_i"]),
            "truePeakDb": float(final["input_tp"]),
            "loudnessRangeLu": float(final["input_lra"]),
            "rmsDb": round(20 * math.log10(max(rms, 1e-10)), 2),
            "loopBoundaryJump": round(abs(samples[-1] - samples[0]) / 32768, 6),
        }
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"Préparé : {name} — {report[name]}", flush=True)
    if opts.asset and opts.asset not in {asset["id"] for asset in briefs["assets"]}:
        raise RuntimeError(f"Son inconnu : {opts.asset}")


if __name__ == "__main__":
    main()
