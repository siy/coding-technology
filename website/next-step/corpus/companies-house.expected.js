// companies-house.expected.js — the acceptance criteria for the Companies House run.
//
// Transcribed from runs/companies-house/DERIVATION-TRANSCRIPT.md. This is what the
// engine must reproduce. `NEXT-STEP-SPEC.md:196`: "A divergence is either an engine bug
// or a book bug; both are findings."
//
// Note the shape of the recorded vector: positions are SCOPED, and several axes carry
// more than one position. "Values apply at demand scope. Hybrids are compositions
// produced by scope splits" (axes-and-ledger.md:10-11). An engine that returns one
// value per axis cannot express this run's answer.

export const COMPANIES_HOUSE = {
  start: 'null vector',

  // Every position, with the scope it applies at.
  vector: {
    topology: [
      { value: 'single deployable', scope: 'system', moved: false,
        note: 'modular form; module seams at register, LLP/LP, ROE, IDV, ACSP admin, ECCTA case management, bulk export, search-serving' },
    ],
    substrate: [
      { value: 'event-based', scope: 'path:accounts-filing', moved: true },
      { value: 'event-based', scope: 'operation:eccta-query-filing', moved: true },
      { value: 'direct', scope: 'path:public-search', moved: false },
    ],
    read_write: [
      { value: 'unified', scope: 'system', moved: false },
      { value: 'separated', scope: 'path:public-search', moved: true },
      { value: 'separated', scope: 'path:bulk-data-export', moved: true },
    ],
    state: [
      { value: 'current-state', scope: 'system', moved: false,
        note: 'with audit-log-as-data on all data classes' },
    ],
    persistence: [
      { value: 'single shared', scope: 'system', moved: false },
      { value: 'per-component', scope: 'data-class:roe', moved: true },
    ],
    recovery: [
      { value: 'design-out', scope: 'operation:incorporate-company' },
      { value: 'design-out', scope: 'operation:accept-filing' },
      { value: 'design-out', scope: 'operation:correct-filing-rp04' },
      { value: 'design-out', scope: 'operation:dissolve-company' },
      { value: 'degrade-and-continue', scope: 'operation:eccta-query-filing' },
      { value: 'degrade-and-continue', scope: 'operation:bulk-export' },
      { value: 'degrade-and-continue', scope: 'operation:idv-backfill' },
      { value: 'compensate', scope: 'operation:court-rectification' },
      { value: 'compensate', scope: 'operation:eccta-post-hoc-removal' },
    ],
  },

  // Axis moves, with the rows that forced them. The transcript's own reasoning.
  moves: [
    {
      axis: 'substrate', toward: 'event-based', scope: 'path:accounts-filing',
      forcedBy: ['answers.q5:accounts-filing'],
      mechanism: 'queue',
      because: "Burst shape: 'queue absorbs the peak', with no stated synchronous latency target to defeat it",
    },
    {
      axis: 'read_write', toward: 'separated', scope: 'path:public-search',
      // The combination check in action: neither citation forces the move alone.
      forcedBy: ['answers.q5:public-search', 'answers.q6:personal-data'],
      mechanism: 'projection',
      because: 'Two independent citations converge on one value: read volume-and-shape divergence, and redaction-shape divergence. The resolution goes past the replicas rung to separated.',
      combination: true,
    },
    {
      axis: 'persistence', toward: 'per-component', scope: 'data-class:roe',
      forcedBy: ['answers.q9:roe'],
      mechanism: 'second store',
      because: "Scope exclusion before hardening: ROE's demand is satisfied by narrowing scope, not by hardening the whole store. Regulation, volume and shape diverged simultaneously.",
      scopeExclusion: true,
    },
  ],

  // Recorded as inert. These matter as much as the moves: an engine that presses any of
  // them is wrong in a way that silently inflates every architecture it derives.
  inert: [
    { row: 'answers.q1:*', because: "every deadline binds the requester's clock, not the system's" },
    { row: 'answers.q1:incorporate-company', because: 'target over physics floor is nowhere near 1' },
    { row: 'answers.q2:system', because: 'the 99.5% target sits below the biting threshold' },
    { row: 'answers.q3:register', because: 'RPO UNKNOWN — blocks distributed shared rather than forcing it' },
    { row: 'answers.q7:system', because: 'release structure UNKNOWN derives a null position' },
    { row: 'answers.q6:register-residency', because: 'the GDPR public-register exemption removes the pressure it would otherwise create' },
    { row: 'answers.q8:system', because: 'headcount presses cadence divergence only, and Q7 states none — it does not press topology' },
    { row: 'answers.q9:system', because: 'the sheet states unity at the search surface explicitly' },
  ],

  // Positions the derivation explicitly declined to move, and why. The state-storage one
  // is the sharpest test in the run: audit tempts event-sourcing and must not get it.
  held: [
    {
      axis: 'state', value: 'current-state',
      because: "'we need audit' tempts event-sourcing, but no replay demand — reconstruct as of a past rule version — exists anywhere on the sheet. Only who/what/when. Cheapest containing value wins outright.",
    },
    {
      axis: 'read_write', value: 'unified', scope: 'system',
      because: 'the core is contained by the read chain (cache, replicas) if load ever needs it; no evidence forces climbing further',
    },
    {
      axis: 'persistence', value: 'single shared', scope: 'system',
      because: 'no ceiling-crossing volume evidence — hardware-rung territory; and the RPO and sovereignty UNKNOWNs block distributed shared',
    },
    {
      axis: 'topology', value: 'single deployable',
      because: 'every candidate pressure toward services (headcount, three registrars, four register types) resolves to inert or to a different axis',
    },
  ],

  // Guarantee gaps the verification step flagged rather than filled.
  flagged: [
    { scope: 'path:public-search', because: 'a staleness window necessarily exists but its bound is UNKNOWN (Q4) — a guarantee without a stated bound is what verify exists to flag' },
    { scope: 'operation:eccta-query-filing', because: 'degrade-and-continue requires the degraded window be bounded and visible; Q1 states no published turnaround exists' },
  ],
};
