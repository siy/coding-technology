'use strict';

// slug.test.js -- pins the heading-slug MECHANISM against a table of awkward headings.
//
// WHY THIS EXISTS
// Heading anchors are URLs. A changed anchor is a dead inbound link from anywhere on
// the internet, and it fails silently: the build's own link check reads `id=` out of
// the HTML it just emitted and compares hrefs against that same set, so a slug change
// moves the id and the header-anchor href together and the check stays green. That was
// verified by mutation twice on this branch -- one probe made the slugifier keep
// periods, moving 77 anchors, and `npm run build` still printed
// "All internal links resolve (89 pages checked)".
//
// The corpus is deliberately NOT the fixture here. A 1,414-line list of every anchor the
// site emits would redden on every legitimate heading edit and train people to
// regenerate it reflexively. This pins the algorithm instead, so it reddens only when
// the slug mechanism itself changes.
//
// WHY IT EXERCISES THE REAL PATH
// The slugging lives in website/lib/site.lua and runs inside pandoc. This test calls the
// real render() from website/lib/render.js, which spawns the real pandoc with the real
// site.lua, and reads the `id=` attributes pandoc emitted. Nothing here reimplements the
// algorithm and compares it against itself -- an instrument built from the same premise
// as the thing it checks cannot falsify that premise.
//
// The one JS statement of the algorithm below (RETIRED_githubSlugify) is NOT a
// reimplementation: it is the verbatim pre-migration function from
// `git show 2c7bf5e^:website/build.js` lines 9-15, the code that actually shipped the
// live site's anchors. site.lua claims to be a byte-exact port OF IT, so the two
// disagreeing is precisely the bug that would ship. The literal table below stays the
// primary pin; the oracle is a second, independently-sourced statement of the same rule.
//
// pandoc is a HARD requirement. This file must never skip itself when pandoc is absent
// -- a gate that reports success while examining nothing is worse than no gate. render()
// throws a named error in that case, and the first test below fails loudly on it.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const { render } = require('./render');

// ---------- the table ----------
//
// One row per class where slug implementations actually differ. Non-ASCII characters in
// the headings are deliberate test data, not typos. U+00A0 is written as an escape
// because it is invisible in a source file and would not survive a careless edit; the
// visible non-ASCII (curly apostrophe, em dash, accented letters, CJK) is left literal so
// the row is readable.
//
// Expected values were read off the real pipeline. Every row is ALSO cross-checked
// against the retired markdown-it slugifier by the last test in this file, on every run,
// so a row whose expectation was mis-transcribed fails there as well as here.
const TABLE = [
  ['backticks and angle brackets', '`Result<T>` and `Option<T>`', 'resultt-and-optiont'],
  ['ampersand', 'Errors & Recovery', 'errors-recovery'],
  ['comma and curly apostrophe', 'Parse, don’t validate', 'parse-dont-validate'],
  ['em dash', 'Spiral 3 — Subsystem', 'spiral-3-subsystem'],
  ['parentheses', 'The Free Lunch (and who pays)', 'the-free-lunch-and-who-pays'],
  ['hash', 'C# vs Java #2', 'c-vs-java-2'],
  ['pipe', 'A | B | C', 'a-b-c'],
  ['tilde', 'Approximately ~100ms', 'approximately-100ms'],
  ['digits and dots', 'Retry 1..100 times', 'retry-1100-times'],
  ['version string', 'Pandoc 3.8.3-rc1', 'pandoc-383-rc1'],
  ['consecutive spaces collapse', 'Two  consecutive   spaces', 'two-consecutive-spaces'],
  // The ATX parser strips source-level whitespace before pandoc builds the AST, so this
  // row pins the END-TO-END result and NOT slugify's own trim: deleting that trim leaves
  // this row green. The two image rows below are what actually reach it.
  ['leading and trailing whitespace', '   Leading and trailing whitespace   ', 'leading-and-trailing-whitespace'],
  // JS \w without /u is ASCII-only, so accented letters are DROPPED, never transliterated.
  ['non-ASCII letters are dropped', 'Café — naïve résumé', 'caf-nave-rsum'],
  ['underscore survives, hyphen survives', 'snake_case and kebab-case', 'snake_case-and-kebab-case'],
  ['currency, percent, arithmetic', '100% — $5 + 5 = 10', '100-5-5-10'],
  ['U+00A0 counts as whitespace', 'A non\u00a0breaking space', 'a-non-breaking-space'],
  // Emphasis and link CONTENTS count toward the slug; images and raw HTML tags do not.
  ['emphasis and link contents count', '**Bold** and *italic* and [a link](https://x.test)', 'bold-and-italic-and-a-link'],
  ['raw HTML tags drop, their text stays', '<span>raw html</span> tail', 'raw-html-tail'],
  // An image contributes nothing to the anchor text, but the Space beside it still does.
  // These two are therefore the ONLY inputs in this table that hand slugify a string with
  // whitespace at an edge, which makes them the rows that pin its trim -- verified by
  // mutation: deleting the trim reddens these and leaves the whitespace row above green.
  ['image drops, leading space is trimmed', '![alt text](/image/x.png) after', 'after'],
  ['image drops, trailing space is trimmed', 'before ![alt text](/image/x.png)', 'before'],
  ['trailing punctuation', 'Trailing punctuation!?', 'trailing-punctuation'],
  ['colon and slash', 'HTTP: GET /api/v1', 'http-get-apiv1'],
  ['tab inside the heading', 'Tab\there', 'tab-here'],
  // `+smart` is on, so ASCII punctuation is typographed BEFORE it is slugged: the
  // straight apostrophe becomes U+2019 and is then dropped, `---` becomes an em dash,
  // `...` becomes an ellipsis. The slug is computed from the typographed text.
  ['smart quotes: straight apostrophe', 'Don\'t stop', 'dont-stop'],
  ['smart quotes: straight double quotes', 'The "free lunch" is over', 'the-free-lunch-is-over'],
  ['smart dashes: three hyphens', 'Spiral 3 --- Subsystem', 'spiral-3-subsystem'],
  ['smart ellipsis: three dots', 'And so on...', 'and-so-on'],
  ['a heading that slugs to nothing', '日本語', ''],
];

