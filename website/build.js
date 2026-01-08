#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const frontMatter = require('front-matter');

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

// Files to convert
const MARKDOWN_FILES = [
  'README.md',
  'CODING_GUIDE.md',
  'MANAGEMENT_PERSPECTIVE.md',
  'CHANGELOG.md',
  'TECHNOLOGY.md',
  'PL_IMPROVEMENTS.md',
  'AI-TOOLING.md',
  'CLI-TOOLING.md',
  'MAVEN-PLUGIN.md',
  'jbct-coder.md',
  'jbct-reviewer.md',
  'CONTACT.md'
];

// Series files
const SERIES_FILES = [
  'INDEX.md',
  'part-01-foundations.md',
  'part-02-four-return-types.md',
  'part-03-parse-dont-validate.md',
  'part-04-error-handling.md',
  'part-05-basic-patterns.md',
  'part-06-advanced-patterns.md',
  'part-07-testing-philosophy.md',
  'part-08-testing-practice.md',
  'part-09-production-systems.md',
  'part-10-systematic-application.md'
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

function convertMarkdownToHtml(markdownContent, filename, isSeriesPage = false) {
  // Parse front matter if exists
  let content = markdownContent;
  let metadata = {};

  try {
    const parsed = frontMatter(markdownContent);
    content = parsed.body;
    metadata = parsed.attributes;
  } catch (e) {
    // No front matter, use entire content
  }

  // Convert markdown links to HTML links
  content = content.replace(/\.md(#[^)]*)?(\))/g, '.html$1$2');

  // Convert to HTML
  const htmlContent = md.render(content);

  // Get title
  const title = metadata.title || getTitle(markdownContent, filename);

  // Load template
  const template = readTemplate('page');

  // Determine navigation context
  const navContext = isSeriesPage ? '../' : '';

  // Replace placeholders
  let html = template
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', htmlContent)
    .replace(/{{NAV_CONTEXT}}/g, navContext);

  return html;
}

function buildPage(sourceFile, outputFile, isSeriesPage = false) {
  console.log(`Building: ${sourceFile} -> ${outputFile}`);

  const markdown = fs.readFileSync(sourceFile, 'utf-8');
  const html = convertMarkdownToHtml(markdown, path.basename(sourceFile), isSeriesPage);

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

  MARKDOWN_FILES.forEach(file => {
    const sourcePath = path.join(ROOT_DIR, file);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Warning: ${file} not found, skipping`);
      return;
    }

    let outputName = file.replace('.md', '.html');

    // Special case: README.md -> index.html
    if (file === 'README.md') {
      outputName = 'index.html';
    }

    const outputPath = path.join(DIST_DIR, outputName);
    buildPage(sourcePath, outputPath, false);
  });
}

function buildSeriesPages() {
  console.log('Building series pages...');

  const seriesDir = path.join(ROOT_DIR, 'series');
  const seriesDistDir = path.join(DIST_DIR, 'series');

  ensureDir(seriesDistDir);

  SERIES_FILES.forEach(file => {
    const sourcePath = path.join(seriesDir, file);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Warning: series/${file} not found, skipping`);
      return;
    }

    let outputName = file.replace('.md', '.html');

    // Special case: INDEX.md -> index.html
    if (file === 'INDEX.md') {
      outputName = 'index.html';
    }

    const outputPath = path.join(seriesDistDir, outputName);
    buildPage(sourcePath, outputPath, true);
  });
}

function generateSitemap() {
  console.log('Generating sitemap...');

  const baseUrl = 'https://pragmatica.dev';
  const pages = [];

  // Add main pages
  MARKDOWN_FILES.forEach(file => {
    let url = file.replace('.md', '.html');
    if (file === 'README.md') {
      url = 'index.html';
    }
    pages.push(`${baseUrl}/${url}`);
  });

  // Add series pages
  SERIES_FILES.forEach(file => {
    let url = file.replace('.md', '.html');
    if (file === 'INDEX.md') {
      url = 'index.html';
    }
    pages.push(`${baseUrl}/series/${url}`);
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
  buildSeriesPages();

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
