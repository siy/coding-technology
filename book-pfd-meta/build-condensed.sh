#!/usr/bin/env bash
# Build the derived "condensed edition" of Process-First Design: the bold spine of
# every chapter, harvested in reading order into a short companion PDF
# ("The Argument in Twenty Minutes"). Derived from the same manuscript via
# extract-spine.py, so it cannot drift from the book; if it reads incoherently,
# the bold selection in the manuscript is wrong.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANUSCRIPT_DIR="$SCRIPT_DIR/../book-pfd"

# Prose chapters in reading order (back matter — acknowledgments, glossary,
# references — carries no spine and is skipped).
CHAPTERS=(
  introduction
  spiral-0-decisions
  foundations
  spiral-1-use-case
  spiral-2-workflow
  spiral-3-subsystem
  spiral-4-system
  architecture-synthesis
  edge-cases
  brownfield
  closing
)

# Version single-sourced from the manuscript CHANGELOG.
VER_LINE="$(grep -m1 -E '^## \[[0-9]' "$MANUSCRIPT_DIR/CHANGELOG.md" || true)"
BOOK_VERSION="$(printf '%s' "$VER_LINE" | sed -E 's/^## \[([^]]+)\].*/\1/')"
BOOK_VERSION="${BOOK_VERSION:-0.0.0}"

BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT
MD="$BUILD/condensed.md"
: > "$MD"

total=0
for f in "${CHAPTERS[@]}"; do
  title="$(grep -m1 '^# ' "$MANUSCRIPT_DIR/$f.md" | sed 's/^# //')"
  printf '# %s\n\n' "$title" >> "$MD"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    printf '%s\n\n' "$line" >> "$MD"
    total=$((total+1))
  done < <(python3 "$SCRIPT_DIR/extract-spine.py" "$MANUSCRIPT_DIR/$f.md")
done

OUT="$SCRIPT_DIR/process-first-design-condensed.pdf"
# --from markdown-raw_html keeps type names like Promise<T> literal instead of
# letting pandoc swallow <T> as an HTML tag.
pandoc --pdf-engine=xelatex \
  --from=markdown-raw_html \
  -V fontsize=11pt -V geometry:margin=1in \
  -V mainfont="DejaVu Serif" -V sansfont="DejaVu Sans" -V monofont="DejaVu Sans Mono" \
  -V linestretch=1.2 \
  -V colorlinks=true -V linkcolor=black -V urlcolor=blue \
  -M title="Process-First Design" \
  -M subtitle="The Argument in Twenty Minutes (condensed edition)" \
  -M author="Sergiy Yevtushenko" \
  -M date="Version $BOOK_VERSION — $(date '+%B %Y')" \
  --standalone --toc --toc-depth=1 \
  -o "$OUT" "$MD"

pages=$(pdfinfo "$OUT" 2>/dev/null | awk '/Pages/{print $2}')
echo "Done: $OUT (${pages:-?} pages, $(du -h "$OUT" | cut -f1)); $total spine sentences."
