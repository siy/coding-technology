#!/bin/bash
# Build script for JBCT Book EPUB generation
# Builds full book + sample excerpt
# Usage: ./build-epub.sh [output-name]

set -e

# Ensure PATH includes common tool locations
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

OUTPUT_NAME="${1:-jbct-book}"

echo "=== JBCT Book EPUB Builder ==="
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

build_epub() {
    local output="$1"
    local metadata="$2"
    shift 2
    local chapters=("$@")

    local cover_opts=""
    if [[ -f "cover.png" ]]; then
        cover_opts="--epub-cover-image=cover.png"
    fi

    pandoc \
        --metadata-file="$metadata" \
        --standalone \
        --toc \
        --toc-depth=2 \
        --highlight-style=tango \
        $cover_opts \
        -o "$output" \
        "${chapters[@]}"
}

# --- Build ---

echo "Checking files..."
verify_chapters "Full book" "${CHAPTERS[@]}"
verify_chapters "Sample" "${SAMPLE_CHAPTERS[@]}"
echo ""

if [[ -f "cover.png" ]]; then
    echo "Cover image found: cover.png"
    echo ""
fi

echo "Building full book..."
OUTPUT_FILE="${OUTPUT_NAME}.epub"
build_epub "$OUTPUT_FILE" "metadata-epub.yaml" "${CHAPTERS[@]}"
echo "  Full book: $SCRIPT_DIR/$OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"

echo ""
echo "Building sample..."
SAMPLE_FILE="${OUTPUT_NAME}-sample.epub"
build_epub "$SAMPLE_FILE" "metadata-epub.yaml" "${SAMPLE_CHAPTERS[@]}"
echo "  Sample: $SCRIPT_DIR/$SAMPLE_FILE ($(du -h "$SAMPLE_FILE" | cut -f1))"

echo ""
echo "=== Build Complete ==="

# Open EPUB (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Open full EPUB? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$OUTPUT_FILE"
    fi
fi
