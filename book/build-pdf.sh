#!/bin/bash
# Build script for JBCT Book PDF generation (with cover)
# Builds full book + sample excerpt
# Usage: ./build-pdf.sh [output-name]

set -e

# Ensure PATH includes common tool locations
export PATH="/opt/homebrew/bin:/Library/TeX/texbin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_NAME="${1:-jbct-book}"
COVER_IMAGE="cover.png"

# --- Version + change history (single source of truth: CHANGELOG.md) ---
CHANGELOG="CHANGELOG.md"
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$CHANGELOG" 2>/dev/null || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_DATE="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[[^]]+\][[:space:]]*-[[:space:]]*//')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"
TITLE_DATE="Version ${BOOK_VERSION}${BOOK_DATE:+ ($BOOK_DATE)}"
# Render the changelog as a "Revision History" appendix (title swapped, preamble dropped).
REVISION_MD="/tmp/jbct-revision-history.md"
{ echo "# Revision History"; echo; awk '/^## \[/{p=1} p' "$CHANGELOG"; } > "$REVISION_MD" 2>/dev/null || true

# Check dependencies
command -v pandoc >/dev/null 2>&1 || { echo "Error: pandoc not installed"; exit 1; }
command -v xelatex >/dev/null 2>&1 || { echo "Error: xelatex not installed"; exit 1; }
fc-list 2>/dev/null | grep -qi "noto emoji" || echo "Warning: font 'Noto Emoji' not found — emoji in comparison tables will render blank. Install: brew install --cask font-noto-emoji"

# --- Spine: chapter order + numbering (single source: root.md) ---
# Chapter files carry no numbers; "Chapter N: " is injected here, into temp copies,
# from spine position. Appendices/back matter pass through unchanged. Insert or move
# a chapter by editing root.md only.
SPINE="root.md"
[[ -f "$SPINE" ]] || { echo "Error: spine $SPINE not found"; exit 1; }
NUM_DIR="$(mktemp -d)"
trap 'rm -rf "$NUM_DIR"' EXIT
CHAPTERS=()
CH_NUM=0
while IFS= read -r file; do
    [[ -f "$file" ]] || { echo "Error: spine entry missing: $file"; exit 1; }
    if [[ "$file" == appendix-* ]]; then
        cp "$file" "$NUM_DIR/$file"
    else
        CH_NUM=$((CH_NUM+1))
        sed "1s|^# |# Chapter ${CH_NUM}: |" "$file" > "$NUM_DIR/$file"
    fi
    CHAPTERS+=("$NUM_DIR/$file")
done < <(sed -nE 's/^- \[[^]]*\]\(([a-z0-9-]+\.md)\).*$/\1/p' "$SPINE")

# Sample chapters — the "convince me" arc (numbered copies from the spine pass)
SAMPLE_CHAPTERS=(
    "$NUM_DIR/introduction.md"
    "$NUM_DIR/four-return-types.md"
    "$NUM_DIR/parse-dont-validate.md"
    "$NUM_DIR/basic-patterns.md"
    "$NUM_DIR/registeruser-example.md"
)

# --- Shared functions ---

verify_chapters() {
    local label="$1"
    shift
    local chapters=("$@")
    for chapter in "${chapters[@]}"; do
        if [[ ! -f "$chapter" ]]; then
            echo "Error: Missing chapter: $chapter"
            exit 1
        fi
    done
    echo "  $label: ${#chapters[@]} chapters found."
}

build_content_pdf() {
    local output="$1"
    shift
    local chapters=("$@")
    pandoc \
        --pdf-engine=xelatex \
        --metadata-file=metadata.yaml \
        --metadata=date:"$TITLE_DATE" \
        --standalone \
        --toc \
        --toc-depth=2 \
        --highlight-style=tango \
        --variable=colorlinks:true \
        --variable=linkcolor:black \
        --variable=urlcolor:blue \
        -o "$output" \
        "${chapters[@]}"
}

add_cover() {
    local content_pdf="$1"
    local output_file="$2"

    if [[ ! -f "$COVER_IMAGE" ]]; then
        echo "  Warning: $COVER_IMAGE not found. Using content-only PDF."
        mv "$content_pdf" "$output_file"
        return
    fi

    echo "  Adding cover page..."

    # Cover -> standalone single full-bleed page, sized to match the content PDF
    # exactly (pdfunite concatenates pages as-is, with no scaling).
    local cpsize cw ch
    cpsize=$(pdfinfo "$content_pdf" 2>/dev/null | awk '/Page size/{print $3, $5}')
    cw=$(printf '%s' "$cpsize" | cut -d' ' -f1); ch=$(printf '%s' "$cpsize" | cut -d' ' -f2)
    cw=${cw:-612}; ch=${ch:-792}

    cat > /tmp/cover-page.tex << LATEX
\documentclass{article}
\usepackage{graphicx}
\usepackage[margin=0pt,paperwidth=${cw}bp,paperheight=${ch}bp]{geometry}
\usepackage{eso-pic}
\pagestyle{empty}
\begin{document}
\AddToShipoutPictureBG*{\includegraphics[width=\paperwidth,height=\paperheight]{$SCRIPT_DIR/$COVER_IMAGE}}
\null
\end{document}
LATEX

    ( cd /tmp && xelatex -interaction=batchmode cover-page.tex >/dev/null 2>&1 ) || true

    # pdfunite PRESERVES the content PDF's hyperlink annotations; \includepdf (pdfpages)
    # strips them, which is what left the blue URLs un-clickable.
    if [[ -f /tmp/cover-page.pdf ]] && command -v pdfunite >/dev/null 2>&1 \
         && pdfunite /tmp/cover-page.pdf "$content_pdf" "$SCRIPT_DIR/$output_file" 2>/dev/null; then
        rm -f /tmp/cover-page.aux /tmp/cover-page.log /tmp/cover-page.tex /tmp/cover-page.pdf
        rm -f "$content_pdf"
    else
        echo "  Error: Failed to add cover, using content-only PDF (links preserved)"
        mv "$content_pdf" "$SCRIPT_DIR/$output_file"
    fi
}

# --- Build full book ---

echo "=== JBCT Book PDF Builder ==="
echo ""
echo "Checking files..."
verify_chapters "Full book" "${CHAPTERS[@]}"
verify_chapters "Sample" "${SAMPLE_CHAPTERS[@]}"
echo ""

echo "Building full book..."
CONTENT_PDF="${OUTPUT_NAME}-content.pdf"
OUTPUT_FILE="${OUTPUT_NAME}.pdf"
build_content_pdf "$CONTENT_PDF" "${CHAPTERS[@]}" "$REVISION_MD"
add_cover "$CONTENT_PDF" "$OUTPUT_FILE"

echo ""
echo "  Full book: $SCRIPT_DIR/$OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"

# --- Build sample ---

echo ""
echo "Building sample..."
SAMPLE_CONTENT_PDF="${OUTPUT_NAME}-sample-content.pdf"
SAMPLE_OUTPUT_FILE="${OUTPUT_NAME}-sample.pdf"
build_content_pdf "$SAMPLE_CONTENT_PDF" "${SAMPLE_CHAPTERS[@]}"
add_cover "$SAMPLE_CONTENT_PDF" "$SAMPLE_OUTPUT_FILE"

echo ""
echo "  Sample: $SCRIPT_DIR/$SAMPLE_OUTPUT_FILE ($(du -h "$SAMPLE_OUTPUT_FILE" | cut -f1))"

echo ""
echo "=== Build Complete ==="

# Open PDF (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open full PDF? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$OUTPUT_FILE"
    fi
fi
