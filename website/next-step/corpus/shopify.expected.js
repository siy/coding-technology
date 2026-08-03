// Shopify, pod era — the recorded derivation.
//
// From book-arch-meta/BLIND-DERIVATION-SHOPIFY.md. Predictions were pre-registered
// (2026-07-07) and every one graded HIT against the published outcome.
//
// Recorded vector: modular monolith + full-stack shop-sharded cells + card-path split /
// direct within, async jobs at edges, pod-scoped / unified with cache+replica rungs at
// storefront scope / current-state / sharded per-cell stores / design-out (reservations)
// + BER (money) + edge admission control for contention.
//
// What this sheet is here to hold, which no other corpus sheet can:
//   - `sharded`, the value SO:73 records as "the sharded value the other runs never
//     touched".
//   - F21 at its upper extreme: 1000+ developers press NOTHING on topology.
//   - The read chain stopping at replicas under 11 TB/s, because volume without
//     model divergence never reaches projections.
//   - A contention row at a scope that also carries a partition key, which must not
//     shard.

export const SHOPIFY = {
  vector: {
    topology: [
      // F21. The largest team in the corpus, and the axis does not move: ownership is
      // demanded, release independence is not, and one train is a choice.
      { value: 'single deployable', scope: 'system', moved: false },
    ],
    substrate: [
      { value: 'direct', scope: 'system', moved: false },
      { value: 'event-based', scope: 'path:flash-arrival', moved: true },
    ],
    read_write: [
      // 11 TB/s and the chain still stops below the axis move.
      { value: 'unified', scope: 'system', moved: false },
    ],
    state: [
      { value: 'current-state', scope: 'system', moved: false },
    ],
    persistence: [
      { value: 'single shared', scope: 'system', moved: false },
      { value: 'sharded', scope: 'data-class:shop-data', moved: true },
    ],
    recovery: [
      { value: 'design-out', scope: 'operation:reserve-inventory' },
      { value: 'compensate', scope: 'operation:capture-payment' },
      { value: 'design-out', scope: 'operation:place-order' },
    ],
  },

  pressures: [
    {
      axis: 'persistence', toward: 'sharded', scope: 'data-class:shop-data',
      forcedBy: ['answers.q5[0]'],
      mechanism: 'partitioned store',
      because: "Write volume past a single node's ceiling (11M queries/s, 11 TB/s read I/O) with a natural partition key: merchants are isolated and no cross-shop actions exist, so the shop is the key. The key becomes load-bearing.",
    },
    {
      axis: 'substrate', toward: 'event-based', scope: 'path:flash-arrival',
      forcedBy: ['answers.q5[3]'],
      mechanism: 'queue',
      because: 'Burst shape: the queue absorbs a peak that arrives without notice, and no synchronous latency target opposes it.',
    },
  ],

  // The refusals this run is worth keeping for.
  inertHighlights: [
    'the storefront read path: 11 TB/s of volume, same read model, chain stops at replicas',
    'the checkout drop: contention, so a second copy does not help and sharding cannot',
    '1000+ developers on one train: no cadence divergence, so topology holds',
  ],
};
