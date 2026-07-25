// engine.js — `next_step check`: the entry gate as an executable.
//
// Scope, deliberately: this is the gate and the bookkeeping, not the oracle. It
// validates an answer sheet the way the book's entry gate does and reports what is
// missing. It does not derive a vector, and it never resolves a judgment point.
// Deriving (press/resolve/verify) is the next stage and slots in after `check`.
//
// Pure module: no DOM, no I/O. Runs identically in a browser and in node.

import {
  BANNED_ADJECTIVES,
  BUNDLES,
  CLOCKS,
  LOAD_SHAPES,
  QUESTIONS,
  SCOPE_KINDS,
} from './rules.js';

// ---------- TOML (the subset the sheet schema uses) ----------

const BARE = /^[A-Za-z0-9_-]+$/;

function parseValue(raw, line) {
  const text = raw.trim();
  if (!text) return { error: 'missing value' };

  if (text[0] === '"' || text[0] === "'") {
    const quote = text[0];
    if (text.length < 2 || text[text.length - 1] !== quote) return { error: 'unterminated string' };
    return { value: text.slice(1, -1) };
  }
  if (text === 'true') return { value: true };
  if (text === 'false') return { value: false };

  if (text[0] === '[') {
    if (text[text.length - 1] !== ']') return { error: 'unterminated array' };
    const items = splitTop(text.slice(1, -1));
    const out = [];
    for (const item of items) {
      const parsed = parseValue(item, line);
      if (parsed.error) return parsed;
      out.push(parsed.value);
    }
    return { value: out };
  }
  if (text[0] === '{') {
    if (text[text.length - 1] !== '}') return { error: 'unterminated inline table' };
    const table = {};
    for (const pair of splitTop(text.slice(1, -1))) {
      const eq = pair.indexOf('=');
      if (eq === -1) return { error: 'inline table entry without =' };
      const parsed = parseValue(pair.slice(eq + 1), line);
      if (parsed.error) return parsed;
      table[stripQuotes(pair.slice(0, eq).trim())] = parsed.value;
    }
    return { value: table };
  }
  if (/^-?\d+$/.test(text)) return { value: Number(text) };
  if (/^-?\d*\.\d+$/.test(text)) return { value: Number(text) };
  // Dates and anything else stay strings; the gate never does date arithmetic.
  return { value: text };
}

