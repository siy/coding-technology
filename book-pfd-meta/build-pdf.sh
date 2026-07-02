#!/bin/bash
# Build the Process-First Design PDFs (cover + manuscript) with pandoc + xelatex.
# Produces the full book and a sample excerpt (the "convince me" arc) in one run.
#
# Usage:
#   ./build-pdf.sh                 # draft: DRAFT watermark, *-DRAFT.pdf and *-sample-DRAFT.pdf
#   ./build-pdf.sh --final         # final: no watermark, process-first-design.pdf and -sample.pdf
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

command -v pandoc  >/dev/null 2>&1 || { echo "Error: pandoc not installed";  exit 1; }
command -v xelatex >/dev/null 2>&1 || { echo "Error: xelatex not installed"; exit 1; }

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
  edge-cases.md
  brownfield.md
  closing.md
  glossary.md
  references.md
)
for f in "${CHAPTERS[@]}"; do
  [[ -f "$MANUSCRIPT_DIR/$f" ]] || { echo "Error: missing chapter $f"; exit 1; }
done

# --- sample excerpt (the "convince me" arc): thesis, the decisions it answers,
#     the full vocabulary, and the method on one use case ---
SAMPLE_CHAPTERS=(
  introduction.md
  spiral-0-decisions.md
  foundations.md
  spiral-1-use-case.md
)

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

