# Leanpub Publishing (upload mode)

Both books ship as **self-built PDF/EPUB uploaded to Leanpub** ("upload" writing mode).
Leanpub is the storefront; the files are produced by our own pandoc/xelatex build, not by
Leanpub's generator. (An earlier native-sync attempt lived in `book/sync-leanpub.sh`; it was
abandoned and removed. Do not resurrect it — Leanpub's generator cannot reproduce the custom
typography, code listings, fonts, or draft watermark.)

## One-time setup

1. **Leanpub account + Pro plan.** The upload API requires a Pro membership. Add payout info
   (Stripe/PayPal) for royalties.
2. **Create each book in upload mode.** https://leanpub.com/author_dashboard/new_book → choose
   **Upload** (or `POST /books.json` with `sync_mode: "upload"`). Note each slug
   (e.g. `jbct-book`, `process-first-design`).
3. **API key.** https://leanpub.com/author_dashboard/settings → copy it.
4. **Environment.** In `~/.zshrc` (never commit the key):
   ```bash
   export LEANPUB_API_KEY="..."
   ```
5. **Book settings on Leanpub** (title, subtitle, description, cover, price, categories) — set
   once in the dashboard.

## Publishing a new version

Build the book, then upload with the shared script (repo root `publish-leanpub.sh`):

```bash
# JBCT
./book/build-pdf.sh
./publish-leanpub.sh jbct-book book/jbct-book.pdf book/jbct-book.epub --publish

# PFD (use the final build so the watermark is gone)
./book-pfd-meta/build-pdf.sh --final
./publish-leanpub.sh process-first-design book-pfd-meta/process-first-design.pdf --publish
```

Script behaviour:
- Uploads PDF (and EPUB, if given) via `POST /{slug}/upload.json` with `edition_type=full`.
- `--sample` uploads the free sample edition instead.
- `--publish` releases a new live version after upload (separate confirm; may email readers).
- Polls `job_status.json` (uploads are processed asynchronously).
- `--dry-run` prints actions without calling the API.
- Reads `$LEANPUB_API_KEY`; never prints it.

## Notes / limitations (upload mode)

- Accepted upload formats: **PDF and EPUB** (MOBI is not accepted via the API).
- Leanpub does not generate other formats from your file — you ship exactly what you build.
- No Leanpub-generated sample; upload your own with `--sample`.
- Self-made EPUBs are sold as downloads but are not readable in the Leanpub reading app.
- Whether an upload goes live immediately or needs `--publish` depends on book settings; the
  script defaults to upload-only. Verify against the dashboard the first time.

## Troubleshooting

- *"Uploads are only available for upload-mode books"* → the book is not `sync_mode: upload`.
- `401`/`403` → API key wrong, or the account is not Pro.
- Build/processing errors → check the Leanpub dashboard build log.
