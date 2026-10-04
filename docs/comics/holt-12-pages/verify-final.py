"""Check the finished book, selectable lettering and rendered review sheet."""

import json
import re
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / "art-masters/comics/holt-12-pages"
data = json.loads((HERE / "storyboard.json").read_text(encoding="utf-8"))
pdf = PdfReader(OUT / "holt-le-s-de-solidarite.pdf")
assert len(pdf.pages) == 14


def normalized(text):
    return re.sub(r"\s+", "", text)


for index, page in enumerate(pdf.pages):
    assert tuple(map(float, page.mediabox[2:])) == (800, 1200)
    text = normalized(page.extract_text())
    assert text, f"No selectable text on page {index + 1}"
    if 1 <= index <= 12:
        for panel in data["pages"][index - 1]["panels"]:
            for item in panel.get("texts", []):
                assert normalized(item["text"]) in text, (index, item["text"])
    for font in page["/Resources"]["/Font"].values():
        font = font.get_object()
        if "/FontDescriptor" in font:
            descriptor = font["/FontDescriptor"].get_object()
            assert any(key in descriptor for key in ["/FontFile", "/FontFile2", "/FontFile3"])

files = ["cover.png"] + [f"page-{i:02d}.png" for i in range(1, 13)] + ["back.png"]
for filename in files:
    with Image.open(OUT / "pages" / filename) as image:
        assert image.size == (1600, 2400)
with zipfile.ZipFile(OUT / "holt-le-s-de-solidarite.cbz") as archive:
    assert len(archive.namelist()) == 14
    assert archive.testzip() is None
assert (OUT / "reader.html").exists()

renders = sorted((OUT / "proofs").glob("final-[0-9][0-9].png"))
assert len(renders) == 14
sheet = Image.new("RGB", (5 * 320, 3 * 510), "#10141c")
draw = ImageDraw.Draw(sheet)
for index, filename in enumerate(renders):
    with Image.open(filename) as image:
        image.thumbnail((310, 470))
        x, y = (index % 5) * 320 + 5, (index // 5) * 510 + 25
        sheet.paste(image, (x, y))
        draw.text((x, y - 20), files[index], fill="white")
sheet.save(OUT / "proofs" / "final-overview.png")
print("PASS: 14 PDF pages; all dialogue selectable; embedded fonts; 14 PNGs and CBZ entries; 14 PDF renders.")
print(f"PDF: {(OUT / 'holt-le-s-de-solidarite.pdf').stat().st_size / 1_000_000:.1f} MB")