// Split on top-level commas, ignoring those inside quotes, brackets or braces.
function splitTop(text) {
  const parts = [];
  let depth = 0, quote = null, current = '';
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    if (ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts.map(p => p.trim()).filter(Boolean);
}

function stripQuotes(key) {
  return (key[0] === '"' || key[0] === "'") ? key.slice(1, -1) : key;
}

function descend(root, path, line, errors) {
  let node = root;
  for (const rawKey of path) {
    const key = stripQuotes(rawKey);
    if (!BARE.test(key) && key === rawKey) {
      errors.push({ line, code: 'TOML', message: `invalid key '${key}'` });
      return null;
    }
    if (Array.isArray(node[key])) node = node[key][node[key].length - 1];
    else node = (node[key] = node[key] || {});
    if (typeof node !== 'object') {
      errors.push({ line, code: 'TOML', message: `'${key}' is a value, not a table` });
      return null;
    }
  }
  return node;
}

/** Parse the TOML subset the sheet schema uses. Returns {sheet, errors, lines}. */
export function parseToml(text) {
  const root = {};
  const errors = [];
  const lines = {};           // "answers.q1[0]" -> source line, for diagnostics
  const counters = {};
  let current = root;
  let currentPath = [];

  const raw = String(text).split(/\r?\n/);
  for (let i = 0; i < raw.length; i++) {
    let line = raw[i];
    const lineNo = i + 1;

    // Strip comments outside strings.
    let quote = null, cut = -1;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (quote) { if (ch === quote) quote = null; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '#') { cut = c; break; }
    }
    if (cut >= 0) line = line.slice(0, cut);
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('[[') && line.endsWith(']]')) {
      const path = line.slice(2, -2).trim().split('.').map(s => s.trim());
      const parent = descend(root, path.slice(0, -1), lineNo, errors);
      if (!parent) continue;
      const key = stripQuotes(path[path.length - 1]);
      parent[key] = parent[key] || [];
      if (!Array.isArray(parent[key])) {
        errors.push({ line: lineNo, code: 'TOML', message: `'${key}' is not an array of tables` });
        continue;
      }
      const entry = {};
      parent[key].push(entry);
      const id = `${path.join('.')}[${parent[key].length - 1}]`;
      counters[path.join('.')] = parent[key].length;
      lines[id] = lineNo;
      current = entry;
      currentPath = [id];
      continue;
    }

    if (line.startsWith('[') && line.endsWith(']')) {
      const path = line.slice(1, -1).trim().split('.').map(s => s.trim());
      const node = descend(root, path, lineNo, errors);
      if (!node) continue;
      lines[path.join('.')] = lineNo;
      current = node;
      currentPath = [path.join('.')];
      continue;
    }

    const eq = line.indexOf('=');
    if (eq === -1) {
      errors.push({ line: lineNo, code: 'TOML', message: `expected 'key = value'` });
      continue;
    }
    const key = stripQuotes(line.slice(0, eq).trim());
    let valueText = line.slice(eq + 1).trim();

    // Join continuation lines until brackets/braces balance.
    if (/^[[{]/.test(valueText)) {
      let depth = 0, quoted = null;
      const balance = t => {
        for (const ch of t) {
          if (quoted) { if (ch === quoted) quoted = null; continue; }
          if (ch === '"' || ch === "'") { quoted = ch; continue; }
          if (ch === '[' || ch === '{') depth++;
          if (ch === ']' || ch === '}') depth--;
        }
      };
      balance(valueText);
      while (depth > 0 && i + 1 < raw.length) {
        i++;
        const next = raw[i].split('#')[0];
        valueText += ' ' + next.trim();
        balance(next);
      }
    }

    const parsed = parseValue(valueText, lineNo);
    if (parsed.error) {
      errors.push({ line: lineNo, code: 'TOML', message: `${parsed.error} for '${key}'` });
      continue;
    }
    current[key] = parsed.value;
    lines[`${currentPath[0]}.${key}`] = lineNo;
  }

  return { sheet: root, errors, lines };
}

// ---------- The entry gate ----------

function scopeKind(scope) {
  if (typeof scope !== 'string' || !scope) return null;
  if (scope === 'system') return 'system';
  const kind = scope.split(':')[0];
  return SCOPE_KINDS.includes(kind) ? kind : null;
}

function findBanned(statement) {
  const text = String(statement || '').toLowerCase();
  return BANNED_ADJECTIVES.filter(word => {
    const boundary = new RegExp(`(^|[^a-z])${word.replace(/[-\s]/g, '[-\\s]')}([^a-z]|$)`, 'i');
    return boundary.test(text);
  });
}

function hasNumber(statement) {
  return /\d/.test(String(statement || ''));
}

/**
 * Run the entry gate over a parsed sheet.
 * Returns {findings, notes, summary}. Findings block; notes do not.
 */
export function check(sheet, lines = {}) {
  const findings = [];
  const notes = [];
  const answers = (sheet && sheet.answers) || {};

  const at = id => lines[id] || null;
  const add = (code, id, message, card) =>
    findings.push({ code, row: id, line: at(id), message, card });

  // Sheet-level requirements.
  if (!sheet || !sheet.schema_version) {
    findings.push({ code: 'NO_SCHEMA_VERSION', row: null, line: null, card: 'spec §3',
      message: 'sheet has no schema_version' });
  }
  if (!sheet || !sheet.meta || !sheet.meta.era) {
    findings.push({ code: 'NO_ERA', row: 'meta', line: at('meta'), card: 'spec §3',
      message: 'era-pinning is mandatory — a sheet without an era cannot be compared to an outcome' });
  }

  const effectful = new Set();
  const shaped = new Set(
    ((sheet && sheet.domain_shape) || []).map(row => row && row.operation).filter(Boolean)
  );

  let answered = 0;
  let unknown = 0;

  for (const [qid, spec] of Object.entries(QUESTIONS)) {
    const rows = answers[qid];
    if (!Array.isArray(rows) || rows.length === 0) {
      notes.push({ code: 'NO_ROWS', row: qid, line: null, card: 'Card 1',
        message: `${qid} (${spec.title}) has no rows — the derivation will carry it as UNKNOWN` });
      continue;
    }

    rows.forEach((row, index) => {
      const id = `answers.${qid}[${index}]`;
      const status = row.status || 'answered';

      if (status === 'UNKNOWN') {
        unknown++;
        notes.push({ code: 'UNKNOWN', row: id, line: at(id), card: 'Appendix A',
          message: `${qid} at ${row.scope || '(no scope)'} is UNKNOWN — recorded, never guessed` });
        return;   // UNKNOWN is valid input; the remaining disciplines do not apply.
      }
      answered++;

      // --- Scoped ---
      const kind = scopeKind(row.scope);
      if (!row.scope) {
        add('UNSCOPED', id, `${qid} row has no scope — ${spec.demand}`, 'Card 1');
      } else if (!kind) {
        add('UNSCOPED', id, `scope '${row.scope}' is not one of ${SCOPE_KINDS.join(' / ')}`, 'Card 1');
      } else if (spec.scopes && !spec.scopes.includes(kind)) {
        add('UNSCOPED', id,
          `${qid} is answered at '${kind}' scope but demands ${spec.scopes.join(' or ')} — ${spec.demand}`,
          'Card 1');
      }

      // --- Surfaced as a real demand, not an adjective ---
      const banned = findBanned(row.statement);
      if (banned.length) {
        add('BARE_ADJECTIVE', id,
          `'${banned[0]}' hides both the scope and the shape of a demand — state the number`,
          'answer-sheet.md:47');
      }
      if (!row.statement) {
        add('NO_STATEMENT', id, `${qid} row has no statement`, 'Card 1');
      } else if (!hasNumber(row.statement) && !banned.length) {
        notes.push({ code: 'NO_NUMBER', row: id, line: at(id), card: 'Appendix A',
          message: `${qid} statement carries no number — "every answer needs a number and a scope"` });
      }

      // --- Priced ---
      if (spec.priced && !row.price) {
        add('UNPRICED', id,
          `${qid} carries no price — what does the business do differently in the fifty-third minute?`,
          'Card 1');
      }

      // --- Triaged ---
      if (spec.triage === 'clock' && !row.shape) {
        add('UNTRIAGED', id,
          `time answer without a clock — ${CLOCKS.join(' (statutory window, inert) vs ')} (response target, presses)`,
          'Card 3');
      } else if (spec.triage === 'clock' && !CLOCKS.includes(row.shape)) {
        add('UNTRIAGED', id, `clock '${row.shape}' is not one of ${CLOCKS.join(' / ')}`, 'Card 3');
      }
      if (spec.triage === 'target' && row.observed && !row.target) {
        add('UNTRIAGED', id, 'an observed failure is not a stated target — state the target', 'Card 1');
      }

      // --- Shape (Q5) ---
      if (spec.requiresShape) {
        if (!row.shape) {
          add('MISSING_SHAPE', id,
            `load answer without a shape — would a second copy help? ${LOAD_SHAPES.join(' / ')}`,
            'Card 3');
        } else if (!LOAD_SHAPES.includes(row.shape)) {
          add('MISSING_SHAPE', id, `shape '${row.shape}' is not one of ${LOAD_SHAPES.join(' / ')}`, 'Card 3');
        }
      }

      // --- Decomposed ---
      if (spec.requiresKind && !row.kind) {
        add('UNDECOMPOSED', id,
          `${qid} row without kind — audit (who/what/when) is not replay (state under past rules)`,
          'Card 1');
      } else if (spec.requiresKind && !spec.requiresKind.includes(row.kind)) {
        add('UNDECOMPOSED', id,
          `kind '${row.kind}' is not one of ${spec.requiresKind.join(' / ')}`, 'Card 1');
      }
      for (const bundle of BUNDLES) {
        if (bundle.requiresKind && row.kind) continue;
        if (bundle.match.test(String(row.statement || ''))) {
          add('UNDECOMPOSED', id, `bundled answer — ${bundle.split}`, 'Card 1');
        }
      }

      if (kind === 'operation' && row.scope) effectful.add(row.scope.split(':')[1]);
    });
  }

  // --- Domain shape: recovery cannot be derived without it ---
  for (const operation of effectful) {
    if (!shaped.has(operation)) {
      findings.push({ code: 'MISSING_DOMAIN_SHAPE', row: `operation:${operation}`, line: null,
        card: 'Card 1',
        message: `operation '${operation}' has no domain-shape row — recovery cannot be derived without inverse / decay / reshapeable` });
    }
  }

  const blocking = findings.length;
  return {
    findings,
    notes,
    summary: {
      answered,
      unknown,
      blocking,
      passed: blocking === 0,
      // Exit codes follow spec §5: 0 clean · 1 gate errors. Halts (2) and pending
      // judgment points (3) belong to `derive`, which is not built yet.
      exitCode: blocking === 0 ? 0 : 1,
    },
  };
}

/** Convenience: parse then check. TOML errors are themselves gate findings. */
export function checkSheet(text) {
  const { sheet, errors, lines } = parseToml(text);
  if (errors.length) {
    return {
      findings: errors.map(e => ({ ...e, row: null, card: 'TOML' })),
      notes: [],
      summary: { answered: 0, unknown: 0, blocking: errors.length, passed: false, exitCode: 1 },
    };
  }
  return check(sheet, lines);
}
