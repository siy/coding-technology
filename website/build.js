#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

// Initialize markdown parser with GitHub-flavored markdown
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false
}).use(markdownItAnchor, {
  permalink: markdownItAnchor.permalink.headerLink()
});

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const STYLES_DIR = path.join(__dirname, 'styles');
const SITE_URL = 'https://pragmatica.dev';

// Content hash for the stylesheet URL: the CDN caches /*.css as immutable
// for a year (netlify.toml), so every CSS change must change the URL.
const STYLE_HASH = crypto.createHash('md5')
                         .update(fs.readFileSync(path.join(STYLES_DIR, 'style.css')))
                         .digest('hex')
                         .slice(0, 10);

// Pages to build: repo-relative source -> dist-relative output
const PAGES = [
  { src: 'website/content/index.md', out: 'index.html' },
  { src: 'website/content/books.md', out: 'books.html' },
  { src: 'MANAGEMENT_PERSPECTIVE.md', out: 'MANAGEMENT_PERSPECTIVE.html' },
  { src: 'CHANGELOG.md', out: 'CHANGELOG.html' },
  { src: 'PL_IMPROVEMENTS.md', out: 'PL_IMPROVEMENTS.html' },
  { src: 'AI-TOOLING.md', out: 'AI-TOOLING.html' },
  { src: 'CLI-TOOLING.md', out: 'CLI-TOOLING.html' },
  { src: 'MAVEN-PLUGIN.md', out: 'MAVEN-PLUGIN.html' },
  { src: 'jbct-coder.md', out: 'jbct-coder.html' },
  { src: 'jbct-reviewer.md', out: 'jbct-reviewer.html' },
  { src: 'CONTACT.md', out: 'CONTACT.html' }
];

// Nav highlight key per output page (book subpages handled separately)
const NAV_KEYS = {
  'index.html': 'home',
  'books.html': 'books',
  'AI-TOOLING.html': 'tools',
  'MANAGEMENT_PERSPECTIVE.html': 'management',
  'CONTACT.html': 'services'
};

// Per-page meta description, keyed by dist-relative output path.
// Book chapters not listed here get a generated fallback from their title.
const DESCRIPTIONS = {
  'index.html': 'Java Backend Coding Technology: executable business process specifications — code that reads like a business process, because it is one. Free book, tooling, and adoption guidance.',
  'books.html': 'Two books, one discipline: Process-First Design (the design methodology, free condensed edition) and Java Backend Coding Technology (the Java realization, free web edition).',
  'MANAGEMENT_PERSPECTIVE.html': 'The business case for structural standardization: onboarding speed, maintenance cost, and AI-assisted development ROI for engineering leaders.',
  'CHANGELOG.html': 'Changelog for the JBCT repository and shared assets: tooling, AI skills, and build scripts.',
  'PL_IMPROVEMENTS.html': 'Language-level improvements that would make functional Java backends simpler — observations from applying JBCT in practice.',
  'AI-TOOLING.html': 'Claude Code skills, subagents, and review commands for JBCT — the toolchain for AI-assisted Java backend development.',
  'CLI-TOOLING.html': 'The jbct CLI: lint and scaffold JBCT-style Java backend code from the command line.',
  'MAVEN-PLUGIN.html': 'The JBCT Maven plugin: build-time enforcement of JBCT structural rules.',
  'jbct-coder.html': 'The jbct-coder subagent: JBCT-compliant Java code generation with Claude Code.',
  'jbct-reviewer.html': 'The jbct-reviewer subagent: JBCT compliance review for Java backend code.',
  'CONTACT.html': 'Work with Pragmatica Labs: JBCT assessment, team training, architecture review, and adoption sprints.',
  'book/index.html': 'Java Backend Coding Technology — the complete book, free web edition. Design methodology, patterns, testing, and worked examples.',
  'book/CHANGELOG.html': 'Version history of the Java Backend Coding Technology book.'
};

