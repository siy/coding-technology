// ticketing-enterprise.expected.js — profile 3 of the Three Profiles experiment.
//
// The hostile pole. Recorded vector, three-profiles.md:57:
//   "read path as services + cores on a unified runtime / event-based across, direct
//    within / separated (pricing) + unified (booking) / event-sourced (pricing) +
//    current-state (booking) / distributed shared (booking) + per-component + polyglot /
//    compensate (money) + design-out (holds, pricing appends) + degrade-and-continue
//    (availability views)"

export const TICKETING_ENTERPRISE = {
  start: 'null vector',

  // Moves the engine reproduces today.
  moves: [
    { axis: 'topology', toward: 'multiple deployables', scope: 'path:quote',
      because: 'the read path carries its own cadence: cadence divergence is what no single artifact buys' },
    { axis: 'read_write', toward: 'separated', scope: 'path:quote',
      because: 'shape, volume and contract converge on one path — separated here, and nowhere else' },
    { axis: 'state', toward: 'event-sourced', scope: 'data-class:pricing',
      because: 'replay is demanded for one data class: a regulator reconstructs quotes under past rule versions' },
    { axis: 'persistence', toward: 'distributed shared', scope: 'data-class:bookings',
      because: 'strict x multi-region x zero-loss on one data class: the ledger\'s unique container',
      unique: true },
    { axis: 'persistence', toward: 'polyglot', scope: 'data-class:event-management',
      because: 'document-shaped and relational-shaped data: stores shaped to their data' },
  ],

  recovery: [
    { operation: 'confirm-booking', value: 'compensate' },
    { operation: 'authorize-payment', value: 'compensate' },
    { operation: 'hold-seat', value: 'design-out' },
    { operation: 'append-price', value: 'design-out' },
    { operation: 'refresh-availability-view', value: 'degrade-and-continue' },
  ],

  // The chapter's proudest line, and the discipline test: "the most dramatic number on
  // the sheet moves nothing, and that is the discipline holding under maximum
  // provocation" (three-profiles.md:55).
  inertUnderProvocation: {
    row: 'answers.q5[1]',
    demand: '10^5+ attempts per minute against a handful of seats',
    because: 'contention: no copy helps. Admission control and coalescing are thin tiers, which never enter the vector.',
  },

  // Positions the run held.
  held: [
    { axis: 'read_write', value: 'unified', scope: 'system', because: 'booking keeps the unified model' },
    { axis: 'state', value: 'current-state', scope: 'system',
      because: 'booking stays current-state with its audit log: two data classes, two storage answers, one system' },
  ],

  // Recorded but NOT yet reproduced, with the reason. These are the open edges.
  notReproduced: [
    { position: 'cores on a unified runtime',
      reason: 'LEDGER.md:76-80 prices this value and gives its pressed-toward-by as "strongly-coupled cores plus uncertainty about future topology". No press rule reads those two facts yet, and the sheet has no field for either — a rule and a schema gap, not a ledger gap.' },
    { position: 'event-based across, direct within',
      reason: 'this sheet omits the cross-module event rows the chapter inherits from profile 2; a transcription gap, not an engine gap' },
    { position: 'per-component alongside polyglot',
      reason: 'the recorded persistence line carries both; this sheet states one divergence, which lands on polyglot' },
  ],
};
