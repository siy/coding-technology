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
  'appendix-c-glossary.md'
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

function convertMarkdownToHtml(markdownContent, filename, isSubPage = false) {
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
  const navContext = isSubPage ? '../' : '';

  // Replace placeholders
  let html = template
    .replace('{{TITLE}}', title)
    .replace('{{CONTENT}}', htmlContent)
    .replace(/{{NAV_CONTEXT}}/g, navContext);

  return html;
}

function buildPage(sourceFile, outputFile, isSubPage = false) {
  console.log(`Building: ${sourceFile} -> ${outputFile}`);

  const markdown = fs.readFileSync(sourceFile, 'utf-8');
  const html = convertMarkdownToHtml(markdown, path.basename(sourceFile), isSubPage);

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

function buildBookPages() {
  console.log('Building book pages...');

  const bookDir = path.join(ROOT_DIR, 'book');
  const bookDistDir = path.join(DIST_DIR, 'book');

  ensureDir(bookDistDir);

  // Build index
  const indexSource = path.join(bookDir, 'index.md');
  if (fs.existsSync(indexSource)) {
    buildPage(indexSource, path.join(bookDistDir, 'index.html'), true);
  } else {
    console.warn('Warning: book/index.md not found, skipping');
  }

  BOOK_CHAPTERS.forEach(file => {
    const sourcePath = path.join(bookDir, file);

    if (!fs.existsSync(sourcePath)) {
      console.warn(`Warning: book/${file} not found, skipping`);
      return;
    }

    const outputName = file.replace('.md', '.html');
    const outputPath = path.join(bookDistDir, outputName);
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
