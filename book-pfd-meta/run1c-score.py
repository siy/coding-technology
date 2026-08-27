#!/usr/bin/env python3
"""Run 1c DDG convergence scoring.

WRITTEN BEFORE ANY IMPLEMENTATION WAS INSPECTED FOR THIS RUN. Metric exactly as
pre-registered in book-pfd-meta/RUN-1C-PREDICTIONS.md.

Input:  a directory of <id>.json extraction files, one per implementation.
Usage:  python3 run1c-score.py <extraction-dir>
"""
import json, sys, os, itertools

NODES = ["N", "P", "R", "V", "Z"]
PAIRS = ["|".join(p) for p in itertools.combinations(NODES, 2)]
RULES = ["input_validation", "zone_full", "vehicle_weight"]
INEXT = "inextractable"

TREATMENT = ["t1", "t2", "t3", "t4", "t5"]
CONTROL = ["c1", "c2", "c3", "c4", "c5"]


def norm_partition(p):
    if p == INEXT:
        return INEXT
    return frozenset(frozenset(g) for g in p)


def agree_d1(a, b):
    pa, pb = norm_partition(a["D1_concurrency"]), norm_partition(b["D1_concurrency"])
    # both-inextractable scores 0, never 1: uniform absence is not agreement.
    if pa == INEXT or pb == INEXT:
        return 0.0
    return 1.0 if pa == pb else 0.0


def agree_setmap(a, b, keys, field):
    hits = []
    for k in keys:
        va, vb = a[field].get(k, INEXT), b[field].get(k, INEXT)
        if va == INEXT or vb == INEXT:
            hits.append(0.0)
        else:
            hits.append(1.0 if set(va) == set(vb) else 0.0)
    return sum(hits) / len(hits)


def agree_valmap(a, b, keys, field):
    hits = []
    for k in keys:
        va, vb = a[field].get(k, INEXT), b[field].get(k, INEXT)
        if va == INEXT or vb == INEXT:
            hits.append(0.0)
        else:
            hits.append(1.0 if va == vb else 0.0)
    return sum(hits) / len(hits)


COMPONENTS = {
    "D1 concurrency": lambda a, b: agree_d1(a, b),
    "D2 guards": lambda a, b: agree_setmap(a, b, RULES, "D2_guards"),
    "D3 absorption": lambda a, b: agree_valmap(a, b, NODES, "D3_absorption"),
    "D4 order": lambda a, b: agree_valmap(a, b, PAIRS, "D4_order"),
}


def inextractable_counts(impls):
    """Per-property count of implementations recording inextractable anywhere in it."""
    out = {}
    d1 = sum(1 for i in impls.values() if i["D1_concurrency"] == INEXT)
    out["D1 concurrency"] = d1
    out["D2 guards"] = sum(
        1 for i in impls.values() if any(i["D2_guards"].get(k, INEXT) == INEXT for k in RULES))
    out["D3 absorption"] = sum(
        1 for i in impls.values() if any(i["D3_absorption"].get(k, INEXT) == INEXT for k in NODES))
    out["D4 order"] = sum(
        1 for i in impls.values() if any(i["D4_order"].get(k, INEXT) == INEXT for k in PAIRS))
    return out


def arm(impls, ids, label):
    present = {i: impls[i] for i in ids if i in impls}
    missing = [i for i in ids if i not in impls]
    if missing:
        print(f"  !! MISSING extractions: {', '.join(missing)}")
    inext = inextractable_counts(present)
    print(f"\n=== {label} (n={len(present)}) ===")
    scores = {}
    excluded = []
    for name, fn in COMPONENTS.items():
        vals = [fn(present[a], present[b]) for a, b in itertools.combinations(sorted(present), 2)]
        m = sum(vals) / len(vals) if vals else None
        scores[name] = m
        flag = ""
        if inext[name] > 1:
            flag = f"   <-- EXCLUDED from overall ({inext[name]} inextractable)"
            excluded.append(name)
        print(f"  {name:16s}: {m*100:6.2f}%   (inextractable: {inext[name]}){flag}")
    kept = [v for k, v in scores.items() if k not in excluded and v is not None]
    overall = sum(kept) / len(kept) if kept else None
    if overall is None:
        print(f"  {'OVERALL':16s}:   VOID   (every component excluded under the void rule)")
    else:
        print(f"  {'OVERALL':16s}: {overall*100:6.2f}%   (from {len(kept)}/4 components)")
    return overall, scores, excluded


if __name__ == "__main__":
    d = sys.argv[1]
    impls = {}
    for fn in os.listdir(d):
        if fn.endswith(".json"):
            impls[fn[:-5]] = json.load(open(os.path.join(d, fn), encoding="utf-8"))
    t_overall, t_scores, t_excl = arm(impls, TREATMENT, "TREATMENT (JBCT)")
    c_overall, c_scores, c_excl = arm(impls, CONTROL, "CONTROL (idiomatic Java)")

    print("\n=== VERDICT ===")
    if t_overall is None or c_overall is None:
        print("  VOID — an arm produced no scorable components.")
        sys.exit(1)
    margin = t_overall - c_overall
    print(f"  P1c-1 overall : treatment {t_overall*100:.2f}% vs control {c_overall*100:.2f}%"
          f"  -> {'HIT' if margin > 0 else 'MISS'} (margin {margin*100:+.2f})")
    t_d1, c_d1 = t_scores["D1 concurrency"], c_scores["D1 concurrency"]
    print(f"  P1c-2 t D1>=0.80: {t_d1*100:.2f}%  -> {'HIT' if t_d1 >= 0.80 else 'MISS'}")
    print(f"  P1c-3 D1 t>c  : {t_d1*100:.2f}% vs {c_d1*100:.2f}%"
          f"  -> {'HIT' if t_d1 > c_d1 else 'MISS'} (margin {(t_d1-c_d1)*100:+.2f})")
    if margin <= 0:
        print("\n  FALSIFIED — control agreement >= treatment. This is the headline.")
    if set(t_excl) | set(c_excl):
        print(f"\n  Components excluded under the void rule: "
              f"treatment {t_excl or 'none'}, control {c_excl or 'none'}")
        print("  If the primary comparison rests on these, the run is VOID, not a result.")
