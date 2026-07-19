'use strict';

// Minimal build-time Java highlighter. Produces the mock's markup exactly:
// <pre><span class="c">...</span><span class="k">...</span><span class="s">...</span>plain-text</pre>
// No <code> wrapper, no external highlighter dependency — matches
// website-meta/mocks/lesson.html's pre/.c/.k/.s CSS contract.

const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'record', 'return', 'sealed',
  'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'var', 'void', 'volatile', 'while',
  'yield', 'permits', 'non-sealed', 'true', 'false', 'null'
]);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Tokenizes Java source into <span class="c|k|s">...</span> runs, everything
// else passed through HTML-escaped. Good enough for book code listings —
// not a full lexer (doesn't need to be; input is curated example code).
function highlightJava(code) {
  const tokenRe =
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g;

  let out = '';
  let last = 0;
  let m;
  while ((m = tokenRe.exec(code)) !== null) {
    out += escapeHtml(code.slice(last, m.index));
    const [full, lineComment, blockComment, string, word] = m;
    if (lineComment || blockComment) {
      out += `<span class="c">${escapeHtml(full)}</span>`;
    } else if (string) {
      out += `<span class="s">${escapeHtml(full)}</span>`;
    } else if (word && JAVA_KEYWORDS.has(word)) {
      out += `<span class="k">${escapeHtml(full)}</span>`;
    } else {
      out += escapeHtml(full);
    }
    last = tokenRe.lastIndex;
  }
  out += escapeHtml(code.slice(last));
  return out;
}

// markdown-it `highlight` option: return value starting with "<pre" is used
// verbatim (bypasses markdown-it's own <pre><code> wrapper), so this fully
// controls fenced-code markup for every language, keeping one consistent
// box regardless of whether it's colored.
function highlight(code, lang) {
  const body = lang && lang.toLowerCase() === 'java' ? highlightJava(code) : escapeHtml(code);
  return `<pre>${body}</pre>`;
}

module.exports = { highlight, highlightJava, escapeHtml };
