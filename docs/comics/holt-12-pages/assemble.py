"""Assemble the HOLT comic from independent image panels and a JSON storyboard.

Run with the bundled Python runtime after the PDF artifact marker has been started:
    python docs/comics/holt-12-pages/assemble.py

The source images remain untouched. Output goes to art-masters/comics/holt-12-pages/.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


def pdf_art(image):
    stream = io.BytesIO()
    image.convert("RGB").save(stream, format="JPEG", quality=95, subsampling=0, optimize=True)
    stream.seek(0)
    return ImageReader(stream)


ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUTPUT = ROOT / "art-masters/comics/holt-12-pages"
PANEL_DIR = OUTPUT / "panels"
REFERENCE_DIR = OUTPUT / "references"
WIDTH, HEIGHT = 1600, 2400
SCALE = 0.5  # PDF page is 800 × 1200 points; PNGs remain 1600 × 2400 pixels.
MARGIN, TOP, BOTTOM, GUTTER = 65, 92, 80, 18
INK = "#10141c"
PAPER = "#f8f2e7"
CYAN = "#79d6e8"
PINK = "#d18ca9"
FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
PDF_NAME = "holt-le-s-de-solidarite.pdf"


@dataclass(frozen=True)
class Box:
    x: int
    y: int
    w: int
    h: int


def layouts(name: str) -> list[Box]:
    x, y = MARGIN, TOP
    w, h = WIDTH - 2 * MARGIN, HEIGHT - TOP - BOTTOM
    half_w = (w - GUTTER) // 2
    half_h = (h - GUTTER) // 2
    upper = int((h - GUTTER) * 0.44)
    lower = h - GUTTER - upper
    strip = (h - 2 * GUTTER) // 3
    choices = {
        "full": [Box(x, y, w, h)],
        "two": [Box(x, y, w, half_h), Box(x, y + half_h + GUTTER, w, h - half_h - GUTTER)],
        "three-strips": [Box(x, y, w, strip), Box(x, y + strip + GUTTER, w, strip), Box(x, y + 2 * (strip + GUTTER), w, h - 2 * (strip + GUTTER))],
        "three-top": [Box(x, y, w, h - GUTTER - lower), Box(x, y + upper + GUTTER, half_w, lower), Box(x + half_w + GUTTER, y + upper + GUTTER, w - half_w - GUTTER, lower)],
        "three-bottom": [Box(x, y, half_w, upper), Box(x + half_w + GUTTER, y, w - half_w - GUTTER, upper), Box(x, y + upper + GUTTER, w, lower)],
        "four": [Box(x, y, half_w, half_h), Box(x + half_w + GUTTER, y, w - half_w - GUTTER, half_h), Box(x, y + half_h + GUTTER, half_w, h - half_h - GUTTER), Box(x + half_w + GUTTER, y + half_h + GUTTER, w - half_w - GUTTER, h - half_h - GUTTER)],
    }
    if name not in choices:
        raise ValueError(f"Unknown layout {name!r}; choose {', '.join(choices)}")
    return choices[name]


def color(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def pdf_y(y: float) -> float:
    return (HEIGHT - y) * SCALE


def cover(image: Image.Image, box: Box, focal: list[float]) -> Image.Image:
    if len(focal) != 2 or any(not 0 <= v <= 1 for v in focal):
        raise ValueError(f"Invalid focal point {focal!r}; expected [x, y] within 0..1")
    return ImageOps.fit(image.convert("RGB"), (box.w, box.h), method=Image.Resampling.LANCZOS, centering=tuple(focal))


def normalized_box(box: Box, values: list[float]) -> Box:
    if len(values) != 4 or any(not 0 <= v <= 1 for v in values):
        raise ValueError(f"Invalid text box {values!r}; expected [x, y, width, height] within 0..1")
    x, y, w, h = values
    if x + w > 1.001 or y + h > 1.001 or w <= 0 or h <= 0:
        raise ValueError(f"Text box goes outside panel: {values!r}")
    return Box(box.x + round(x * box.w), box.y + round(y * box.h), round(w * box.w), round(h * box.h))


def wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for word in paragraph.split():
            trial = f"{current} {word}" if current else word
            if font.getlength(trial) <= max_width:
                current = trial
            elif current:
                lines.append(current)
                current = word
            else:
                raise ValueError(f"Word too wide for text box: {word!r}")
        if current:
            lines.append(current)
    return lines


def fit_text(text: str, kind: str, box: Box, requested: int) -> tuple[ImageFont.FreeTypeFont, list[str], int]:
    padding = 24 if kind != "sfx" else 4
    for size in range(requested, 29, -1):
        font = ImageFont.truetype(str(FONT_BOLD if kind == "sfx" else FONT_REGULAR), size)
        try:
            lines = wrap(text, font, box.w - 2 * padding)
        except ValueError:
            continue
        line_height = math.ceil(size * 1.21)
        if len(lines) * line_height <= box.h - 2 * padding:
            return font, lines, line_height
    raise ValueError(f"Text does not fit at 30 px or larger: {text!r} in {box}")


def draw_rect(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, b: Box, *, radius: int, fill: str, stroke: str, stroke_width: int) -> None:
    draw.rounded_rectangle((b.x, b.y, b.x + b.w, b.y + b.h), radius=radius, fill=fill, outline=stroke, width=stroke_width)
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke)
    pdf.setLineWidth(stroke_width * SCALE)
    pdf.roundRect(b.x * SCALE, pdf_y(b.y + b.h), b.w * SCALE, b.h * SCALE, radius * SCALE, fill=1, stroke=1)


def draw_polygon(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, points: list[tuple[int, int]], fill: str, stroke: str, stroke_width: int) -> None:
    draw.polygon(points, fill=fill)
    draw.line(points + [points[0]], fill=stroke, width=stroke_width, joint="curve")
    path = pdf.beginPath()
    path.moveTo(points[0][0] * SCALE, pdf_y(points[0][1]))
    for x, y in points[1:]:
        path.lineTo(x * SCALE, pdf_y(y))
    path.close()
    pdf.setFillColor(fill)
    pdf.setStrokeColor(stroke)
    pdf.setLineWidth(stroke_width * SCALE)
    pdf.drawPath(path, fill=1, stroke=1)


def draw_tail(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, panel: Box, b: Box, tail: list[float], fill: str, stroke: str) -> None:
    if len(tail) != 2 or any(not 0 <= v <= 1 for v in tail):
        raise ValueError(f"Invalid tail {tail!r}; expected [x, y] within 0..1")
    tx = panel.x + round(tail[0] * panel.w)
    ty = panel.y + round(tail[1] * panel.h)
    cx = max(b.x + 30, min(tx, b.x + b.w - 30))
    if ty >= b.y + b.h:
        points = [(cx - 24, b.y + b.h - 3), (cx + 18, b.y + b.h - 3), (tx, ty)]
    elif ty <= b.y:
        points = [(cx - 22, b.y + 3), (cx + 22, b.y + 3), (tx, ty)]
    elif tx < b.x:
        cy = max(b.y + 30, min(ty, b.y + b.h - 30))
        points = [(b.x + 3, cy - 20), (b.x + 3, cy + 20), (tx, ty)]
    else:
        cy = max(b.y + 30, min(ty, b.y + b.h - 30))
        points = [(b.x + b.w - 3, cy - 20), (b.x + b.w - 3, cy + 20), (tx, ty)]
    # A pointer indicates direction without crossing the character's face.
    sx = (points[0][0] + points[1][0]) / 2
    sy = (points[0][1] + points[1][1]) / 2
    length = math.hypot(tx - sx, ty - sy)
    if length > 110:
        points[-1] = (round(sx + (tx - sx) * 110 / length), round(sy + (ty - sy) * 110 / length))
    draw_polygon(draw, pdf, points, fill, stroke, 3)


def draw_thought_tail(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, panel: Box, b: Box, tail: list[float]) -> None:
    tx = panel.x + tail[0] * panel.w
    ty = panel.y + tail[1] * panel.h
    sx = max(b.x + 25, min(tx, b.x + b.w - 25))
    sy = b.y + b.h + 8
    distance = max(1, math.hypot(tx - sx, ty - sy))
    for offset, radius in [(18, 10), (45, 7), (68, 4)]:
        fraction = min(offset, distance) / distance
        x, y = sx + (tx - sx) * fraction, sy + (ty - sy) * fraction
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=PAPER, outline=INK, width=2)
        pdf.setFillColor(PAPER)
        pdf.setStrokeColor(INK)
        pdf.setLineWidth(1)
        pdf.circle(x * SCALE, pdf_y(y), radius * SCALE, fill=1, stroke=1)


def draw_text(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, box: Box, text: str, kind: str, font_size: int) -> None:
    font, lines, line_height = fit_text(text, kind, box, font_size)
    padding = 24 if kind != "sfx" else 4
    ascent, _ = font.getmetrics()
    x, top = box.x + padding, box.y + (box.h - len(lines) * line_height) // 2
    fill = INK if kind in {"speech", "thought"} else PAPER
    if kind == "sfx":
        fill = PAPER
    pdf.setFillColor(fill)
    pdf.setFont("HoltBold" if kind == "sfx" else "Holt", font.size * SCALE)
    for i, line in enumerate(lines):
        baseline = top + i * line_height + ascent
        draw.text((x, baseline), line, font=font, fill=fill, anchor="ls")
        pdf.drawString(x * SCALE, pdf_y(baseline), line)


def draw_label(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, text: str, x: int, baseline: int, size: int, fill: str, bold: bool = False) -> None:
    font = ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size)
    draw.text((x, baseline), text, font=font, fill=fill, anchor="ls")
    pdf.setFont("HoltBold" if bold else "Holt", size * SCALE)
    pdf.setFillColor(fill)
    pdf.drawString(x * SCALE, pdf_y(baseline), text)


def render_text(draw: ImageDraw.ImageDraw, pdf: canvas.Canvas, panel: Box, item: dict, index: int) -> None:
    kind = item.get("kind", "speech")
    if kind not in {"speech", "narration", "thought", "sfx"}:
        raise ValueError(f"Unknown text kind: {kind!r}")
    raw = item.get("box")
    if raw is None:
        # Predictable fallback for early drafts; final lettering should set every box.
        raw = [0.055 + (index % 2) * 0.45, 0.05 + (index // 2) * 0.19, 0.44, 0.17]
        print(f"WARNING: automatic box for {item.get('text', '')[:32]!r}; set box explicitly for final layout")
    b = normalized_box(panel, raw)
    fill = PAPER if kind in {"speech", "thought"} else "#161d2a"
    stroke = INK if kind in {"speech", "thought"} else CYAN
    if kind in {"speech", "thought"}:
        tail = item.get("tail")
        if tail is not None:
            if kind == "thought":
                draw_thought_tail(draw, pdf, panel, b, tail)
            else:
                draw_tail(draw, pdf, panel, b, tail, fill, stroke)
        draw_rect(draw, pdf, b, radius=min(26, b.h // 3), fill=fill, stroke=stroke, stroke_width=3)
    elif kind == "narration":
        draw_rect(draw, pdf, b, radius=7, fill=fill, stroke=stroke, stroke_width=3)
    draw_text(draw, pdf, b, item["text"], kind, int(item.get("font_size", 38 if kind != "narration" else 36)))


def validate(data: dict, require_images: bool = True) -> None:
    pages = data.get("pages")
    if not isinstance(pages, list) or len(pages) != 12:
        raise ValueError("Storyboard must contain exactly 12 pages")
    for name in ("COVER", "BACK"):
        if require_images and not (REFERENCE_DIR / f"{name}.png").is_file():
            raise FileNotFoundError(REFERENCE_DIR / f"{name}.png")
    for number, page in enumerate(pages, 1):
        if page.get("number", number) != number:
            raise ValueError(f"Page sequence error at page {number}")
        boxes = layouts(page["layout"])
        panels = page.get("panels", [])
        if len(panels) != len(boxes):
            raise ValueError(f"Page {number}: panel count does not match layout {page['layout']!r}")
        for index, (panel, box) in enumerate(zip(panels, boxes, strict=True), 1):
            expected = f"P{number:02d}-C{index:02d}"
            if panel.get("id") != expected:
                raise ValueError(f"Expected {expected}, got {panel.get('id')!r}")
            if require_images and not (PANEL_DIR / f"{expected}.png").is_file():
                raise FileNotFoundError(PANEL_DIR / f"{expected}.png")
            for item in panel.get("texts", []):
                if not isinstance(item.get("text"), str) or not item["text"].strip():
                    raise ValueError(f"Empty or invalid text in {expected}")
                if item.get("box") is not None:
                    text_box = normalized_box(box, item["box"])
                    fit_text(item["text"], item.get("kind", "speech"), text_box, int(item.get("font_size", 38)))


def render_cover(pdf: canvas.Canvas, pages_dir: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), INK)
    draw = ImageDraw.Draw(image)
    with Image.open(REFERENCE_DIR / "COVER.png") as source:
        background = cover(source, Box(0, 0, WIDTH, HEIGHT), [0.5, 0.5])
    image.paste(background)
    pdf.drawImage(pdf_art(background), 0, 0, width=WIDTH * SCALE, height=HEIGHT * SCALE)
    draw.rectangle((0, 0, WIDTH, 400), fill="#111923")
    pdf.setFillColor("#111923")
    pdf.rect(0, pdf_y(400), WIDTH * SCALE, 400 * SCALE, fill=1, stroke=0)
    draw.rectangle((70, 45, 83, 375), fill=CYAN)
    pdf.setFillColor(CYAN)
    pdf.rect(70 * SCALE, pdf_y(375), 13 * SCALE, 330 * SCALE, fill=1, stroke=0)
    draw_label(draw, pdf, "UNE HISTOIRE DE L'ACADÉMIE", 113, 82, 29, CYAN, bold=True)
    draw_label(draw, pdf, "HOLT", 99, 285, 245, PAPER, bold=True)
    draw_label(draw, pdf, "LE S DE SOLIDARITÉ", 110, 365, 62, "#e07889", bold=True)
    draw.rectangle((0, 2245, WIDTH, HEIGHT), fill="#111923")
    pdf.setFillColor("#111923")
    pdf.rect(0, 0, WIDTH * SCALE, 155 * SCALE, fill=1, stroke=0)
    draw_label(draw, pdf, "LA DERNIÈRE NUIT", 105, 2340, 38, PAPER, bold=True)
    draw_label(draw, pdf, "UN COMICS EN 12 PAGES", 1085, 2340, 26, CYAN)
    image.save(pages_dir / "cover.png", optimize=True)
    pdf.showPage()


def render_back(pdf: canvas.Canvas, pages_dir: Path, data: dict) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), INK)
    draw = ImageDraw.Draw(image)
    art = Box(0, 0, WIDTH, 1090)
    with Image.open(REFERENCE_DIR / "BACK.png") as source:
        background = cover(source, art, [0.5, 0.5])
    image.paste(background)
    pdf.drawImage(pdf_art(background), 0, pdf_y(art.h), width=WIDTH * SCALE, height=art.h * SCALE)
    draw.rectangle((0, 1075, WIDTH, HEIGHT), fill="#111923")
    pdf.setFillColor("#111923")
    pdf.rect(0, 0, WIDTH * SCALE, (HEIGHT - 1075) * SCALE, fill=1, stroke=0)
    draw.rectangle((75, 1150, 87, 1550), fill=CYAN)
    pdf.setFillColor(CYAN)
    pdf.rect(75 * SCALE, pdf_y(1550), 12 * SCALE, 400 * SCALE, fill=1, stroke=0)
    draw_label(draw, pdf, "HOLT", 125, 1260, 88, PAPER, bold=True)
    draw_label(draw, pdf, "LE S DE SOLIDARITÉ", 130, 1350, 47, "#e07889", bold=True)
    default_blurb = (
        "Le dernier jour de Franklyn à l'académie devait finir par une photo et une danse. "
        "Quand la fête tourne au cauchemar, les six cadets n'ont plus que leurs liens pour "
        "traverser la nuit. Sauver les autres aura un prix."
    )
    blurb = data.get("back", {}).get("blurb", default_blurb)
    draw_text(draw, pdf, Box(125, 1390, 1300, 260), blurb, "narration", 42)
    draw.rectangle((125, 1730, 1475, 1733), fill="#476173")
    pdf.setFillColor("#476173")
    pdf.rect(125 * SCALE, pdf_y(1733), 1350 * SCALE, 3 * SCALE, fill=1, stroke=0)
    draw_label(draw, pdf, "CRÉDITS", 125, 1810, 26, CYAN, bold=True)
    credits = [
        "Adaptation des chapitres 1 et 2 du jeu HOLT",
        "Scénario original : propriétaire du projet",
        "Adaptation et direction : Codex",
        "Illustrations : génération assistée par IA",
        "Édition privée — octobre 2026",
    ]
    for index, line in enumerate(credits):
        draw_label(draw, pdf, line, 125, 1878 + index * 77, 32, PAPER)
    image.save(pages_dir / "back.png", optimize=True)
    pdf.showPage()


def assemble(data: dict, make_cbz: bool) -> None:
    if not FONT_REGULAR.is_file() or not FONT_BOLD.is_file():
        raise FileNotFoundError("Arial regular and bold fonts are required in C:/Windows/Fonts")
    validate(data)
    pdfmetrics.registerFont(TTFont("Holt", str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont("HoltBold", str(FONT_BOLD)))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    pages_dir = OUTPUT / "pages"
    pages_dir.mkdir(exist_ok=True)
    pdf_path = OUTPUT / PDF_NAME
    pdf = canvas.Canvas(str(pdf_path), pagesize=(WIDTH * SCALE, HEIGHT * SCALE), pageCompression=1)
    pdf.setTitle(data.get("title", "HOLT — Le S de solidarité"))
    pdf.setAuthor("HOLT")
    render_cover(pdf, pages_dir)
    for number, page in enumerate(data["pages"], 1):
        image = Image.new("RGB", (WIDTH, HEIGHT), INK)
        draw = ImageDraw.Draw(image)
        pdf.setFillColor(INK)
        pdf.rect(0, 0, WIDTH * SCALE, HEIGHT * SCALE, fill=1, stroke=0)
        draw_label(draw, pdf, "HOLT  /  LE S DE SOLIDARITÉ", MARGIN, 63, 24, CYAN, bold=True)
        for panel, box in zip(page["panels"], layouts(page["layout"]), strict=True):
            with Image.open(PANEL_DIR / f"{panel['id']}.png") as source:
                crop = cover(source, box, panel.get("focal", [0.5, 0.5]))
            image.paste(crop, (box.x, box.y))
            pdf.drawImage(pdf_art(crop), box.x * SCALE, pdf_y(box.y + box.h), width=box.w * SCALE, height=box.h * SCALE)
            draw.rectangle((box.x, box.y, box.x + box.w - 1, box.y + box.h - 1), outline="#354658", width=3)
            pdf.setStrokeColor("#354658")
            pdf.setLineWidth(1.5)
            pdf.rect(box.x * SCALE, pdf_y(box.y + box.h), box.w * SCALE, box.h * SCALE, fill=0, stroke=1)
            for index, item in enumerate(panel.get("texts", [])):
                render_text(draw, pdf, box, item, index)
        draw_label(draw, pdf, f"{number:02d} / 12", WIDTH - 162, HEIGHT - 33, 26, PAPER)
        page_path = pages_dir / f"page-{number:02d}.png"
        image.save(page_path, optimize=True)
        pdf.showPage()
        print(f"Page {number:02d}: {page_path}")
    render_back(pdf, pages_dir, data)
    pdf.save()
    shutil.copyfile(HERE / "reader.html", OUTPUT / "reader.html")
    if make_cbz:
        cbz = OUTPUT / "holt-le-s-de-solidarite.cbz"
        with zipfile.ZipFile(cbz, "w", compression=zipfile.ZIP_STORED) as archive:
            archive.write(pages_dir / "cover.png", "000-cover.png")
            for page in sorted(pages_dir.glob("page-*.png")):
                archive.write(page, page.name)
            archive.write(pages_dir / "back.png", "zzz-back.png")
        print(f"CBZ: {cbz}")
    print(f"PDF: {pdf_path}")
    print(f"Reader: {OUTPUT / 'reader.html'}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--storyboard", type=Path, default=HERE / "storyboard.json")
    parser.add_argument("--cbz", action="store_true", help="also create a CBZ archive")
    parser.add_argument("--check", action="store_true", help="validate layout and lettering without creating a PDF")
    args = parser.parse_args()
    data = json.loads(args.storyboard.read_text(encoding="utf-8"))
    if args.check:
        validate(data, require_images=False)
        print("Storyboard layout and lettering fit: OK")
        return
    assemble(data, args.cbz)


if __name__ == "__main__":
    main()
