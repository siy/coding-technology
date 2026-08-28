#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const { highlight } = require('./lib/highlight');

function githubSlugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight
}).use(markdownItAnchor, {
  slugify: githubSlugify,
  permalink: markdownItAnchor.permalink.headerLink()
});

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, 'dist');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const STYLES_DIR = path.join(__dirname, 'styles');
const BOOK_DIR = path.join(ROOT_DIR, 'book');
const COURSE_DIR = path.join(__dirname, 'course', 'jbct');
const SITE_URL = 'https://pragmatica.dev';

const STYLE_HASH = crypto.createHash('md5')
                         .update(fs.readFileSync(path.join(STYLES_DIR, 'style.css')))
                         .digest('hex')
                         .slice(0, 10);

const SITEMAP_URLS = [];

// Pages that are deliberately reachable only by direct URL or redirect. Anything
// else with no inbound link is a build error, not a style preference.
// These four are legacy root pages kept so previously-published URLs do not 404;
// they are not part of the current IA and nothing should link to them.
const ORPHAN_ALLOWED = new Set([
  'CHANGELOG.html',
  'PL_IMPROVEMENTS.html',
  'jbct-coder.html',
  'jbct-reviewer.html',
]);

// ---------- Course registry (JBCT + PFD + AS) ----------
// Each course renders its book's chapters as sequential web lessons. JBCT's config
// reproduces the previously-hardcoded behaviour exactly (byte-identical output).

const COURSES = [
  {
    id: 'jbct',
    bookDir: path.join(ROOT_DIR, 'book'),
    layerDir: path.join(__dirname, 'course', 'jbct'),
    urlBase: '/java/jbct/course/',
    referenceUrlBase: '/java/jbct/reference/',
    referenceSlug: 'appendix-a-api-reference',
    tocFileSlug: 'appendix-b-exercises',
    glossarySlug: 'appendix-c-glossary',
    storagePrefix: 'jbct:',
    nav: 'java',
    realm: { href: '/java/', label: 'The Java Realization' },
    parent: { href: '/java/jbct/', label: 'JBCT course' },
    courseLabel: 'JBCT course',
    crumbLabel: 'JBCT course',
    h1: 'Java Backend Coding Technology &mdash; Course',
    titleSuffix: 'JBCT course',
    tocTitle: 'JBCT Course — pragmatica.dev',
    tocDescription: 'The full JBCT method, chapter by chapter: six parts, twenty-two lessons, each pairing book prose with a short exercise. Free, no account required.',
    tocIntro: 'Twenty-two lessons across six parts. Each pairs the book’s prose with a short exercise; progress is tracked locally in your browser, no account required.',
    footerLinks: '<a href="/java/jbct/reference/">API reference</a> &middot; <a href="/java/jbct/worksheet/">Worksheet</a> &middot; <a href="https://leanpub.com/jbct-book" target="_blank" rel="noopener">Get the book</a> &middot; ',
    nonLessonSlugs: new Set(['appendix-a-api-reference', 'appendix-b-exercises', 'appendix-c-glossary', 'appendix-d-worksheet'])
  },
  {
    id: 'pfd',
    bookDir: path.join(ROOT_DIR, 'book-pfd'),
    layerDir: path.join(__dirname, 'course', 'pfd'),
    urlBase: '/method/pfd/course/',
    referenceUrlBase: '/method/pfd/reference/',
    referenceSlug: 'appendix-reference-cards',
    tocFileSlug: null,
    glossarySlug: 'glossary',
    storagePrefix: 'pfd:',
    nav: 'method',
    realm: { href: '/method/', label: 'The Method' },
    parent: { href: '/method/pfd/', label: 'Process-First Design' },
    courseLabel: 'PFD course',
    crumbLabel: 'PFD course',
    h1: 'Process-First Design &mdash; Course',
    titleSuffix: 'PFD course',
    tocTitle: 'Process-First Design Course — pragmatica.dev',
    tocDescription: 'Process-First Design, chapter by chapter: the spiral walked at four altitudes, each lesson pairing book prose with an apply-to-your-system exercise. Free, no account required.',
    tocIntro: 'The whole method as a sequence of lessons. Each pairs the book’s prose with a short exercise you run on a system you own; progress is tracked locally in your browser, no account required.',
    footerLinks: '<a href="/method/pfd/reference/">Reference cards</a> &middot; <a href="/method/pfd/worksheet/">Worksheet</a> &middot; <a href="https://leanpub.com/process-first-design" target="_blank" rel="noopener">Get the book</a> &middot; ',
    nonLessonSlugs: new Set(['series-note', 'acknowledgments', 'afterword', 'glossary', 'references',
                             'appendix-worksheet', 'appendix-reference-cards'])
  },
  {
    id: 'as',
    bookDir: path.join(ROOT_DIR, 'book-arch'),
    layerDir: path.join(__dirname, 'course', 'architecture-synthesis'),
    urlBase: '/method/architecture-synthesis/course/',
    referenceUrlBase: '/method/architecture-synthesis/reference/',
    referenceSlug: 'appendix-reference-cards',
    tocFileSlug: null,
    glossarySlug: 'glossary',
    storagePrefix: 'as:',
    nav: 'method',
    realm: { href: '/method/', label: 'The Method' },
    parent: { href: '/method/architecture-synthesis/', label: 'Architecture Synthesis' },
    // Chapters the prose cites by number: two-teams is 1 and judgment is 12. `closing`
    // sits in the reading order but is not a numbered chapter, matching the PDF.
    chapterNumbers: true,
    unnumberedSlugs: new Set(['closing']),
    courseLabel: 'Architecture Synthesis course',
    crumbLabel: 'Architecture Synthesis course',
    h1: 'Architecture Synthesis &mdash; Course',
    titleSuffix: 'Architecture Synthesis course',
    tocTitle: 'Architecture Synthesis Course — pragmatica.dev',
    tocDescription: 'Architecture Synthesis, chapter by chapter: derive an architecture from service-level objectives, verify it against its own budget, and grade it against real systems. Each lesson pairs book prose with an apply-to-your-system exercise. Free, no account required.',
    tocIntro: 'The whole derivation method as a sequence of lessons. Each pairs the book’s prose with a short exercise you run on a system you own; progress is tracked locally in your browser, no account required.',
    footerLinks: '<a href="/method/architecture-synthesis/reference/">Reference cards</a> &middot; <a href="/method/architecture-synthesis/worksheet/">Worksheet</a> &middot; <a href="/method/architecture-synthesis/next-step/">Entry gate</a> &middot; <a href="https://leanpub.com/architecture-synthesis-the-next-correct-step" target="_blank" rel="noopener">Get the book</a> &middot; ',
    nonLessonSlugs: new Set(['series-note', 'acknowledgments', 'appendix-worksheet', 'appendix-reference-cards', 'references'])
  }
];