# --- version + change history (single source: book-pfd/CHANGELOG.md) ---
PFD_CHANGELOG="$MANUSCRIPT_DIR/CHANGELOG.md"
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$PFD_CHANGELOG" 2>/dev/null || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"
REVISION_MD="$BUILD/revision-history.md"
{ echo "# Revision History"; echo; awk '/^## \[/{p=1} p' "$PFD_CHANGELOG"; } > "$REVISION_MD" 2>/dev/null || true

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
% wrap at the text measure instead of overflowing the page. TeXLive-basic ships
% listings; fvextra (which would let pandoc's tango Highlighting wrap) is absent
% and uninstallable here (2025 local vs 2026 remote), so listings is the path.
% columns=fullflexible + keepspaces keep the aligned interface tables and ASCII
% diagrams intact (DejaVu Mono is fixed-width); literate maps the two code-comment
% em-dashes to hyphens.
\definecolor{pfdkw}{RGB}{0,0,160}
\definecolor{pfdcmt}{RGB}{110,110,110}
\definecolor{pfdstr}{RGB}{150,70,0}
\lstset{%
  basicstyle=\small\ttfamily,
  keywordstyle=\color{pfdkw}\bfseries,
  commentstyle=\color{pfdcmt}\itshape,
  stringstyle=\color{pfdstr},
  breaklines=true,breakatwhitespace=false,
  columns=fullflexible,keepspaces=true,showstringspaces=false,
  literate={—}{{-}}1 {–}{{-}}1 {→}{{$\rightarrow$}}1}
% Headings: a clear size ladder - section (chapter) > subsection > subsubsection > inline bold.
% (Without an explicit \section format, the article default \Large collides with \subsection below.)
\titleformat{\section}{\huge\bfseries}{}{0pt}{}
\titlespacing*{\section}{0pt}{0pt}{1.2em}
\titleformat{\subsection}{\Large\bfseries}{}{0pt}{}
\titlespacing*{\subsection}{0pt}{1.6ex plus .2ex}{0.8em}
\titleformat{\subsubsection}{\large\bfseries}{}{0pt}{}
\titlespacing*{\subsubsection}{0pt}{1.3ex plus .2ex}{0.6em}
% Discourage orphan/widow lines (a lone line stranded at a page top or bottom).
\clubpenalty=10000
\widowpenalty=10000
\displaywidowpenalty=10000
% Start each chapter (top-level heading) on a fresh page; this also breaks before
% the table of contents (article's \tableofcontents uses \section*), giving a clean
% title-page / contents / first-chapter split.
\let\pfdoldsection\section
\renewcommand{\section}{\clearpage\pfdoldsection}
% Keep each code block whole on one page (no split across a page break).
\BeforeBeginEnvironment{lstlisting}{\par\noindent\begin{minipage}{\linewidth}}
\AfterEndEnvironment{lstlisting}{\end{minipage}\par}
HDR
[[ -n "$WATERMARK" ]] && printf '%s\n' "$WATERMARK" >> "$BUILD/header.tex"

# --- cover: render cover.svg -> PNG (fallback to a committed cover-preview.png) ---
COVER=""
if command -v rsvg-convert >/dev/null 2>&1 && [[ -f "$SCRIPT_DIR/cover.svg" ]]; then
  rsvg-convert -w 2100 -h 3000 "$SCRIPT_DIR/cover.svg" -o "$BUILD/cover.png" && COVER="$BUILD/cover.png"
elif [[ -f "$SCRIPT_DIR/cover-preview.png" ]]; then
  COVER="$SCRIPT_DIR/cover-preview.png"
fi

# --- build one book (content PDF + cover) -> output path ---
build_book() {
  local out="$1"; shift
  local inputs=("$@")
  pandoc --pdf-engine=xelatex \
    -V fontsize=10pt -V geometry:margin=1in -V geometry:bindingoffset=0.5in \
    -V mainfont="DejaVu Serif" -V sansfont="DejaVu Sans" -V monofont="DejaVu Sans Mono" \
    -V linestretch=1.15 -V code-block-font-size='\small' \
    -V colorlinks=true -V linkcolor=black -V urlcolor=blue \
    -M title="Process-First Design" \
    -M subtitle="Less art, more engineering" \
    -M author="Sergiy Yevtushenko" \
    -M date="$DATE" \
    --include-in-header="$BUILD/header.tex" \
    --standalone --toc --toc-depth=2 --syntax-highlighting=idiomatic \
    -o "$BUILD/content.pdf" \
    "${inputs[@]}"

  if [[ -n "$COVER" ]]; then
    # Cover -> standalone single full-bleed page, sized to match the content PDF
    # exactly (pdfunite concatenates pages as-is, with no scaling).
    local cpsize cw ch
    cpsize=$(pdfinfo "$BUILD/content.pdf" 2>/dev/null | awk '/Page size/{print $3, $5}')
    cw=$(printf '%s' "$cpsize" | cut -d' ' -f1); ch=$(printf '%s' "$cpsize" | cut -d' ' -f2)
    cw=${cw:-612}; ch=${ch:-792}
    cat > "$BUILD/cover.tex" <<EOF
\documentclass{article}
\usepackage{graphicx}
\usepackage[margin=0pt,paperwidth=${cw}bp,paperheight=${ch}bp]{geometry}
\pagestyle{empty}
\begin{document}
\AddToShipoutPictureBG*{\includegraphics[width=\paperwidth,height=\paperheight]{$COVER}}
\null
\end{document}
EOF
    ( cd "$BUILD" && xelatex -interaction=batchmode cover.tex >/dev/null 2>&1 ) || true
    # pdfunite PRESERVES the content PDF's hyperlink annotations; \includepdf (pdfpages)
    # strips them, which is what left the blue URLs un-clickable.
    if [[ -f "$BUILD/cover.pdf" ]] && command -v pdfunite >/dev/null 2>&1 \
         && pdfunite "$BUILD/cover.pdf" "$BUILD/content.pdf" "$out" 2>/dev/null; then
      :
    else
      echo "  Warning: cover merge failed; using content-only PDF (links preserved)"
      cp "$BUILD/content.pdf" "$out"
    fi
  else
    echo "  Warning: no cover found; content-only PDF"
    cp "$BUILD/content.pdf" "$out"
  fi
  local pages; pages=$(pdfinfo "$out" 2>/dev/null | awk '/Pages/{print $2}')
  echo "Done: $out (${pages:-?} pages, $(du -h "$out" | cut -f1))"
}

# --- de-spine: the spine (bold sentences) is internal markup that drives the
# condensed edition (extract-spine.py); the full book renders it as plain prose
# so the deep read stays clean. Strip spine bold from build-time copies, leaving
# list labels intact. Source files are never touched. ---
DESPINE_DIR="$BUILD/despined"
mkdir -p "$DESPINE_DIR"
for f in "${CHAPTERS[@]}"; do
  python3 "$SCRIPT_DIR/despine.py" "$MANUSCRIPT_DIR/$f" > "$DESPINE_DIR/$f"
done

# --- full book ---
FULL_INPUTS=()
for f in "${CHAPTERS[@]}"; do FULL_INPUTS+=("$DESPINE_DIR/$f"); done
[[ -f "$REVISION_MD" ]] && FULL_INPUTS+=("$REVISION_MD")
OUTPUT="$SCRIPT_DIR/${BASENAME}${SUFFIX}.pdf"
echo "Building $MODE full PDF -> $OUTPUT"
build_book "$OUTPUT" "${FULL_INPUTS[@]}"

# --- sample excerpt ---
SAMPLE_INPUTS=()
for f in "${SAMPLE_CHAPTERS[@]}"; do SAMPLE_INPUTS+=("$DESPINE_DIR/$f"); done
SAMPLE_OUTPUT="$SCRIPT_DIR/${BASENAME}-sample${SUFFIX}.pdf"
echo "Building $MODE sample PDF -> $SAMPLE_OUTPUT"
build_book "$SAMPLE_OUTPUT" "${SAMPLE_INPUTS[@]}"
