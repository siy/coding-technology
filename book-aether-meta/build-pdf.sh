#!/bin/bash
# Build the Aether book PDF (cover + manuscript) with pandoc + xelatex.
#
# Usage:
#   ./build-pdf.sh                 # draft: DRAFT watermark + "Draft — <date>", output *-DRAFT.pdf
#   ./build-pdf.sh --final         # final: no watermark, "<Month Year>", output aether-book.pdf
#   ./build-pdf.sh my-name         # override the output basename
#
# Manuscript lives in ../book-aether (this script lives in book-aether-meta, alongside cover.svg when one exists).
# Mirrors book-pfd-meta/build-pdf.sh. TITLE/SUBTITLE are provisional — see BOOK-PLAN.md §7 (open items).
set -e
export PATH="/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANUSCRIPT_DIR="$SCRIPT_DIR/../book-aether"

# --- args ---
MODE="draft"
BASENAME="aether-book"
for arg in "$@"; do
  case "$arg" in
    --final) MODE="final" ;;
    --draft) MODE="draft" ;;
    *)       BASENAME="$arg" ;;
  esac
done

command -v pandoc  >/dev/null 2>&1 || { echo "Error: pandoc not installed";  exit 1; }
command -v xelatex >/dev/null 2>&1 || { echo "Error: xelatex not installed"; exit 1; }

# --- reading order (matches book-aether/root.md) ---
CHAPTERS=(
  introduction.md
  part0-onramp.md
  part1-no-magic.md
  part2-aether-model.md
  part3-playbook.md
  part4-testing.md
  part5-operate.md
  part6-thinking.md
  references.md
)
for f in "${CHAPTERS[@]}"; do
  [[ -f "$MANUSCRIPT_DIR/$f" ]] || { echo "Error: missing chapter $f"; exit 1; }
done

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

# --- version + change history (single source: book-aether/CHANGELOG.md) ---
AETHER_CHANGELOG="$MANUSCRIPT_DIR/CHANGELOG.md"
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$AETHER_CHANGELOG" 2>/dev/null || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"
REVISION_MD="$BUILD/revision-history.md"
{ echo "# Revision History"; echo; awk '/^## \[/{p=1} p' "$AETHER_CHANGELOG"; } > "$REVISION_MD" 2>/dev/null || true

# --- draft vs final ---
if [[ "$MODE" == "draft" ]]; then
  DATE="Version $BOOK_VERSION (Draft) — $(date '+%-d %B %Y')"
  SUFFIX="-DRAFT"
  WATERMARK='\AddToShipoutPictureBG{\AtPageCenter{\makebox(0,0){\rotatebox{55}{\textcolor[gray]{0.90}{\fontsize{2.2cm}{2.2cm}\selectfont DRAFT}}}}}'
else
  DATE="Version $BOOK_VERSION — $(date '+%B %Y')"
  SUFFIX=""
  WATERMARK=""
fi
OUTPUT="$SCRIPT_DIR/${BASENAME}${SUFFIX}.pdf"

# --- LaTeX header (watermark in draft; chapter breaks; keep code blocks whole) ---
cat > "$BUILD/header.tex" <<'HDR'
\usepackage{eso-pic}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{etoolbox}
\usepackage{listings}
\usepackage{titlesec}
\usepackage{tikz}
\usetikzlibrary{automata,positioning,arrows.meta}
% All code blocks render through listings (pandoc --listings) so long Java lines
% wrap at the text measure instead of overflowing the page.
\definecolor{aekw}{RGB}{0,0,160}
\definecolor{aecmt}{RGB}{110,110,110}
\definecolor{aestr}{RGB}{150,70,0}
\lstset{%
  basicstyle=\small\ttfamily,
  keywordstyle=\color{aekw}\bfseries,
  commentstyle=\color{aecmt}\itshape,
  stringstyle=\color{aestr},
  breaklines=true,breakatwhitespace=false,
  columns=fullflexible,keepspaces=true,showstringspaces=false,
  literate={—}{{-}}1 {–}{{-}}1 {→}{{$\rightarrow$}}1}
% Headings: make subsection/subsubsection visibly larger than inline bold text.
\titleformat{\subsection}{\Large\bfseries}{}{0pt}{}
\titlespacing*{\subsection}{0pt}{1.6ex plus .2ex}{0.8em}
\titleformat{\subsubsection}{\large\bfseries}{}{0pt}{}
\titlespacing*{\subsubsection}{0pt}{1.3ex plus .2ex}{0.6em}
% Discourage orphan/widow lines.
\clubpenalty=10000
\widowpenalty=10000
\displaywidowpenalty=10000
% Start each chapter (top-level heading) on a fresh page.
\let\aeoldsection\section
\renewcommand{\section}{\clearpage\aeoldsection}
% Keep each code block whole on one page (no split across a page break).
\BeforeBeginEnvironment{lstlisting}{\par\noindent\begin{minipage}{\linewidth}}
\AfterEndEnvironment{lstlisting}{\end{minipage}\par}
HDR
[[ -n "$WATERMARK" ]] && printf '%s\n' "$WATERMARK" >> "$BUILD/header.tex"

# --- cover: render cover.svg -> PNG (fallback to committed cover-preview.png; else content-only) ---
COVER=""
if command -v rsvg-convert >/dev/null 2>&1 && [[ -f "$SCRIPT_DIR/cover.svg" ]]; then
  rsvg-convert -w 2100 -h 3000 "$SCRIPT_DIR/cover.svg" -o "$BUILD/cover.png" && COVER="$BUILD/cover.png"
elif [[ -f "$SCRIPT_DIR/cover-preview.png" ]]; then
  COVER="$SCRIPT_DIR/cover-preview.png"
fi

echo "Building $MODE PDF -> $OUTPUT"

# --- content PDF ---
INPUTS=()
for f in "${CHAPTERS[@]}"; do INPUTS+=("$MANUSCRIPT_DIR/$f"); done
[[ -f "$REVISION_MD" ]] && INPUTS+=("$REVISION_MD")

pandoc --pdf-engine=xelatex \
  -V fontsize=10pt -V geometry:margin=1in -V geometry:bindingoffset=0.5in \
  -V mainfont="DejaVu Serif" -V sansfont="DejaVu Sans" -V monofont="DejaVu Sans Mono" \
  -V linestretch=1.15 -V code-block-font-size='\small' \
  -V colorlinks=true -V linkcolor=black -V urlcolor=blue \
  -M title="Building Applications with Aether" \
  -M subtitle="Less art, more engineering" \
  -M author="Sergiy Yevtushenko" \
  -M date="$DATE" \
  --include-in-header="$BUILD/header.tex" \
  --standalone --toc --toc-depth=2 --syntax-highlighting=idiomatic \
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
  ( cd "$BUILD" && xelatex -interaction=batchmode combine.tex >/dev/null 2>&1; \
    xelatex -interaction=batchmode combine.tex >/dev/null 2>&1 )
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
