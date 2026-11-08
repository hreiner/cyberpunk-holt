"""Small, local FFmpeg editing primitives; callers retain project history."""
from __future__ import annotations

import json
import math
import re
import subprocess
from pathlib import Path
from typing import Sequence


def _run(args: list[str]) -> None:
    subprocess.run(args, check=True, capture_output=True)


def compose_placeholder(output: str | Path, duration: float, color: str = "0x202030", *, ffmpeg: str = "ffmpeg") -> Path:
    """Create a silent solid-colour provisional shot, never overwriting an attempt."""
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("La durée doit être positive et finie.")
    if not re.fullmatch(r"0x[0-9a-fA-F]{6}", color):
        raise ValueError("La couleur doit être de la forme 0xRRGGBB.")
    target = Path(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise FileExistsError(f"Rendu déjà présent : {target}")
    _run([ffmpeg, "-nostdin", "-n", "-v", "error", "-f", "lavfi", "-i",
          f"color=c={color}:s=640x360:r=24", "-t", str(duration),
          "-vf", "drawbox=x=180:y=80:w=280:h=200:color=white@0.8:t=fill,drawbox=x=210:y=115:w=220:h=8:color=black:t=fill,drawbox=x=210:y=145:w=160:h=8:color=black:t=fill",
          "-c:v", "libx264", "-pix_fmt", "yuv420p", str(target)])
    return target


def export_sequence(shots: Sequence[str | Path], output: str | Path, *, ffmpeg: str = "ffmpeg") -> Path:
    """Join matching silent shots into a new MP4, retaining all inputs."""
    if not shots:
        raise ValueError("La chronologie doit contenir au moins un plan.")
    target = Path(output)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise FileExistsError(f"Montage déjà présent : {target}")
    args = [ffmpeg, "-nostdin", "-n", "-v", "error"]
    for shot in shots:
        args.extend(["-i", str(shot)])
    inputs = "".join(f"[{i}:v:0]" for i in range(len(shots)))
    args.extend(["-filter_complex", f"{inputs}concat=n={len(shots)}:v=1:a=0[v]",
                 "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(target)])
    _run(args)
    return target


def probe(path: str | Path, *, ffprobe: str = "ffprobe") -> dict:
    """Return ffprobe's JSON format and stream metadata."""
    result = subprocess.run([ffprobe, "-v", "error", "-show_format", "-show_streams",
                             "-of", "json", str(path)], check=True, capture_output=True, text=True)
    return json.loads(result.stdout)


def replace_shot(shots: Sequence[str | Path], index: int, replacement: str | Path) -> list:
    """Return a revised timeline without mutating the original."""
    if index < 0 or index >= len(shots):
        raise IndexError("Plan introuvable dans la chronologie.")
    revised = list(shots)
    revised[index] = replacement
    return revised
