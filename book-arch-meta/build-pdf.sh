#!/bin/bash
# Build the Architecture Synthesis PDFs (cover + manuscript) with pandoc + xelatex.
# Produces the full book and a sample excerpt in one run. Adapted from the PFD
# pattern (book-pfd-meta/build-pdf.sh); no despine step — this book has no spine
# markup / condensed edition.
#
# Usage:
#   ./build-pdf.sh                 # draft: DRAFT watermark, *-DRAFT.pdf and *-sample-DRAFT.pdf
#   ./build-pdf.sh --final         # final: no watermark, architecture-synthesis.pdf and -sample.pdf
#   ./build-pdf.sh my-name         # override the output basename
#
# Manuscript lives in ../book-arch (this script lives in book-arch-meta, alongside cover.svg).
set -e
export PATH="/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MANUSCRIPT_DIR="$SCRIPT_DIR/../book-arch"

# --- args ---
MODE="draft"
BASENAME="architecture-synthesis"
for arg in "$@"; do
  case "$arg" in
    --final) MODE="final" ;;
    --draft) MODE="draft" ;;
    *)       BASENAME="$arg" ;;
  esac
done

command -v pandoc  >/dev/null 2>&1 || { echo "Error: pandoc not installed";  exit 1; }
command -v xelatex >/dev/null 2>&1 || { echo "Error: xelatex not installed"; exit 1; }

# --- reading order (matches book-arch/root.md) ---
CHAPTERS=(
  series-note.md
  acknowledgments.md
  two-teams.md
  answer-sheet.md
  axes-and-ledger.md
  derivation.md
  verification.md
  three-profiles.md
  derived-blind.md
  when-derivation-says-no.md
  derivative.md
  pathfinding.md
  brownfield.md
  judgment.md
  closing.md
  appendix-worksheet.md
  appendix-reference-cards.md
  references.md
)
for f in "${CHAPTERS[@]}"; do
  [[ -f "$MANUSCRIPT_DIR/$f" ]] || { echo "Error: missing chapter $f"; exit 1; }
done

# --- sample excerpt (the "convince me" arc): the problem, the questions, the
#     instruments, the method — the reader watches it run, then sees the toolkit ---
SAMPLE_CHAPTERS=(
  two-teams.md
  answer-sheet.md
  axes-and-ledger.md
  derivation.md
)

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT

# --- version + change history (single source: book-arch/CHANGELOG.md) ---
ARCH_CHANGELOG="$MANUSCRIPT_DIR/CHANGELOG.md"

# Chapter numbering. The manuscript's prose cites chapters by number ("Chapter 8's
# subject"), so the rendered book has to print those numbers or the references resolve
# to nothing. Numbering runs over the twelve chapters only: two-teams is 1 and judgment
# is 12, matching the prose. Front matter, the closing, the appendices and the
# references are not chapters and are marked unnumbered as the file is staged, so they
# consume no number. Staging keeps the source markdown untouched — the web edition
# renders the same files and has its own numbering.
UNNUMBERED=(series-note.md acknowledgments.md closing.md
            appendix-worksheet.md appendix-reference-cards.md references.md)

stage_chapter() {
  local f="$1" src="$MANUSCRIPT_DIR/$1" out="$BUILD/stage/$1"
  mkdir -p "$BUILD/stage"
  local unnumbered=0 u
  for u in "${UNNUMBERED[@]}"; do [[ "$u" == "$f" ]] && unnumbered=1; done
  if (( unnumbered )); then
    # Mark only the first top-level heading; subsections stay as they are.
    awk 'BEGIN{done=0} /^# /&&!done{print $0 " {-}"; done=1; next} {print}' "$src" > "$out"
  else
    cp "$src" "$out"
  fi
  printf '%s' "$out"
}
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$ARCH_CHANGELOG" 2>/dev/null || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"
REVISION_MD="$BUILD/revision-history.md"
{ echo "# Revision History"; echo; awk '/^## \[/{p=1} p' "$ARCH_CHANGELOG"; } > "$REVISION_MD" 2>/dev/null || true

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

# --- LaTeX header (watermark in draft; chapter breaks; keep code/tables whole) ---
cat > "$BUILD/header.tex" <<'HDR'
\usepackage{eso-pic}
\usepackage{graphicx}
\usepackage{xcolor}
\usepackage{etoolbox}
\usepackage{listings}
\usepackage{titlesec}
% Code blocks render through listings (pandoc --listings) so long lines wrap at
% the text measure. columns=fullflexible + keepspaces keep aligned tables and
% ASCII diagrams intact; literate maps em/en-dashes and arrows in code blocks.
\definecolor{arckw}{RGB}{0,0,160}
\definecolor{arccmt}{RGB}{110,110,110}
\definecolor{arcstr}{RGB}{150,70,0}
\lstset{%
  basicstyle=\small\ttfamily,
  keywordstyle=\color{arckw}\bfseries,
  commentstyle=\color{arccmt}\itshape,
  stringstyle=\color{arcstr},
  breaklines=true,breakatwhitespace=false,
  columns=fullflexible,keepspaces=true,showstringspaces=false,
  literate={—}{{-}}1 {–}{{-}}1 {→}{{$\rightarrow$}}1}
% Headings: a clear size ladder - section (chapter) > subsection > subsubsection > inline bold.
\titleformat{\section}[display]{\huge\bfseries}{\normalsize\mdseries\color{arccmt}Chapter \thesection}{0.35em}{}
\titlespacing*{\section}{0pt}{0pt}{1.2em}
\titleformat{\subsection}{\Large\bfseries}{}{0pt}{}
\titlespacing*{\subsection}{0pt}{1.6ex plus .2ex}{0.8em}
\titleformat{\subsubsection}{\large\bfseries}{}{0pt}{}
\titlespacing*{\subsubsection}{0pt}{1.3ex plus .2ex}{0.6em}
% Discourage orphan/widow lines.
\clubpenalty=10000
\widowpenalty=10000
\displaywidowpenalty=10000
% Start each chapter (top-level heading) on a fresh page.
\let\arcoldsection\section
\renewcommand{\section}{\clearpage\arcoldsection}
% Keep each code block whole on one page.
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
    -M title="Architecture Synthesis" \
    -M subtitle="The Next Correct Step" \
    -M author="Sergiy Yevtushenko" \
    -M date="$DATE" \
    --include-in-header="$BUILD/header.tex" \
    --standalone --toc --toc-depth=2 --number-sections --syntax-highlighting=idiomatic \
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
    # pdfunite preserves the content PDF's hyperlink annotations.
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

# --- full book ---
FULL_INPUTS=()
for f in "${CHAPTERS[@]}"; do FULL_INPUTS+=("$(stage_chapter "$f")"); done
[[ -f "$REVISION_MD" ]] && FULL_INPUTS+=("$REVISION_MD")
OUTPUT="$SCRIPT_DIR/${BASENAME}${SUFFIX}.pdf"
echo "Building $MODE full PDF -> $OUTPUT"
build_book "$OUTPUT" "${FULL_INPUTS[@]}"

# --- sample excerpt ---
SAMPLE_INPUTS=()
for f in "${SAMPLE_CHAPTERS[@]}"; do SAMPLE_INPUTS+=("$(stage_chapter "$f")"); done
SAMPLE_OUTPUT="$SCRIPT_DIR/${BASENAME}-sample${SUFFIX}.pdf"
echo "Building $MODE sample PDF -> $SAMPLE_OUTPUT"
build_book "$SAMPLE_OUTPUT" "${SAMPLE_INPUTS[@]}"
