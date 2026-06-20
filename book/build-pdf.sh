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

# Chapter order
CHAPTERS=(
    # Part I: Foundations
    "ch01-introduction.md"
    "ch02-design-methodology.md"
    "ch02-four-return-types.md"
    "ch03-pragmatica-lite-essentials.md"

    # Part II: Core Principles
    "ch04-parse-dont-validate.md"
    "ch05-error-handling.md"
    "ch06-null-policy-recovery.md"

    # Part III: Patterns
    "ch07-basic-patterns.md"
    "ch08-advanced-patterns.md"
    "ch08b-knowledge-gathering-pipelines.md"
    "ch09-thread-safety.md"

    # Part IV: Testing
    "ch10-testing-philosophy.md"
    "ch11-testing-practice.md"

    # Part V: Production Systems
    "ch12-registeruser-example.md"
    "ch13-placeorder-example.md"
    "ch14a-publisharticle-example.md"
    "ch14b-transferfunds-example.md"
    "ch15-project-structure.md"

    # Part VI: Adoption
    "ch16-systematic-application.md"
    "ch17-migration-strategies.md"
    "ch18-comparison.md"
    "ch19-troubleshooting-faq.md"

    # Appendices
    "appendix-a-api-reference.md"
    "appendix-b-exercises.md"
    "appendix-c-glossary.md"
)

# Sample chapters — the "convince me" arc
SAMPLE_CHAPTERS=(
    "ch01-introduction.md"
    "ch02-four-return-types.md"
    "ch04-parse-dont-validate.md"
    "ch07-basic-patterns.md"
    "ch12-registeruser-example.md"
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

    cat > /tmp/combine-cover.tex << 'LATEX'
\documentclass[letterpaper]{article}
\usepackage{graphicx}
\usepackage{pdfpages}
\usepackage[margin=0pt]{geometry}
\usepackage{eso-pic}
\pagestyle{empty}
\begin{document}
% Cover page - full page image with no margins
\AddToShipoutPictureBG*{\includegraphics[width=\paperwidth,height=\paperheight]{COVER_IMAGE}}
\null\newpage
% Include all pages from content PDF
\includepdf[pages=-]{CONTENT_PDF}
\end{document}
LATEX

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|COVER_IMAGE|$SCRIPT_DIR/$COVER_IMAGE|g" /tmp/combine-cover.tex
        sed -i '' "s|CONTENT_PDF|$SCRIPT_DIR/$content_pdf|g" /tmp/combine-cover.tex
    else
        sed -i "s|COVER_IMAGE|$SCRIPT_DIR/$COVER_IMAGE|g" /tmp/combine-cover.tex
        sed -i "s|CONTENT_PDF|$SCRIPT_DIR/$content_pdf|g" /tmp/combine-cover.tex
    fi

    cd /tmp
    xelatex -interaction=batchmode combine-cover.tex >/dev/null 2>&1 || {
        echo "  First pass..."
        xelatex -interaction=batchmode combine-cover.tex 2>&1 | tail -5
    }

    if [[ -f "combine-cover.pdf" ]]; then
        mv combine-cover.pdf "$SCRIPT_DIR/$output_file"
        rm -f combine-cover.aux combine-cover.log combine-cover.tex
        cd "$SCRIPT_DIR"
        rm -f "$content_pdf"
    else
        echo "  Error: Failed to add cover, using content-only PDF"
        cd "$SCRIPT_DIR"
        mv "$content_pdf" "$output_file"
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
