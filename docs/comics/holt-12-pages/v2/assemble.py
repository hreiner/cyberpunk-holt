"""Assemble already lettered comic pages without cropping or adding text to the art."""

import argparse
import json
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUTPUT = ROOT / "art-masters/comics/holt-12-pages/v2"
FILES = ["cover.png"] + [f"page-{n:02d}.png" for n in range(1, 13)] + ["back.png"]
PDF_NAME = "holt-le-s-de-solidarite-v2.pdf"
CBZ_NAME = "holt-le-s-de-solidarite-v2.cbz"
TITLES = ["Couverture", "Choisir", "L'épreuve", "Encore un tour", "À terre", "La seule sortie",
          "Ceux qu'on laisse derrière", "Le prix", "Un absent", "Murano", "La nuit des décharges",
          "Le prix de Letitia", "La place vide", "Quatrième de couverture"]


def overview():
    renders = sorted((OUTPUT / "proofs").glob("pdf-[0-9][0-9].png"))
    assert len(renders) == 14
    sheet = Image.new("RGB", (1600, 1530), "#0b1120")
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(renders):
        with Image.open(path) as image:
            image.thumbnail((310, 470))
            x, y = index % 5 * 320 + 5, index // 5 * 510 + 25
            sheet.paste(image, (x, y))
            draw.text((x, y - 20), FILES[index], fill="white")
    sheet.save(OUTPUT / "proofs/overview.png")


def assemble():
    dimensions = {}
    for filename in FILES:
        path = OUTPUT / "pages" / filename
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            width, height = image.size
            assert width >= 1000 and abs(width / height - 2 / 3) < 0.005, (filename, image.size)
            dimensions[filename] = [width, height]

    pdf = canvas.Canvas(str(OUTPUT / PDF_NAME), pagesize=(800, 1200), pageCompression=1)
    pdf.setTitle("HOLT — Le S de solidarité — Seconde édition")
    pdf.setAuthor("HOLT — adaptation Codex")
    pdf.setSubject("Douze pages de récit, couverture et quatrième. Illustration et lettrage intégrés.")
    for index, filename in enumerate(FILES):
        pdf.bookmarkPage(f"page-{index + 1}")
        pdf.addOutlineEntry(TITLES[index], f"page-{index + 1}")
        with Image.open(OUTPUT / "pages" / filename) as image:
            pdf.drawImage(ImageReader(image.convert("RGB")), 0, 0, width=800, height=1200)
        pdf.showPage()
    pdf.save()
    with zipfile.ZipFile(OUTPUT / CBZ_NAME, "w", compression=zipfile.ZIP_STORED) as archive:
        for index, filename in enumerate(FILES):
            archive.write(OUTPUT / "pages" / filename, f"{index:02d}-{filename}")

    template = (HERE.parent / "reader.html").read_text(encoding="utf-8")
    template = template.replace("holt-le-s-de-solidarite.pdf", PDF_NAME)
    template = template.replace("Une histoire de HOLT · 12 pages de récit", "Seconde édition · 12 pages de récit · 60 cases")
    template = template.replace('width="1600" height="2400"', 'width="1024" height="1536"')
    start = template.index("    const titles = ")
    end = template.index(";", start)
    template = template[:start] + "    const titles = " + json.dumps(TITLES, ensure_ascii=False) + template[end:]
    template = template.replace('<a href="' + PDF_NAME + '" download>Ouvrir le PDF ↗</a>',
                                '<a href="' + PDF_NAME + '" download>PDF ↗</a><a href="' + CBZ_NAME + '" download>CBZ ↗</a>')
    template = template.replace('<p class="hint">', '<p class="hint"><a id="fullpage" href="pages/cover.png" target="_blank" rel="noopener">Agrandir la page ↗</a> · ')
    template = template.replace('image.src = `pages/${files[current - 1]}`;',
                                'image.src = `pages/${files[current - 1]}`;\n      document.getElementById("fullpage").href = image.src;')
    (OUTPUT / "reader.html").write_text(template, encoding="utf-8")

    reader = PdfReader(OUTPUT / PDF_NAME)
    assert len(reader.pages) == 14
    assert len(reader.outline) == 14
    for page, filename in zip(reader.pages, FILES, strict=True):
        assert tuple(map(float, page.mediabox[2:])) == (800, 1200)
        assert len(page.images) == 1
        with Image.open(OUTPUT / "pages" / filename) as original:
            assert page.images[0].image.convert("RGB").tobytes() == original.convert("RGB").tobytes(), filename
    with zipfile.ZipFile(OUTPUT / CBZ_NAME) as archive:
        assert len(archive.namelist()) == 14 and archive.testzip() is None
    (OUTPUT / "manifest.json").write_text(json.dumps({"edition": 2, "story_pages": 12, "panels": 60,
        "pdf": PDF_NAME, "cbz": CBZ_NAME, "pages": dimensions, "lettering": "generated in image"},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"PASS: 14 complete image pages, 14 PDF bookmarks, 14 CBZ entries; no crop or lettering overlay.")
    print(f"PDF {(OUTPUT / PDF_NAME).stat().st_size / 1_000_000:.1f} MB: {OUTPUT / PDF_NAME}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--overview", action="store_true")
    args = parser.parse_args()
    overview() if args.overview else assemble()
