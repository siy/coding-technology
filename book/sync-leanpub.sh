#!/bin/bash
# Sync manuscript files and trigger Leanpub preview/publish
# Usage: ./sync-leanpub.sh [preview|publish]
#
# Prerequisites:
# 1. Set LEANPUB_API_KEY environment variable
# 2. Set LEANPUB_BOOK_SLUG environment variable (e.g., "jbct")
#
# Get your API key from: https://leanpub.com/author_dashboard/settings

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ACTION="${1:-preview}"

# Check environment variables
if [[ -z "$LEANPUB_API_KEY" ]]; then
    echo "Error: LEANPUB_API_KEY not set"
    echo "Get your API key from: https://leanpub.com/author_dashboard/settings"
    exit 1
fi

if [[ -z "$LEANPUB_BOOK_SLUG" ]]; then
    echo "Error: LEANPUB_BOOK_SLUG not set"
    echo "Set to your book's URL slug (e.g., 'jbct' for leanpub.com/jbct)"
    exit 1
fi

# Sync manuscript files
echo "=== Syncing Manuscript Files ==="

# Copy chapter files
echo "Copying chapters..."
cp ch01-introduction.md ch02-four-return-types.md ch03-pragmatica-lite-essentials.md \
   ch04-parse-dont-validate.md ch05-error-handling.md ch06-null-policy-recovery.md \
   ch07-basic-patterns.md ch08-advanced-patterns.md ch09-thread-safety.md \
   ch10-testing-philosophy.md ch11-testing-practice.md \
   ch12-registeruser-example.md ch13-placeorder-example.md \
   ch14a-publisharticle-example.md ch14b-transferfunds-example.md ch15-project-structure.md \
   ch16-systematic-application.md ch17-migration-strategies.md ch18-comparison.md ch19-troubleshooting-faq.md \
   appendix-a-api-reference.md appendix-b-exercises.md appendix-c-glossary.md \
   manuscript/

# Copy cover image
if [[ -f "cover.png" ]]; then
    cp cover.png manuscript/images/title_page.png
    echo "Cover image updated"
fi

echo "Manuscript synced: $(ls manuscript/*.md | wc -l | tr -d ' ') chapters"
echo ""

# Leanpub API
LEANPUB_API="https://leanpub.com/${LEANPUB_BOOK_SLUG}"

case "$ACTION" in
    preview)
        echo "=== Triggering Preview Build ==="
        curl -s -X POST "${LEANPUB_API}/preview.json?api_key=${LEANPUB_API_KEY}" | jq .
        echo ""
        echo "Preview building. Check status at: https://leanpub.com/${LEANPUB_BOOK_SLUG}/preview"
        ;;
    publish)
        echo "=== Publishing Book ==="
        read -p "Are you sure you want to publish? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            curl -s -X POST "${LEANPUB_API}/publish.json?api_key=${LEANPUB_API_KEY}" | jq .
            echo ""
            echo "Publishing. Check status at: https://leanpub.com/${LEANPUB_BOOK_SLUG}"
        else
            echo "Aborted."
        fi
        ;;
    status)
        echo "=== Build Status ==="
        curl -s "${LEANPUB_API}/job_status.json?api_key=${LEANPUB_API_KEY}" | jq .
        ;;
    *)
        echo "Usage: $0 [preview|publish|status]"
        echo ""
        echo "Commands:"
        echo "  preview  - Build preview (default)"
        echo "  publish  - Publish new version"
        echo "  status   - Check build status"
        exit 1
        ;;
esac
