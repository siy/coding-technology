'use strict';

// Markdown -> HTML for the site build. Replaces markdown-it + markdown-it-anchor
// -- 11 package installs in all, 9 of them transitive -- with the pandoc the
// book build scripts already require. The dependency being removed is a
// supply-chain surface, not a slow one; nothing here is a performance change,
// and pandoc is a build-time tool only (nothing ships to the browser).
//
// The reader extensions below are chosen to match the retired markdown-it
// configuration, not to get pandoc's best output:
//   html: true       -> raw_html (on in gfm)
//   linkify: true    -> autolink_bare_uris (on in gfm)
//   typographer:true -> smart
//   breaks: false    -> no hard_line_breaks
// and the gfm extras markdown-it had no plugin for are switched OFF, so a
// task list, footnote, emoji shortcode or GitHub alert keeps rendering as the
// literal text it renders as today.
//
// Heading ids, fenced code, <hr> and <s> are handled in lib/site.lua.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { highlight } = require('./highlight');

const FILTER = path.join(__dirname, 'site.lua');

const FROM = [
  'gfm',
  '+smart',
  '-emoji',
  '-footnotes',
  '-task_lists',
  '-alerts',
  '-tex_math_dollars',
  '-tex_math_gfm',
  '-yaml_metadata_block',
  '-gfm_auto_identifiers'
].join('');

let channelSeq = 0;
let checked = false;

// pandoc is a hard build dependency now, and "pandoc exists" is NOT the check
// that matters. Netlify's build image bakes in its own pandoc (2.13 on the
// focal image, per netlify/build-image's Dockerfile) — old enough to reject
// the reader spec below, new enough that an existence check sails past it and
// the build fails later with something obscure.
//
// So probe the thing that actually has to hold: that THIS pandoc accepts the
// exact FROM string we render with. That is the constraint pandoc's own
// extension parser enforces, rather than a version number standing in for it,
// and it stays true when 3.8.4 ships. The exact version is pinned separately
// in .github/actions/setup-pandoc, where reproducibility is the point.
function requirePandoc() {
  if (checked) return;

  let version;
  try {
    version = execFileSync('pandoc', ['--version'], { encoding: 'utf-8' })
      .split('\n')[0].trim();
  } catch {
    throw new Error(
      'pandoc not found on PATH. The site build requires it (as the book build ' +
      'scripts already do). Install it, or add a pinned pandoc step to CI.');
  }

  try {
    execFileSync('pandoc', ['--from', FROM, '--to', 'html5'],
      { input: '', stdio: ['pipe', 'ignore', 'pipe'] });
  } catch (e) {
    throw new Error(
      `${version} cannot read the site's markdown dialect, so heading anchors ` +
      'and typography would not match what the slug gate pins. pandoc 3.x is ' +
      'required (tested on 3.8.3, which CI installs via ' +
      '.github/actions/setup-pandoc).\n  reader: ' + FROM +
      '\n  pandoc said: ' + String(e.stderr || '').trim().split('\n')[0]);
  }

  checked = true;
}

// Reads the length-prefixed code records lib/site.lua wrote for this render.
function readCodeChannel(file) {
  if (!fs.existsSync(file)) return [];
  const buf = fs.readFileSync(file);
  const blocks = [];
  let at = 0;
  while (at < buf.length) {
    const nl = buf.indexOf(0x0a, at);
    if (nl < 0) break;
    const [index, lang, length] = buf.toString('utf-8', at, nl).split(' ');
    const start = nl + 1;
    const end = start + Number(length);
    blocks[Number(index)] = {
      lang: lang === '-' ? '' : lang,
      code: buf.toString('utf-8', start, end)
    };
    at = end + 1;
  }
  return blocks;
}

function render(markdown) {
  if (typeof markdown !== 'string' || markdown === '') return '';
  requirePandoc();

  const channel = path.join(
    os.tmpdir(), `site-code-${process.pid}-${channelSeq++}.bin`);

  try {
    const html = execFileSync(
      'pandoc',
      ['--from', FROM, '--to', 'html5', '--wrap=preserve', '--lua-filter', FILTER],
      {
        input: markdown,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, SITE_CODE_CHANNEL: channel }
      });

    const blocks = readCodeChannel(channel);

    // Two html5-writer habits markdown-it did not share. Both are applied while
    // code blocks are still @@SITECODE@@ sentinels, so neither can reach a
    // listing, and neither can destroy source text: no file in the repo
    // contains U+FE0E or a literal "<br />" (checked over book*/, articles/,
    // website/content, website/course, ai-tools/ and the root *.md).
    //   * U+FE0E is appended to characters that default to emoji presentation
    //     (the arrows in CHANGELOG.md and the agent docs) to force text
    //     rendering. markdown-it emitted the bare character.
    //   * <br /> is the XHTML spelling of markdown-it's <br>.
    return html
      .replace(/\uFE0E/g, '')
      .replace(/<br \/>/g, '<br>')
      .replace(/@@SITECODE:(\d+)@@/g, (_match, index) => {
        const block = blocks[Number(index)];
        if (!block) throw new Error(`render: code block ${index} lost in transit`);
        // Fences carry a trailing newline in markdown-it's fence renderer.
        return highlight(block.code + '\n', block.lang);
      });
  } finally {
    fs.rmSync(channel, { force: true });
  }
}

module.exports = { render };
