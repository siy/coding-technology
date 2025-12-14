#!/bin/bash
# Build script for JBCT Book PDF with cover page
# Usage: ./build-pdf-with-cover.sh [output-name]

set -e

# Ensure PATH includes common tool locations
export PATH="/opt/homebrew/bin:/Library/TeX/texbin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_NAME="${1:-jbct-book-complete}"
CONTENT_PDF="jbct-book.pdf"
OUTPUT_FILE="${OUTPUT_NAME}.pdf"
COVER_IMAGE="cover.png"

echo "=== JBCT Book PDF Builder (with Cover) ==="
echo "Output: $OUTPUT_FILE"
echo ""

# Build content PDF first
./build-pdf.sh << EOF
n
EOF

# Check cover exists
if [[ ! -f "$COVER_IMAGE" ]]; then
    echo "Warning: $COVER_IMAGE not found. Using content-only PDF."
    cp "$CONTENT_PDF" "$OUTPUT_FILE"
    exit 0
fi

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

# Replace placeholders with actual paths
sed -i '' "s|COVER_IMAGE|$SCRIPT_DIR/$COVER_IMAGE|g" /tmp/combine-cover.tex
sed -i '' "s|CONTENT_PDF|$SCRIPT_DIR/$CONTENT_PDF|g" /tmp/combine-cover.tex

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

    echo ""
    echo "=== Build Complete ==="
    echo "Output: $SCRIPT_DIR/$OUTPUT_FILE"
    echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
else
    echo "Error: Failed to create PDF with cover"
    cd "$SCRIPT_DIR"
    cp "$CONTENT_PDF" "$OUTPUT_FILE"
fi

echo ""

# Open PDF (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open PDF? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$OUTPUT_FILE"
    fi
fi
