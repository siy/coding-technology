# Pragmatica Website

Static website generator for pragmatica.dev, built from markdown documentation files.

## Directory Structure

```
website/
├── build.js              # Main build script (converts markdown to HTML)
├── package.json          # Node.js dependencies
├── .gitignore           # Git ignore rules
├── templates/           # HTML templates
│   └── page.html        # Main page template
├── styles/              # CSS stylesheets
│   └── style.css        # Main stylesheet
├── dist/                # Generated site (git-ignored)
│   ├── index.html
│   ├── *.html
│   ├── book/
│   └── style.css
├── DEPLOYMENT.md        # Deployment instructions
└── README.md           # This file
```

## Quick Start

### Install Dependencies

```bash
npm install
```

### Build Website

```bash
npm run build
```

This will:
1. Clean the `dist/` directory
2. Convert all markdown files to HTML
3. Copy CSS stylesheets
4. Generate sitemap.xml

### Preview Locally

```bash
npm run dev
```

Open http://localhost:8000 in your browser.

### Clean Build Directory

```bash
npm run clean
```

## How It Works

### Build Process

The `build.js` script:

1. **Reads markdown files** from project root and `book/` directory
2. **Converts markdown to HTML** using markdown-it
3. **Applies HTML template** (`templates/page.html`) to each page
4. **Adjusts navigation links** for book pages (adds `../` prefix)
5. **Copies stylesheets** to `dist/`
6. **Generates sitemap.xml** for SEO

### Template Variables

The HTML template uses these placeholders:

- `{{TITLE}}` - Page title (extracted from first `#` heading or filename)
- `{{CONTENT}}` - Converted HTML content from markdown
- `{{NAV_CONTEXT}}` - Navigation prefix (`''` for root pages, `'../'` for book pages)

### Markdown Processing

- All `.md` links are converted to `.html` links
- `README.md` → `index.html`
- `book/index.md` → `book/index.html`
- GitHub-flavored markdown is supported
- Automatic heading anchors for table of contents

## Files Converted

### Root Pages

- `README.md` → `index.html`
- `MANAGEMENT_PERSPECTIVE.md` → `MANAGEMENT_PERSPECTIVE.html`
- `CHANGELOG.md` → `CHANGELOG.html`
- `TECHNOLOGY.md` → `TECHNOLOGY.html`
- `PL_IMPROVEMENTS.md` → `PL_IMPROVEMENTS.html`
- `jbct-coder.md` → `jbct-coder.html`

### Book Pages

- `book/index.md` → `book/index.html`
- `book/ch*.md` → `book/ch*.html`

## Development

### Adding New Pages

To add a new page:

1. Create markdown file in project root or `book/` directory
2. Add filename to `MARKDOWN_FILES` or `BOOK_FILES` array in `build.js`
3. Run `npm run build` to generate HTML

### Updating Styles

Edit `styles/style.css` and run `npm run build`.

### Updating Template

Edit `templates/page.html` and run `npm run build`.

## Deployment

The website is automatically deployed to Netlify via GitHub Actions when changes are pushed to the `main` branch.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

### Deployment Flow

1. Push changes to `main` branch
2. GitHub Actions triggers (`.github/workflows/deploy.yml`)
3. Build script runs (`npm run build`)
4. Generated site is deployed to Netlify
5. Changes appear at https://pragmatica.dev within 2-3 minutes

## Technologies

- **Node.js** - Build script runtime
- **markdown-it** - Markdown to HTML conversion
- **markdown-it-anchor** - Automatic heading anchors
- **front-matter** - Optional YAML front matter support
- **Netlify** - Static site hosting
- **GitHub Actions** - CI/CD pipeline
- **Cloudflare** - DNS and CDN

## License

MIT License - See [../LICENSE](../LICENSE) for details.

---

**Part of**: Java Backend Coding Technology
**Repository**: https://github.com/siy/coding-technology
**Website**: https://pragmatica.dev
