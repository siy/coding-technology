#!/bin/bash
# Build script for JBCT Book PDF generation (with cover)
# Usage: ./build-pdf.sh [output-name]

set -e

# Ensure PATH includes common tool locations
export PATH="/opt/homebrew/bin:/Library/TeX/texbin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_NAME="${1:-jbct-book}"
CONTENT_PDF="${OUTPUT_NAME}-content.pdf"
OUTPUT_FILE="${OUTPUT_NAME}.pdf"
COVER_IMAGE="cover.png"

echo "=== JBCT Book PDF Builder ==="
echo "Output: $OUTPUT_FILE"
echo ""

# Check dependencies
command -v pandoc >/dev/null 2>&1 || { echo "Error: pandoc not installed"; exit 1; }
command -v xelatex >/dev/null 2>&1 || { echo "Error: xelatex not installed"; exit 1; }

# Chapter order
CHAPTERS=(
    # Part I: Foundations
    "ch01-introduction.md"
    "ch02-four-return-types.md"
    "ch03-pragmatica-lite-essentials.md"

    # Part II: Core Principles
    "ch04-parse-dont-validate.md"
    "ch05-error-handling.md"
    "ch06-null-policy-recovery.md"

    # Part III: Patterns
    "ch07-basic-patterns.md"
    "ch08-advanced-patterns.md"
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

# Verify all chapters exist
echo "Checking chapter files..."
for chapter in "${CHAPTERS[@]}"; do
    if [[ ! -f "$chapter" ]]; then
        echo "Error: Missing chapter: $chapter"
        exit 1
    fi
done
echo "All ${#CHAPTERS[@]} chapters found."
echo ""

# Build content PDF
echo "Generating content PDF..."
pandoc \
    --pdf-engine=xelatex \
    --metadata-file=metadata.yaml \
    --standalone \
    --toc \
    --toc-depth=2 \
    --highlight-style=tango \
    --variable=colorlinks:true \
    --variable=linkcolor:black \
    --variable=urlcolor:blue \
    -o "$CONTENT_PDF" \
    "${CHAPTERS[@]}"

# Check if cover exists
if [[ ! -f "$COVER_IMAGE" ]]; then
    echo "Warning: $COVER_IMAGE not found. Using content-only PDF."
    mv "$CONTENT_PDF" "$OUTPUT_FILE"
else
    echo "Adding cover page..."

    # Create LaTeX file to combine cover and content
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

    # Replace placeholders with actual paths (Linux-compatible sed)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|COVER_IMAGE|$SCRIPT_DIR/$COVER_IMAGE|g" /tmp/combine-cover.tex
        sed -i '' "s|CONTENT_PDF|$SCRIPT_DIR/$CONTENT_PDF|g" /tmp/combine-cover.tex
    else
        sed -i "s|COVER_IMAGE|$SCRIPT_DIR/$COVER_IMAGE|g" /tmp/combine-cover.tex
        sed -i "s|CONTENT_PDF|$SCRIPT_DIR/$CONTENT_PDF|g" /tmp/combine-cover.tex
    fi

    # Compile with xelatex
    cd /tmp
    xelatex -interaction=batchmode combine-cover.tex >/dev/null 2>&1 || {
        echo "First pass..."
        xelatex -interaction=batchmode combine-cover.tex 2>&1 | tail -5
    }

    # Move result
    if [[ -f "combine-cover.pdf" ]]; then
        mv combine-cover.pdf "$SCRIPT_DIR/$OUTPUT_FILE"
        rm -f combine-cover.aux combine-cover.log combine-cover.tex
        cd "$SCRIPT_DIR"
        rm -f "$CONTENT_PDF"
    else
        echo "Error: Failed to add cover, using content-only PDF"
        cd "$SCRIPT_DIR"
        mv "$CONTENT_PDF" "$OUTPUT_FILE"
    fi
fi

echo ""
echo "=== Build Complete ==="
echo "Output: $SCRIPT_DIR/$OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""

# Open PDF (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open PDF? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$OUTPUT_FILE"
    fi
fi