const courseByBookDir = {};
COURSES.forEach(c => { courseByBookDir[path.basename(c.bookDir)] = c; });

// Course-nav link list, reproducing the TOC template's original markup exactly
// (no class on inactive links, class="current" on the active realm).
function courseNavLinks(navKey) {
  const a = (key, href, label) =>
    `<a ${navKey === key ? 'class="current" ' : ''}href="${href}">${label}</a>`;
  return [
    a('start', '/', 'Start'),
    a('method', '/method/', 'The Method'),
    a('java', '/java/', 'The Java Realization'),
    a('glossary', '/method/glossary/', 'Glossary'),
    '<a href="https://github.com/pragmaticalabs/pragmatica" target="_blank" rel="noopener">GitHub</a>'
  ].join('\n      ');
}

function courseOutSegs(course) {
  return course.urlBase.replace(/^\/|\/$/g, '').split('/');
}

// ---------- Generic helpers ----------

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.html`), 'utf-8');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}

function stripFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { body: raw, attributes: {} };
  const attributes = {};
  m[1].split(/\r?\n/).forEach(line => {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) attributes[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  });
  return { body: raw.slice(m[0].length), attributes };
}

function getTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function stripLeadingH1(markdown) {
  const m = markdown.match(/^#\s+(.+?)\s*\r?\n\r?\n?/);
  if (m) return { title: m[1].trim(), body: markdown.slice(m[0].length) };
  return { title: null, body: markdown };
}

function extractFirstParagraph(body) {
  const withoutH1 = body.replace(/^#\s+.+$/m, '').trim();
  const paras = withoutH1.split(/\r?\n\s*\r?\n/);
  const first = (paras.find(p => p.trim() && !p.trim().startsWith('#')) || '').trim();
  let text = first
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > 165) text = text.slice(0, 162).replace(/\s+\S*$/, '') + '…';
  return text;
}

// Kramdown-style `**Term** {#anchor}` -> anchored bold term. The rest of the
// paragraph (definition + attribution) follows as normal prose; `<a id>`
// does not trigger CommonMark's HTML-block parsing, so inline markdown on
// the same paragraph still renders.
function preprocessGlossaryAnchors(markdown) {
  return markdown.replace(
    /^\*\*(.+?)\*\* \{#([a-z0-9-]+)\}$/gm,
    '<a id="$2"></a>**$1.**'
  );
}

function writePage(outPath, html, canonicalUrl) {
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, html);
  if (canonicalUrl) SITEMAP_URLS.push(canonicalUrl);
}

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else results.push(full);
  }
  return results;
}

// ---------- Spine (book/root.md) ----------

