"""Patch pagination with lossless FFmpeg RGBA overlays; verify exact raster witnesses."""
from __future__ import annotations
import hashlib
import json
import subprocess
import sys
import ctypes
import time
from pathlib import Path

ROOT = next(parent for parent in Path(__file__).resolve().parents if (parent / "AGENTS.md").exists())
WIDTH, HEIGHT = 1280, 720


class ProcessMemoryCounters(ctypes.Structure):
    _fields_ = [("cb", ctypes.c_ulong), ("PageFaultCount", ctypes.c_ulong),
                *[(name, ctypes.c_size_t) for name in ("PeakWorkingSetSize", "WorkingSetSize", "QuotaPeakPagedPoolUsage", "QuotaPagedPoolUsage", "QuotaPeakNonPagedPoolUsage", "QuotaNonPagedPoolUsage", "PagefileUsage", "PeakPagefileUsage")]]


def peak_working_set(process: subprocess.Popen) -> int | None:
    counters = ProcessMemoryCounters()
    counters.cb = ctypes.sizeof(counters)
    query = ctypes.windll.psapi.GetProcessMemoryInfo
    success = query(ctypes.c_void_p(int(process._handle)), ctypes.byref(counters), counters.cb)
    return int(counters.PeakWorkingSetSize) if success else None


def inside(value: str | Path) -> Path:
    result = Path(value).resolve()
    if not result.is_relative_to(ROOT):
        raise ValueError(f"Chemin hors dépôt : {result}")
    return result


