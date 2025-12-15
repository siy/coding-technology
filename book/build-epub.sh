#!/bin/bash
# Build script for JBCT Book EPUB generation
# Usage: ./build-epub.sh [output-name]

set -e

# Ensure PATH includes common tool locations
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_NAME="${1:-jbct-book}"
OUTPUT_FILE="${OUTPUT_NAME}.epub"

echo "=== JBCT Book EPUB Builder ==="
echo "Output: $OUTPUT_FILE"
echo ""

# Check dependencies
command -v pandoc >/dev/null 2>&1 || { echo "Error: pandoc not installed"; exit 1; }

# Chapter order (same as PDF)
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
    "appendix-d-quick-reference.md"
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

# Build EPUB
echo "Generating EPUB..."
pandoc \
    --metadata-file=metadata-epub.yaml \
    --standalone \
    --toc \
    --toc-depth=2 \
    --highlight-style=tango \
    -o "$OUTPUT_FILE" \
    "${CHAPTERS[@]}"

echo ""
echo "=== Build Complete ==="
echo "Output: $SCRIPT_DIR/$OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""

# Open EPUB (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open EPUB? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$OUTPUT_FILE"
    fi
fi