// Book chapters
const BOOK_CHAPTERS = [
  'ch01-introduction.md',
  'ch02-design-methodology.md',
  'ch02-four-return-types.md',
  'ch03-pragmatica-lite-essentials.md',
  'ch04-parse-dont-validate.md',
  'ch05-error-handling.md',
  'ch06-null-policy-recovery.md',
  'ch07-basic-patterns.md',
  'ch08-advanced-patterns.md',
  'ch08b-knowledge-gathering-pipelines.md',
  'ch09-thread-safety.md',
  'ch10-testing-philosophy.md',
  'ch11-testing-practice.md',
  'ch12-registeruser-example.md',
  'ch13-placeorder-example.md',
  'ch14a-publisharticle-example.md',
  'ch14b-transferfunds-example.md',
  'ch15-project-structure.md',
  'ch16-systematic-application.md',
  'ch17-migration-strategies.md',
  'ch18-comparison.md',
  'ch19-troubleshooting-faq.md',
  'appendix-a-api-reference.md',
  'appendix-b-exercises.md',
  'appendix-c-glossary.md',
  'CHANGELOG.md'
];

// Helper functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readTemplate(name) {
  const templatePath = path.join(TEMPLATES_DIR, `${name}.html`);
  return fs.readFileSync(templatePath, 'utf-8');
}

function getTitle(content, filename) {
  // Try to extract title from first # heading
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1];
  }

  // Fallback to filename
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// For HTML attribute values (title/description in meta tags)
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