// ---------- helpers over the REAL rendered HTML ----------

const HEADER_RE = /<h([1-6]) id="([^"]*)" tabindex="-1"><a class="header-anchor" href="#([^"]*)">([\s\S]*?)<\/a><\/h\1>/g;

function headers(markdown) {
  const html = render(markdown);
  const out = [];
  for (const m of html.matchAll(HEADER_RE)) {
    out.push({ level: Number(m[1]), id: m[2], href: m[3], inner: m[4] });
  }
  assert.ok(out.length > 0, `no <hN id=...> emitted for ${JSON.stringify(markdown)}; got:\n${html}`);
  return out;
}

const idOf = heading => headers(`# ${heading}\n`)[0].id;

// ---------- tests ----------

test('pandoc is present AND can read the site dialect (fails, never skips, if not)', () => {
  let version;
  try {
    version = execFileSync('pandoc', ['--version'], { encoding: 'utf-8' }).split('\n')[0];
  } catch (cause) {
    assert.fail(
      'pandoc is not on PATH. website/lib/render.js requires it and website/lib/site.lua ' +
      'runs inside it, so these slug assertions cannot be evaluated. This test fails ' +
      'rather than skipping on purpose: a green gate that examined nothing is worse than ' +
      `a missing one. Install pandoc (CI does so via .github/actions/setup-pandoc). ${cause}`);
  }
  // Quote what ran, not the exit status. Slugs depend on pandoc's reader (`+smart`
  // typography in particular), so the version is part of the evidence.
  console.log(`        pandoc in use: ${version}`);
  assert.match(version, /^pandoc \d+\./);

  // PRESENCE IS NOT THE CONSTRAINT. Netlify's build image bakes in pandoc 2.13 -- new
  // enough to answer `--version`, too old to accept render.js's reader spec. Checking
  // only the first would let this named test report "installed" in green while the 35
  // assertions below fail one at a time. Measured against a stub impersonating 2.13:
  // with the version check alone the suite read `pass 1, fail 35`; driving a real render
  // here makes it `pass 0, fail 36` with render.js's own message arriving first.
  const html = render('# Errors & Recovery\n');
  assert.match(html, /<h1 id="errors-recovery"/,
    'pandoc ran but did not produce the expected anchor markup');
});

