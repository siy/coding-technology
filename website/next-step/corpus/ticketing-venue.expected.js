// ticketing-venue.expected.js — profile 1 of the Three Profiles experiment.
//
// `three-profiles.md:5` states the experimental condition the whole book rests on:
// "If the architecture follows from the answers, three answer sheets over one domain
// must produce three different vectors, each forced, with no step appealing to taste."
//
// Profile 1 is the negative pole of that experiment, and the most valuable single test
// in the corpus: seven demands, zero pressures, the null vector intact.
// `three-profiles.md:21`: "Zero pressures; the null vector survives; recovery resolves
// from domain shape (defined inverses on the money path -> compensate)."
//
// An engine that moves an axis here is selling architecture. Every row that presses
// nothing is a documented refusal — "the reason this system carries no queue, no
// replicas, no projections, written down where the next architect can find it."

export const TICKETING_VENUE = {
  start: 'null vector',

  vector: {
    topology: [{ value: 'single deployable', scope: 'system', moved: false }],
    substrate: [{ value: 'direct', scope: 'system', moved: false }],
    read_write: [{ value: 'unified', scope: 'system', moved: false }],
    state: [{ value: 'current-state', scope: 'system', moved: false }],
    persistence: [{ value: 'single shared', scope: 'system', moved: false }],
    recovery: [
      { value: 'compensate', scope: 'operation:reserve-seat' },
      { value: 'compensate', scope: 'operation:authorize-payment' },
      { value: 'compensate', scope: 'operation:confirm-sale' },
    ],
  },

  moves: [],   // the point of the profile

  // The pressure matrix at three-profiles.md:11-19, with the outcome column verbatim.
  inert: [
    { demand: 'buy ~2s P95', mode: 'select', because: 'contained: direct calls + single store at tens/sec' },
    { demand: 'check <1s', mode: 'select', because: 'contained' },
    { demand: '99.5%', mode: 'isolate', because: 'contained: single node + restart budget (44 h/yr)' },
    { demand: 'booking strict, zero loss', mode: 'prune', because: 'single shared store provides transactions + durable commit; strikes nothing' },
    { demand: 'reads eventual', mode: null, because: 'weaker than what the vector already provides' },
    { demand: 'cost ceiling, one team', mode: 'bound', because: 'reinforces the null position' },
    { demand: 'read-moderate', mode: 'split', because: 'no divergence between paths' },
  ],

  // two-teams.md:92 — the sentence the profile exists to earn.
  claim: 'The team did not choose simplicity. The derivation found zero uncontained demands.',
};
