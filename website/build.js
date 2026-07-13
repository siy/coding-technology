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

function parseSpine() {
  const raw = fs.readFileSync(path.join(BOOK_DIR, 'root.md'), 'utf-8');
  const lines = raw.split(/\r?\n/);
  const parts = [];
  const backMatter = [];
  let current = null;
  let inBackMatter = false;

  for (const line of lines) {
    const partMatch = line.match(/^## (Part [IVX]+) — (.+)$/);
    const backMatch = line.match(/^## Back matter\s*$/);
    if (partMatch) {
      current = { roman: partMatch[1].replace('Part ', ''), name: partMatch[2].trim(), lessons: [] };
      parts.push(current);
      inBackMatter = false;
      continue;
    }
    if (backMatch) {
      current = null;
      inBackMatter = true;
      continue;
    }
    const itemMatch = line.match(/^- \[(.+?)\]\(([a-z0-9-]+)\.md\)/);
    if (itemMatch) {
      const item = { title: itemMatch[1].trim(), slug: itemMatch[2].trim() };
      if (current) current.lessons.push(item);
      else if (inBackMatter) backMatter.push(item);
    }
  }
  return { parts, backMatter };
}

function flattenSpine(parts) {
  const flat = [];
  parts.forEach(part => {
    part.lessons.forEach((lesson, posInPart) => {
      flat.push({
        slug: lesson.slug,
        specTitle: lesson.title,
        partName: `Part ${part.roman} — ${part.name}`,
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

function rewriteBookLinks(markdown, courseSlugSet) {
  return markdown.replace(/\]\(([^)#\s]+\.md)((?:#[^)]*)?)\)/g, (match, target, anchor) => {
    const clean = target.replace(/^\.\//, '');
    if (clean === 'appendix-a-api-reference.md') return `](/java/jbct/reference/${anchor || ''})`;
    if (clean === 'appendix-c-glossary.md') return `](/method/glossary/${anchor || ''})`;
    if (clean === 'appendix-b-exercises.md') return `](/java/jbct/course/)`;
    const slug = clean.replace(/\.md$/, '');
    if (courseSlugSet.has(slug)) return `](/java/jbct/course/${slug}/${anchor || ''})`;
    console.warn(`  WARN: unrecognized book-internal link target "${target}" — left unresolved`);
    return match;
  });
}

// ---------- Course layer (course/jbct/<slug>.md) ----------

function parseCourseLayer(raw) {
  const sections = {};
  const re = /^## (blurb|learn|note|exercise)\s*\r?\n([\s\S]*?)(?=\r?\n## |\s*$)/gm;
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
      { href: '/method/', label: 'The Method', note: 'parent' },
      { href: '/method/architecture-synthesis/', label: 'Architecture Synthesis', note: 'next step' },
      { href: '/method/glossary/', label: 'Series glossary', note: 'reference' }
    ]
  },
  {
    src: 'website/content/architecture-synthesis.md', out: 'method/architecture-synthesis/index.html', fallbackTitle: 'Architecture Synthesis',
    crumb: crumbSub('/method/', 'The Method', 'Architecture Synthesis'), nav: 'method',
    related: [
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
  }
];

function buildLandingPages() {
  LANDING_PAGES.forEach(buildLandingPage);
}

// ---------- Course TOC ----------

function buildCourseToc(parts, flat) {
  const template = readTemplate('course-toc');
  const partsHtml = parts.map(part => {
    const slugs = part.lessons.map(l => l.slug);
    const svg = buildLatticeSVG(slugs, -1);
    const items = part.lessons.map((lesson, i) => {
      const layerPath = path.join(COURSE_DIR, `${lesson.slug}.md`);
      let blurb = '';
      if (fs.existsSync(layerPath)) {
        const sections = parseCourseLayer(fs.readFileSync(layerPath, 'utf-8'));
        blurb = sections.blurb || '';
      } else {
        console.warn(`  WARN: course/jbct/${lesson.slug}.md not found — TOC blurb omitted`);
      }
      return `<li><a href="/java/jbct/course/${lesson.slug}/"><span class="num">${i + 1}</span><span class="title">${escapeHtml(lesson.title)}</span>${blurb ? `<div class="blurb">${escapeHtml(blurb)}</div>` : ''}</a></li>`;
    }).join('\n      ');
    return `<div class="part-block">
      <h2>Part ${part.roman} — ${escapeHtml(part.name)}</h2>
      <div class="part-cap">${part.lessons.length} lesson${part.lessons.length === 1 ? '' : 's'}</div>
      ${svg}
      <ul class="lesson-list">
      ${items}
      </ul>
    </div>`;
  }).join('\n\n');

  const title = 'JBCT Course — pragmatica.dev';
  const description = 'The full JBCT method, chapter by chapter: six parts, twenty-two lessons, each pairing book prose with a short exercise. Free, no account required.';
  const intro = 'Twenty-two lessons across six parts. Each pairs the book’s prose with a short exercise; progress is tracked locally in your browser, no account required.';

  const html = template
    .replace(/{{TITLE}}/g, escapeAttr(title))
    .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
    .replace(/{{CANONICAL_URL}}/g, SITE_URL + '/java/jbct/course/')
    .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
    .replace('{{INTRO}}', escapeHtml(intro))
    .replace('{{PARTS}}', partsHtml);

  writePage(path.join(DIST_DIR, 'java', 'jbct', 'course', 'index.html'), html, SITE_URL + '/java/jbct/course/');
}

// ---------- Lesson pages ----------

function buildLessonPages(flat, courseSlugSet) {
  const template = readTemplate('lesson');

  flat.forEach((lesson, i) => {
    const chapterPath = path.join(BOOK_DIR, `${lesson.slug}.md`);
    if (!fs.existsSync(chapterPath)) {
      console.warn(`  WARN: book/${lesson.slug}.md not found — skipping lesson`);
      return;
    }
    const rawChapter = fs.readFileSync(chapterPath, 'utf-8');
    const { body: chapterBody } = stripFrontMatter(rawChapter);
    const { title: h1Title, body: strippedBody } = stripLeadingH1(chapterBody);
    const title = h1Title || lesson.specTitle;
    const rewritten = rewriteBookLinks(strippedBody, courseSlugSet);
    const bodyHtml = md.render(rewritten);

    const layerPath = path.join(COURSE_DIR, `${lesson.slug}.md`);
    let sections = {};
    if (fs.existsSync(layerPath)) {
      sections = parseCourseLayer(fs.readFileSync(layerPath, 'utf-8'));
    } else {
      console.warn(`  WARN: course/jbct/${lesson.slug}.md not found — lesson rendered without course-layer blocks`);
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
    const description = sections.blurb || extractFirstParagraph(chapterBody) || `${title} — JBCT course.`;

    const latticeSvg = buildLatticeSVG(lesson.partSlugs, lesson.posInPart);

    const prev = i > 0 ? flat[i - 1] : null;
    const next = i < flat.length - 1 ? flat[i + 1] : null;
    const prevLink = prev
      ? `<a class="prev" href="/java/jbct/course/${prev.slug}/">&larr; ${escapeHtml(prev.specTitle)}</a>`
      : `<a class="prev" href="/java/jbct/course/">&larr; Course contents</a>`;
    const nextLink = next
      ? `<a class="next" href="/java/jbct/course/${next.slug}/">Next: ${escapeHtml(next.specTitle)} &rarr;</a>`
      : `<a class="next" href="/java/jbct/course/">Next: Course contents &rarr;</a>`;

    const canonicalUrl = `${SITE_URL}/java/jbct/course/${lesson.slug}/`;

    const html = template
      .replace(/{{TITLE}}/g, escapeAttr(`${title} — JBCT course`))
      .replace(/{{DESCRIPTION}}/g, escapeAttr(description))
      .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
      .replace(/{{STYLE_HASH}}/g, STYLE_HASH)
      .replace(/{{PART_NAME}}/g, escapeHtml(lesson.partName))
      .replace('{{TITLE_TEXT}}', escapeHtml(title))
      .replace('{{LATTICE_SVG}}', latticeSvg)
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

    writePage(path.join(DIST_DIR, 'java', 'jbct', 'course', lesson.slug, 'index.html'), html, canonicalUrl);
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
    }
  });

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

  const { parts, backMatter } = parseSpine();
  const flat = flattenSpine(parts);
  const courseSlugSet = new Set(flat.map(l => l.slug));

  console.log(`Spine: ${parts.length} parts, ${flat.length} lessons.`);

  buildFrontDoor();
  buildLandingPages();
  buildCourseToc(parts, flat);
  buildLessonPages(flat, courseSlugSet);
  buildLegacyPages();
  buildRedirects();

  copyStyles();
  copyImages();

  generateSitemap();

  verifyLinks();

  console.log('\n✓ Build complete!');
  console.log(`Output directory: ${DIST_DIR}`);
}

build();