test(`the slug table: ${TABLE.length} rows through real pandoc + site.lua`, async t => {
  for (const [label, heading, expected] of TABLE) {
    await t.test(label, () => {
      assert.equal(idOf(heading), expected, `heading ${JSON.stringify(heading)}`);
    });
  }
});

test('the header-anchor href always equals the id it points at', () => {
  // The build's link check leans on this: it resolves every href against the ids in the
  // emitted HTML. If these two ever drift apart the check starts reporting real breakage.
  for (const [, heading] of TABLE) {
    const h = headers(`# ${heading}\n`)[0];
    assert.equal(h.href, h.id, `heading ${JSON.stringify(heading)}`);
  }
});

test('duplicate headings get distinct ids: base, then -1, -2 ...', () => {
  const ids = headers('# Testing\n\n## Testing\n\n### Testing\n').map(h => h.id);
  assert.deepEqual(ids, ['testing', 'testing-1', 'testing-2']);
});

test('a heading that collides with a generated suffix is suffixed again', () => {
  // "Testing-1" slugs to `testing-1`, which the second "Testing" already took, so the
  // counter runs again from 1 on the NEW base. Pinned because it is the one case where
  // the id does not look like any single rule applied once.
  const ids = headers('# Testing\n\n## Testing\n\n### Testing-1\n').map(h => h.id);
  assert.deepEqual(ids, ['testing', 'testing-1', 'testing-1-1']);
});

test('the empty slug is a real id, and it dedupes like any other', () => {
  // Two headings made entirely of dropped characters produce id="" and id="-1".
  // id="" is not linkable; this pins it as OBSERVED BEHAVIOUR, not as desirable.
  const ids = headers('# 日本語\n\n## €\n').map(h => h.id);
  assert.deepEqual(ids, ['', '-1']);
});

test('the duplicate counter resets per render() call, not per page', () => {
  // build.js makes up to four render() calls for one lesson page (body, learn box, note,
  // exercise). One pandoc process per call means the `seen` table in site.lua resets
  // between them, so a heading repeated ACROSS those sections gets no suffix. This is
  // inherited from markdown-it-anchor, which also kept its slug table per render().
  assert.equal(idOf('Testing'), 'testing');
  assert.equal(idOf('Testing'), 'testing', 'a second render() call must start clean');
});

// ---------- the independently-sourced oracle ----------

// VERBATIM from `git show 2c7bf5e^:website/build.js` lines 9-15 -- the markdown-it
// slugifier that produced every anchor on the live site before this branch. Copied, not
// rewritten: retyping it from site.lua would make it agree with site.lua by construction
// and prove nothing.
function RETIRED_githubSlugify(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

// site.lua's anchor_text() concatenates Str/Space/Code and recurses into emphasis and
// links, contributing nothing for images, raw HTML and notes. Stripping tags from the
// rendered anchor body and unescaping entities reproduces that from the HTML side.
function anchorTextOf(inner) {
  return inner
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&');
}

test('the retired markdown-it slugifier and the Lua path agree on every row', () => {
  // A silent divergence between these two is exactly the bug that ships a moved anchor.
  // Sanity-check the oracle first, so a gutted copy of it cannot pass vacuously.
  assert.equal(RETIRED_githubSlugify('Errors & Recovery'), 'errors-recovery');
  assert.notEqual(RETIRED_githubSlugify('Errors & Recovery'), 'errors-and-recovery');

  const disagreements = [];
  for (const [label, heading] of TABLE) {
    const h = headers(`# ${heading}\n`)[0];
    const oracle = RETIRED_githubSlugify(anchorTextOf(h.inner));
    if (oracle !== h.id) disagreements.push(`${label}: lua=${JSON.stringify(h.id)} js=${JSON.stringify(oracle)}`);
  }
  assert.deepEqual(disagreements, [], `${TABLE.length} rows compared`);
});