// Robustly strip a leading `---` front-matter block and pull out top-level
// scalar keys. Tolerant of values that contain colons (e.g. dates, URLs),
// which a strict YAML parser rejects and would otherwise leak into the page.
function stripFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    return { body: raw, attributes: {} };
  }
  const attributes = {};
  m[1].split(/\r?\n/).forEach(line => {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      attributes[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  return { body: raw.slice(m[0].length), attributes };
}

// Build the prev / Contents / next bar for a book chapter.
// {{POS}} is replaced with top/bottom so CSS can place the divider.
function buildChapterNav(prev, next) {
  const prevLink = prev
    ? `<a class="nav-prev" href="${prev.htmlName}">&larr; ${escapeHtml(prev.title)}</a>`
    : `<span class="nav-prev"></span>`;
  const nextLink = next
    ? `<a class="nav-next" href="${next.htmlName}">${escapeHtml(next.title)} &rarr;</a>`
    : `<span class="nav-next"></span>`;
  const contents = `<a class="nav-contents" href="index.html">Contents</a>`;
  return `<nav class="chapter-nav {{POS}}">${prevLink}${contents}${nextLink}</nav>\n`;
}

// Shown once, after the bottom nav of the final reading-sequence page.
// Injected at build time so the book sources stay clean for PDF/EPUB builds.
const WHATS_NEXT_HTML = `
<aside class="whats-next">
  <h2>You've finished the web edition — what's next?</h2>
  <ul>
    <li><a href="https://leanpub.com/jbct-book" target="_blank" rel="noopener">Take it with you</a> — the book as PDF/EPUB on Leanpub.</li>
    <li><a href="https://leanpub.com/process-first-design" target="_blank" rel="noopener">Read the methodology upstream</a> — Process-First Design; the condensed edition is free.</li>
    <li><a href="{{NAV_CONTEXT}}CONTACT.html">Bring it to your team</a> — assessment, training, and adoption sprints.</li>
  </ul>
</aside>
`;

function convertMarkdownToHtml(markdownContent, filename, isSubPage = false, navKey = '', chapterNav = '', pageMeta = {}, afterContent = '') {
  // Strip front matter (tolerant of colon-bearing values)
  const { body, attributes: metadata } = stripFrontMatter(markdownContent);
  let content = body;

  // Re-target relative .md links: resolve against the source file's real
  // directory, then re-relativize to the output page's directory. Sources that
  // live elsewhere than their output (symlinked pages like AI-TOOLING.md ->
  // ai-tools/README.md) keep working links both on GitHub and on the site.
  if (pageMeta.srcDir !== undefined && pageMeta.outDir !== undefined) {
    content = content.replace(/\]\(([^)#:\s]+\.md)((?:#[^)]*)?)\)/g, (match, target, anchor) => {
      if (target.startsWith('/')) {
        return match;
      }
      const resolved = path.posix.normalize(path.posix.join(pageMeta.srcDir, target));
      const relinked = path.posix.relative(pageMeta.outDir, resolved) || resolved;
      return `](${relinked}${anchor})`;
    });
  }

  // Convert markdown links to HTML links
  content = content.replace(/\.md(#[^)]*)?(\))/g, '.html$1$2');

  // Convert to HTML
  let htmlContent = md.render(content);

  // Get title
  const title = metadata.title || getTitle(content, filename);

  // Ensure every page opens with a styled H1. Pages whose body has no leading
  // H1 (e.g. front-matter-titled agent pages) get one synthesized from the title.
  if (!/^\s*<h1[\s>]/.test(htmlContent)) {
    htmlContent = `<h1>${escapeHtml(title)}</h1>\n` + htmlContent;
  }

  // Wrap book chapters with prev / Contents / next navigation (top and bottom)
  if (chapterNav) {
    htmlContent = chapterNav.replace('{{POS}}', 'top') + htmlContent + chapterNav.replace('{{POS}}', 'bottom');
  }
  if (afterContent) {
    htmlContent += afterContent;
  }

  // Load template
  const template = readTemplate('page');

  // Determine navigation context
  const navContext = isSubPage ? '../' : '';

  // Per-page meta: description falls back to a title-derived line (book chapters)
  const description = pageMeta.description
    || `${title} — Java Backend Coding Technology, free web edition.`;

  // Replace placeholders
  let html = template
    .replace(/{{TITLE}}/g, escapeAttr(title))
    .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
    .replace(/{{CANONICAL_URL}}/g, pageMeta.canonicalUrl || SITE_URL + '/')
    .replace(/{{OG_TYPE}}/g, pageMeta.ogType || 'website')
    .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
    .replace('{{CONTENT}}', () => htmlContent)
    .replace(/{{NAV_CONTEXT}}/g, navContext);

  // Highlight the active top-nav item
  if (navKey) {
    html = html.replace(`id="nav-${navKey}"`, `id="nav-${navKey}" class="active"`);
  }

  return html;
}

function buildPage(sourceFile, outputFile, isSubPage = false, navKey = '', chapterNav = '', afterContent = '') {
  console.log(`Building: ${sourceFile} -> ${outputFile}`);

  // Dist-relative path drives canonical URL, description lookup, and og:type
  const relPath = path.relative(DIST_DIR, outputFile).split(path.sep).join('/');
  const pageMeta = {
    canonicalUrl: relPath === 'index.html' ? SITE_URL + '/' : `${SITE_URL}/${relPath}`,
    description: DESCRIPTIONS[relPath],
    ogType: relPath.startsWith('book/') ? 'article' : 'website',
    // Real source dir (resolves symlinked pages) and output dir, both POSIX-relative
    srcDir: path.relative(ROOT_DIR, path.dirname(fs.realpathSync(sourceFile))).split(path.sep).join('/'),
    outDir: path.dirname(relPath) === '.' ? '' : path.dirname(relPath)
  };

  const markdown = fs.readFileSync(sourceFile, 'utf-8');
  const html = convertMarkdownToHtml(markdown, path.basename(sourceFile), isSubPage, navKey, chapterNav, pageMeta, afterContent);

  ensureDir(path.dirname(outputFile));
  fs.writeFileSync(outputFile, html);
}

function copyStyles() {
  console.log('Copying styles...');
  const styleSource = path.join(STYLES_DIR, 'style.css');
  const styleDest = path.join(DIST_DIR, 'style.css');

  if (fs.existsSync(styleSource)) {
    fs.copyFileSync(styleSource, styleDest);
  } else {
    console.warn('Warning: style.css not found');
  }
}

function copyImages() {
  console.log('Copying images...');
  const imageSource = path.join(__dirname, 'image');
  const imageDest = path.join(DIST_DIR, 'image');

  if (fs.existsSync(imageSource)) {
    ensureDir(imageDest);
    const files = fs.readdirSync(imageSource);
    files.forEach(file => {
      const src = path.join(imageSource, file);
      const dest = path.join(imageDest, file);
      fs.copyFileSync(src, dest);
    });
  } else {
    console.warn('Warning: image directory not found');
  }
}

function buildMainPages() {
  console.log('Building main pages...');

  PAGES.forEach(page => {
    const sourcePath = path.join(ROOT_DIR, page.src);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Warning: ${page.src} not found, skipping`);
      return;
    }

    const outputPath = path.join(DIST_DIR, page.out);
    const navKey = NAV_KEYS[page.out] || '';
    buildPage(sourcePath, outputPath, false, navKey);
  });
}

function buildBookPages() {
  console.log('Building book pages...');

  const bookDir = path.join(ROOT_DIR, 'book');
  const bookDistDir = path.join(DIST_DIR, 'book');

  ensureDir(bookDistDir);

  // Build index (no chapter nav)
  const indexSource = path.join(bookDir, 'index.md');
  if (fs.existsSync(indexSource)) {
    buildPage(indexSource, path.join(bookDistDir, 'index.html'), true, 'books');
  } else {
    console.warn('Warning: book/index.md not found, skipping');
  }

  // Reading sequence: chapters + appendices in order. CHANGELOG is not part of it.
  const sequence = BOOK_CHAPTERS
    .filter(file => file !== 'CHANGELOG.md')
    .map(file => {
      const sourcePath = path.join(bookDir, file);
      if (!fs.existsSync(sourcePath)) {
        console.warn(`Warning: book/${file} not found, skipping`);
        return null;
      }
      const markdown = fs.readFileSync(sourcePath, 'utf-8');
      return {
        sourcePath,
        htmlName: file.replace('.md', '.html'),
        title: getTitle(markdown, file)
      };
    })
    .filter(Boolean);

  // Build each reading-sequence page with prev / Contents / next navigation;
  // the final page additionally gets the what's-next block.
  sequence.forEach((chapter, i) => {
    const chapterNav = buildChapterNav(sequence[i - 1], sequence[i + 1]);
    const afterContent = i === sequence.length - 1 ? WHATS_NEXT_HTML : '';
    buildPage(chapter.sourcePath, path.join(bookDistDir, chapter.htmlName), true, 'books', chapterNav, afterContent);
  });

  // CHANGELOG: Contents link only, no prev/next
  const changelogSource = path.join(bookDir, 'CHANGELOG.md');
  if (fs.existsSync(changelogSource)) {
    buildPage(changelogSource, path.join(bookDistDir, 'CHANGELOG.html'), true, 'books', buildChapterNav(null, null));
  }
}

function generateSitemap() {
  console.log('Generating sitemap...');

  const baseUrl = 'https://pragmatica.dev';
  const pages = [];

  // Add main pages
  PAGES.forEach(page => {
    pages.push(page.out === 'index.html' ? `${baseUrl}/` : `${baseUrl}/${page.out}`);
  });

  // Add book pages
  pages.push(`${baseUrl}/book/index.html`);
  BOOK_CHAPTERS.forEach(file => {
    const url = file.replace('.md', '.html');
    pages.push(`${baseUrl}/book/${url}`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
}

// Main build process
function build() {
  console.log('Starting build...\n');

  // Ensure dist directory exists
  ensureDir(DIST_DIR);

  // Build pages
  buildMainPages();
  buildBookPages();

  // Copy assets
  copyStyles();
  copyImages();

  // Generate sitemap
  generateSitemap();

  console.log('\n✓ Build complete!');
  console.log(`Output directory: ${DIST_DIR}`);
}

// Run build
build();
