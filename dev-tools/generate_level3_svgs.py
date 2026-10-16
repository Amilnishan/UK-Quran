"""Generate the deployed Level 3 SVG sprites from level3-data.js.

The font and shaping libraries are generation-only dependencies. The website
receives only the generated SVG path files.

Usage:
    python dev-tools/generate_level3_svgs.py path/to/NotoNaskhArabic-Regular.ttf
    python dev-tools/generate_level3_svgs.py path/to/font.ttf \
        --output dev-tools/level3-svg-diagnostic-generated

Haa is preserved by default because its manually tuned sprite is the visual
regression baseline. Pass --regenerate-haa only when intentionally comparing
new Haa output.
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from xml.sax.saxutils import escape

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "Components" / "Learn-Arabic" / "level3-data.js"
OUTPUT = ROOT / "Components" / "Learn-Arabic" / "level3-svg"
BLUE = "#173c5d"
RED = "#e53935"
SCALE = 0.5
BASELINE = 500
MARGIN_X = 40
ABOVE_MARKS = {"064B", "064C", "064E", "064F", "0652"}
POSITION_IDS = ("initial", "medial", "final")


def read_lessons() -> list[tuple[str, str, list[str], list[int]]]:
    source = DATA.read_text(encoding="utf-8")
    entries = re.findall(r"\{\s*(.*?)\n\s*\}", source, flags=re.DOTALL)
    lessons = []
    for entry in entries:
        name = re.search(r"name:\s*'([^']+)'", entry)
        target = re.search(r"ar:\s*'([^']+)'", entry)
        forms = re.search(r"forms:\s*\[([^\]]+)\]", entry)
        if not name or not target or not forms:
            continue
        words = re.findall(r"'([^']*)'", forms.group(1))
        occurrence_match = re.search(r"highlightOccurrences:\s*\[([^\]]+)\]", entry)
        occurrences = (
            [int(value) for value in occurrence_match.group(1).split(",")]
            if occurrence_match
            else [0, 0, 0]
        )
        lessons.append((name.group(1), target.group(1), words, occurrences))
    if len(lessons) != 28:
        raise ValueError(f"Expected 28 lessons in {DATA}, found {len(lessons)}")
    return lessons


def mark_adjustment(glyph_name: str) -> int:
    components = {
        part[3:]
        for part in glyph_name.split("_")
        if part.startswith("uni06")
    }
    # Below-marks and combined mark ligatures retain HarfBuzz's anchor result.
    return 100 if components and components.issubset(ABOVE_MARKS) else 0


def make_symbol(
    font: TTFont,
    hb_font: hb.Font,
    text: str,
    target: str,
    occurrence: int,
    symbol_id: str,
    apply_manual_mark_adjustment: bool,
) -> str:
    buffer = hb.Buffer()
    buffer.add_codepoints([ord(character) for character in text])
    buffer.direction = "rtl"
    buffer.script = "arab"
    buffer.language = "ar"
    hb.shape(hb_font, buffer)

    infos = buffer.glyph_infos
    positions = buffer.glyph_positions
    target_indices = [i for i, character in enumerate(text) if character == target]
    if occurrence >= len(target_indices):
        raise ValueError(f"{symbol_id}: target occurrence is missing from {text!r}")
    target_cluster = target_indices[occurrence]

    glyph_set = font.getGlyphSet()
    glyph_order = font.getGlyphOrder()
    paths = []
    pen_x = 0
    for info, position in zip(infos, positions):
        glyph_name = glyph_order[info.codepoint]
        pen = SVGPathPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        path_data = pen.getCommands()
        # FontTools outlines use a positive-up y-axis. The enclosing SVG group
        # flips that axis, so HarfBuzz's positive y_offset must remain positive
        # here; negating it reverses GPOS mark placement.
        y = position.y_offset
        if apply_manual_mark_adjustment:
            y += mark_adjustment(glyph_name)
        if path_data:
            fill = RED if info.cluster == target_cluster else BLUE
            paths.append(
                f'      <path transform="translate({pen_x + position.x_offset:g} {y:g})" '
                f'fill="{fill}" d="{path_data}"/>'
            )
        pen_x += position.x_advance

    width = sum(position.x_advance for position in positions) * SCALE + MARGIN_X * 2
    return f"""  <symbol id="{symbol_id}" viewBox="0 0 {width:g} 700">
    <title>{escape(text)}</title>
    <desc>{escape(text)}. Static outlined glyph geometry generated offline.</desc>
    <g transform="translate({MARGIN_X} {BASELINE}) scale({SCALE} -{SCALE})">
{chr(10).join(paths)}
    </g>
  </symbol>"""


def generate(
    font_path: Path,
    output: Path,
    regenerate_haa: bool,
    apply_manual_mark_adjustment: bool,
) -> None:
    font_data = font_path.read_bytes()
    font = TTFont(str(font_path))
    face = hb.Face(font_data)
    hb_font = hb.Font(face)
    hb_font.scale = (face.upem, face.upem)

    generated = 0
    for name, target, words, occurrences in read_lessons():
        slug = name.lower()
        if slug == "haa" and not regenerate_haa:
            continue
        symbols = [
            make_symbol(
                font,
                hb_font,
                word,
                target,
                occurrence,
                symbol_id,
                apply_manual_mark_adjustment,
            )
            for symbol_id, word, occurrence in zip(
                POSITION_IDS, words, occurrences
            )
        ]
        output.mkdir(parents=True, exist_ok=True)
        (output / f"{slug}.svg").write_text(
            '<svg xmlns="http://www.w3.org/2000/svg">\n'
            + "\n".join(symbols)
            + "\n</svg>\n",
            encoding="utf-8",
        )
        generated += 1
    print(
        f"Generated {generated} sprite files in {output}; "
        f"Haa preserved: {not regenerate_haa}; "
        f"manual mark adjustment: {apply_manual_mark_adjustment}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("font", type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT,
        help="Output directory; defaults to the production SVG directory.",
    )
    parser.add_argument("--regenerate-haa", action="store_true")
    parser.add_argument(
        "--manual-mark-adjustment",
        action="store_true",
        help="Add the legacy Haa-derived +100 adjustment for comparison only.",
    )
    args = parser.parse_args()
    generate(
        args.font,
        args.output,
        args.regenerate_haa,
        args.manual_mark_adjustment,
    )


if __name__ == "__main__":
    main()
