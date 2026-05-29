#!/bin/bash
# Build the Process-First Design PDF (cover + manuscript) with pandoc + pdflatex.
#
# Usage:
#   ./build-pdf.sh                 # draft: DRAFT watermark + "Draft — <date>", output *-DRAFT.pdf
#   ./build-pdf.sh --final         # final: no watermark, "<Month Year>", output process-first-design.pdf
#   ./build-pdf.sh my-name         # override the output basename
#
# Manuscript lives in ../book-pfd (this script lives in book-pfd-meta, alongside cover.svg).
set -e
export PATH="/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANUSCRIPT_DIR="$SCRIPT_DIR/../book-pfd"

# --- args ---
MODE="draft"
BASENAME="process-first-design"
for arg in "$@"; do
  case "$arg" in
    --final) MODE="final" ;;
    --draft) MODE="draft" ;;
    *)       BASENAME="$arg" ;;
  esac
done

command -v pandoc   >/dev/null 2>&1 || { echo "Error: pandoc not installed";   exit 1; }
command -v pdflatex >/dev/null 2>&1 || { echo "Error: pdflatex not installed"; exit 1; }

# --- reading order (matches book-pfd/root.md) ---
CHAPTERS=(
  introduction.md
  acknowledgments.md
  spiral-0-decisions.md
  foundations.md
  spiral-1-use-case.md
  spiral-2-workflow.md
  spiral-3-subsystem.md
  spiral-4-system.md
  architecture-synthesis.md
  brownfield.md
  closing.md
  references.md
)
for f in "${CHAPTERS[@]}"; do
  [[ -f "$MANUSCRIPT_DIR/$f" ]] || { echo "Error: missing chapter $f"; exit 1; }
done

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

# --- draft vs final ---
if [[ "$MODE" == "draft" ]]; then
  DATE="Draft — $(date '+%-d %B %Y')"
  SUFFIX="-DRAFT"
  WATERMARK='\AddToShipoutPictureFG{\AtPageCenter{\makebox(0,0){\rotatebox{55}{\textcolor[gray]{0.86}{\fontsize{2.2cm}{2.2cm}\selectfont DRAFT}}}}}'
else
  DATE="$(date '+%B %Y')"
  SUFFIX=""
  WATERMARK=""
fi
OUTPUT="$SCRIPT_DIR/${BASENAME}${SUFFIX}.pdf"

# --- LaTeX header: Unicode glyph mappings the default font lacks (+ watermark in draft) ---
cat > "$BUILD/header.tex" <<'HDR'
\DeclareUnicodeCharacter{2192}{\ensuremath{\rightarrow}}
\DeclareUnicodeCharacter{2194}{\ensuremath{\leftrightarrow}}
\DeclareUnicodeCharacter{2080}{\textsubscript{0}}
\DeclareUnicodeCharacter{2081}{\textsubscript{1}}
\usepackage{eso-pic}
\usepackage{graphicx}
\usepackage{xcolor}
HDR
[[ -n "$WATERMARK" ]] && printf '%s\n' "$WATERMARK" >> "$BUILD/header.tex"

# --- front-break: force the Introduction onto a fresh page after the Contents ---
printf '```{=latex}\n\\clearpage\n```\n' > "$BUILD/frontbreak.md"

# --- cover: render cover.svg -> PNG (fallback to a committed cover-preview.png) ---
COVER=""
if command -v rsvg-convert >/dev/null 2>&1 && [[ -f "$SCRIPT_DIR/cover.svg" ]]; then
  rsvg-convert -w 2100 -h 3000 "$SCRIPT_DIR/cover.svg" -o "$BUILD/cover.png" && COVER="$BUILD/cover.png"
elif [[ -f "$SCRIPT_DIR/cover-preview.png" ]]; then
  COVER="$SCRIPT_DIR/cover-preview.png"
fi

echo "Building $MODE PDF -> $OUTPUT"

# --- content PDF ---
INPUTS=("$BUILD/frontbreak.md")
for f in "${CHAPTERS[@]}"; do INPUTS+=("$MANUSCRIPT_DIR/$f"); done

pandoc --pdf-engine=pdflatex \
  -V fontsize=11pt -V geometry:margin=1in \
  -V colorlinks=true -V linkcolor=black -V urlcolor=blue \
  -M title="Process-First Design" \
  -M subtitle="Less art, more engineering" \
  -M author="Sergiy Yevtushenko" \
  -M date="$DATE" \
  --include-in-header="$BUILD/header.tex" \
  --standalone --toc --toc-depth=2 --highlight-style=tango \
  -o "$BUILD/content.pdf" \
  "${INPUTS[@]}"

# --- prepend the cover, if we have one ---
if [[ -n "$COVER" ]]; then
  cat > "$BUILD/combine.tex" <<EOF
\documentclass[letterpaper]{article}
\usepackage{graphicx}
\usepackage{pdfpages}
\usepackage[margin=0pt]{geometry}
\pagestyle{empty}
\begin{document}
\AddToShipoutPictureBG*{\includegraphics[width=\paperwidth,height=\paperheight]{$COVER}}
\null\newpage
\includepdf[pages=-]{$BUILD/content.pdf}
\end{document}
EOF
  ( cd "$BUILD" && pdflatex -interaction=batchmode combine.tex >/dev/null 2>&1; \
    pdflatex -interaction=batchmode combine.tex >/dev/null 2>&1 )
  if [[ -f "$BUILD/combine.pdf" ]]; then
    cp "$BUILD/combine.pdf" "$OUTPUT"
  else
    echo "  Warning: cover merge failed; using content-only PDF"
    cp "$BUILD/content.pdf" "$OUTPUT"
  fi
else
  echo "  Warning: no cover found; content-only PDF"
  cp "$BUILD/content.pdf" "$OUTPUT"
fi

PAGES=$(pdfinfo "$OUTPUT" 2>/dev/null | awk '/Pages/{print $2}')
echo "Done: $OUTPUT (${PAGES:-?} pages, $(du -h "$OUTPUT" | cut -f1))"
