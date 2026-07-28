// rules.js — the entry gate's rule tables, transcribed from the book.
//
// Source of truth: book-arch/appendix-reference-cards.md (Cards 1 and 3) and
// book-arch/answer-sheet.md. Where this file and the book disagree, the book wins
// and this file has a bug.
//
// These tables are candidates for generation via ai-tools/sync-book-blocks.py once
// the corresponding book sections are stable enough to extract by heading.

// Card 1 — the nine questions, with the scope each answer must carry.
// "scopes: null" means the question does not fix a single unit; the gate does not
// second-guess scope for those (Q6 is scoped by a mandate's reach, Q7 spans the
// components whose cadence diverges, Q9 varies per dimension).
export const QUESTIONS = {
  q1: {
    title: 'Time budget',
    demand: 'per operation: percentiles, tails, soft maxima, windows',
    scopes: ['operation', 'path'],
    priced: true,
    triage: 'clock',
  },
  q2: {
    title: 'Failure budget',
    demand: 'per operation: error budget + criticality',
    // PROVISIONAL RULING, reversible. Card 1 says "per operation", but Q2 bundles two
    // answers that live at different scopes: an ERROR BUDGET, which is normally a
    // service-level commitment, and CRITICALITY, which genuinely is per operation. Both
    // published sheets that state a service-level availability target answer at system
    // scope — Companies House ("Digital services available for a minimum of 99.5%") and
    // the venue ("Service availability: 99.5%") — and Companies House then records
    // per-operation criticality separately as UNKNOWN, which is the honest shape.
    //
    // So `system` is accepted here, and a note reports when per-operation criticality is
    // unstated. The real fix is in the book: Q2 should be decomposed the way "audit" and
    // "team independence" already are. Until then the gate follows the examples rather
    // than refusing them.
    scopes: ['operation', 'path', 'system'],
    priced: true,
    pricedAs: 'nines',
    triage: 'target',
    notePerOperation: true,
  },
  q3: {
    title: 'Loss budget',
    demand: 'per data class: RPO, retention, never-lose set',
    scopes: ['data-class'],
  },
  q4: {
    title: 'Consistency contract',
    demand: 'per data class/path: strict / bounded (named bound) / eventual; read-your-writes where?',
    scopes: ['data-class', 'path'],
  },
  q5: {
    title: 'Load',
    demand: 'magnitude (steady/peak), shape per path, concentration, window',
    // The whole load answer is per path, not merely its shape:
    // "load answers are only meaningful per path" (answer-sheet.md:35).
    scopes: ['path'],
    requiresShape: true,
  },
  q6: {
    title: 'External constraints',
    demand: 'audit (who/what/when) vs replay (state under past rules); residency pins; mandates that strike values',
    scopes: null,
    requiresKind: ['audit', 'replay', 'residency', 'mandate'],
  },
  q7: {
    title: 'Release structure',
    demand: 'cadence divergence; deploy safety',
    scopes: null,
  },
  q8: {
    title: 'Cost & capacity envelope',
    demand: 'money + who operates',
    // Legitimately whole-system: it is the envelope, not a per-unit demand.
    scopes: ['system'],
  },
  q9: {
    title: 'Multi-X',
    demand: 'countries/currencies/tenants/regions/versions: partition gifts + legal pins',
    scopes: null,
  },
};

// Card 3 — "Would a second copy help?"
export const LOAD_SHAPES = ['volume', 'contention', 'burst', 'deadline'];

// Card 3 — time-answer triage.
export const CLOCKS = ['requester-clock', 'system-clock'];

// Card 4 — containment rungs, in order. Carried for the press stage (not yet built).
export const RUNGS = ['hardware sizing', 'cache', 'coalescing', 'replicas', 'projections'];

// answer-sheet.md:47 — "One system-level number is how bare adjectives sneak back
// wearing digits. The banned vocabulary is worth naming: 'scalability', 'high
// availability', 'performance' (words that hide both the scope and the shape of a
// demand)."
export const BANNED_ADJECTIVES = [
  'scalability',
  'scalable',
  'high availability',
  'highly available',
  'performance',
  'performant',
  'robust',
  'reliable',
  'fast',
  'best effort',
  'best-effort',
];

// Scope prefixes the sheet may use. Scope is a typed string so the scope test and
// the narrowest-scope rule stay machine-comparable.
export const SCOPE_KINDS = ['operation', 'data-class', 'path', 'policy', 'system'];

// Card 1 — bundled answers the gate refuses until they are split.
export const BUNDLES = [
  {
    id: 'team-independence',
    match: /\bteam\s+independen|\bindependent\s+teams?\b/i,
    split: 'ownership is not release independence — state which one this answer buys',
  },
  {
    id: 'audit',
    match: /\baudit\b/i,
    // Only fires when q6.kind is absent; audit and replay are different demands.
    requiresKind: true,
    split: 'audit (who/what/when) is not replay (state under past rules) — set kind',
  },
];

// The book's own five halts (when-derivation-says-no.md). Carried so the emitter can
// name them; only the knowledge gap is reachable from the entry gate alone.
export const HALTS = {
  contradiction: 'No vector satisfies the answers.',
  'infeasible-intermediate': 'The target derives cleanly and no operable path leads there.',
  'trapped-state': 'The current position was never forced, and the exit costs more than the occupancy.',
  'knowledge-gap': 'Answers come back UNKNOWN on rows the derivation cannot proceed without.',
  'unexplored-territory': 'The answers are real and priced, and the ledger has no entry that contains them.',
};
