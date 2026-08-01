// verify.js — step 5, the exit gate. Card 6 / `verification.md`.
//
// Arithmetic only. This module computes nothing about physics: every floor, every
// slow-fraction, every component availability is a number the sheet supplied. What it
// does is compose those numbers the way the book says they compose, and report where
// the composition does not fit the target.
//
// The five rules, cited by name (Card 6 — "cite these by name, not by number"):
//   latency decomposition · tail composition · envelope composition ·
//   availability multiplication · mechanism bill
//
// The load-bearing refusal: a floor the user did not supply is UNVERIFIED, never a
// default. Inventing a plausible hop latency would make the gate agree with itself.

const CARD = 'Card 6';

function round(n, places = 4) {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/**
 * Latency decomposition (`verification.md:19`). An operation's budget is spent by its
 * critical path: sequential steps add, parallel branches cost their maximum, every hop
 * pays its floor.
 *
 * `target ÷ floor → 1` is pressing; `floor > target` is a wrong vector, not a tuning
 * problem.
 */
export function latencyDecomposition(floors = [], targets = {}) {
  const results = [];
  for (const entry of floors) {
    const path = entry.path;
    const hops = Array.isArray(entry.hops) ? entry.hops : [];
    const missing = hops.filter(h => typeof h.p50_ms !== 'number').map(h => h.name || '(unnamed)');
    if (!hops.length || missing.length) {
      results.push({
        rule: 'latency decomposition', card: CARD, path,
        verdict: 'UNVERIFIED',
        because: hops.length
          ? `floor missing for ${missing.join(', ')}`
          : 'no hops supplied for this path',
      });
      continue;
    }

    // Sequential adds; a hop marked parallel:<group> costs its group's max, once.
    let sequential = 0;
    const groups = new Map();
    for (const hop of hops) {
      if (typeof hop.parallel === 'string' && hop.parallel) {
        groups.set(hop.parallel, Math.max(groups.get(hop.parallel) ?? 0, hop.p50_ms));
      } else {
        sequential += hop.p50_ms;
      }
    }
    let floor = sequential;
    for (const max of groups.values()) floor += max;

    const target = targets[path];
    if (typeof target !== 'number') {
      results.push({
        rule: 'latency decomposition', card: CARD, path, floor: round(floor),
        verdict: 'UNVERIFIED', because: 'no target stated for this path',
      });
      continue;
    }

    const headroom = round(target / floor);
    let verdict = 'OK';
    if (floor > target) verdict = 'WRONG_VECTOR';
    else if (headroom <= 2) verdict = 'PRESSING';
    results.push({
      rule: 'latency decomposition', card: CARD, path,
      floor: round(floor), target, headroom, verdict,
      because: verdict === 'WRONG_VECTOR'
        ? 'the floors alone exceed the target — no tuning reaches it from this vector'
        : verdict === 'PRESSING'
          ? 'target is within 2x of the floor; the path has almost no room'
          : 'floors leave room against the target',
    });
  }
  return results;
}

/**
 * Tail composition (`verification.md:25`). Sequentially a chain is slow when *any* step
 * is slow, so slow-fractions compose as 1 - product(1 - p). Fan-out harvests the tail:
 * 1 - (1 - p)^n.
 *
 * The book's caveat travels with the number: both formulas assume independent slowness
 * and production correlates it, so these are bounds, not predictions.
 */
export function tailComposition(chains = []) {
  return chains.map(chain => {
    const steps = Array.isArray(chain.steps) ? chain.steps : [];
    const fanout = typeof chain.fanout === 'number' ? chain.fanout : null;
    const missing = steps.some(s => typeof s.slow_fraction !== 'number');
    if ((!steps.length && fanout === null) || missing) {
      return {
        rule: 'tail composition', card: CARD, chain: chain.name ?? null,
        verdict: 'UNVERIFIED', because: 'slow-fraction missing for at least one step',
      };
    }

    if (fanout !== null) {
      const p = typeof chain.per_shard_slow_fraction === 'number' ? chain.per_shard_slow_fraction : null;
      if (p === null) {
        return {
          rule: 'tail composition', card: CARD, chain: chain.name ?? null,
          verdict: 'UNVERIFIED', because: 'fan-out stated without a per-shard slow fraction',
        };
      }
      const harvested = 1 - (1 - p) ** fanout;
      return {
        rule: 'tail composition', card: CARD, chain: chain.name ?? null,
        kind: 'fan-out', width: fanout, chainSlowFraction: round(harvested),
        verdict: 'COMPUTED',
        because: `fan-out harvests the tail: ${fanout} way at ${p} each`,
        caveat: 'assumes independent slowness; production correlates it — treat as a bound',
      };
    }

    const chainSlow = 1 - steps.reduce((acc, s) => acc * (1 - s.slow_fraction), 1);
    return {
      rule: 'tail composition', card: CARD, chain: chain.name ?? null,
      kind: 'series', steps: steps.length, chainSlowFraction: round(chainSlow),
      verdict: 'COMPUTED',
      because: 'slow-fractions add through the distribution, not the means',
      caveat: 'assumes independent slowness; production correlates it — treat as a bound',
    };
  });
}

/**
 * Envelope composition (`verification.md:31`). Steady loads add; peaks add only when
 * correlated. An uncorrelated peak that is summed anyway overbuys; a correlated peak
 * that is not summed underbuys, which is the failure that shows up on the calendar.
 */
export function envelopeComposition(envelopes = []) {
  return envelopes.map(env => {
    const parts = Array.isArray(env.parts) ? env.parts : [];
    const missing = parts.some(p => typeof p.steady !== 'number' || typeof p.peak !== 'number');
    if (!parts.length || missing) {
      return {
        rule: 'envelope composition', card: CARD, subsystem: env.name ?? null,
        verdict: 'UNVERIFIED', because: 'steady or peak missing for at least one part',
      };
    }
    const steady = parts.reduce((a, p) => a + p.steady, 0);
    const correlated = parts.filter(p => p.correlated === true);
    const uncorrelated = parts.filter(p => p.correlated !== true);
    // Correlated peaks land together and add; uncorrelated ones contribute their
    // steady draw plus, at most, the single largest peak among them.
    const correlatedPeak = correlated.reduce((a, p) => a + p.peak, 0);
    const largestUncorrelated = uncorrelated.reduce((a, p) => Math.max(a, p.peak - p.steady), 0);
    const uncorrelatedSteady = uncorrelated.reduce((a, p) => a + p.steady, 0);
    const peak = correlatedPeak + uncorrelatedSteady + largestUncorrelated;
    return {
      rule: 'envelope composition', card: CARD, subsystem: env.name ?? null,
      steady: round(steady), peak: round(peak),
      correlatedParts: correlated.map(p => p.name ?? null),
      verdict: 'COMPUTED',
      because: correlated.length
        ? 'correlated peaks add; uncorrelated ones contribute steady plus the largest single peak'
        : 'no correlated peaks declared — peaks do not add',
    };
  });
}

/**
 * Availability multiplication (`verification.md:37`). In series, availability
 * multiplies. In parallel it does not, unless independence is *earned* — no shared
 * deploys, certs, regions, or config. Unearned independence is refused rather than
 * computed, because the parallel formula is where availability theatre lives.
 */
export function availabilityMultiplication(chains = []) {
  return chains.map(chain => {
    const parts = Array.isArray(chain.parts) ? chain.parts : [];
    const missing = parts.some(p => typeof p.availability !== 'number');
    if (!parts.length || missing) {
      return {
        rule: 'availability multiplication', card: CARD, chain: chain.name ?? null,
        verdict: 'UNVERIFIED', because: 'availability missing for at least one part',
      };
    }

    if (chain.arrangement === 'parallel') {
      const shared = Array.isArray(chain.shared) ? chain.shared : [];
      if (shared.length) {
        return {
          rule: 'availability multiplication', card: CARD, chain: chain.name ?? null,
          verdict: 'INDEPENDENCE_UNEARNED',
          shared,
          because: `parallel arithmetic requires earned independence; these are shared: ${shared.join(', ')}`,
        };
      }
      const unavailable = parts.reduce((a, p) => a * (1 - p.availability), 1);
      return {
        rule: 'availability multiplication', card: CARD, chain: chain.name ?? null,
        arrangement: 'parallel', availability: round(1 - unavailable, 6),
        verdict: 'COMPUTED',
        because: 'independence declared with no shared deploys, certs, regions or config',
      };
    }

    const availability = parts.reduce((a, p) => a * p.availability, 1);
    const result = {
      rule: 'availability multiplication', card: CARD, chain: chain.name ?? null,
      arrangement: 'series', availability: round(availability, 6),
      verdict: 'COMPUTED',
      because: 'availability multiplies down a chain',
    };
    if (typeof chain.target === 'number') {
      result.target = chain.target;
      if (availability < chain.target) {
        result.verdict = 'TARGET_MISSED';
        result.because = `series composition lands under the ${chain.target} target`;
      }
    }
    return result;
  });
}

/** Mechanisms a vector stands up permanently, by axis value. Card 2b's `via` column. */
const STANDING_MECHANISMS = {
  topology: {
    'multiple deployables': ['per-artifact pipeline', 'versioned contracts', 'version matrix'],
    'unified runtime': ['runtime platform'],
    serverless: ['FaaS platform'],
  },
  substrate: {
    'event-based': ['broker', 'idempotent consumers'],
    streaming: ['partitioned log', 'consumer groups'],
  },
  read_write: { separated: ['projection pipeline', 'backfill'] },
  state: { 'event-sourced': ['event log', 'projection per read', 'schema upcasters'] },
  persistence: {
    'distributed shared': ['consensus replication'],
    sharded: ['partition key discipline', 'resharding ops'],
    cells: ['per-cell stack', 'cell routing'],
    'per-component': ['store per component'],
    polyglot: ['ops competency per store'],
  },
};

/**
 * The mechanism bill (`verification.md:43`). Counts the vector's standing mechanisms and
 * sets them against Q8's two currencies — money, and who operates. A comparison rather
 * than a formula: the book's own framing is "a platform-team vector against a
 * four-engineers sheet fails before anything is built."
 */
export function mechanismBill(vector = {}, envelope = {}) {
  const mechanisms = [];
  for (const [axis, positions] of Object.entries(vector)) {
    const table = STANDING_MECHANISMS[axis];
    if (!table) continue;
    for (const position of [].concat(positions)) {
      const value = typeof position === 'string' ? position : position && position.value;
      const found = table[value];
      if (found) for (const m of found) mechanisms.push({ axis, value, mechanism: m });
    }
  }

  const count = mechanisms.length;
  if (typeof envelope.operators !== 'number') {
    return {
      rule: 'mechanism bill', card: CARD, count, mechanisms,
      verdict: 'UNVERIFIED',
      because: 'Q8 states no operator count — the bill cannot be set against an envelope',
    };
  }

  // Not a formula. The book offers one comparison it is willing to make mechanically:
  // standing mechanisms outnumbering the people who operate them is a fail, and the
  // sheet says so before anything is built.
  const verdict = count > envelope.operators ? 'ENVELOPE_EXCEEDED' : 'OK';
  return {
    rule: 'mechanism bill', card: CARD, count, mechanisms,
    operators: envelope.operators,
    budget: typeof envelope.budget === 'string' ? envelope.budget : null,
    verdict,
    because: verdict === 'ENVELOPE_EXCEEDED'
      ? `${count} standing mechanisms against ${envelope.operators} operators — the vector outruns who operates it`
      : `${count} standing mechanisms is within ${envelope.operators} operators`,
  };
}

/**
 * The exit gate. Runs all five rules and reports; it never edits the vector, and it
 * never supplies a number the sheet withheld.
 */
export function verify(sheet = {}, vector = {}) {
  const v = sheet.verification || {};
  const results = [
    ...latencyDecomposition(v.floors, v.targets || {}),
    ...tailComposition(v.chains),
    ...envelopeComposition(v.envelopes),
    ...availabilityMultiplication(v.availability),
    mechanismBill(vector, v.envelope || {}),
  ];

  const failures = results.filter(r =>
    r.verdict === 'WRONG_VECTOR' || r.verdict === 'TARGET_MISSED' ||
    r.verdict === 'ENVELOPE_EXCEEDED' || r.verdict === 'INDEPENDENCE_UNEARNED');
  const unverified = results.filter(r => r.verdict === 'UNVERIFIED');

  return {
    results,
    failures,
    unverified,
    passed: failures.length === 0,
    complete: unverified.length === 0,
  };
}
