# Leanpub Publishing Setup

## One-Time Setup

### 1. Create Leanpub Account
- Go to https://leanpub.com and create author account
- Set up payment info for royalties (Stripe/PayPal)

### 2. Create Book Project
- Go to https://leanpub.com/author_dashboard/new_book
- Choose "I want to write in my web browser and sync to GitHub/Dropbox" or "Upload"
- Book slug (URL): choose something like `jbct` → leanpub.com/jbct

### 3. Get API Key
- Go to https://leanpub.com/author_dashboard/settings
- Copy your API key

### 4. Configure Environment
Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export LEANPUB_API_KEY="your-api-key-here"
export LEANPUB_BOOK_SLUG="jbct"  # your book's URL slug
```

Then reload: `source ~/.zshrc`

### 5. Configure Book Settings on Leanpub
In book settings (https://leanpub.com/jbct/settings):

- **Title**: Java Backend Coding Technology
- **Subtitle**: Unified Code Through Functional Composition
- **Description**: (copy from README or create new)
- **Cover**: Upload `cover.png` (1600x2400 px recommended)
- **Pricing**: Set minimum/suggested price
- **Categories**: Programming, Java, Software Architecture

## Directory Structure

```
book/
├── manuscript/           # Leanpub content directory
│   ├── Book.txt         # Chapter order manifest
│   ├── Sample.txt       # Free sample chapters
│   ├── ch01-*.md        # Chapter files
│   ├── ...
│   └── images/
│       └── title_page.png
├── sync-leanpub.sh      # Sync and build script
└── LEANPUB_SETUP.md     # This file
```

## Usage

### Preview Build
```bash
./sync-leanpub.sh preview
```

### Publish New Version
```bash
./sync-leanpub.sh publish
```

### Check Build Status
```bash
./sync-leanpub.sh status
```

## Alternative: GitHub Integration

Instead of API uploads, you can connect Leanpub directly to GitHub:

1. In Leanpub book settings, choose "Writing Mode" → "GitHub"
2. Connect your GitHub account
3. Select repository and branch
4. Set manuscript path to `book/manuscript`
5. Leanpub will auto-build on push

## Troubleshooting

### API Key Not Working
- Verify key at https://leanpub.com/author_dashboard/settings
- Ensure no extra whitespace in environment variable

### Build Fails
- Check Leanpub's build log in dashboard
- Verify Book.txt lists existing files
- Ensure markdown is valid (no unclosed tags)

### Cover Not Appearing
- Must be named `title_page.png` in `manuscript/images/`
- Recommended size: 1600x2400 pixels
- Also upload via Leanpub web interface as backup