def digest(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def execute(ffmpeg: Path, args: list[str], metrics: dict | None = None) -> bytes:
    started = time.monotonic()
    process = subprocess.Popen([str(ffmpeg), *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE, creationflags=subprocess.CREATE_NO_WINDOW)
    peak = 0
    while True:
        peak = max(peak, peak_working_set(process) or 0)
        try:
            stdout, stderr = process.communicate(timeout=0.25)
            break
        except subprocess.TimeoutExpired:
            continue
    peak = max(peak, peak_working_set(process) or 0)
    if metrics is not None:
        metrics.update({"elapsedSeconds": time.monotonic() - started, "peakWorkingSetBytes": peak or None, "exitCode": process.returncode})
    if process.returncode:
        raise RuntimeError(stderr.decode("utf-8", errors="replace"))
    return stdout


def rgba(ffmpeg: Path, file: Path) -> bytes:
    data = execute(ffmpeg, ["-nostdin", "-hide_banner", "-loglevel", "error", "-i", str(file), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"])
    if len(data) != WIDTH * HEIGHT * 4:
        raise ValueError(f"Dimensions incorrectes : {file}")
    return data


def main() -> None:
    plan_file = inside(sys.argv[1])
    plan = json.loads(plan_file.read_text(encoding="utf-8-sig"))
    output, cache = inside(plan["output"]), inside(plan["cache"])
    ffmpeg = inside(plan["ffmpeg"])
    x, y, width, height = plan["paginationRect"]
    patches = {entry["page"]: rgba(ffmpeg, inside(entry["image"])) for entry in plan["patches"]}
    witnesses = {entry["index"]: entry for entry in plan["witnesses"]}
    proof_only = plan.get("proofOnly", False)
    compression_level = int(plan.get("pngCompressionLevel", 1))
    if not 0 <= compression_level <= 9:
        raise ValueError("Compression PNG attendue entre0 et9.")
    selected = plan["frames"] if not proof_only else [frame for frame in plan["frames"] if frame["index"] in witnesses]
    origins, proofs, batches = [], [], []
    # Validate the entire selected source cache before allowing a batch transcode.
    for frame in selected:
        source = inside(cache / "frames" / f"frame_{frame['index']:05d}.png")
        if digest(source) != frame["sha256"]:
            raise ValueError(f"Cache modifié : {source}")
    if not proof_only:
        # One retained page and one constant patch per process. Eight simultaneously
        # looped still-image inputs make framesync retain unbounded image queues.
        for patch in plan["patches"]:
            matching = [frame["index"] for frame in plan["frames"] if frame["page"] == patch["page"]]
            if not matching:
                continue
            first, last = min(matching), max(matching)
            if matching != list(range(first, last + 1)):
                raise ValueError(f"Plage de page non contiguë : {patch['page']}")
            args = ["-nostdin", "-hide_banner", "-loglevel", "error", "-n", "-framerate", str(plan["fps"]), "-start_number", str(first), "-i", str(cache / "frames/frame_%05d.png"),
                    "-loop", "1", "-framerate", str(plan["fps"]), "-i", str(inside(patch["image"])), "-filter_complex_threads", "1",
                    "-filter_complex", f"[0:v]format=rgba[v];[1:v]format=rgba,crop={width}:{height}:{x}:{y}[p];[v][p]overlay=x={x}:y={y}:format=rgb[out]",
                    "-map", "[out]", "-frames:v", str(len(matching)), "-c:v", "png", "-pix_fmt", "rgba", "-compression_level", str(compression_level), "-threads", "1", "-start_number", str(first), str(output / "frames/frame_%05d.png")]
            metrics = {"page": patch["page"], "firstFrame": first, "lastFrame": last, "frames": len(matching), "simultaneousPatchInputs": 1, "pngCompressionLevel": compression_level}
            execute(ffmpeg, args, metrics)
            batches.append(metrics)
            print(json.dumps({"page": patch["page"] + 1, "frames": len(matching), **metrics}), flush=True)
    for frame in selected:
        index = frame["index"]
        source = inside(cache / "frames" / f"frame_{index:05d}.png")
        if index in witnesses:
            original = rgba(ffmpeg, source)
            expected_file = inside(witnesses[index]["image"])
            expected = rgba(ffmpeg, expected_file)
            changed = bytearray(original)
            for row in range(y, y + height):
                first, last = (row * WIDTH + x) * 4, (row * WIDTH + x + width) * 4
                changed[first:last] = patches[frame["page"]][first:last]
            expected_outside = bytearray(expected)
            for row in range(y, y + height):
                first, last = (row * WIDTH + x) * 4, (row * WIDTH + x + width) * 4
                expected_outside[first:last] = original[first:last]
            outside_exact, whole_exact = expected_outside == original, changed == expected
            encoded_exact = True
            if not proof_only:
                encoded_exact = rgba(ffmpeg, inside(output / "frames" / f"frame_{index:05d}.png")) == expected
            proof = {"index": index, "page": frame["page"], "time": index / plan["fps"], "outsidePaginationExact": outside_exact,
                     "wholeRgbaExactAfterPatch": whole_exact, "ffmpegPngExactAfterOverlay": encoded_exact,
                     "sourceSha256": frame["sha256"], "runtimePngSha256": digest(expected_file)}
            proofs.append(proof)
            if not outside_exact or not whole_exact or not encoded_exact:
                raise ValueError(f"Pixels de témoin différents après patch : frame{index}; {proof}")
        if not proof_only:
            target = inside(output / "frames" / f"frame_{index:05d}.png")
            origins.append({"index": index, "time": index / plan["fps"], "origin": "verified-retained-raster-with-pagination-only-patch",
                            "source": source.relative_to(ROOT).as_posix(), "sourceSha256": frame["sha256"], "sha256": digest(target), "paginationRect": plan["paginationRect"]})
    report = {"status": "completed", "proofOnly": proof_only, "paginationRect": plan["paginationRect"], "checkedRetainedFrames": len(selected), "witnesses": proofs, "paginationBatches": batches,
              "maximumFfmpegWorkingSetBytes": max((entry.get("peakWorkingSetBytes") or 0 for entry in batches), default=0),
              "frames": origins, "method": "PNG SHA against historical frame-origins; exact RGBA runtime witnesses outside pagination and after patch; FFmpeg overlays remain RGB/RGBA, without YUV."}
    destination = inside(output / "cache-proof" / "prefix-copy-report.json")
    with destination.open("x", encoding="utf-8") as result:
        json.dump(report, result, ensure_ascii=False, indent=2)
    print(json.dumps({"status": report["status"], "frames": len(origins), "witnesses": len(proofs)}))


if __name__ == "__main__":
    main()