function parseSpine(course) {
  const raw = fs.readFileSync(path.join(course.bookDir, 'root.md'), 'utf-8');
  const lines = raw.split(/\r?\n/);
  const parts = [];
  let current = null;

  for (const line of lines) {
    const headMatch = line.match(/^## (.+?)\s*$/);
    if (headMatch) {
      current = { label: headMatch[1].trim(), lessons: [] };
      parts.push(current);
      continue;
    }
    const itemMatch = line.match(/^- \[(.+?)\]\(([a-z0-9-]+)\.md\)/);
    if (itemMatch && current) {
      const slug = itemMatch[2].trim();
      if (!course.nonLessonSlugs.has(slug)) {
        current.lessons.push({ title: itemMatch[1].trim(), slug });
      }
    }
  }
  // Sections with no lessons (front/back matter, notes) drop out entirely.
  return parts.filter(p => p.lessons.length > 0);
}

function flattenSpine(parts) {
  const flat = [];
  parts.forEach(part => {
    part.lessons.forEach((lesson, posInPart) => {
      flat.push({
        slug: lesson.slug,
        specTitle: lesson.title,
        partName: part.label,
        partSlugs: part.lessons.map(l => l.slug),
        posInPart,
        partTotal: part.lessons.length
      });
    });
  });
  flat.forEach((l, i) => { l.globalIndex = i; });
  return flat;
}

// ---------- Book-chapter link rewriting ----------

function rewriteBookLinks(markdown, course, byBook) {
  return markdown.replace(/\]\(([^)#\s]+\.md)((?:#[^)]*)?)\)/g, (match, target, anchor) => {
    let clean = target.replace(/^\.\//, '');
    let cc = course;
    // A ../book-*/ prefix targets another book → resolve against that course.
    const cross = clean.match(/^\.\.\/([^/]+)\/(.+)$/);
    if (cross) {
      const other = byBook[cross[1]];
      if (!other) return match;
      cc = other;
      clean = cross[2];
    }
    const slug = clean.replace(/\.md$/, '');
    if (slug === cc.glossarySlug) return `](/method/glossary/${anchor || ''})`;
    if (cc.referenceSlug && slug === cc.referenceSlug) return `](${cc.referenceUrlBase}${anchor || ''})`;
    if (cc.tocFileSlug && slug === cc.tocFileSlug) return `](${cc.urlBase})`;
    if (cc.lessonSlugSet && cc.lessonSlugSet.has(slug)) return `](${cc.urlBase}${slug}/${anchor || ''})`;
    console.warn(`  WARN: unrecognized book-internal link target "${target}" in ${course.id} — left unresolved`);
    return match;
  });
}

// ---------- Course layer (course/jbct/<slug>.md) ----------

function parseCourseLayer(raw) {
  const sections = {};
  // Capture each section's full body: everything up to the next "## " header or the
  // true end of input. (A bare `$` under /m matches every line-end and truncates
  // multi-line sections after their first line — hence `$(?![\s\S])` for real EOF.)
  const re = /^## (blurb|learn|note|exercise)\s*\r?\n([\s\S]*?)(?=\r?\n## |$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(raw))) sections[m[1]] = m[2].trim();
  return sections;
}

function parseExercise(raw) {
  const m = raw.match(/^###\s*(.+?)\s*\|\s*~?(\d+)\s*min\s*\r?\n([\s\S]*)$/);
  if (!m) return { title: 'Exercise', minutes: '', body: raw };
  return { title: m[1].trim(), minutes: m[2].trim(), body: m[3].trim() };
}

// ---------- Lattice SVG ----------

function buildLatticeSVG(slugs, currentIndex) {
  const r = 6.5, step = 26, startX = 9, cy = 9;
  const width = startX + Math.max(slugs.length - 1, 0) * step + 9;
  const circles = slugs.map((slug, i) => {
    const cx = startX + i * step;
    const cls = i === currentIndex ? 'node current' : 'node';
    return `<circle class="${cls}" data-lesson-slug="${escapeAttr(slug)}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  }).join('\n    ');
  return `<svg width="${width}" height="18" viewBox="0 0 ${width} 18">\n    ${circles}\n  </svg>`;
}

// ---------- Crumbs / related-links ----------

function crumbTop(label) {
  return `<div class="crumb"><a href="/">Start</a> / <b>${escapeHtml(label)}</b></div>`;
}
function crumbSub(parentHref, parentLabel, label) {
  return `<div class="crumb"><a href="/">Start</a> / <a href="${parentHref}">${escapeHtml(parentLabel)}</a> / <b>${escapeHtml(label)}</b></div>`;
}
function crumbDeep(segments, label) {
  const links = segments.map(s => `<a href="${s.href}">${escapeHtml(s.label)}</a>`).join(' / ');
  return `<div class="crumb"><a href="/">Start</a> / ${links} / <b>${escapeHtml(label)}</b></div>`;
}

function buildRelated(items) {
  if (!items || !items.length) return '';
  const lis = items.map(it =>
    `<li><a href="${it.href}">${escapeHtml(it.label)} <span>${escapeHtml(it.note || '')}</span></a></li>`
  ).join('\n      ');
  return `<div class="related">\n    <h2>Related</h2>\n    <ul>\n      ${lis}\n    </ul>\n  </div>`;
}

function navAttr(cfgNav, key) {
  return cfgNav === key ? 'class="current"' : '';
}

// ---------- Front door ----------

function buildFrontDoor() {
  const template = readTemplate('front-door');
  const title = 'pragmatica.dev — Less Art, More Engineering.';
  const description = 'Process-First Design, Architecture Synthesis, and Java Backend Coding Technology: three methods that derive software systems from business intent, each free to learn here and each also a book.';
  const html = template
    .replace(/{{TITLE}}/g, escapeAttr(title))
    .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
    .replace(/{{CANONICAL_URL}}/g, SITE_URL + '/')
    .replace(/{{STYLE_HASH}}/g, STYLE_HASH);
  writePage(path.join(DIST_DIR, 'index.html'), html, SITE_URL + '/');
}

// ---------- Landing pages ----------

function buildLandingPage(cfg) {
  const srcPath = path.join(ROOT_DIR, cfg.src);
  let raw;
  if (fs.existsSync(srcPath)) {
    raw = fs.readFileSync(srcPath, 'utf-8');
  } else {
    console.warn(`WARN: ${cfg.src} not found — rendering placeholder for /${cfg.out}`);
    raw = `# ${cfg.fallbackTitle}\n\n<div class="placeholder-note">Content pending.</div>\n`;
  }
  const { body } = stripFrontMatter(raw);
  const title = getTitle(body) || cfg.fallbackTitle;
  const description = cfg.description || extractFirstParagraph(body);
  const renderSource = cfg.glossary ? preprocessGlossaryAnchors(body) : body;
  const contentHtml = md.render(renderSource);

  const template = readTemplate('landing');
  const outPath = path.join(DIST_DIR, cfg.out);
  const relUrl = cfg.out.replace(/index\.html$/, '');
  const canonicalUrl = SITE_URL + '/' + relUrl;

  const html = template
    .replace(/{{TITLE}}/g, escapeAttr(`${title} — pragmatica.dev`))
    .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
    .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
    .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
    .replace('{{CRUMB}}', cfg.crumb)
    .replace('{{CONTENT}}', () => contentHtml)
    .replace('{{RELATED}}', buildRelated(cfg.related))
    .replace(/{{NAV_START}}/g, navAttr(cfg.nav, 'start'))
    .replace(/{{NAV_METHOD}}/g, navAttr(cfg.nav, 'method'))
    .replace(/{{NAV_JAVA}}/g, navAttr(cfg.nav, 'java'))
    .replace(/{{NAV_GLOSSARY}}/g, navAttr(cfg.nav, 'glossary'));

  writePage(outPath, html, canonicalUrl);
}

const LANDING_PAGES = [
  {
    src: 'website/content/method.md', out: 'method/index.html', fallbackTitle: 'Method',
    crumb: crumbTop('The Method'), nav: 'method', related: []
  },
  {
    src: 'website/content/java.md', out: 'java/index.html', fallbackTitle: 'Java',
    crumb: crumbTop('The Java Realization'), nav: 'java', related: []
  },
  {
    src: 'website/content/pfd.md', out: 'method/pfd/index.html', fallbackTitle: 'Process-First Design',
    crumb: crumbSub('/method/', 'The Method', 'Process-First Design'), nav: 'method',
    related: [
      { href: '/method/pfd/course/', label: 'PFD course', note: 'start learning' },
      { href: '/method/', label: 'The Method', note: 'parent' },
      { href: '/method/architecture-synthesis/', label: 'Architecture Synthesis', note: 'next step' },
      { href: '/method/glossary/', label: 'Series glossary', note: 'reference' }
    ]
  },
  {
    src: 'website/content/architecture-synthesis.md', out: 'method/architecture-synthesis/index.html', fallbackTitle: 'Architecture Synthesis',
    crumb: crumbSub('/method/', 'The Method', 'Architecture Synthesis'), nav: 'method',
    related: [
      { href: '/method/architecture-synthesis/course/', label: 'Architecture Synthesis course', note: 'start learning' },
      { href: '/method/architecture-synthesis/next-step/', label: 'Run the entry gate', note: 'check an answer sheet' },
      { href: '/method/', label: 'The Method', note: 'parent' },
      { href: '/method/pfd/', label: 'Process-First Design', note: 'upstream' },
      { href: '/method/glossary/', label: 'Series glossary', note: 'reference' }
    ]
  },
  {
    src: 'website/content/counterexamples.md', out: 'method/counterexamples/index.html', fallbackTitle: 'Counterexamples',
    crumb: crumbSub('/method/', 'The Method', 'Counterexamples wanted'), nav: 'method',
    related: [
      { href: '/method/', label: 'The Method', note: 'parent' },
      { href: '/method/glossary/', label: 'Series glossary', note: 'reference' }
    ]
  },
  {
    src: 'website/content/jbct.md', out: 'java/jbct/index.html', fallbackTitle: 'Java Backend Coding Technology',
    crumb: crumbSub('/java/', 'The Java Realization', 'Java Backend Coding Technology'), nav: 'java',
    related: [
      { href: '/java/', label: 'The Java Realization', note: 'parent' },
      { href: '/java/jbct/course/', label: 'JBCT course', note: 'start learning' },
      { href: '/java/pragmatica/', label: 'Pragmatica core library', note: 'the library' }
    ]
  },
  {
    src: 'website/content/pragmatica.md', out: 'java/pragmatica/index.html', fallbackTitle: 'Pragmatica',
    crumb: crumbSub('/java/', 'The Java Realization', 'Pragmatica core library'), nav: 'java',
    related: [
      { href: '/java/', label: 'The Java Realization', note: 'parent' },
      { href: '/java/jbct/', label: 'Java Backend Coding Technology', note: 'written against' }
    ]
  },
  {
    src: 'website/content/aether.md', out: 'java/aether/index.html', fallbackTitle: 'Aether',
    crumb: crumbSub('/java/', 'The Java Realization', 'Aether runtime'), nav: 'java',
    related: [
      { href: '/java/', label: 'The Java Realization', note: 'parent' },
      { href: '/java/jbct/', label: 'Java Backend Coding Technology', note: 'the same composition' }
    ]
  },
  {
    src: 'website/content/glossary.md', out: 'method/glossary/index.html', fallbackTitle: 'Series Glossary',
    crumb: crumbSub('/method/', 'The Method', 'Glossary'), nav: 'glossary', glossary: true,
    description: 'One glossary for the whole series: Process-First Design, Architecture Synthesis, and Java Backend Coding Technology terms, cross-referenced and defined once.',
    related: []
  },
  {
    src: 'book/appendix-a-api-reference.md', out: 'java/jbct/reference/index.html', fallbackTitle: 'API Reference',
    crumb: crumbDeep([{ href: '/java/', label: 'The Java Realization' }, { href: '/java/jbct/course/', label: 'JBCT course' }], 'Reference'),
    nav: 'java',
    description: 'Complete API reference for Pragmatica Core: Result, Option, Promise, and the full method surface used throughout the JBCT course.',
    related: [
      { href: '/java/jbct/course/', label: 'JBCT course', note: 'back to contents' },
      { href: '/java/jbct/', label: 'Java Backend Coding Technology', note: 'overview' }
    ]
  },
  {
    src: 'book-arch/appendix-reference-cards.md', out: 'method/architecture-synthesis/reference/index.html', fallbackTitle: 'Reference Cards',
    crumb: crumbDeep([{ href: '/method/', label: 'The Method' }, { href: '/method/architecture-synthesis/course/', label: 'Architecture Synthesis course' }], 'Reference cards'),
    nav: 'method',
    description: 'The Architecture Synthesis reference cards: the nine questions, the ledger of axis values and costs, and the derivation rules — the whole method as a deck.',
    related: [
      { href: '/method/architecture-synthesis/course/', label: 'Architecture Synthesis course', note: 'back to contents' },
      { href: '/method/architecture-synthesis/', label: 'Architecture Synthesis', note: 'overview' }
    ]
  },
  {
    src: 'book-pfd/appendix-reference-cards.md', out: 'method/pfd/reference/index.html', fallbackTitle: 'PFD Reference Cards',
    crumb: crumbDeep([{ href: '/method/', label: 'The Method' }, { href: '/method/pfd/course/', label: 'PFD course' }], 'Reference cards'),
    nav: 'method',
    description: 'The Process-First Design reference cards: the shapes, the patterns, the telescope, the change driver and its register, where data comes from, and the recovery triple — the whole vocabulary as a deck.',
    related: [
      { href: '/method/pfd/course/', label: 'PFD course', note: 'back to contents' },
      { href: '/method/pfd/worksheet/', label: 'The worksheet', note: 'the sheet you fill' }
    ]
  },
  {
    src: 'book-pfd/appendix-worksheet.md', out: 'method/pfd/worksheet/index.html', fallbackTitle: 'The PFD Design Worksheet',
    crumb: crumbDeep([{ href: '/method/', label: 'The Method' }, { href: '/method/pfd/course/', label: 'PFD course' }], 'Worksheet'),
    nav: 'method',
    description: 'The Process-First Design worksheet: take one operation, specify its six properties, attribute it to a change driver, and let the data and the altitudes precipitate from the register.',
    related: [
      { href: '/method/pfd/course/', label: 'PFD course', note: 'back to contents' },
      { href: '/method/pfd/reference/', label: 'Reference cards', note: 'the vocabulary as a deck' }
    ]
  },
  {
    src: 'book-arch/appendix-worksheet.md', out: 'method/architecture-synthesis/worksheet/index.html', fallbackTitle: 'The Derivation Worksheet',
    crumb: crumbDeep([{ href: '/method/', label: 'The Method' }, { href: '/method/architecture-synthesis/course/', label: 'Architecture Synthesis course' }], 'Worksheet'),
    nav: 'method',
    description: 'The Architecture Synthesis derivation worksheet: the blank two-part table you fill to derive an architecture from answers and verify it against its own budget.',
    related: [
      { href: '/method/architecture-synthesis/course/', label: 'Architecture Synthesis course', note: 'back to contents' },
      { href: '/method/architecture-synthesis/reference/', label: 'Reference cards', note: 'the method as a deck' }
    ]
  },
  {
    src: 'book/appendix-d-worksheet.md', out: 'java/jbct/worksheet/index.html', fallbackTitle: 'The JBCT Use Case Worksheet',
    crumb: crumbDeep([{ href: '/java/', label: 'The Java Realization' }, { href: '/java/jbct/course/', label: 'JBCT course' }], 'Worksheet'),
    nav: 'java',
    description: 'The JBCT use case worksheet: specify a process by its six properties, parse the input, choose a return kind per step, place each step in a zone and a pattern, name the recovery response, and check the four composition test obligations.',
    related: [
      { href: '/java/jbct/course/', label: 'JBCT course', note: 'back to contents' },
      { href: '/java/jbct/reference/', label: 'API reference', note: 'the types and combinators' }
    ]
  },
  {
    src: 'website/content/articles.md', out: 'articles/index.html', fallbackTitle: 'Articles',
    crumb: crumbTop('Articles'), nav: '',
    description: 'Shorter pieces from Pragmatica Labs: each takes a single argument from the books and works it out at article length. The canonical copies live here.',
    related: [
      { href: '/method/', label: 'The Method', note: 'the books behind the arguments' },
      { href: '/java/', label: 'The Java Realization', note: 'how it is written in code' }
    ]
  },
  {
    src: 'articles/engineering-is-the-checkable-fraction.md', out: 'articles/engineering-is-the-checkable-fraction/index.html',
    fallbackTitle: 'Engineering Is the Checkable Fraction of Your Practice',
    crumb: crumbSub('/articles/', 'Articles', 'The Checkable Fraction'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/keep-the-context-map.md', out: 'articles/keep-the-context-map/index.html',
    fallbackTitle: 'Keep the Context Map. Replace the Aggregates.',
    crumb: crumbSub('/articles/', 'Articles', 'Keep the Context Map'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/every-test-can-name-why-it-exists.md', out: 'articles/every-test-can-name-why-it-exists/index.html',
    fallbackTitle: 'Every Test Can Name Why It Exists',
    crumb: crumbSub('/articles/', 'Articles', 'Every Test Can Name Why It Exists'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/pattern-based-code-review-article-v2.md', out: 'articles/pattern-based-code-review/index.html',
    fallbackTitle: 'From Subjective Opinions to Systematic Analysis: Pattern-Based Code Review',
    crumb: crumbSub('/articles/', 'Articles', 'Pattern-Based Code Review'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/jbdt-process-first-methodology.md', out: 'articles/jbdt-process-first-methodology/index.html',
    fallbackTitle: 'Java Backend Design Technology: A Process-First Methodology',
    crumb: crumbSub('/articles/', 'Articles', 'Java Backend Design Technology'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/no-framework-no-pain.md', out: 'articles/no-framework-no-pain/index.html',
    fallbackTitle: 'No Framework, No Pain: Writing Aether Slices',
    crumb: crumbSub('/articles/', 'Articles', 'No Framework, No Pain'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/aether-let-java-be-java.md', out: 'articles/aether-let-java-be-java/index.html',
    fallbackTitle: 'Pragmatica Aether: Let Java Be Java',
    crumb: crumbSub('/articles/', 'Articles', 'Let Java Be Java'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/interface-factory-pattern.md', out: 'articles/interface-factory-pattern/index.html',
    fallbackTitle: 'Why Interface + Factory? The Java Pattern That Makes Everything Replaceable',
    crumb: crumbSub('/articles/', 'Articles', 'Interface + Factory'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/fail-safe-legacy.md', out: 'articles/fail-safe-legacy/index.html',
    fallbackTitle: 'Fail-Safe Your Legacy Java in One Sprint',
    crumb: crumbSub('/articles/', 'Articles', 'Fail-Safe Your Legacy Java'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/slices.md', out: 'articles/slices/index.html',
    fallbackTitle: 'Slices: The Right Size for Microservices',
    crumb: crumbSub('/articles/', 'Articles', 'Slices'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/six-patterns-that-cover-everything.md', out: 'articles/six-patterns-that-cover-everything/index.html',
    fallbackTitle: 'The Six Patterns That Cover Everything',
    crumb: crumbSub('/articles/', 'Articles', 'The Six Patterns'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/underlying-process.md', out: 'articles/underlying-process/index.html',
    fallbackTitle: 'The Underlying Process of Request Processing',
    crumb: crumbSub('/articles/', 'Articles', 'The Underlying Process'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/softwares-second-free-lunch.md', out: 'articles/softwares-second-free-lunch/index.html',
    fallbackTitle: "Software's Second Free Lunch",
    crumb: crumbSub('/articles/', 'Articles', 'The Second Free Lunch'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  },
  {
    src: 'articles/your-backlog-is-a-cache-of-beliefs.md', out: 'articles/your-backlog-is-a-cache-of-beliefs/index.html',
    fallbackTitle: 'Your Backlog Is a Cache of Beliefs',
    crumb: crumbSub('/articles/', 'Articles', 'Cache of Beliefs'), nav: '',
    related: [{ href: '/articles/', label: 'All articles', note: 'back to the list' }]
  }
];

function buildLandingPages() {
  LANDING_PAGES.forEach(buildLandingPage);
}

// ---------- Course TOC ----------

function buildCourseToc(course, parts, flat) {
  const template = readTemplate('course-toc');
  const partsHtml = parts.map(part => {
    const slugs = part.lessons.map(l => l.slug);
    const svg = buildLatticeSVG(slugs, -1);
    const items = part.lessons.map((lesson, i) => {
      const layerPath = path.join(course.layerDir, `${lesson.slug}.md`);
      let blurb = '';
      if (fs.existsSync(layerPath)) {
        const sections = parseCourseLayer(fs.readFileSync(layerPath, 'utf-8'));
        blurb = sections.blurb || '';
      } else {
        console.warn(`  WARN: ${course.id} course layer ${lesson.slug}.md not found — TOC blurb omitted`);
      }
      return `<li><a href="${course.urlBase}${lesson.slug}/"><span class="num">${i + 1}</span><span class="title">${escapeHtml(lesson.title)}</span>${blurb ? `<div class="blurb">${escapeHtml(blurb)}</div>` : ''}</a></li>`;
    }).join('\n      ');
    return `<div class="part-block">
      <h2>${escapeHtml(part.label)}</h2>
      <div class="part-cap">${part.lessons.length} lesson${part.lessons.length === 1 ? '' : 's'}</div>
      ${svg}
      <ul class="lesson-list">
      ${items}
      </ul>
    </div>`;
  }).join('\n\n');

  const html = template
    .replace(/{{TITLE}}/g, escapeAttr(course.tocTitle))
    .replace(/{{DESCRIPTION}}/g, escapeAttr(course.tocDescription))
    .replace(/{{CANONICAL_URL}}/g, SITE_URL + course.urlBase)
    .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
    .replace('{{NAV_LINKS}}', courseNavLinks(course.nav))
    .replace(/{{REALM_HREF}}/g, course.realm.href)
    .replace(/{{REALM_LABEL}}/g, escapeHtml(course.realm.label))
    .replace(/{{CRUMB_LABEL}}/g, escapeHtml(course.crumbLabel))
    .replace('{{COURSE_H1}}', course.h1)
    .replace('{{FOOTER_LINKS}}', course.footerLinks)
    .replace('{{INTRO}}', escapeHtml(course.tocIntro))
    .replace('{{PARTS}}', partsHtml);

  writePage(path.join(DIST_DIR, ...courseOutSegs(course), 'index.html'), html, SITE_URL + course.urlBase);
}

// ---------- Lesson pages ----------

function buildLessonPages(course, flat) {
  const template = readTemplate('lesson');

  flat.forEach((lesson, i) => {
    const chapterPath = path.join(course.bookDir, `${lesson.slug}.md`);
    if (!fs.existsSync(chapterPath)) {
      console.warn(`  WARN: ${course.id} book/${lesson.slug}.md not found — skipping lesson`);
      return;
    }
    const rawChapter = fs.readFileSync(chapterPath, 'utf-8');
    const { body: chapterBody } = stripFrontMatter(rawChapter);
    const { title: h1Title, body: strippedBody } = stripLeadingH1(chapterBody);
    const title = h1Title || lesson.specTitle;
    const rewritten = rewriteBookLinks(strippedBody, course, courseByBookDir);
    const bodyHtml = md.render(rewritten);

    const layerPath = path.join(course.layerDir, `${lesson.slug}.md`);
    let sections = {};
    if (fs.existsSync(layerPath)) {
      sections = parseCourseLayer(fs.readFileSync(layerPath, 'utf-8'));
    } else {
      console.warn(`  WARN: ${course.id} course layer ${lesson.slug}.md not found — lesson rendered without course-layer blocks`);
    }

    const learnBox = sections.learn
      ? `<div class="learn">\n    <h2>In this lesson</h2>\n    ${md.render(sections.learn)}\n  </div>`
      : '';
    const noteBlock = sections.note
      ? `<div class="lesson-note">${md.render(sections.note)}</div>`
      : '';
    let exerciseBlock = '';
    if (sections.exercise) {
      const ex = parseExercise(sections.exercise);
      exerciseBlock = `<div class="exercise">
    <div class="bar">Exercise — ${escapeHtml(ex.title)} ${ex.minutes ? `<span>~${escapeHtml(ex.minutes)} min</span>` : '<span></span>'}</div>
    <div class="body">${md.render(ex.body)}</div>
  </div>`;
    }
    const description = sections.blurb || extractFirstParagraph(chapterBody) || `${title} — ${course.titleSuffix}.`;

    const latticeSvg = buildLatticeSVG(lesson.partSlugs, lesson.posInPart);

    const prev = i > 0 ? flat[i - 1] : null;
    const next = i < flat.length - 1 ? flat[i + 1] : null;
    const prevLink = prev
      ? `<a class="prev" href="${course.urlBase}${prev.slug}/">&larr; ${escapeHtml(prev.specTitle)}</a>`
      : `<a class="prev" href="${course.urlBase}">&larr; Course contents</a>`;
    const nextLink = next
      ? `<a class="next" href="${course.urlBase}${next.slug}/">Next: ${escapeHtml(next.specTitle)} &rarr;</a>`
      : `<a class="next" href="${course.urlBase}">Next: Course contents &rarr;</a>`;

    const canonicalUrl = `${SITE_URL}${course.urlBase}${lesson.slug}/`;

    let chapterLabel = '';
    if (course.chapterNumbers) {
      const unnumbered = course.unnumberedSlugs || new Set();
      if (!unnumbered.has(lesson.slug)) {
        const number = flat.slice(0, i + 1).filter(l => !unnumbered.has(l.slug)).length;
        chapterLabel = `Chapter ${number} &middot; `;
      }
    }

    const html = template
      .replace(/{{TITLE}}/g, escapeAttr(`${title} — ${course.titleSuffix}`))
      .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
      .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
      .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
      .replace(/{{COURSE_HOME}}/g, course.urlBase)
      .replace(/{{COURSE_LABEL}}/g, course.courseLabel)
      .replace(/{{REALM_HREF}}/g, course.realm.href)
      .replace(/{{REALM_LABEL}}/g, escapeHtml(course.realm.label))
      .replace(/{{PARENT_HREF}}/g, course.parent.href)
      .replace(/{{PARENT_LABEL}}/g, escapeHtml(course.parent.label))
      .replace(/{{STORAGE_PREFIX}}/g, course.storagePrefix)
      .replace(/{{PART_NAME}}/g, escapeHtml(lesson.partName))
      .replace('{{TITLE_TEXT}}', escapeHtml(title))
      .replace('{{LATTICE_SVG}}', latticeSvg)
      .replace('{{CHAPTER_LABEL}}', chapterLabel)
      .replace('{{LESSON_POS}}', String(lesson.posInPart + 1))
      .replace('{{LESSON_TOTAL}}', String(lesson.partTotal))
      .replace('{{LEARN_BOX}}', learnBox)
      .replace('{{NOTE}}', noteBlock)
      .replace('{{BODY}}', () => bodyHtml)
      .replace('{{EXERCISE}}', exerciseBlock)
      .replace('{{PREV_LINK}}', prevLink)
      .replace('{{NEXT_LINK}}', nextLink)
      .replace('{{SLUG_JSON}}', JSON.stringify(lesson.slug))
      .replace('{{PART_SLUGS_JSON}}', JSON.stringify(lesson.partSlugs));

    writePage(path.join(DIST_DIR, ...courseOutSegs(course), lesson.slug, 'index.html'), html, canonicalUrl);
  });
}

// ---------- Legacy pages (tooling docs kept at their existing root URLs) ----------

const LEGACY_PAGES = [
  { src: 'CHANGELOG.md', out: 'CHANGELOG.html', description: 'Changelog for the JBCT repository and shared assets: tooling, AI skills, and build scripts.' },
  { src: 'PL_IMPROVEMENTS.md', out: 'PL_IMPROVEMENTS.html', description: 'Language-level improvements that would make functional Java backends simpler — observations from applying JBCT in practice.' },
  { src: 'AI-TOOLING.md', out: 'AI-TOOLING.html', description: 'Claude Code skills, subagents, and review commands for JBCT — the toolchain for AI-assisted Java backend development.' },
  { src: 'CLI-TOOLING.md', out: 'CLI-TOOLING.html', description: 'The jbct CLI: lint and scaffold JBCT-style Java backend code from the command line.' },
  { src: 'MAVEN-PLUGIN.md', out: 'MAVEN-PLUGIN.html', description: 'The JBCT Maven plugin: build-time enforcement of JBCT structural rules.' },
  { src: 'jbct-coder.md', out: 'jbct-coder.html', description: 'The jbct-coder subagent: JBCT-compliant Java code generation with Claude Code.' },
  { src: 'jbct-reviewer.md', out: 'jbct-reviewer.html', description: 'The jbct-reviewer subagent: JBCT compliance review for Java backend code.' }
];

function rewriteLegacyLinks(content, srcDir, outDir) {
  return content.replace(/\]\(([^)#:\s]+\.md)((?:#[^)]*)?)\)/g, (match, target, anchor) => {
    if (target.startsWith('/')) return match;
    const resolved = path.posix.normalize(path.posix.join(srcDir, target));
    if (resolved === 'book/index.md') return `](/java/jbct/course/${anchor || ''})`;
    const relinked = path.posix.relative(outDir, resolved) || resolved;
    return `](${relinked}${anchor || ''})`;
  });
}

function buildLegacyPages() {
  LEGACY_PAGES.forEach(page => {
    const sourcePath = path.join(ROOT_DIR, page.src);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`WARN: ${page.src} not found, skipping legacy page`);
      return;
    }
    const raw = fs.readFileSync(sourcePath, 'utf-8');
    const { body } = stripFrontMatter(raw);

    const realDir = path.dirname(fs.realpathSync(sourcePath));
    const srcDir = path.relative(ROOT_DIR, realDir).split(path.sep).join('/');
    const outDir = '';

    let content = rewriteLegacyLinks(body, srcDir, outDir);
    content = content.replace(/\.md(#[^)]*)?(\))/g, '.html$1$2');

    let htmlContent = md.render(content);
    const title = getTitle(content) || page.out.replace('.html', '');
    if (!/^\s*<h1[\s>]/.test(htmlContent)) {
      htmlContent = `<h1>${escapeHtml(title)}</h1>\n` + htmlContent;
    }

    const template = readTemplate('page');
    const canonicalUrl = `${SITE_URL}/${page.out}`;
    const html = template
      .replace(/{{TITLE}}/g, escapeAttr(`${title} — pragmatica.dev`))
      .replace(/{{DESCRIPTION}}/g, escapeAttr(page.description))
      .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
      .replace(/{{OG_TYPE}}/g, 'website')
      .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
      .replace(/{{NAV_CONTEXT}}/g, '')
      .replace('{{CONTENT}}', () => htmlContent);

    writePage(path.join(DIST_DIR, page.out), html, canonicalUrl);
  });
}

// ---------- Redirects ----------

const CHAPTER_REDIRECTS = [
  ['ch01-introduction.html', 'introduction'],
  ['ch02-design-methodology.html', 'from-process-to-patterns'],
  ['ch02-four-return-types.html', 'four-return-types'],
  ['ch03-pragmatica-lite-essentials.html', 'pragmatica-core-essentials'],
  ['ch04-parse-dont-validate.html', 'parse-dont-validate'],
  ['ch05-error-handling.html', 'error-handling'],
  ['ch06-null-policy-recovery.html', 'null-policy-recovery'],
  ['ch07-basic-patterns.html', 'basic-patterns'],
  ['ch08-advanced-patterns.html', 'advanced-patterns'],
  ['ch08b-knowledge-gathering-pipelines.html', 'knowledge-gathering-pipelines'],
  ['ch09-thread-safety.html', 'thread-safety'],
  ['ch10-testing-philosophy.html', 'testing-philosophy'],
  ['ch11-testing-practice.html', 'testing-practice'],
  ['ch12-registeruser-example.html', 'registeruser-example'],
  ['ch13-placeorder-example.html', 'placeorder-example'],
  ['ch14a-publisharticle-example.html', 'publisharticle-example'],
  ['ch14b-transferfunds-example.html', 'transferfunds-example'],
  ['ch15-project-structure.html', 'project-structure'],
  ['ch16-systematic-application.html', 'systematic-application'],
  ['ch17-migration-strategies.html', 'migration-strategies'],
  ['ch18-comparison.html', 'comparison'],
  ['ch19-troubleshooting-faq.html', 'troubleshooting-faq']
];

function buildRedirects() {
  const lines = [];
  CHAPTER_REDIRECTS.forEach(([oldFile, slug]) => {
    lines.push(`/book/${oldFile} /java/jbct/course/${slug}/ 301`);
  });
  lines.push('/book/appendix-a-api-reference.html /java/jbct/reference/ 301');
  lines.push('/book/appendix-b-exercises.html /java/jbct/course/ 301');
  lines.push('/book/appendix-c-glossary.html /method/glossary/ 301');
  // Article #1 was published with a canonical_url lacking the /articles/ prefix; honour it.
  lines.push('/pattern-based-code-review /articles/pattern-based-code-review/ 301');
  lines.push('/book/index.html /java/jbct/course/ 301');
  lines.push('/book/CHANGELOG.html /java/jbct/course/ 301');
  lines.push('/book/chapter-summaries.html /java/jbct/course/ 301');
  lines.push('/book/diagrams.html /java/jbct/course/ 301');
  lines.push('/books.html / 301');
  lines.push('/CONTACT.html https://pragmaticalabs.io/ 301');
  lines.push('/MANAGEMENT_PERSPECTIVE.html https://pragmaticalabs.io/ 301');
  lines.push('/book/* /java/jbct/course/ 301');

  ensureDir(DIST_DIR);
  fs.writeFileSync(path.join(DIST_DIR, '_redirects'), lines.join('\n') + '\n');
}

// ---------- Assets ----------

function copyStyles() {
  const dest = path.join(DIST_DIR, 'style.css');
  ensureDir(DIST_DIR);
  fs.copyFileSync(path.join(STYLES_DIR, 'style.css'), dest);
}

function copyImages() {
  const imageSource = path.join(__dirname, 'image');
  const imageDest = path.join(DIST_DIR, 'image');
  if (!fs.existsSync(imageSource)) {
    console.warn('WARN: image directory not found');
    return;
  }
  ensureDir(imageDest);
  fs.readdirSync(imageSource).forEach(file => {
    fs.copyFileSync(path.join(imageSource, file), path.join(imageDest, file));
  });
}

// ---------- next_step playground ----------

// The entry gate runs client-side: the page and its modules are copied verbatim,
// with no bundling step and no dependencies. Tests and the type marker stay behind.
function copyNextStep() {
  const source = path.join(__dirname, 'next-step');
  const dest = path.join(DIST_DIR, 'method', 'architecture-synthesis', 'next-step');
  if (!fs.existsSync(source)) {
    console.warn('WARN: next-step directory not found');
    return;
  }
  ensureDir(dest);
  fs.readdirSync(source, { withFileTypes: true })
    // Tests, the type marker, and the golden-derivation corpus stay behind: the page
    // ships the engine, not its test fixtures.
    .filter(entry => entry.isFile()
      && !entry.name.endsWith('.test.js')
      && entry.name !== 'package.json')
    .forEach(entry => {
      const file = entry.name;
      const from = path.join(source, file);
      // The page is hand-written rather than template-rendered, so it carries the
      // stylesheet placeholder and gets the same cache-busting stamp as every
      // generated page. Without it a returning visitor can be served a stale
      // stylesheet, since CSS ships with long cache headers.
      if (file.endsWith('.html')) {
        const html = fs.readFileSync(from, 'utf-8').replace(/{{STYLE_HASH}}/g, STYLE_HASH);
        fs.writeFileSync(path.join(dest, file), html);
      } else {
        fs.copyFileSync(from, path.join(dest, file));
      }
    });
  generateProfiles(source, dest);
  SITEMAP_URLS.push(SITE_URL + '/method/architecture-synthesis/next-step/');
}

// The Three Profiles demo loads the same answer sheets the golden tests assert against.
// Generating the page's copy from those files keeps the demo honest: a sheet that
// changed and broke a test cannot quietly keep working in the browser.
const PROFILES = [
  { id: 'venue', file: 'ticketing-venue.toml', label: 'Independent venue' },
  { id: 'regional', file: 'ticketing-regional.toml', label: 'Regional platform' },
  { id: 'enterprise', file: 'ticketing-enterprise.toml', label: 'Enterprise platform' },
];

function generateProfiles(source, dest) {
  const corpus = path.join(source, 'corpus');
  const entries = PROFILES.map(profile => {
    const from = path.join(corpus, profile.file);
    if (!fs.existsSync(from)) throw new Error(`next-step corpus missing: ${profile.file}`);
    const toml = fs.readFileSync(from, 'utf-8');
    return `  {\n    id: ${JSON.stringify(profile.id)},\n`
      + `    label: ${JSON.stringify(profile.label)},\n`
      + `    sheet: ${JSON.stringify(toml)},\n  }`;
  });
  const module = '// GENERATED by build.js from website/next-step/corpus/*.toml — do not edit.\n'
    + '// These are the sheets the golden tests assert against.\n'
    + `export const PROFILES = [\n${entries.join(',\n')},\n];\n`;
  fs.writeFileSync(path.join(dest, 'profiles.js'), module);
}

// ---------- Sitemap ----------
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_URLS.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
}

// ---------- Link verification ----------

function verifyLinks() {
  console.log('\nVerifying internal links...');
  const allFiles = walk(DIST_DIR);
  const existing = new Set(allFiles.map(f => path.relative(DIST_DIR, f).split(path.sep).join('/')));
  const files = allFiles.filter(f => f.endsWith('.html'));

  // Collect id/name anchors per dist-relative file for same-page and cross-page checks.
  const idsByFile = new Map();
  files.forEach(f => {
    const rel = path.relative(DIST_DIR, f).split(path.sep).join('/');
    const html = fs.readFileSync(f, 'utf-8');
    const ids = new Set();
    const idRe = /\bid="([^"]+)"/g;
    let im;
    while ((im = idRe.exec(html))) ids.add(im[1]);
    idsByFile.set(rel, ids);
  });

  let broken = 0;
  const linked = new Set();
  const hrefRe = /(?:href|src)="([^"]+)"/g;

  files.forEach(file => {
    const rel = path.relative(DIST_DIR, file).split(path.sep).join('/');
    const html = fs.readFileSync(file, 'utf-8');
    const fileRelDir = path.posix.dirname(rel);
    let m;
    while ((m = hrefRe.exec(html))) {
      const href = m[1];
      if (!href || href.startsWith('http://') || href.startsWith('https://') ||
          href.startsWith('mailto:') || href.startsWith('data:') || href.startsWith('//')) continue;

      // /p/* is the Pirsch proxy, served at the Cloudflare edge — never present in dist.
      if (href.startsWith('/p/')) continue;

      const [rawPath, hash] = href.split('#');
      const pathPart = rawPath.split('?')[0];

      let candidate;
      if (pathPart === '') {
        // Pure same-page anchor
        candidate = rel;
      } else if (pathPart.startsWith('/')) {
        candidate = pathPart.slice(1);
      } else {
        candidate = path.posix.normalize(path.posix.join(fileRelDir === '.' ? '' : fileRelDir, pathPart));
      }

      if (candidate === '' || candidate === '.') candidate = 'index.html';
      else if (candidate.endsWith('/')) candidate = candidate + 'index.html';

      let ok = existing.has(candidate);
      if (!ok && !path.extname(candidate)) {
        const asDir = candidate + '/index.html';
        if (existing.has(asDir)) { candidate = asDir; ok = true; }
      }

      if (!ok) {
        console.error(`  BROKEN: ${rel} -> ${href}`);
        broken++;
        continue;
      }

      if (hash) {
        const ids = idsByFile.get(candidate);
        if (ids && !ids.has(hash)) {
          console.error(`  BROKEN ANCHOR: ${rel} -> ${href} (no id="${hash}" in ${candidate})`);
          broken++;
        }
      }

      if (candidate !== rel) linked.add(candidate);
    }
  });

  // A page nothing links to is unreachable in practice, however well it renders.
  // Resolving links cannot catch that, so check reachability separately.
  const orphans = files
    .map(f => path.relative(DIST_DIR, f).split(path.sep).join('/'))
    .filter(rel => rel !== 'index.html' && !linked.has(rel) && !ORPHAN_ALLOWED.has(rel));

  if (orphans.length) {
    orphans.forEach(rel => console.error(`  ORPHAN: ${rel} (no page links to it)`));
    console.error(`\n✗ ${orphans.length} unreachable page(s).`);
    process.exitCode = 1;
  }

  if (broken > 0) {
    console.error(`\n✗ ${broken} broken internal link(s)/anchor(s).`);
    process.exitCode = 1;
  } else {
    console.log(`✓ All internal links resolve (${files.length} pages checked).`);
  }
}

// ---------- Main build ----------

function build() {
  console.log('Starting build...\n');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  ensureDir(DIST_DIR);

  // Parse every course's spine first so cross-course links resolve at render time.
  COURSES.forEach(course => {
    course.parts = parseSpine(course);
    course.flat = flattenSpine(course.parts);
    course.lessonSlugSet = new Set(course.flat.map(l => l.slug));
    console.log(`Spine (${course.id}): ${course.parts.length} parts, ${course.flat.length} lessons.`);
  });

  buildFrontDoor();
  buildLandingPages();

  COURSES.forEach(course => {
    buildCourseToc(course, course.parts, course.flat);
    buildLessonPages(course, course.flat);
  });

  buildLegacyPages();
  buildRedirects();

  copyStyles();
  copyImages();
  copyNextStep();

  generateSitemap();

  verifyLinks();

  console.log('\n✓ Build complete!');
  console.log(`Output directory: ${DIST_DIR}`);
}

build();
