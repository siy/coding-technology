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

# --- Version + change history (single source of truth: CHANGELOG.md) ---
CHANGELOG="CHANGELOG.md"
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$CHANGELOG" 2>/dev/null || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_DATE="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[[^]]+\][[:space:]]*-[[:space:]]*//')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"
TITLE_DATE="Version ${BOOK_VERSION}${BOOK_DATE:+ ($BOOK_DATE)}"
REVISION_MD="/tmp/jbct-revision-history.md"
{ echo "# Revision History"; echo; awk '/^## \[/{p=1} p' "$CHANGELOG"; } > "$REVISION_MD" 2>/dev/null || true

echo "=== JBCT Book EPUB Builder ==="
echo ""

# Check dependencies
command -v pandoc >/dev/null 2>&1 || { echo "Error: pandoc not installed"; exit 1; }

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
        --metadata=date:"$TITLE_DATE" \
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
build_epub "$OUTPUT_FILE" "metadata-epub.yaml" "${CHAPTERS[@]}" "$REVISION_MD"
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
