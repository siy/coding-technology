#!/bin/bash
# publish-leanpub.sh — upload a locally-built PDF/EPUB to a Leanpub *upload-mode*
# book and (optionally) publish a new live version, via the Leanpub API.
#
# Both books ship as self-built PDF/EPUB uploaded to Leanpub ("upload" writing
# mode); Leanpub is the storefront, our pandoc/xelatex build makes the files.
# This replaces the abandoned native-sync flow (the old book/sync-leanpub.sh).
#
# Usage:
#   LEANPUB_API_KEY=... ./publish-leanpub.sh <slug> <pdf> [epub] [options]
#
# Options:
#   --sample     upload as the free sample edition (edition_type=sample)
#   --publish    after upload, release a new live version (separate confirm)
#   --dry-run    print what would happen; make no API calls
#
# Examples:
#   ./publish-leanpub.sh jbct-book book/jbct-book.pdf book/jbct-book.epub --publish
#   ./publish-leanpub.sh process-first-design book-pfd-meta/process-first-design.pdf --dry-run
#
# Requirements:
#   - A Leanpub *Pro* plan (the API requires Pro).
#   - The book created in "upload" writing mode (sync_mode: upload).
#   - $LEANPUB_API_KEY set (https://leanpub.com/author_dashboard/settings).
#     The key is read from the env var and never printed.
#
# Notes:
#   - Accepted formats: PDF and EPUB only (MOBI is not accepted via the API).
#   - Uploads are processed asynchronously; the script polls job_status.json.
#   - Whether an upload goes live immediately or needs --publish depends on the
#     book's settings; default here is upload-only. Verify the first time.

set -euo pipefail

API="https://leanpub.com"
EDITION="full"
DO_PUBLISH=0
DRY_RUN=0

die() { echo "Error: $*" >&2; exit 1; }

# --- parse args ---
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --sample)  EDITION="sample" ;;
    --publish) DO_PUBLISH=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -*)        die "unknown option: $arg" ;;
    *)         POSITIONAL+=("$arg") ;;
  esac
done
SLUG="${POSITIONAL[0]:-}"
PDF="${POSITIONAL[1]:-}"
EPUB="${POSITIONAL[2]:-}"

[[ -n "$SLUG" && -n "$PDF" ]] || die "usage: LEANPUB_API_KEY=... $0 <slug> <pdf> [epub] [--sample] [--publish] [--dry-run]"
[[ -n "${LEANPUB_API_KEY:-}" ]] || die "LEANPUB_API_KEY not set (Leanpub Pro API key)"
[[ -f "$PDF" ]] || die "PDF not found: $PDF"
[[ -z "$EPUB" || -f "$EPUB" ]] || die "EPUB not found: $EPUB"

echo "Book slug : $SLUG"
echo "Edition   : $EDITION"
echo "PDF       : $PDF ($(du -h "$PDF" | cut -f1))"
[[ -n "$EPUB" ]] && echo "EPUB      : $EPUB ($(du -h "$EPUB" | cut -f1))"
echo "Publish   : $([[ $DO_PUBLISH == 1 ]] && echo 'yes (separate confirm)' || echo 'no (upload only)')"
echo

jqcat() {
  # Leanpub occasionally returns a non-JSON body (e.g. "Unexpected Server Error")
  # even when the action took effect; buffer and pretty-print only if it parses,
  # so a non-JSON body never aborts the script under `set -o pipefail`.
  local in; in="$(cat)"
  if command -v jq >/dev/null 2>&1 && printf '%s' "$in" | jq . >/dev/null 2>&1; then
    printf '%s' "$in" | jq .
  else
    printf '%s\n' "$in"
  fi
}

poll_status() {
  # Leanpub processes uploads/publishes asynchronously; {} means done. Poll <= 1/5s.
  local i s
  for i in $(seq 1 60); do
    sleep 5
    s=$(curl -s "$API/$SLUG/job_status.json?api_key=$LEANPUB_API_KEY" || true)
    if [[ "$s" == "{}" || -z "$s" ]]; then echo "  done."; return 0; fi
    echo "  ...processing"
  done
  echo "  (still processing after 5 min; check the Leanpub dashboard)"
}

upload_file() {
  local f="$1"
  echo "Uploading $(basename "$f") (edition_type=$EDITION) ..."
  if [[ $DRY_RUN == 1 ]]; then
    echo "  [dry-run] POST $API/$SLUG/upload.json  -F file=@$f  -F edition_type=$EDITION"
    return 0
  fi
  curl -s -X POST "$API/$SLUG/upload.json?api_key=$LEANPUB_API_KEY" \
       -F "file=@$f" -F "edition_type=$EDITION" | jqcat
  poll_status
}

# Upload changes the live book project, so confirm first.
if [[ $DRY_RUN == 0 ]]; then
  read -r -p "Upload these files to leanpub.com/$SLUG? [y/N] " ans
  [[ "${ans:-}" =~ ^[Yy]$ ]] || die "aborted."
fi

upload_file "$PDF"
[[ -n "$EPUB" ]] && upload_file "$EPUB"

# Publishing is outward-facing (new live version, may email readers): separate confirm.
if [[ $DO_PUBLISH == 1 ]]; then
  if [[ $DRY_RUN == 1 ]]; then
    echo "[dry-run] would POST $API/$SLUG/publish.json"
  else
    read -r -p "PUBLISH a new live version of leanpub.com/$SLUG now? [y/N] " ans
    if [[ "${ans:-}" =~ ^[Yy]$ ]]; then
      curl -s -X POST "$API/$SLUG/publish.json?api_key=$LEANPUB_API_KEY" | jqcat
      poll_status
      echo "Published: https://leanpub.com/$SLUG"
    else
      echo "Skipped publish (files uploaded, not released)."
    fi
  fi
fi

echo "Done."
